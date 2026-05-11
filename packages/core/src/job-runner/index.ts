import type { Job, RunContext } from "../types.js";
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

export async function runJobs(
  jobs: Record<string, Job>,
  context: RunContext,
  onJobStart?: (name: string) => void,
): Promise<void> {
  const order = topoSort(jobs);

  for (const jobName of order) {
    const job = jobs[jobName]!;
    onJobStart?.(jobName);

    for (const step of job.steps) {
      const outputs = await runStep(step, context);
      // Write outputs into context so later steps can reference steps.<id>.outputs.*
      if (step.id) {
        context.steps[step.id] = { outputs };
      }
    }
  }
}
