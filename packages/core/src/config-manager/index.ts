import path from "node:path";
import fs from "fs-extra";
import type { XoConfig } from "../types.js";

const CONFIG_FILE = "xo.config.json";

export async function readConfig(cwd: string): Promise<XoConfig> {
  const cfgPath = path.join(cwd, CONFIG_FILE);
  if (!(await fs.pathExists(cfgPath))) return {};
  return fs.readJson(cfgPath).catch(() => ({}));
}

export async function writeConfig(cwd: string, config: XoConfig): Promise<void> {
  await fs.writeJson(path.join(cwd, CONFIG_FILE), config, { spaces: 2 });
}

export async function mergeConfig(cwd: string, patch: Partial<XoConfig>): Promise<void> {
  const existing = await readConfig(cwd);
  await writeConfig(cwd, { ...existing, ...patch });
}
