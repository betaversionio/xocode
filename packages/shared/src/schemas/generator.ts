import { z } from "zod";

export const generatorNameSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9\-\/]+$/, "Name must be lowercase alphanumeric with hyphens or slashes (e.g. ui/button)");

export const registerGeneratorSchema = z.object({
  name: generatorNameSchema,
  type: z.enum(["Project", "Feature"]),
  githubUrl: z.string().url("Must be a valid GitHub URL"),
  description: z.string().max(300).optional(),
  tags: z.array(z.string()).max(10).default([]),
});

export const updateGeneratorSchema = registerGeneratorSchema.partial().omit({ name: true });

export type RegisterGeneratorInput = z.infer<typeof registerGeneratorSchema>;
export type UpdateGeneratorInput = z.infer<typeof updateGeneratorSchema>;
