import path from "node:path";
import fs from "fs-extra";
import prompts from "prompts";
import { Project } from "ts-morph";
import type { Step, RunContext } from "../types.js";
import { evaluate } from "../utils/expression.js";
import { interpolate } from "../utils/interpolate.js";
import {
  copyFile,
  templateFile,
  appendToFile,
  injectIntoFile,
  replaceInFile,
  mergeJsonFile,
  setEnvVar,
} from "../file-editor/index.js";
import { runCommand, runScript } from "../script-runner/index.js";
import {
  detectPackageManager,
  detectLanguage,
  isPkgInstalled,
  readJsonAtPath,
} from "../signal-scanner/index.js";
import { loadAction, runCompositeAction, runScriptAction, runPromptAction } from "../action-runner/index.js";

type WithArgs = Record<string, unknown>;

function str(v: unknown): string {
  return String(v ?? "");
}

function interpolateWith(args: WithArgs, ctx: Record<string, unknown>): WithArgs {
  const out: WithArgs = {};
  for (const [k, v] of Object.entries(args)) {
    out[k] = typeof v === "string" ? interpolate(v, ctx) : v;
  }
  return out;
}

function dotToNested(dotPath: string, value: unknown): Record<string, unknown> {
  const parts = dotPath.split(".");
  const result: Record<string, unknown> = {};
  let cur = result;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]!] = {};
    cur = cur[parts[i]!] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
  return result;
}

async function astAddImport(
  cwd: string,
  args: { file: string; import: string | string[]; from: string; isDefault?: boolean },
  ctx: Record<string, unknown>,
): Promise<void> {
  const targetPath = path.join(cwd, interpolate(args.file, ctx));
  if (!(await fs.pathExists(targetPath))) {
    throw new Error(`xo/ast-import: file not found: ${targetPath}`);
  }
  const project = new Project({ useInMemoryFileSystem: false });
  const sourceFile = project.addSourceFileAtPath(targetPath);
  const namedImports = Array.isArray(args.import) ? args.import : [args.import];
  const moduleSpecifier = interpolate(args.from, ctx);

  const existing = sourceFile.getImportDeclaration(moduleSpecifier);
  if (existing) {
    if (!args.isDefault) {
      const currentNamed = existing.getNamedImports().map((n) => n.getName());
      const toAdd = namedImports.filter((n) => !currentNamed.includes(n));
      if (toAdd.length > 0) existing.addNamedImports(toAdd);
    }
  } else if (args.isDefault && namedImports.length === 1) {
    sourceFile.addImportDeclaration({ defaultImport: namedImports[0], moduleSpecifier });
  } else {
    sourceFile.addImportDeclaration({ namedImports, moduleSpecifier });
  }

  await sourceFile.save();
}

