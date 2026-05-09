export interface Generator {
  name: string;
  type: "project" | "feature";
  requires?: string[];
  dependencies?: string[];
  conflicts?: string[];
  provides?: string[];
  detects?: DetectRule[];
  prompts?: Prompt[];
  actions?: Action[];
}

export interface DetectRule {
  signal: string;
  exists?: boolean;
  equals?: string;
  matches?: string;
}

export interface Prompt {
  name: string;
  type: "input" | "select" | "confirm" | "multiselect";
  message: string;
  choices?: string[];
  when?: string;
}

export interface Action {
  type: ActionType;
  if?: string;
  [key: string]: unknown;
}

export type ActionType =
  | "copy"
  | "template"
  | "append"
  | "inject"
  | "replace"
  | "json"
  | "env"
  | "ast-add-import"
  | "command"
  | "script"
  | "xo-call";

export interface Signal {
  [key: string]: string | boolean | undefined;
}

export interface XoConfig {
  template?: string;
  framework?: string;
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  [namespace: string]: unknown;
}

export interface RunOptions {
  dryRun?: boolean;
  preview?: boolean;
}
