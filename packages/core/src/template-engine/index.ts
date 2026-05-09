import Handlebars from "handlebars";

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper("or", (...args: unknown[]) => args.slice(0, -1).some(Boolean));
Handlebars.registerHelper("and", (...args: unknown[]) => args.slice(0, -1).every(Boolean));
Handlebars.registerHelper("capitalize", (s: unknown) =>
  typeof s === "string" ? s.charAt(0).toUpperCase() + s.slice(1) : s,
);
Handlebars.registerHelper("camelCase", (s: unknown) => {
  if (typeof s !== "string") return s;
  return s.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase());
});
Handlebars.registerHelper("kebabCase", (s: unknown) => {
  if (typeof s !== "string") return s;
  return s.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
});
Handlebars.registerHelper("snakeCase", (s: unknown) => {
  if (typeof s !== "string") return s;
  return s.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
});
Handlebars.registerHelper("pascalCase", (s: unknown) => {
  if (typeof s !== "string") return s;
  return s.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^(.)/, (c: string) => c.toUpperCase());
});

export function renderTemplate(source: string, ctx: Record<string, unknown>): string {
  const compiled = Handlebars.compile(source, { noEscape: true });
  return compiled(ctx);
}

export function renderFilename(name: string, ctx: Record<string, unknown>): string {
  return renderTemplate(name, ctx);
}
