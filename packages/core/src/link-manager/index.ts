import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { parse as parseYaml } from "yaml";
import type { Workflow } from "../types.js";

const LINKED_PATH = path.join(os.homedir(), ".xo", "linked.json");

export interface LinkedEntry {
  dir: string;
  linkedAt: string;
}

type LinkedRegistry = Record<string, LinkedEntry>;

async function read(): Promise<LinkedRegistry> {
  if (!(await fs.pathExists(LINKED_PATH))) return {};
  return fs.readJson(LINKED_PATH).catch(() => ({}));
}

async function write(data: LinkedRegistry): Promise<void> {
  await fs.ensureDir(path.dirname(LINKED_PATH));
  await fs.writeJson(LINKED_PATH, data, { spaces: 2 });
}

async function readWorkflowName(dir: string): Promise<string | null> {
  for (const filename of ["workflow.yaml", "workflow.yml"]) {
    const file = path.join(dir, filename);
    if (await fs.pathExists(file)) {
      const content = await fs.readFile(file, "utf8");
      const wf = parseYaml(content) as Partial<Workflow>;
      return wf.name ?? null;
    }
  }
  // Try workflows/ directory
  for (const trigger of ["add", "create", "run"]) {
    for (const ext of ["yaml", "yml"]) {
      const file = path.join(dir, "workflows", `${trigger}.${ext}`);
      if (await fs.pathExists(file)) {
        const content = await fs.readFile(file, "utf8");
        const wf = parseYaml(content) as Partial<Workflow>;
        return wf.name ?? null;
      }
    }
  }
  return null;
}

export async function linkGenerator(dir: string, name?: string): Promise<string> {
  const resolvedDir = path.resolve(dir);
  const resolvedName = name ?? (await readWorkflowName(resolvedDir));

  if (!resolvedName) {
    throw new Error(
      `Could not determine generator name.\n` +
        `Either pass a name: xo link <name>\n` +
        `Or add a "name" field to your workflow.yaml`,
    );
  }

  const linked = await read();
  linked[resolvedName] = { dir: resolvedDir, linkedAt: new Date().toISOString() };
  await write(linked);
  return resolvedName;
}

export async function unlinkGenerator(dir: string, name?: string): Promise<string | null> {
  const resolvedDir = path.resolve(dir);
  const linked = await read();

  // Find by explicit name, or by matching directory
  const targetName =
    name ?? Object.keys(linked).find((n) => linked[n]!.dir === resolvedDir);

  if (!targetName || !linked[targetName]) return null;

  delete linked[targetName];
  await write(linked);
  return targetName;
}

export async function resolveLinked(name: string): Promise<string | null> {
  const linked = await read();
  return linked[name]?.dir ?? null;
}

export async function listLinked(): Promise<Array<{ name: string } & LinkedEntry>> {
  const linked = await read();
  return Object.entries(linked).map(([name, entry]) => ({ name, ...entry }));
}
