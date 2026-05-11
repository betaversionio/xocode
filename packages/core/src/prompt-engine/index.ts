import { createPromptModule } from "inquirer";
import type { WorkflowInput } from "../types.js";

const prompt = createPromptModule();

export async function collectInputs(
  inputs: Record<string, WorkflowInput>,
  prefilled: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...prefilled };

  const toPrompt = Object.entries(inputs).filter(([name]) => result[name] === undefined);

  if (toPrompt.length === 0) return result;

  const questions = toPrompt.map(([name, input]) => ({
    name,
    type:
      input.type === "multiselect"
        ? "checkbox"
        : input.type === "select"
          ? "list"
          : input.type ?? "input",
    message: input.prompt,
    default: input.default,
    ...(input.choices ? { choices: input.choices } : {}),
    validate: input.required
      ? (v: unknown) =>
          v !== "" && v !== undefined && v !== null ? true : `${name} is required`
      : undefined,
  }));

  const answers = await prompt(questions);
  return { ...result, ...answers };
}
