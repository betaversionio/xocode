import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Actions Reference" };

const actions = [
  {
    type: "copy",
    desc: "Copies a file from the generator directory to the target path verbatim — no rendering.",
    fields: [
      ["source", "string", "Yes", "Path relative to the generator directory"],
      ["target", "string", "Yes", "Destination path relative to project root"],
    ],
    example: `{
  "type": "copy",
  "source": "assets/logo.svg",
  "target": "public/logo.svg"
}`,
  },
  {
    type: "template",
    desc: "Renders a Handlebars template using the current context (signals + prompt answers) and writes the result to the target path.",
    fields: [
      ["source", "string", "Yes", "Path to .hbs file, relative to generator directory"],
      ["target", "string", "Yes", "Destination path. Supports {{variable}} interpolation"],
    ],
    example: `{
  "type": "template",
  "source": "templates/service.ts.hbs",
  "target": "src/{{kebabCase name}}/{{kebabCase name}}.service.ts"
}`,
    note: "Handlebars helpers (pascalCase, camelCase, kebabCase, snakeCase, capitalize) work in both template content and target paths.",
  },
  {
    type: "append",
    desc: "Appends content to an existing file. Creates the file if it doesn't exist. Content supports Handlebars rendering.",
    fields: [
      ["target", "string", "Yes", "Path to the file to append to"],
      ["content", "string", "Yes", "Content to append. Supports Handlebars rendering"],
      ["newline", "boolean", "No", "Prefix content with a newline (default: true)"],
    ],
    example: `{
  "type": "append",
  "target": ".env.example",
  "content": "DATABASE_URL=postgresql://localhost:5432/{{snakeCase name}}"
}`,
  },
  {
    type: "inject",
    desc: "Inserts content immediately after or before a marker string in an existing file. Throws if the marker is not found.",
    fields: [
      ["target", "string", "Yes", "Path to the file to modify"],
      ["content", "string", "Yes", "Content to insert. Supports Handlebars rendering"],
      ["after", "string", "No*", "Insert after this marker string"],
      ["before", "string", "No*", "Insert before this marker string"],
    ],
    example: `{
  "type": "inject",
  "target": "src/app.module.ts",
  "after": "// GENERATORS",
  "content": "import { {{pascalCase name}}Module } from './{{kebabCase name}}/{{kebabCase name}}.module';"
}`,
    note: "Exactly one of after or before is required.",
  },
  {
    type: "replace",
    desc: "Performs a regex find-and-replace inside a file. Search and replace strings support {{variable}} interpolation.",
    fields: [
      ["target", "string", "Yes", "Path to the file to modify"],
      ["search", "string", "Yes", "Regex pattern to search for"],
      ["replace", "string", "Yes", "Replacement string. Supports Handlebars and $1/$2 capture groups"],
      ["flags", "string", "No", 'Regex flags (default: "g")'],
    ],
    example: `{
  "type": "replace",
  "target": "README.md",
  "search": "\\$\\{APP_NAME\\}",
  "replace": "{{name}}",
  "flags": "g"
}`,
  },
  {
    type: "json",
    desc: "Merges a JSON object into an existing JSON file. Creates the file if it doesn't exist. Supports shallow (default) or deep merge.",
    fields: [
      ["target", "string", "Yes", "Path to the JSON file"],
      ["merge", "object", "Yes", "Object to merge into the file"],
      ["deep", "boolean", "No", "Use deep merge instead of shallow (default: false)"],
    ],
    example: `{
  "type": "json",
  "target": "package.json",
  "deep": true,
  "merge": {
    "scripts": {
      "db:migrate": "prisma migrate dev",
      "db:push": "prisma db push"
    },
    "dependencies": {
      "@prisma/client": "^6.0.0"
    }
  }
}`,
    note: "With deep: false (default), top-level keys are replaced. With deep: true, nested objects are recursively merged.",
  },
  {
    type: "env",
    desc: "Sets or updates a KEY=value line in a .env file. If the key already exists it is updated in place; otherwise it is appended.",
    fields: [
      ["key", "string", "Yes", "The environment variable key"],
      ["value", "string", "Yes", "The value. Supports {{variable}} interpolation"],
      ["target", "string", "No", "Path to the env file (default: .env)"],
    ],
    example: `{
  "type": "env",
  "key": "DATABASE_URL",
  "value": "postgresql://localhost:5432/{{snakeCase name}}_dev"
}`,
  },
  {
    type: "ast-add-import",
    desc: "Adds a TypeScript import declaration using AST manipulation (ts-morph). Never duplicates an existing import.",
    fields: [
      ["target", "string", "Yes", "Path to the TypeScript file"],
      ["from", "string", "Yes", "The module specifier (e.g. '@nestjs/common')"],
      ["import", "string | string[]", "Yes", "Named import(s) to add"],
      ["isDefault", "boolean", "No", "Add as default import instead of named"],
    ],
    example: `{
  "type": "ast-add-import",
  "target": "src/app.module.ts",
  "from": "@nestjs/config",
  "import": ["ConfigModule", "ConfigService"]
}`,
    note: "If the module is already imported, only the missing named imports are added — existing ones are untouched.",
  },
  {
    type: "command",
    desc: "Runs a shell command in the project directory. Streams output to the terminal.",
    fields: [
      ["command", "string", "Yes", "The shell command to run. Supports {{variable}} interpolation"],
      ["cwd", "string", "No", "Subdirectory to run in, relative to project root"],
    ],
    example: `{
  "type": "command",
  "command": "pnpm add {{dependencies}}"
}`,
    note: "Runs with shell: true so shell syntax (&&, pipes) works. The generator fails if exit code is non-zero.",
  },
  {
    type: "script",
    desc: "Runs a script file from the generator directory. Useful for complex post-install logic.",
    fields: [
      ["script", "string", "Yes", "Path to the script file, relative to generator directory"],
      ["cwd", "string", "No", "Subdirectory to run in, relative to project root"],
    ],
    example: `{
  "type": "script",
  "script": "scripts/postinstall.sh"
}`,
  },
  {
    type: "xo-call",
    desc: "Invokes another generator from within this one. Useful for composing generators without requiring the user to run them separately.",
    fields: [
      ["generator", "string", "Yes", "The generator name to invoke (same resolution rules as xo add)"],
    ],
    example: `{
  "type": "xo-call",
  "generator": "acme/eslint-setup"
}`,
    note: "The nested generator runs with the same cwd and context. Its prompts are run interactively before its actions execute.",
  },
];

