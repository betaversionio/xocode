import { createPromptModule } from "inquirer";
import type { Prompt } from "../types.js";
import { evaluate } from "../utils/expression.js";

const prompt = createPromptModule();

export async function runPrompts(
  prompts: Prompt[],
  ctx: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const questions = prompts
    .filter((p) => !p.when || evaluate(p.when, ctx))
    .map((p) => ({
      name: p.name,
      type: p.type === "multiselect" ? "checkbox" : p.type === "select" ? "list" : p.type,
      message: p.message,
      ...(p.choices ? { choices: p.choices } : {}),
    }));

  if (questions.length === 0) return {};
  return prompt(questions);
}
