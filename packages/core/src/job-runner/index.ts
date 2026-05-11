import type { Job, Step, RunContext } from "../types.js";
import { runStep } from "../step-runner/index.js";

function topoSort(jobs: Record<string, Job>): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();

  function visit(name: string, ancestors: Set<string>) {
    if (ancestors.has(name)) throw new Error(`Circular job dependency: "${name}"`);
    if (visited.has(name)) return;
    const job = jobs[name];
    if (!job) throw new Error(`Job "${name}" referenced in "needs" but not defined`);
    ancestors.add(name);
    for (const dep of job.needs ?? []) visit(dep, new Set(ancestors));
    visited.add(name);
    sorted.push(name);
  }

  for (const name of Object.keys(jobs)) visit(name, new Set());
  return sorted;
}

// Group consecutive parallel steps into batches; sequential steps are singleton batches.
function buildBatches(steps: Step[]): Step[][] {
  const batches: Step[][] = [];
  let i = 0;
  while (i < steps.length) {
    const step = steps[i]!;
    if (step.parallel) {
      const batch: Step[] = [step];
      while (i + 1 < steps.length && steps[i + 1]!.parallel) {
        i++;
        batch.push(steps[i]!);
      }
      batches.push(batch);
    } else {
      batches.push([step]);
    }
    i++;
  }
  return batches;
}

export async function runJobs(
  jobs: Record<string, Job>,
  context: RunContext,
  onJobStart?: (name: string) => void,
): Promise<void> {
  const order = topoSort(jobs);

  for (const jobName of order) {
    const job = jobs[jobName]!;
    onJobStart?.(jobName);

    const batches = buildBatches(job.steps);

    for (const batch of batches) {
      if (batch.length === 1) {
        const step = batch[0]!;
        const outputs = await runStep(step, context);
        if (step.id) context.steps[step.id] = { outputs };
      } else {
        // Run parallel batch concurrently
        const results = await Promise.all(batch.map((step) => runStep(step, context)));
        for (let j = 0; j < batch.length; j++) {
          const step = batch[j]!;
          if (step.id) context.steps[step.id] = { outputs: results[j]! };
        }
      }
    }
  }
}
