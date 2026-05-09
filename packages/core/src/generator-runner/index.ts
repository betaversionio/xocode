import type { Generator, RunOptions, Signal } from "../types.js";
import { scanSignals } from "../signal-scanner/index.js";
import { readConfig, mergeConfig } from "../config-manager/index.js";
import { recordOperation, snapshotFile } from "../state-manager/index.js";
import type { FileSnapshot } from "../state-manager/index.js";
import { validateRequires, validateConflicts, validateDetects } from "../rule-validator/index.js";
import { runPrompts } from "../prompt-engine/index.js";
import { runActions } from "../action-runner/index.js";
import { loadGenerator } from "../generator-loader/index.js";
import { listOperations } from "../state-manager/index.js";
import fs from "fs-extra";
import path from "node:path";

export interface RunResult {
  generator: Generator;
  answers: Record<string, unknown>;
  filesChanged: FileSnapshot[];
  operationId?: string;
  dryRun: boolean;
}

export async function run(
  name: string,
  cwd: string,
  opts: RunOptions = {},
): Promise<RunResult> {
  const { dryRun = false } = opts;

  const { generator, dir: generatorDir } = await loadGenerator(name, cwd);
  const signals: Signal = await scanSignals(cwd);
  const config = await readConfig(cwd);

  // Validate detects
  if (generator.detects && generator.detects.length > 0) {
    const detected = validateDetects(generator.detects, signals);
    if (!detected) {
      throw new Error(
        `Generator "${name}" detected incompatible project signals. ` +
        `It may not be designed for this project type.`,
      );
    }
  }

  // Validate requires / conflicts
  const ops = await listOperations(cwd);
  const appliedGenerators = ops.map((o) => o.generator);

  if (generator.requires && generator.requires.length > 0) {
    const result = validateRequires(generator.requires, appliedGenerators);
    if (!result.valid) throw new Error(result.errors.join("\n"));
  }

  if (generator.conflicts && generator.conflicts.length > 0) {
    const result = validateConflicts(generator.conflicts, appliedGenerators);
    if (!result.valid) throw new Error(result.errors.join("\n"));
  }

  // Build prompt context from signals + config
  const promptCtx: Record<string, unknown> = {
    ...signals,
    ...config,
    name,
    generatorName: name,
  };

  const answers = generator.prompts && generator.prompts.length > 0 && !dryRun
    ? await runPrompts(generator.prompts, promptCtx)
    : {};

  const ctx: Record<string, unknown> = { ...promptCtx, ...answers };

  // Snapshot files that will be touched for undo support
  const filesChanged: FileSnapshot[] = [];

  if (!dryRun && generator.actions) {
    const targetFiles = getTargetFiles(generator, ctx);
    for (const filePath of targetFiles) {
      const before = await snapshotFile(cwd, filePath);
      filesChanged.push({
        filePath,
        action: before === undefined ? "created" : "modified",
        before,
      });
    }
  }

  // Run actions
  if (generator.actions) {
    await runActions(generator.actions, {
      generatorDir,
      cwd,
      ctx,
      dryRun,
    });
  }

  // Record state
  let operationId: string | undefined;
  if (!dryRun) {
    const operationType = generator.type === "project" ? "create" : "add";
    operationId = await recordOperation(cwd, name, operationType, filesChanged);

    // Update xo.config.json
    if (generator.type === "project") {
      await mergeConfig(cwd, { template: name });
    } else {
      const existing = (config.features as string[] | undefined) ?? [];
      await mergeConfig(cwd, {
        features: [...new Set([...existing, name])],
      });
    }
  }

  return { generator, answers, filesChanged, operationId, dryRun };
}

function getTargetFiles(generator: Generator, ctx: Record<string, unknown>): string[] {
  if (!generator.actions) return [];
  const files: string[] = [];
  for (const action of generator.actions) {
    const target = action.target as string | undefined;
    if (target) {
      const rendered = target.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
        const val = ctx[key.trim()];
        return val !== undefined ? String(val) : _;
      });
      files.push(rendered);
    }
  }
  return [...new Set(files)];
}

export { loadGenerator, scanSignals, readConfig, mergeConfig };
