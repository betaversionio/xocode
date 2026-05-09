export type { Generator, Action, Prompt, Signal, XoConfig, RunOptions, ActionType, DetectRule } from "./types.js";

export { interpolate } from "./utils/interpolate.js";
export { evaluate } from "./utils/expression.js";

export { scanSignals } from "./signal-scanner/index.js";

export { readConfig, writeConfig, mergeConfig } from "./config-manager/index.js";

export {
  recordOperation,
  getLastOperation,
  undoLastOperation,
  listOperations,
  snapshotFile,
} from "./state-manager/index.js";
export type { OperationRecord, FileSnapshot } from "./state-manager/index.js";

export {
  validateRequires,
  validateConflicts,
  validateDetects,
  combineResults,
} from "./rule-validator/index.js";
export type { ValidationResult } from "./rule-validator/index.js";

export { runPrompts } from "./prompt-engine/index.js";

export { renderTemplate, renderFilename } from "./template-engine/index.js";

export {
  copyFile,
  templateFile,
  appendToFile,
  injectIntoFile,
  replaceInFile,
  mergeJsonFile,
  setEnvVar,
} from "./file-editor/index.js";

export { runCommand, runScript } from "./script-runner/index.js";

export { runAction, runActions } from "./action-runner/index.js";
export type { ActionContext } from "./action-runner/index.js";

export { loadGenerator, installGenerator } from "./generator-loader/index.js";
export type { LoadedGenerator } from "./generator-loader/index.js";

export { run } from "./generator-runner/index.js";
export type { RunResult } from "./generator-runner/index.js";
