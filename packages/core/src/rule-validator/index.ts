import path from "node:path";
import fs from "fs-extra";
import type { DetectRule } from "../types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRequires(requires: string[], appliedWorkflows: string[]): ValidationResult {
  const missing = requires.filter((r) => !appliedWorkflows.includes(r));
  return {
    valid: missing.length === 0,
    errors: missing.map((r) => `Required workflow not yet applied: "${r}"`),
  };
}

export function validateConflicts(conflicts: string[], appliedWorkflows: string[]): ValidationResult {
  const conflicting = conflicts.filter((c) => appliedWorkflows.includes(c));
  return {
    valid: conflicting.length === 0,
    errors: conflicting.map((c) => `Conflicts with already-applied workflow: "${c}"`),
  };
}

async function checkRule(rule: DetectRule, cwd: string): Promise<boolean> {
  if (rule.file !== undefined) {
    const exists = await fs.pathExists(path.join(cwd, rule.file));
    return rule.exists !== undefined ? exists === rule.exists : exists;
  }

  if (rule.pkg !== undefined) {
    const pkgPath = path.join(cwd, "package.json");
    if (!(await fs.pathExists(pkgPath))) return rule.exists === false;
    const json = await fs.readJson(pkgPath).catch(() => ({}));
    const allDeps = { ...json.dependencies, ...json.devDependencies };
    const version = allDeps[rule.pkg] as string | undefined;
    if (rule.exists !== undefined) return Boolean(version) === rule.exists;
    if (rule.equals !== undefined) return version === rule.equals;
    if (rule.matches !== undefined)
      return typeof version === "string" && new RegExp(rule.matches).test(version);
    return Boolean(version);
  }

  return false;
}

export async function validateDetects(detects: DetectRule[], cwd: string): Promise<boolean> {
  const results = await Promise.all(detects.map((r) => checkRule(r, cwd)));
  return results.every(Boolean);
}

export function combineResults(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors);
  return { valid: errors.length === 0, errors };
}
