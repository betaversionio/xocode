// Types
export type {
  Workflow,
  WorkflowTrigger,
  WorkflowInput,
  Job,
  Step,
  StepOutput,
  XoConfig,
  RunOptions,
  RunContext,
  DetectRule,
  ActionDef,
} from "./types.js";

// Utils
export { interpolate } from "./utils/interpolate.js";
export { evaluate } from "./utils/expression.js";

// Config manager
export { readConfig, writeConfig, mergeConfig } from "./config-manager/index.js";

// State manager
export {
  recordOperation,
  getLastOperation,
  undoLastOperation,
  listOperations,
  snapshotFile,
} from "./state-manager/index.js";
export type { OperationRecord, FileSnapshot } from "./state-manager/index.js";

// Registry manager
export {
  addToRegistry,
  removeFromRegistry,
  listRegistry,
  resolveUrl,
  resolveEntry,
} from "./registry-manager/index.js";
export type { RegistryEntry } from "./registry-manager/index.js";

// Validation
export {
  validateRequires,
  validateConflicts,
  validateDetects,
  combineResults,
} from "./rule-validator/index.js";
export type { ValidationResult } from "./rule-validator/index.js";

// Prompt engine
export { collectInputs } from "./prompt-engine/index.js";

// Template engine
export { renderTemplate, renderFilename } from "./template-engine/index.js";

// File editor
export {
  copyFile,
  templateFile,
  appendToFile,
  injectIntoFile,
  replaceInFile,
  mergeJsonFile,
  setEnvVar,
} from "./file-editor/index.js";

// Script / command runner
export { runCommand, runScript } from "./script-runner/index.js";

// Action runner (custom action loading + execution)
export { loadAction, runCompositeAction, runScriptAction } from "./action-runner/index.js";
export type { LoadedAction } from "./action-runner/index.js";

// Step & job runner
export { runStep } from "./step-runner/index.js";
export { runJobs } from "./job-runner/index.js";

// Link manager (xo link / xo unlink)
export {
  linkGenerator,
  unlinkGenerator,
  resolveLinked,
  listLinked,
} from "./link-manager/index.js";
export type { LinkedEntry } from "./link-manager/index.js";

// GitHub direct resolver
export { parseGitHubRef, formatGitHubRef, isGitHubRef } from "./github-resolver/index.js";
export type { GitHubRef } from "./github-resolver/index.js";

// Workflow loader
export { loadWorkflow } from "./workflow-loader/index.js";
export type { LoadedWorkflow } from "./workflow-loader/index.js";

// Workflow runner — main entry point
export { runWorkflow } from "./workflow-runner/index.js";
export type { WorkflowRunResult } from "./workflow-runner/index.js";
