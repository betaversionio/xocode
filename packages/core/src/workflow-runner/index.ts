import type { Workflow, RunOptions, RunContext, WorkflowTrigger } from "../types.js";
import { readConfig, mergeConfig } from "../config-manager/index.js";
import { recordOperation, snapshotFile } from "../state-manager/index.js";
import type { FileSnapshot } from "../state-manager/index.js";
import { validateRequires, validateConflicts, validateDetects } from "../rule-validator/index.js";
import { collectInputs } from "../prompt-engine/index.js";
import { runJobs } from "../job-runner/index.js";
import { loadWorkflow } from "../workflow-loader/index.js";
import { listOperations } from "../state-manager/index.js";

export interface WorkflowRunResult {
  workflow: Workflow;
  inputs: Record<string, unknown>;
  filesChanged: FileSnapshot[];
  operationId?: string;
  dryRun: boolean;
}

function extractTargetFiles(workflow: Workflow, ctx: Record<string, unknown>): string[] {
  const files: string[] = [];
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      if (!step.with) continue;
      for (const candidate of [step.with.to, step.with.file, step.with.target]) {
        if (typeof candidate === "string") {
          const rendered = candidate.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
            const parts = key.trim().split(".");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let cur: any = ctx;
            for (const p of parts) cur = cur?.[p];
            return cur !== undefined ? String(cur) : _;
          });
          files.push(rendered);
        }
      }
    }
  }
  return [...new Set(files)];
}

export async function runWorkflow(
  name: string,
  cwd: string,
  opts: RunOptions = {},
): Promise<WorkflowRunResult> {
  const { dryRun = false, local = false } = opts;
  const trigger: WorkflowTrigger = opts.trigger ?? "add";

  const { workflow, dir: generatorDir } = await loadWorkflow(name, cwd, trigger, local);
  const config = await readConfig(cwd);

  // Pre-flight: declarative detect rules (file/pkg checks, no scanner)
  if (workflow.detects?.length) {
    const ok = await validateDetects(workflow.detects, cwd);
    if (!ok) {
      throw new Error(
        `Workflow "${name}" is incompatible with this project. ` +
          `Check the detect rules in workflow.yaml.`,
      );
    }
  }

  // Validate requires / conflicts
  const ops = await listOperations(cwd);
  const applied = ops.map((o) => o.generator);

  if (workflow.requires?.length) {
    const r = validateRequires(workflow.requires, applied);
    if (!r.valid) throw new Error(r.errors.join("\n"));
  }

  if (workflow.conflicts?.length) {
    const r = validateConflicts(workflow.conflicts, applied);
    if (!r.valid) throw new Error(r.errors.join("\n"));
  }

  // Collect inputs — pre-filled values from CLI flags skip prompting
  const inputs =
    workflow.inputs && !dryRun
      ? await collectInputs(workflow.inputs, opts.inputs ?? {})
      : { ...(opts.inputs ?? {}) };

  const context: RunContext = {
    inputs,
    config,
    steps: {},   // populated as steps with `id:` run
    env: process.env as Record<string, string>,
    generatorDir,
    cwd,
    dryRun,
  };

  // Snapshot files touched by file-writing steps for undo support
  const filesChanged: FileSnapshot[] = [];
  if (!dryRun) {
    const flatCtx = { inputs, config, steps: {}, env: process.env };
    const targets = extractTargetFiles(workflow, flatCtx);
    for (const filePath of targets) {
      const before = await snapshotFile(cwd, filePath);
      filesChanged.push({ filePath, action: before === undefined ? "created" : "modified", before });
    }
  }

  // Execute jobs
  await runJobs(workflow.jobs, context, (jobName) => {
    console.log(`  job: ${jobName}`);
  });

  // Record operation in state
  let operationId: string | undefined;
  if (!dryRun) {
    operationId = await recordOperation(cwd, name, trigger, filesChanged);
    if (trigger === "create") {
      await mergeConfig(cwd, { template: name });
    } else {
      const existing = (config.features as string[] | undefined) ?? [];
      await mergeConfig(cwd, { features: [...new Set([...existing, name])] });
    }
  }

  return { workflow, inputs, filesChanged, operationId, dryRun };
}
