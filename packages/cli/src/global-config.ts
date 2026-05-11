import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

const CONFIG_PATH = path.join(os.homedir(), ".xo", "config.json");

export interface XoGlobalConfig {
  autoUpdate: boolean;
  registryUrl: string;
  githubToken?: string;
}

const DEFAULTS: XoGlobalConfig = {
  autoUpdate: true,
  registryUrl: "https://registry.npmjs.org",
};

export const CONFIG_META: Record<
  string,
  { description: string; type: "boolean" | "string"; default?: string }
> = {
  autoUpdate: {
    description: "Show update notifications after each command",
    type: "boolean",
    default: "true",
  },
  registryUrl: {
    description: "npm registry URL used for update checks",
    type: "string",
    default: "https://registry.npmjs.org",
  },
  githubToken: {
    description: "GitHub personal access token for private generator repos",
    type: "string",
  },
};

export async function readGlobalConfig(): Promise<XoGlobalConfig> {
  if (!(await fs.pathExists(CONFIG_PATH))) return { ...DEFAULTS };
  const stored = await fs.readJson(CONFIG_PATH).catch(() => ({}));
  return { ...DEFAULTS, ...stored };
}

export async function getConfigValue(key: string): Promise<unknown> {
  if (!(key in CONFIG_META)) throw new Error(unknownKeyMsg(key));
  const config = await readGlobalConfig();
  return (config as Record<string, unknown>)[key];
}

export async function setConfigValue(key: string, raw: string): Promise<void> {
  if (!(key in CONFIG_META)) throw new Error(unknownKeyMsg(key));
  const meta = CONFIG_META[key]!;

  let value: unknown = raw;
  if (meta.type === "boolean") {
    if (raw === "true") value = true;
    else if (raw === "false") value = false;
    else throw new Error(`Invalid value for "${key}": expected true or false, got "${raw}"`);
  }

  const current = await readGlobalConfig();
  await fs.ensureDir(path.dirname(CONFIG_PATH));
  await fs.writeJson(CONFIG_PATH, { ...current, [key]: value }, { spaces: 2 });
}

function unknownKeyMsg(key: string): string {
  return (
    `Unknown config key: "${key}"\n` +
    `Valid keys: ${Object.keys(CONFIG_META).join(", ")}`
  );
}
