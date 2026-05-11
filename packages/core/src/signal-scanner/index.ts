// Detection utilities used internally by xo/* detection actions.
// Not part of the public API — detection is done via explicit workflow steps.

import path from "node:path";
import fs from "fs-extra";

export async function detectPackageManager(cwd: string): Promise<string> {
  if (await fs.pathExists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (
    (await fs.pathExists(path.join(cwd, "bun.lockb"))) ||
    (await fs.pathExists(path.join(cwd, "bun.lock")))
  )
    return "bun";
  if (await fs.pathExists(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

export async function detectLanguage(cwd: string): Promise<string> {
  if (await fs.pathExists(path.join(cwd, "tsconfig.json"))) return "typescript";
  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath).catch(() => ({}));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps["typescript"] || allDeps["ts-node"]) return "typescript";
  }
  if (await fs.pathExists(path.join(cwd, "pubspec.yaml"))) return "dart";
  if (await fs.pathExists(path.join(cwd, "go.mod"))) return "go";
  if (await fs.pathExists(path.join(cwd, "Cargo.toml"))) return "rust";
  if (
    (await fs.pathExists(path.join(cwd, "requirements.txt"))) ||
    (await fs.pathExists(path.join(cwd, "pyproject.toml")))
  )
    return "python";
  return "javascript";
}

export async function isPkgInstalled(
  cwd: string,
  pkg: string,
): Promise<{ installed: boolean; version?: string }> {
  const pkgPath = path.join(cwd, "package.json");
  if (!(await fs.pathExists(pkgPath))) return { installed: false };
  const json = await fs.readJson(pkgPath).catch(() => ({}));
  const allDeps = {
    ...json.dependencies,
    ...json.devDependencies,
    ...json.peerDependencies,
  };
  const version = allDeps[pkg] as string | undefined;
  return { installed: Boolean(version), version };
}

export async function readJsonAtPath(
  cwd: string,
  file: string,
  jsonPath: string,
): Promise<unknown> {
  const absPath = path.join(cwd, file);
  if (!(await fs.pathExists(absPath))) return undefined;
  const json = await fs.readJson(absPath).catch(() => undefined);
  if (json === undefined) return undefined;
  const parts = jsonPath.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = json;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}
