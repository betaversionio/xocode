import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import { interpolate } from "../utils/interpolate.js";

export interface CommandAction {
  command: string;
  cwd?: string;
}

export interface ScriptAction {
  script: string;
  cwd?: string;
}

export function runCommand(
  cwd: string,
  action: CommandAction,
  ctx: Record<string, unknown>,
  dryRun = false,
): void {
  const cmd = interpolate(action.command, ctx);
  const execCwd = action.cwd ? path.join(cwd, interpolate(action.cwd, ctx)) : cwd;

  if (dryRun) {
    console.log(`[dry-run] command: ${cmd} (in ${execCwd})`);
    return;
  }

  const result = spawnSync(cmd, { cwd: execCwd, shell: true, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status ?? "unknown"}): ${cmd}`);
  }
}

export async function runScript(
  generatorDir: string,
  cwd: string,
  action: ScriptAction,
  ctx: Record<string, unknown>,
  dryRun = false,
): Promise<void> {
  const scriptPath = path.join(generatorDir, interpolate(action.script, ctx));
  if (!(await fs.pathExists(scriptPath))) {
    throw new Error(`Script not found: ${scriptPath}`);
  }

  const execCwd = action.cwd ? path.join(cwd, interpolate(action.cwd, ctx)) : cwd;

  if (dryRun) {
    console.log(`[dry-run] script: ${scriptPath} (in ${execCwd})`);
    return;
  }

  const result = spawnSync(scriptPath, { cwd: execCwd, shell: true, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Script failed (exit ${result.status ?? "unknown"}): ${scriptPath}`);
  }
}