const conditionalExample = `{
  "type": "template",
  "source": "templates/docker-compose.yml.hbs",
  "target": "docker-compose.yml",
  "if": "withDocker && packageManager === 'pnpm'"
}`;

export default function ActionsPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Building Generators</p>
        <h1 className="mb-3 text-3xl font-bold">Actions Reference</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Actions are the steps that change your project. They run in order, each with full access to
          the merged context — project signals, prompt answers, and config values.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Conditional execution</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every action supports an <code>if</code> field — a JavaScript expression evaluated against
          the merged context of signals + prompt answers. The action is skipped when falsy.
        </p>
        <CodeBlock code={conditionalExample} lang="json" />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Action types</h2>

        {actions.map((action) => (
          <div key={action.type} className="space-y-3 rounded-xl border border-border p-5">
            <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
              {action.type}
            </Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">{action.desc}</p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {["Field", "Type", "Required", "Description"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {action.fields.map(([f, t, r, d]) => (
                    <tr key={f} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs text-primary">{f}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{t}</td>
                      <td className="px-3 py-2 text-xs">{r}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CodeBlock code={action.example} lang="json" />
            {action.note && <Callout variant="info">{action.note}</Callout>}
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dry run mode</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pass <code>--dry-run</code> to any CLI command to preview actions without writing files or
          running commands. Each action prints a log line describing what it would do.
        </p>
        <CodeBlock
          code={`$ xo add acme/auth-jwt --dry-run

[dry-run] template: templates/auth.service.ts.hbs → src/auth/auth.service.ts
[dry-run] template: templates/jwt.guard.ts.hbs → src/auth/jwt.guard.ts
[dry-run] ast-add-import: JwtModule from @nestjs/jwt in src/app.module.ts
[dry-run] json: package.json
[dry-run] command: pnpm install`}
          lang="output"
        />
      </section>
    </article>
  );
}
