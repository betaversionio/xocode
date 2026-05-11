import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { Generator } from "../types.js";

const GENERATOR_FILES = ["generator.yaml", "generator.yml", "generator.json"];
const LOCAL_GENERATORS_DIR = ".xo/generators";
const GLOBAL_GENERATORS_DIR = path.join(os.homedir(), ".xo", "generators");

export interface LoadedGenerator {
  generator: Generator;
  dir: string;
}

function parseGeneratorName(name: string): { owner: string; repo: string; subpath?: string } | null {
  const parts = name.split("/");
  if (parts.length >= 2) {
    const sub = parts.slice(2).join("/");
    return { owner: parts[0]!, repo: parts[1]!, subpath: sub || undefined };
  }
  return null;
}

function parseFile(content: string, filename: string): Generator {
  if (filename.endsWith(".json")) return JSON.parse(content) as Generator;
  return parseYaml(content) as Generator;
}

async function loadFromDir(dir: string): Promise<LoadedGenerator | null> {
  for (const filename of GENERATOR_FILES) {
    const genFile = path.join(dir, filename);
    if (await fs.pathExists(genFile)) {
      const content = await fs.readFile(genFile, "utf8");
      const generator = parseFile(content, filename);
      return { generator, dir };
    }
  }
  return null;
}

async function fetchFromGitHub(name: string): Promise<LoadedGenerator | null> {
  const parsed = parseGeneratorName(name);
  if (!parsed) return null;

  const { owner, repo, subpath } = parsed;
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/main`;
  const basePath = subpath ? `${base}/${subpath}` : base;

  for (const filename of GENERATOR_FILES) {
    const genUrl = `${basePath}/${filename}`;
    try {
      const res = await fetch(genUrl);
      if (!res.ok) continue;
      const content = await res.text();
      const generator = parseFile(content, filename);
      const cacheDir = path.join(GLOBAL_GENERATORS_DIR, owner, repo, subpath ?? "");
      await fs.ensureDir(cacheDir);
      await fs.writeFile(path.join(cacheDir, "generator.yaml"), stringifyYaml(generator));
      return { generator, dir: cacheDir };
    } catch {
      continue;
    }
  }
  return null;
}

export async function loadGenerator(name: string, cwd: string): Promise<LoadedGenerator> {
  if (name.startsWith("./") || name.startsWith("/")) {
    const dir = path.isAbsolute(name) ? name : path.join(cwd, name);
    const loaded = await loadFromDir(dir);
    if (loaded) return loaded;
    throw new Error(`Generator not found at local path: ${dir}`);
  }

  const localDir = path.join(cwd, LOCAL_GENERATORS_DIR, name);
  const localLoaded = await loadFromDir(localDir);
  if (localLoaded) return localLoaded;

  const globalDir = path.join(GLOBAL_GENERATORS_DIR, name);
  const globalLoaded = await loadFromDir(globalDir);
  if (globalLoaded) return globalLoaded;

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
