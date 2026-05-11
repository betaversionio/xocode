import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { Workflow, WorkflowTrigger } from "../types.js";
import { resolveEntry } from "../registry-manager/index.js";
import { isGitHubRef, parseGitHubRef, resolveGitHubWorkflow } from "../github-resolver/index.js";
import { resolveLinked } from "../link-manager/index.js";

const WORKFLOW_FILES = ["workflow.yaml", "workflow.yml"];
const CACHE_DIR = path.join(os.homedir(), ".xo", "cache", "registry");

function parseWorkflow(content: string): Workflow {
  return parseYaml(content) as Workflow;
}

async function loadFromDir(dir: string, trigger?: WorkflowTrigger): Promise<Workflow | null> {
  if (trigger) {
    for (const ext of ["yaml", "yml"]) {
      const file = path.join(dir, "workflows", `${trigger}.${ext}`);
      if (await fs.pathExists(file)) {
        return parseWorkflow(await fs.readFile(file, "utf8"));
      }
    }
  }
  for (const filename of WORKFLOW_FILES) {
    const file = path.join(dir, filename);
    if (await fs.pathExists(file)) {
      return parseWorkflow(await fs.readFile(file, "utf8"));
    }
  }
  return null;
}

function toRawBase(githubUrl: string, subpath?: string): string {
  const repoPath = githubUrl.startsWith("https://github.com/")
    ? githubUrl.replace("https://github.com/", "")
    : githubUrl;
  const base = `https://raw.githubusercontent.com/${repoPath}/main`;
  return subpath ? `${base}/${subpath}` : base;
}

async function fetchFromRegistryEntry(
  url: string,
  subpath: string | undefined,
  name: string,
  trigger: WorkflowTrigger | undefined,
): Promise<{ workflow: Workflow; dir: string } | null> {
  const rawBase = toRawBase(url, subpath);
  const token = process.env["XO_GITHUB_TOKEN"];
  const headers: Record<string, string> = token ? { Authorization: `token ${token}` } : {};

  const candidates: string[] = [];
  if (trigger) {
    candidates.push(`${rawBase}/workflows/${trigger}.yaml`, `${rawBase}/workflows/${trigger}.yml`);
  }
  candidates.push(`${rawBase}/workflow.yaml`, `${rawBase}/workflow.yml`);

  for (const fileUrl of candidates) {
    try {
      const res = await fetch(fileUrl, { headers });
      if (!res.ok) continue;

      const content = await res.text();
      const workflow = parseWorkflow(content);

      const cacheDir = path.join(CACHE_DIR, name.replace(/\//g, path.sep));
      await fs.ensureDir(cacheDir);
      await fs.writeFile(path.join(cacheDir, "workflow.yaml"), stringifyYaml(workflow));
      await fs.writeFile(path.join(cacheDir, ".rawbase"), rawBase);

      return { workflow, dir: cacheDir };
    } catch {
      continue;
    }
  }

  return null;
}

export interface LoadedWorkflow {
  workflow: Workflow;
  dir: string;
}

export async function loadWorkflow(
  name: string,
  cwd: string,
  trigger?: WorkflowTrigger,
  local = false,
): Promise<LoadedWorkflow> {

  // ── @github/ direct reference ─────────────────────────────────────────────
  if (isGitHubRef(name)) {
    const ref = parseGitHubRef(name);
    if (!ref) throw new Error(`Invalid @github reference: "${name}"`);

    const resolved = await resolveGitHubWorkflow(ref, trigger);
    if (resolved) return { workflow: resolved.workflow, dir: resolved.dir };

    throw new Error(
      `Could not load workflow from ${name}.\n` +
        `Tried: https://github.com/${ref.owner}/${ref.repo} (ref: ${ref.ref}${ref.subpath ? `, path: ${ref.subpath}` : ""})\n` +
        (process.env["XO_GITHUB_TOKEN"]
          ? ""
          : `For private repos, set XO_GITHUB_TOKEN=<your-token>`),
    );
  }

  // ── Local path (./relative, /absolute, or --local flag) ───────────────────
  if (local || name.startsWith("./") || name.startsWith("/")) {
    const dir = path.isAbsolute(name) ? name : path.join(cwd, name);
    const workflow = await loadFromDir(dir, trigger);
    if (workflow) return { workflow, dir };
    throw new Error(`No workflow.yaml found at local path: ${dir}`);
  }

  // ── Linked (xo link) — checked before registry so local overrides work ───
  const linkedDir = await resolveLinked(name);
  if (linkedDir) {
    const workflow = await loadFromDir(linkedDir, trigger);
    if (workflow) {
      console.log(`  (linked) ${name} → ${linkedDir}`);
      return { workflow, dir: linkedDir };
    }
    console.warn(`  Warning: "${name}" is linked to ${linkedDir} but no workflow.yaml found there.`);
  }

  // ── Project-local cache (.xo/generators/<name>) ───────────────────────────
  const projectLocalDir = path.join(cwd, ".xo", "generators", name);
  const projectLocal = await loadFromDir(projectLocalDir, trigger);
  if (projectLocal) return { workflow: projectLocal, dir: projectLocalDir };

  // ── Registry lookup ───────────────────────────────────────────────────────
  const entry = await resolveEntry(name);
  if (entry) {
    const fetched = await fetchFromRegistryEntry(entry.url, entry.path, name, trigger);
    if (fetched) return fetched;
    throw new Error(
      `Workflow "${name}" is registered but could not be fetched.\n` +
        `URL: ${entry.url}${entry.path ? ` (path: ${entry.path})` : ""}`,
    );
  }

  throw new Error(
    `Workflow "${name}" not found.\n\n` +
      `Options:\n` +
      `  Direct GitHub:  xo add @github/<owner>/<repo>\n` +
      `  Register first: xo registry add ${name} --url <github-url>`,
  );
}
