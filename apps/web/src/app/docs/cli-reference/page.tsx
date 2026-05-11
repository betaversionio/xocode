import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { TerminalBlock, CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "CLI Reference" };

export default function CliReferencePage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Tools</p>
        <h1 className="mb-3 text-3xl font-bold">CLI Reference</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          The <code>xo</code> CLI is the primary way to interact with the generator engine. Install
          it globally with <code>npm install -g xocode</code>.
        </p>
      </div>

      {[
        {
          cmd: "xo create",
          tagline: "Scaffold a new project",
          usage: "xo create <template> [options]",
          desc: "Downloads and runs a project-type generator to scaffold a new project from scratch. The template is resolved by GitHub path (owner/repo) or local path (./path/to/generator).",
          options: [
            ["--dry-run", "Preview all actions without writing any files"],
            ["--dir <path>", "Target directory (default: current working directory)"],
          ],
          examples: [
            "xo create acme/nextjs-starter",
            "xo create acme/nestjs-api --dir ./api",
            "xo create ./local-template --dry-run",
            "xo create acme/generators/monorepo-base",
          ],
          note: null,
        },
        {
          cmd: "xo add",
          tagline: "Add a feature to an existing project",
          usage: "xo add <feature> [options]",
          desc: "Applies a feature-type generator to the current project. Validates compatibility (detects, requires, conflicts) before running any actions.",
          options: [
            ["--dry-run", "Preview all actions without writing any files"],
          ],
          examples: [
            "xo add acme/shadcn-setup",
            "xo add acme/auth-jwt",
            "xo add acme/prisma --dry-run",
          ],
          note: {
            variant: "info" as const,
            title: "Validation order",
            body: "Before running, xo checks detects rules (signals compatible?), then requires (prerequisites applied?), then conflicts (no conflicting generators?). All three must pass.",
          },
        },
        {
          cmd: "xo run",
          tagline: "Run any generator by name",
          usage: "xo run <name> [options]",
          desc: "Runs a generator regardless of its declared type. Useful for one-off generators or task runners.",
          options: [
            ["--dry-run", "Preview all actions without writing any files"],
          ],
          examples: [
            "xo run acme/scaffold-module",
            "xo run ./internal/codegen",
          ],
          note: null,
        },
        {
          cmd: "xo undo",
          tagline: "Revert the last operation",
          usage: "xo undo",
          desc: "Reverts the most recent xo create, xo add, or xo run operation. Files that were created are deleted; files that were modified are restored.",
          options: [],
          examples: ["xo undo"],
          note: {
            variant: "warning" as const,
            title: "File changes only",
            body: "xo undo restores file content but does not reverse shell commands (like pnpm install). Reverse those manually if needed.",
          },
        },
        {
          cmd: "xo history",
          tagline: "List applied generators",
          usage: "xo history",
          desc: "Lists every generator applied in the current project in chronological order, with operation ID, generator name, and timestamp.",
          options: [],
          examples: ["xo history"],
          note: null,
        },
      ].map(({ cmd, tagline, usage, desc, options, examples, note }) => (
        <section key={cmd} className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-md px-3 py-1.5 font-mono text-sm font-bold text-primary">
              {cmd}
            </Badge>
            <span className="text-sm text-muted-foreground">{tagline}</span>
          </div>
          <CodeBlock code={usage} lang="bash" />
          <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>

          {options.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {["Option", "Description"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {options.map(([o, d]) => (
                    <tr key={o} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs text-primary">{o}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <TerminalBlock commands={examples} />
          {note && (
            <Callout variant={note.variant} title={note.title}>{note.body}</Callout>
          )}
        </section>
      ))}

      {/* Resolution */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Generator resolution</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          xo looks for <code>generator.yaml</code> (or <code>generator.yml</code> / <code>generator.json</code>) in this order:
        </p>
        <div className="space-y-3">
          {[
            { step: "1", title: "Local path", desc: "Name starts with ./ or / → reads directly from that directory." },
            { step: "2", title: "Project-local", desc: ".xo/generators/<name>/generator.yaml in the current project." },
            { step: "3", title: "Global cache", desc: "~/.xo/generators/<name>/generator.yaml." },
            { step: "4", title: "GitHub fetch", desc: "Fetches from https://raw.githubusercontent.com/<owner>/<repo>/main/generator.yaml and caches globally." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Callout variant="tip" title="Subpath generators">
          The name <code>owner/repo/subpath</code> maps to{" "}
          <code>…/owner/repo/main/subpath/generator.yaml</code> — letting you host multiple
          generators in a single GitHub repo.
        </Callout>
      </section>

      {/* Project files */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Project files written by xo</h2>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 font-mono text-sm font-semibold text-primary">xo.config.yaml</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Records the applied template and features. Used by requires/conflicts validation on subsequent runs. Commit this file.
            </p>
            <CodeBlock
              code={`template: acme/nextjs-starter
features:
  - acme/shadcn-setup
  - acme/auth-jwt`}
              lang="yaml"
            />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 font-mono text-sm font-semibold text-primary">.xo/state.json</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Stores every operation with before-snapshots for undo. Commit this file so your team shares generator history.
            </p>
            <CodeBlock
              code={`{
  "operations": [
    {
      "id": "a1b2c3d4-...",
      "timestamp": "2025-05-04T10:32:00.000Z",
      "generator": "acme/nextjs-starter",
      "type": "create",
      "files": [
        { "filePath": "src/app/page.tsx", "action": "created" },
        { "filePath": "package.json",     "action": "modified", "before": "..." }
      ]
    }
  ]
}`}
              lang="json"
            />
          </div>
        </div>
      </section>
    </article>
  );
}
