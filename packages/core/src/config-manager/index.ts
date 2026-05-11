import path from "node:path";
import fs from "fs-extra";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { XoConfig } from "../types.js";

const CONFIG_FILES = ["xo.config.yaml", "xo.config.yml", "xo.config.json"];
const DEFAULT_CONFIG_FILE = "xo.config.yaml";

async function findConfigFile(cwd: string): Promise<{ filePath: string; isYaml: boolean } | null> {
  for (const filename of CONFIG_FILES) {
    const filePath = path.join(cwd, filename);
    if (await fs.pathExists(filePath)) {
      return { filePath, isYaml: !filename.endsWith(".json") };
    }
  }
  return null;
}

export async function readConfig(cwd: string): Promise<XoConfig> {
  const found = await findConfigFile(cwd);
  if (!found) return {};
  try {
    const content = await fs.readFile(found.filePath, "utf8");
    return (found.isYaml ? parseYaml(content) : JSON.parse(content)) as XoConfig;
  } catch {
    return {};
  }
}

export async function writeConfig(cwd: string, config: XoConfig): Promise<void> {
  const found = await findConfigFile(cwd);
  const filePath = found?.filePath ?? path.join(cwd, DEFAULT_CONFIG_FILE);
  const isYaml = !filePath.endsWith(".json");
  const content = isYaml ? stringifyYaml(config) : JSON.stringify(config, null, 2);
  await fs.writeFile(filePath, content, "utf8");
}

export async function mergeConfig(cwd: string, patch: Partial<XoConfig>): Promise<void> {
  const existing = await readConfig(cwd);
  await writeConfig(cwd, { ...existing, ...patch });
}
