import type { DetectRule, Signal } from "../types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRequires(requires: string[], appliedGenerators: string[]): ValidationResult {
  const missing = requires.filter((r) => !appliedGenerators.includes(r));
  return {
    valid: missing.length === 0,
    errors: missing.map((r) => `Required generator not applied: "${r}"`),
  };
}

export function validateConflicts(conflicts: string[], appliedGenerators: string[]): ValidationResult {
  const conflicting = conflicts.filter((c) => appliedGenerators.includes(c));
  return {
    valid: conflicting.length === 0,
    errors: conflicting.map((c) => `Conflicts with already-applied generator: "${c}"`),
  };
}

export function validateDetects(detects: DetectRule[], signals: Signal): boolean {
  return detects.every((rule) => {
    const val = signals[rule.signal];
    if (rule.exists !== undefined) return !!val === rule.exists;
    if (rule.equals !== undefined) return val === rule.equals;
    if (rule.matches !== undefined) {
      return typeof val === "string" && new RegExp(rule.matches).test(val);
    }
    return !!val;
  });
}

export function combineResults(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors);
  return { valid: errors.length === 0, errors };
}
