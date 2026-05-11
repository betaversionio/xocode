import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

const REGISTRY_PATH = path.join(os.homedir(), ".xo", "registry.json");

export interface RegistryEntry {
  url: string;
  path?: string;   // subpath within the repo, for multi-workflow repos
  addedAt: string;
}

export type Registry = Record<string, RegistryEntry>;

async function readRegistry(): Promise<Registry> {
  if (!(await fs.pathExists(REGISTRY_PATH))) return {};
  return fs.readJson(REGISTRY_PATH).catch(() => ({}));
}

async function writeRegistry(registry: Registry): Promise<void> {
  await fs.ensureDir(path.dirname(REGISTRY_PATH));
  await fs.writeJson(REGISTRY_PATH, registry, { spaces: 2 });
}

export async function addToRegistry(name: string, url: string, path?: string): Promise<void> {
  const registry = await readRegistry();
  registry[name] = { url, ...(path ? { path } : {}), addedAt: new Date().toISOString() };
  await writeRegistry(registry);
}

export async function removeFromRegistry(name: string): Promise<boolean> {
  const registry = await readRegistry();
  if (!registry[name]) return false;
  delete registry[name];
  await writeRegistry(registry);
  return true;
}

export async function listRegistry(): Promise<Array<{ name: string } & RegistryEntry>> {
  const registry = await readRegistry();
  return Object.entries(registry).map(([name, entry]) => ({ name, ...entry }));
}

export async function resolveUrl(name: string): Promise<string | null> {
  const registry = await readRegistry();
  return registry[name]?.url ?? null;
}

export async function resolveEntry(name: string): Promise<RegistryEntry | null> {
  const registry = await readRegistry();
  return registry[name] ?? null;
}
