import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { ActionDef, Step, RunContext } from "../types.js";
import { isGitHubRef, parseGitHubRef } from "../github-resolver/index.js";
import { interpolate } from "../utils/interpolate.js";
import { collectInputs } from "../prompt-engine/index.js";

const ACTION_CACHE_DIR = path.join(os.homedir(), ".xo", "cache", "actions");

export interface LoadedAction {
  def: ActionDef;
  dir: string;
  type: "composite" | "node" | "prompt";
  mainPath?: string;
}

// ── Loading ───────────────────────────────────────────────────────────────────

export async function loadAction(uses: string, generatorDir: string): Promise<LoadedAction> {
  if (uses.startsWith("./") || uses.startsWith("../")) {
    return loadLocalAction(uses, generatorDir);
  }
  if (isGitHubRef(uses)) {
    return loadGitHubAction(uses);
  }
  throw new Error(
    `Unsupported action reference: "${uses}".\n` +
    `  Local composite:  uses: ./actions/my-action.yaml\n` +
    `  Local script:     uses: ./actions/my-action.js\n` +
    `  GitHub:           uses: @github/owner/repo or @github/owner/repo/subpath`,
  );
}

async function loadLocalAction(uses: string, generatorDir: string): Promise<LoadedAction> {
  const fullPath = path.resolve(generatorDir, uses);
  const ext = path.extname(uses);

  if ([".js", ".mjs", ".cjs"].includes(ext)) {
    if (!(await fs.pathExists(fullPath))) {
      throw new Error(`Script action not found: ${fullPath}`);
    }
    return { def: {}, dir: path.dirname(fullPath), type: "node", mainPath: fullPath };
  }

  // YAML or directory
  let yamlPath = fullPath;
  if (![".yaml", ".yml"].includes(ext)) {
    for (const name of ["action.yaml", "action.yml"]) {
      const candidate = path.join(fullPath, name);
      if (await fs.pathExists(candidate)) { yamlPath = candidate; break; }
    }
  }

  if (!(await fs.pathExists(yamlPath))) {
    throw new Error(`Action not found: ${fullPath}`);
  }

  const def = parseYaml(await fs.readFile(yamlPath, "utf8")) as ActionDef;
  const dir = path.dirname(yamlPath);

  if (def.runs?.using === "node" && def.runs.main) {
    return { def, dir, type: "node", mainPath: path.resolve(dir, def.runs.main) };
  }
  if (def.runs?.using === "prompt") {
    return { def, dir, type: "prompt" };
  }
  return { def, dir, type: "composite" };
}

async function loadGitHubAction(uses: string): Promise<LoadedAction> {
  const ref = parseGitHubRef(uses);
  if (!ref) throw new Error(`Invalid @github reference: "${uses}"`);

  const token = process.env["XO_GITHUB_TOKEN"];
  const headers: Record<string, string> = token ? { Authorization: `token ${token}` } : {};
  const base = `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${ref.ref}${ref.subpath ? `/${ref.subpath}` : ""}`;

  const refSlug = ref.ref.replace(/[^a-zA-Z0-9._-]/g, "_");
  const sub = ref.subpath ? path.join(...ref.subpath.split("/")) : "";
  const cacheDir = path.join(ACTION_CACHE_DIR, ref.owner, ref.repo, refSlug, sub);

  if (!ref.isMutable) {
    const cached = await loadCachedAction(cacheDir);
    if (cached) return cached;
  }

  for (const filename of ["action.yaml", "action.yml"]) {
    try {
      const res = await fetch(`${base}/${filename}`, { headers });
      if (!res.ok) continue;

      const def = parseYaml(await res.text()) as ActionDef;
      await fs.ensureDir(cacheDir);
      await fs.writeFile(path.join(cacheDir, "action.yaml"), stringifyYaml(def));

      if (def.runs?.using === "node" && def.runs.main) {
        const mainRes = await fetch(`${base}/${def.runs.main}`, { headers });
        if (!mainRes.ok) throw new Error(`Failed to fetch action main: ${base}/${def.runs.main}`);
        const mainPath = path.join(cacheDir, def.runs.main);
        await fs.ensureDir(path.dirname(mainPath));
        await fs.writeFile(mainPath, await mainRes.text());
        return { def, dir: cacheDir, type: "node", mainPath };
      }

      if (def.runs?.using === "prompt") {
        return { def, dir: cacheDir, type: "prompt" };
      }

      return { def, dir: cacheDir, type: "composite" };
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Failed to fetch")) throw err;
      continue;
    }
  }

  throw new Error(
    `Could not load action from ${uses}.\n` +
    `Tried: ${base}/action.yaml and action.yml\n` +
    (!process.env["XO_GITHUB_TOKEN"] ? `For private repos, set XO_GITHUB_TOKEN=<token>` : ""),
  );
}

