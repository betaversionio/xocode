import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import type { Generator } from "../types.js";

const GENERATOR_FILE = "generator.json";
const LOCAL_GENERATORS_DIR = ".xo/generators";
const GLOBAL_GENERATORS_DIR = path.join(os.homedir(), ".xo", "generators");

export interface LoadedGenerator {
  generator: Generator;
  dir: string;
}

function parseGeneratorName(name: string): { owner: string; repo: string; subpath?: string } | null {
  // GitHub format: owner/repo or owner/repo/subpath
  const parts = name.split("/");
  if (parts.length >= 2) {
    const sub = parts.slice(2).join("/");
    return { owner: parts[0]!, repo: parts[1]!, subpath: sub || undefined };
  }
  return null;
}

async function loadFromDir(dir: string): Promise<LoadedGenerator | null> {
  const genFile = path.join(dir, GENERATOR_FILE);
  if (!(await fs.pathExists(genFile))) return null;
  const generator = await fs.readJson(genFile);
  return { generator, dir };
}

async function fetchFromGitHub(name: string): Promise<LoadedGenerator | null> {
  const parsed = parseGeneratorName(name);
  if (!parsed) return null;

  const { owner, repo, subpath } = parsed;
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/main`;
  const genUrl = subpath ? `${base}/${subpath}/${GENERATOR_FILE}` : `${base}/${GENERATOR_FILE}`;

  try {
    const res = await fetch(genUrl);
    if (!res.ok) return null;
    const generator = (await res.json()) as Generator;
    // Store in global cache
    const cacheDir = path.join(GLOBAL_GENERATORS_DIR, owner, repo, subpath ?? "");
    await fs.ensureDir(cacheDir);
    await fs.writeJson(path.join(cacheDir, GENERATOR_FILE), generator, { spaces: 2 });
    return { generator, dir: cacheDir };
  } catch {
    return null;
  }
}

export async function loadGenerator(name: string, cwd: string): Promise<LoadedGenerator> {
  // 1. Local path (starts with ./ or /)
  if (name.startsWith("./") || name.startsWith("/")) {
    const dir = path.isAbsolute(name) ? name : path.join(cwd, name);
    const loaded = await loadFromDir(dir);
    if (loaded) return loaded;
    throw new Error(`Generator not found at local path: ${dir}`);
  }

  // 2. Project-local .xo/generators/<name>
  const localDir = path.join(cwd, LOCAL_GENERATORS_DIR, name);
  const localLoaded = await loadFromDir(localDir);
  if (localLoaded) return localLoaded;

  // 3. Global ~/.xo/generators/<name>
  const globalDir = path.join(GLOBAL_GENERATORS_DIR, name);
  const globalLoaded = await loadFromDir(globalDir);
  if (globalLoaded) return globalLoaded;

  // 4. Fetch from GitHub (owner/repo or owner/repo/subpath)
  const remote = await fetchFromGitHub(name);
  if (remote) return remote;

  throw new Error(
    `Generator "${name}" not found locally or on GitHub.\n` +
    `Tried:\n  - ${localDir}\n  - ${globalDir}\n  - GitHub: ${name}`,
  );
}

export async function installGenerator(name: string, cwd: string): Promise<void> {
  const loaded = await loadGenerator(name, cwd);
  const destDir = path.join(cwd, LOCAL_GENERATORS_DIR, loaded.generator.name ?? name);
  if (destDir !== loaded.dir) {
    await fs.ensureDir(destDir);
    await fs.copy(loaded.dir, destDir, { overwrite: true });
  }
}
