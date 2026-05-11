import prompts from "prompts";
import type { WorkflowChoice, WorkflowInput } from "../types.js";

function normalizeChoice(c: WorkflowChoice): { title: string; value: string } {
  if (typeof c === "string") return { title: c, value: c };
  return { title: c.label ?? c.value, value: c.value };
}

export async function collectInputs(
  inputs: Record<string, WorkflowInput>,
  prefilled: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  // For text inputs, apply defaults upfront so they don't get prompted.
  // For select/multiselect/confirm, always prompt — the default just pre-selects an option.
  const interactiveTypes = new Set(["select", "multiselect", "confirm"]);
  const withDefaults: Record<string, unknown> = { ...prefilled };
  for (const [name, input] of Object.entries(inputs)) {
    if (
      withDefaults[name] === undefined &&
      input.default !== undefined &&
      !interactiveTypes.has(input.type ?? "text")
    ) {
      withDefaults[name] = input.default;
    }
  }

  const toPrompt = Object.entries(inputs).filter(
    ([name, input]) =>
      withDefaults[name] === undefined || interactiveTypes.has(input.type ?? "text"),
  );
  if (toPrompt.length === 0) return withDefaults;

  const questions: prompts.PromptObject[] = toPrompt.map(([name, input]) => {
    const message =
      input.prompt ?? input.description ?? name;

    const base = { name, message };

    if (input.type === "confirm") {
      return {
        ...base,
        type: "confirm" as const,
        initial: input.default === true || input.default === "true",
      };
    }

    if (
      input.type === "select" ||
      input.type === "multiselect" ||
      (input.type as string) === "list"
    ) {
      const choices = (input.choices ?? []).map(normalizeChoice);
      const initialIndex = input.default
        ? (input.choices ?? [])
            .map(normalizeChoice)
            .findIndex((c) => c.value === String(input.default))
        : 0;

      if (input.type === "multiselect") {
        return { ...base, type: "multiselect" as const, choices };
      }
      return {
        ...base,
        type: "select" as const,
        choices,
        initial: Math.max(0, initialIndex),
      };
    }

    // Default: text input
    return {
      ...base,
      type: "text" as const,
      initial: input.default !== undefined ? String(input.default) : undefined,
      validate: (v: string) => {
        if (input.required && v.trim() === "") return `${name} is required`;
        if (input.pattern && !new RegExp(input.pattern).test(v))
          return `${name} must match pattern: ${input.pattern}`;
        if (input.min !== undefined && v.length < input.min)
          return `${name} must be at least ${input.min} characters`;
        if (input.max !== undefined && v.length > input.max)
          return `${name} must be at most ${input.max} characters`;
        return true;
      },
    };
  });

  const answers = await prompts(questions, {
    onCancel: () => {
      process.exit(0);
    },
  });

  return { ...withDefaults, ...answers };
}
