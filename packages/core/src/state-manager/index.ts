import path from "node:path";
import fs from "fs-extra";
import { randomUUID } from "node:crypto";

const STATE_DIR = ".xo";
const STATE_FILE = "state.json";

export interface FileSnapshot {
  filePath: string;
  action: "created" | "modified" | "deleted";
  before?: string;
}

export interface OperationRecord {
  id: string;
  timestamp: string;
  generator: string;
  type: "create" | "add" | "run";
  files: FileSnapshot[];
}

interface StateData {
  operations: OperationRecord[];
}

async function getStatePath(cwd: string): Promise<string> {
  return path.join(cwd, STATE_DIR, STATE_FILE);
}

async function readState(cwd: string): Promise<StateData> {
  const statePath = await getStatePath(cwd);
  if (!(await fs.pathExists(statePath))) return { operations: [] };
  return fs.readJson(statePath).catch(() => ({ operations: [] }));
}

async function writeState(cwd: string, state: StateData): Promise<void> {
  const statePath = await getStatePath(cwd);
  await fs.ensureDir(path.dirname(statePath));
  await fs.writeJson(statePath, state, { spaces: 2 });
}

export async function recordOperation(
  cwd: string,
  generator: string,
  type: OperationRecord["type"],
  files: FileSnapshot[],
): Promise<string> {
  const state = await readState(cwd);
  const id = randomUUID();
  state.operations.push({ id, timestamp: new Date().toISOString(), generator, type, files });
  await writeState(cwd, state);
  return id;
}

export async function getLastOperation(cwd: string): Promise<OperationRecord | null> {
  const state = await readState(cwd);
  return state.operations.at(-1) ?? null;
}

export async function undoLastOperation(cwd: string): Promise<OperationRecord | null> {
  const state = await readState(cwd);
  const op = state.operations.pop();
  if (!op) return null;

  for (const snap of [...op.files].reverse()) {
    const absPath = path.join(cwd, snap.filePath);
    if (snap.action === "created") {
      await fs.remove(absPath);
    } else if (snap.action === "modified" && snap.before !== undefined) {
      await fs.outputFile(absPath, snap.before, "utf8");
    } else if (snap.action === "deleted" && snap.before !== undefined) {
      await fs.outputFile(absPath, snap.before, "utf8");
    }
  }

  await writeState(cwd, state);
  return op;
}

export async function listOperations(cwd: string): Promise<OperationRecord[]> {
  const state = await readState(cwd);
  return state.operations;
}

export async function snapshotFile(cwd: string, filePath: string): Promise<string | undefined> {
  const absPath = path.join(cwd, filePath);
  if (!(await fs.pathExists(absPath))) return undefined;
  return fs.readFile(absPath, "utf8");
}