// Returns step outputs (may be empty for non-detection actions)
async function runBuiltinAction(
  actionName: string,
  args: WithArgs,
  ctx: Record<string, unknown>,
  context: RunContext,
): Promise<Record<string, unknown>> {
  const { generatorDir, cwd, dryRun } = context;
  const w = interpolateWith(args, ctx);

  // ── Detection actions (always run, even in dry-run; no side effects) ──────

  if (actionName === "xo/detect-pm") {
    const value = await detectPackageManager(cwd);
    if (!dryRun) console.log(`    ✔ xo/detect-pm → ${value}`);
    return { value };
  }

  if (actionName === "xo/detect-lang") {
    const value = await detectLanguage(cwd);
    if (!dryRun) console.log(`    ✔ xo/detect-lang → ${value}`);
    return { value };
  }

  if (actionName === "xo/file-exists") {
    const filePath = str(w.path);
    const exists = await fs.pathExists(path.join(cwd, filePath));
    if (!dryRun) console.log(`    ✔ xo/file-exists(${filePath}) → ${exists}`);
    return { exists };
  }

  if (actionName === "xo/pkg-installed") {
    const { installed, version } = await isPkgInstalled(cwd, str(w.pkg));
    if (!dryRun)
      console.log(`    ✔ xo/pkg-installed(${w.pkg}) → ${installed}${version ? ` (${version})` : ""}`);
    return { installed, version: version ?? null };
  }

  if (actionName === "xo/read-json") {
    const value = await readJsonAtPath(cwd, str(w.file), str(w.path));
    if (!dryRun) console.log(`    ✔ xo/read-json(${w.file}#${w.path}) → ${JSON.stringify(value)}`);
    return { value };
  }

  // ── File actions ─────────────────────────────────────────────────────────

  if (actionName === "xo/copy") {
    if (dryRun) { console.log(`  [dry-run] copy: ${w.from} → ${w.to}`); return {}; }
    await copyFile(generatorDir, cwd, { source: str(w.from), target: str(w.to) }, ctx);
    console.log(`    ✔ xo/copy → ${w.to}`);
    return {};
  }

  if (actionName === "xo/template") {
    if (dryRun) { console.log(`  [dry-run] template: ${w.from} → ${w.to}`); return {}; }
    await templateFile(generatorDir, cwd, { source: str(w.from), target: str(w.to) }, ctx);
    console.log(`    ✔ xo/template → ${w.to}`);
    return {};
  }

  if (actionName === "xo/append") {
    if (dryRun) { console.log(`  [dry-run] append to: ${w.file}`); return {}; }
    await appendToFile(cwd, { target: str(w.file), content: str(w.content), newline: w.newline !== false }, ctx);
    console.log(`    ✔ xo/append → ${w.file}`);
    return {};
  }

  if (actionName === "xo/inject") {
    if (dryRun) { console.log(`  [dry-run] inject into: ${w.file}`); return {}; }
    await injectIntoFile(
      cwd,
      { target: str(w.file), content: str(w.content), after: w.after ? str(w.after) : undefined, before: w.before ? str(w.before) : undefined },
      ctx,
    );
    console.log(`    ✔ xo/inject → ${w.file}`);
    return {};
  }

  if (actionName === "xo/replace") {
    if (dryRun) { console.log(`  [dry-run] replace in: ${w.file}`); return {}; }
    await replaceInFile(cwd, { target: str(w.file), search: str(w.find), replace: str(w.replace) }, ctx);
    console.log(`    ✔ xo/replace → ${w.file}`);
    return {};
  }

  if (actionName === "xo/json") {
    if (dryRun) { console.log(`  [dry-run] json: ${w.file} @ ${w.path}`); return {}; }
    await mergeJsonFile(cwd, { target: str(w.file), merge: dotToNested(str(w.path), w.value), deep: true }, ctx);
    console.log(`    ✔ xo/json → ${w.file}`);
    return {};
  }

  if (actionName === "xo/env") {
    if (dryRun) {
      console.log(`  [dry-run] env: ${Object.keys(w.variables as object).join(", ")}`);
      return {};
    }
    const variables = w.variables as Record<string, string>;
    for (const [key, value] of Object.entries(variables)) {
      await setEnvVar(cwd, { target: str(w.file ?? ".env.example"), key, value: String(value) }, ctx);
    }
    console.log(`    ✔ xo/env → ${Object.keys(variables).join(", ")}`);
    return {};
  }

  // ── Code actions ──────────────────────────────────────────────────────────

  if (actionName === "xo/ast-import") {
    if (dryRun) { console.log(`  [dry-run] ast-import: ${w.import} from "${w.from}" in ${w.file}`); return {}; }
    await astAddImport(cwd, { file: str(w.file), import: w.import as string | string[], from: str(w.from), isDefault: Boolean(w.isDefault) }, ctx);
    console.log(`    ✔ xo/ast-import → ${w.file}`);
    return {};
  }

  // ── Package actions ───────────────────────────────────────────────────────

  if (actionName === "xo/install-pkg") {
    // Use steps.pm.outputs.value if available, fallback to detecting now
    const pm = (context.steps["pm"]?.outputs["value"] as string | undefined)
      ?? await detectPackageManager(cwd);
    const devFlag = w.dev ? (pm === "npm" ? "--save-dev" : "-D") : "";
    const cmd = `${pm} ${pm === "npm" ? "install" : "add"} ${str(w.pkg)}${devFlag ? " " + devFlag : ""}`;
    if (dryRun) { console.log(`  [dry-run] install-pkg: ${cmd}`); return {}; }
    runCommand(cwd, { command: cmd }, ctx, false);
    console.log(`    ✔ xo/install-pkg → ${w.pkg}`);
    return {};
  }

  // ── Prompt / message actions ──────────────────────────────────────────────

  if (actionName === "xo/prompt") {
    const type = str(w.type) || "info";
    const message = str(w.message);

    if (type === "confirm") {
      if (dryRun) { console.log(`  [dry-run] prompt(confirm): ${message}`); return { confirmed: true }; }
      const { confirmed } = await prompts({
        type: "confirm",
        name: "confirmed",
        message,
        initial: w.default !== false,
      }, { onCancel: () => process.exit(0) });
      return { confirmed: Boolean(confirmed) };
    }

    // info / warn / success — just print
    const prefix =
      type === "warn" ? "  ⚠ " :
      type === "success" ? "  ✔ " :
      "  ℹ ";
    console.log(`${prefix}${message}`);
    return {};
  }

  // ── Execution actions ─────────────────────────────────────────────────────

  if (actionName === "xo/run") {
    runCommand(cwd, { command: str(w.command) }, ctx, dryRun);
    if (!dryRun) console.log(`    ✔ xo/run → ${w.command}`);
    return {};
  }

  if (actionName === "xo/script") {
    await runScript(generatorDir, cwd, { script: str(w.file) }, ctx, dryRun);
    if (!dryRun) console.log(`    ✔ xo/script → ${w.file}`);
    return {};
  }

  throw new Error(`Unknown built-in action: "${actionName}". Available: xo/detect-pm, xo/detect-lang, xo/file-exists, xo/pkg-installed, xo/read-json, xo/copy, xo/template, xo/append, xo/inject, xo/replace, xo/json, xo/env, xo/ast-import, xo/install-pkg, xo/run, xo/script, xo/prompt`);
}

export async function runStep(
  step: Step,
  context: RunContext,
): Promise<Record<string, unknown>> {
  const flatCtx: Record<string, unknown> = {
    inputs: context.inputs,
    config: context.config,
    steps: context.steps,
    env: context.env,
    ...context.inputs,
  };

  if (step.if && !evaluate(interpolate(step.if, flatCtx), flatCtx)) {
    return {};
  }

  if (step.uses) {
    if (!step.uses.startsWith("xo/")) {
      const loaded = await loadAction(step.uses, context.generatorDir);
      if (loaded.type === "composite") {
        return runCompositeAction(loaded, step.with ?? {}, context, runStep);
      }
      if (loaded.type === "prompt") {
        return runPromptAction(loaded, step.with ?? {}, context);
      }
      return runScriptAction(loaded, step.with ?? {}, context);
    }
    return runBuiltinAction(step.uses, step.with ?? {}, flatCtx, context);
  }

  if (step.run) {
    const cmd = interpolate(step.run, flatCtx);
    if (context.dryRun) {
      console.log(`  [dry-run] run: ${cmd}`);
    } else {
      runCommand(context.cwd, { command: cmd }, flatCtx, false);
      console.log(`    ✔ run: ${cmd}`);
    }
    return {};
  }

  throw new Error(`Step has neither "uses" nor "run": ${JSON.stringify(step)}`);
}