async function loadCachedAction(dir: string): Promise<LoadedAction | null> {
  const yamlPath = path.join(dir, "action.yaml");
  if (!(await fs.pathExists(yamlPath))) return null;
  const def = parseYaml(await fs.readFile(yamlPath, "utf8")) as ActionDef;
  if (def.runs?.using === "node" && def.runs.main) {
    return { def, dir, type: "node", mainPath: path.resolve(dir, def.runs.main) };
  }
  if (def.runs?.using === "prompt") {
    return { def, dir, type: "prompt" };
  }
  return { def, dir, type: "composite" };
}

// ── Running ───────────────────────────────────────────────────────────────────

type RunStepFn = (step: Step, ctx: RunContext) => Promise<Record<string, unknown>>;

function resolveActionInputs(
  def: ActionDef,
  withArgs: Record<string, unknown>,
  parentContext: RunContext,
): Record<string, unknown> {
  const flatParent: Record<string, unknown> = {
    inputs: parentContext.inputs,
    config: parentContext.config,
    steps: parentContext.steps,
    env: parentContext.env,
    ...parentContext.inputs,
  };

  const inputs: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(def.inputs ?? {})) {
    if (schema.default !== undefined) inputs[key] = schema.default;
  }
  for (const [key, val] of Object.entries(withArgs)) {
    inputs[key] = typeof val === "string" ? interpolate(val, flatParent) : val;
  }
  return inputs;
}

export async function runCompositeAction(
  loaded: LoadedAction,
  withArgs: Record<string, unknown>,
  parentContext: RunContext,
  runStepFn: RunStepFn,
): Promise<Record<string, unknown>> {
  const { def, dir } = loaded;
  const steps = def.steps ?? def.runs?.steps ?? [];
  const inputs = resolveActionInputs(def, withArgs, parentContext);

  const actionContext: RunContext = {
    ...parentContext,
    inputs,
    generatorDir: dir,
    steps: {},
  };

  for (const step of steps) {
    const stepOutputs = await runStepFn(step, actionContext);
    if (step.id) {
      actionContext.steps[step.id] = { outputs: stepOutputs };
    }
  }

  // Resolve declared outputs against the action's own step results
  const outputs: Record<string, unknown> = {};
  if (def.outputs) {
    const flat: Record<string, unknown> = {
      inputs: actionContext.inputs,
      config: actionContext.config,
      steps: actionContext.steps,
      env: actionContext.env,
    };
    for (const [key, decl] of Object.entries(def.outputs)) {
      outputs[key] = interpolate(decl.value, flat);
    }
  }
  return outputs;
}

export async function runPromptAction(
  loaded: LoadedAction,
  withArgs: Record<string, unknown>,
  parentContext: RunContext,
): Promise<Record<string, unknown>> {
  const { def } = loaded;
  const flatParent: Record<string, unknown> = {
    inputs: parentContext.inputs,
    config: parentContext.config,
    steps: parentContext.steps,
    env: parentContext.env,
    ...parentContext.inputs,
  };

  // withArgs act as pre-filled overrides (can reference parent context)
  const prefilled: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(withArgs)) {
    prefilled[key] = typeof val === "string" ? interpolate(val, flatParent) : val;
  }

  if (parentContext.dryRun) {
    console.log(`  [dry-run] prompt-action: ${def.name ?? "unnamed"}`);
    const dryOutputs: Record<string, unknown> = {};
    for (const key of Object.keys(def.inputs ?? {})) dryOutputs[key] = prefilled[key] ?? "";
    return dryOutputs;
  }

  const answers = await collectInputs(def.inputs ?? {}, prefilled);

  // Resolve declared outputs; if none declared, expose all answers directly
  if (!def.outputs) return answers;

  const outputs: Record<string, unknown> = {};
  const flat: Record<string, unknown> = {
    inputs: answers,
    config: parentContext.config,
    steps: parentContext.steps,
    env: parentContext.env,
  };
  for (const [key, decl] of Object.entries(def.outputs)) {
    outputs[key] = interpolate(decl.value, flat);
  }
  return outputs;
}

export async function runScriptAction(
  loaded: LoadedAction,
  withArgs: Record<string, unknown>,
  parentContext: RunContext,
): Promise<Record<string, unknown>> {
  const { mainPath, dir, def } = loaded;
  if (!mainPath) throw new Error("Script action has no main path");

  const inputs = resolveActionInputs(def, withArgs, parentContext);

  if (parentContext.dryRun) {
    console.log(`  [dry-run] script-action: ${mainPath}`);
    return {};
  }

  const mod = await import(mainPath);
  const fn = mod.default ?? mod.run;
  if (typeof fn !== "function") {
    throw new Error(
      `Script action at ${mainPath} must export a default function or named "run" function`,
    );
  }

  return (await fn({
    inputs,
    cwd: parentContext.cwd,
    generatorDir: dir,
    dryRun: parentContext.dryRun,
    env: parentContext.env,
  })) ?? {};
}
