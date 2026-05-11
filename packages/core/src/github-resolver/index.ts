import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { Workflow, WorkflowTrigger } from "../types.js";

const CACHE_DIR = path.join(os.homedir(), ".xo", "cache", "github");

export interface GitHubRef {
  owner: string;
  repo: string;
  subpath?: string;
  ref: string;           // branch, tag, or commit — defaults to "main"
  isMutable: boolean;    // true for branches (don't cache forever), false for tags/commits
}

/**
 * Parses the @github/ direct-reference syntax.
 *
 * Supported forms:
 *   @github/owner/repo
 *   @github/owner/repo/subpath
 *   @github/owner/repo@tag
 *   @github/owner/repo#branch
 *   @github/owner/repo/subpath@tag
 *   @github/owner/repo/subpath#branch
 */
export function parseGitHubRef(name: string): GitHubRef | null {
  if (!name.startsWith("@github/")) return null;

  let rest = name.slice("@github/".length);
  let ref = "main";
  let isMutable = true;

  // Extract #branch (git-style — must check before @ to avoid false splits)
  const hashIdx = rest.indexOf("#");
  if (hashIdx !== -1) {
    ref = rest.slice(hashIdx + 1).trim();
    rest = rest.slice(0, hashIdx);
    isMutable = true;
  } else {
    // Extract @tag — use lastIndexOf so subpaths with no @ are handled cleanly
    const atIdx = rest.lastIndexOf("@");
    if (atIdx !== -1) {
      ref = rest.slice(atIdx + 1).trim();
      rest = rest.slice(0, atIdx);
      isMutable = false; // tags are immutable — cache forever
    }
  }

  const parts = rest.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0]!;
  const repo = parts[1]!;
  const subpath = parts.slice(2).join("/") || undefined;

  return { owner, repo, subpath, ref, isMutable };
}

export function formatGitHubRef(ref: GitHubRef): string {
  const sub = ref.subpath ? `/${ref.subpath}` : "";
  const ver = ref.ref !== "main" ? (ref.isMutable ? `#${ref.ref}` : `@${ref.ref}`) : "";
  return `@github/${ref.owner}/${ref.repo}${sub}${ver}`;
}

function rawBase(ref: GitHubRef): string {
  const sub = ref.subpath ? `/${ref.subpath}` : "";
  return `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${ref.ref}${sub}`;
}

function cacheDir(ref: GitHubRef): string {
  const sub = ref.subpath ? path.join(...ref.subpath.split("/")) : "";
  const refSlug = ref.ref.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(CACHE_DIR, ref.owner, ref.repo, refSlug, sub);
}

function authHeaders(): Record<string, string> {
  const token = process.env["XO_GITHUB_TOKEN"];
  return token ? { Authorization: `token ${token}` } : {};
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

function parseWorkflow(content: string): Workflow {
  return parseYaml(content) as Workflow;
}

export interface ResolvedWorkflow {
  workflow: Workflow;
  dir: string;
  ref: GitHubRef;
}

export async function resolveGitHubWorkflow(
  ref: GitHubRef,
  trigger?: WorkflowTrigger,
): Promise<ResolvedWorkflow | null> {
  const base = rawBase(ref);
  const dir = cacheDir(ref);

  // For immutable refs (tags), serve from cache if present
  if (!ref.isMutable) {
    const cached = await loadFromCacheDir(dir, trigger);
    if (cached) return { workflow: cached, dir, ref };
  }

  // Candidate URLs in priority order
  const candidates: string[] = [];
  if (trigger) {
    candidates.push(
      `${base}/workflows/${trigger}.yaml`,
      `${base}/workflows/${trigger}.yml`,
    );
  }
  candidates.push(`${base}/workflow.yaml`, `${base}/workflow.yml`);

  for (const url of candidates) {
    const content = await fetchText(url);
    if (!content) continue;

    const workflow = parseWorkflow(content);

    // Cache the result
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, "workflow.yaml"), stringifyYaml(workflow));
    await fs.writeFile(path.join(dir, ".rawbase"), base);
    await fs.writeFile(path.join(dir, ".ref"), JSON.stringify(ref));

    return { workflow, dir, ref };
  }

  return null;
}

async function loadFromCacheDir(dir: string, trigger?: WorkflowTrigger): Promise<Workflow | null> {
  // Try trigger-specific cached file
  if (trigger) {
    for (const ext of ["yaml", "yml"]) {
      const file = path.join(dir, "workflows", `${trigger}.${ext}`);
      if (await fs.pathExists(file)) {
        return parseWorkflow(await fs.readFile(file, "utf8"));
      }
    }
  }
  const file = path.join(dir, "workflow.yaml");
  if (await fs.pathExists(file)) {
    return parseWorkflow(await fs.readFile(file, "utf8"));
  }
  return null;
}

export function isGitHubRef(name: string): boolean {
  return name.startsWith("@github/");
}
