export type WorkflowTrigger = "add" | "create" | "run";

export type WorkflowChoice = string | { value: string; label: string }

export interface WorkflowInput {
  prompt?: string;
  description?: string;
  required?: boolean;
  type?: "text" | "select" | "confirm" | "multiselect";
  choices?: WorkflowChoice[];
  default?: string | boolean;
  pattern?: string;   // regex to validate text input
  min?: number;       // min length (text) or min value (numeric text)
  max?: number;       // max length (text) or max value (numeric text)
}

export interface DetectRule {
  // Exactly one check type:
  file?: string;  // relative path — checks existence
  pkg?: string;   // package name — checks package.json deps
  // Assertion (default: exists: true):
  exists?: boolean;
  equals?: string;
  matches?: string;
}

export interface Step {
  id?: string;
  name?: string;
  uses?: string;
  with?: Record<string, unknown>;
  run?: string;
  if?: string;
  parallel?: boolean;  // run this step concurrently with adjacent parallel steps
}

export interface Job {
  needs?: string[];
  steps: Step[];
}

export interface Workflow {
  name: string;
  on: WorkflowTrigger[];
  description?: string;
  detects?: DetectRule[];
  requires?: string[];
  dependencies?: string[];
  conflicts?: string[];
  provides?: string[];
  inputs?: Record<string, WorkflowInput>;
  jobs: Record<string, Job>;
}

export interface StepOutput {
  outputs: Record<string, unknown>;
}

export interface XoConfig {
  template?: string;
  framework?: string;
  packageManager?: string;
  features?: string[];
  [namespace: string]: unknown;
}

export interface RunContext {
  inputs: Record<string, unknown>;
  config: XoConfig;
  steps: Record<string, StepOutput>;
  env: Record<string, string>;
  generatorDir: string;
  cwd: string;
  dryRun: boolean;
}

export interface RunOptions {
  dryRun?: boolean;
  preview?: boolean;
  local?: boolean;
  trigger?: WorkflowTrigger;
  inputs?: Record<string, unknown>;  // pre-filled inputs from CLI flags
}

// ── Custom action schema (action.yaml) ───────────────────────────────────────

export interface ActionDef {
  name?: string;
  description?: string;
  inputs?: Record<string, WorkflowInput>;
  outputs?: Record<string, { value: string }>;
  // Composite shorthand: steps at root
  steps?: Step[];
  runs?: {
    using: "node" | "composite" | "prompt";
    main?: string;   // node: JS file path relative to action dir
    steps?: Step[];  // composite: alternative to root-level steps
  };
}
