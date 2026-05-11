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

      {/* Commands */}
      {[
        {
          cmd: "xo create",
          tagline: "Scaffold a new project",
          usage: "xo create <generator> [options]",
          desc: "Runs the generator's create workflow to scaffold a new project from scratch. Generators are resolved by direct GitHub reference (@github/owner/repo), registered name, or local path.",
          options: [
            ["--dry-run", "Preview all actions without writing any files"],
            ["-i <key>=<val>", "Pre-fill an input, skipping the interactive prompt for that value. Repeatable."],
            ["--local", "Run a generator from a local path without linking"],
          ],
          examples: [
            "xo create @github/my-org/xo-next-app",
            "xo create flutter-app",
            "xo create @github/betaversionio/xo-flutter",
            "xo create ./my-template --local --dry-run",
          ],
          note: null,
        },
        {
          cmd: "xo add",
          tagline: "Add a feature to an existing project",
          usage: "xo add <generator> [options]",
          desc: "Applies a generator to the current project. Validates compatibility (detects, requires, conflicts) before running any steps.",
          options: [
            ["--dry-run", "Preview all actions without writing any files"],
            ["-i <key>=<val>", "Pre-fill an input. Repeatable."],
            ["--local", "Run from a local path without linking"],
          ],
          examples: [
            "xo add @github/my-org/xo-stripe",
            "xo add @github/my-org/xo-ui/button",
            "xo add @github/my-org/xo-ui/button@v1.2.0",
            "xo add payment/stripe --dry-run",
            "xo add ui/button -i componentName=Button -i variant=primary",
          ],
          note: {
            variant: "info" as const,
            title: "Validation order",
            body: "Before running, xo checks detects rules (project compatible?), then requires (prerequisites applied?), then conflicts (no clashing generators?). All three must pass.",
          },
        },
        {
          cmd: "xo run",
          tagline: "Run a generator's run workflow",
          usage: "xo run <generator> [options]",
          desc: "Triggers the generator's run workflow. Useful for task runners or one-off generators.",
          options: [
            ["--dry-run", "Preview without writing files"],
            ["-i <key>=<val>", "Pre-fill an input"],
          ],
          examples: [
            "xo run db:migrate",
            "xo run @github/my-org/xo-codegen",
          ],
          note: null,
        },
        {
          cmd: "xo undo",
          tagline: "Revert the last operation",
          usage: "xo undo",
          desc: "Reverts the most recent xo add or xo create operation. Files that were created are deleted; files that were modified are restored from their before-snapshot.",
          options: [],
          examples: ["xo undo"],
          note: {
            variant: "warning" as const,
            title: "File changes only",
            body: "xo undo restores file content but does not reverse shell commands (like flutter pub get). Reverse those manually if needed.",
          },
        },
        {
          cmd: "xo history",
          tagline: "List applied generators",
          usage: "xo history",
          desc: "Lists every generator applied in the current project in chronological order, with operation ID, generator name, trigger, and timestamp.",
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
          {note && <Callout variant={note.variant} title={note.title}>{note.body}</Callout>}
        </section>
      ))}

      {/* Local development */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Local development</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These commands are for generator authors building and testing a generator locally.
        </p>

        <div className="space-y-6">
          {[
            {
              cmd: "xo link [name]",
              desc: "Register the current directory as a named generator. xo reads the name field from workflow.yaml automatically — pass a name only to override. Once linked, xo add <name> from any project resolves to your local directory. Changes to workflow.yaml or templates are picked up immediately.",
              examples: ["cd ~/projects/xo-stripe", "xo link", "xo link payment/stripe"],
            },
            {
              cmd: "xo unlink [name]",
              desc: "Remove the link for the current directory. Run inside the generator repo.",
              examples: ["cd ~/projects/xo-stripe", "xo unlink"],
            },
            {
              cmd: "xo links",
              desc: "List all locally linked generators with their names, paths, and link dates.",
              examples: ["xo links"],
            },
          ].map(({ cmd, desc, examples }) => (
            <div key={cmd} className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-md px-3 py-1 font-mono text-sm font-semibold text-primary">
                  {cmd}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <TerminalBlock commands={examples} />
            </div>
          ))}
        </div>
      </section>

      {/* Registry */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Registry</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Register GitHub generators under short names so users don't need the <code>@github/</code>{" "}
          prefix every time.
        </p>

        <div className="space-y-6">
          {[
            {
              cmd: "xo registry add <name>",
              desc: "Register a generator from a GitHub URL. Use --path for a subdirectory in a multi-generator repo.",
              examples: [
                "xo registry add payment/stripe --url https://github.com/my-org/xo-stripe",
                "xo registry add ui/button --url https://github.com/my-org/xo-ui --path button",
              ],
            },
            {
              cmd: "xo registry list",
              desc: "List all registered generators.",
              examples: ["xo registry list"],
            },
            {
              cmd: "xo registry remove <name>",
              desc: "Remove a generator from the local registry.",
              examples: ["xo registry remove payment/stripe"],
            },
          ].map(({ cmd, desc, examples }) => (
            <div key={cmd} className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-md px-3 py-1 font-mono text-sm font-semibold text-primary">
                  {cmd}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <TerminalBlock commands={examples} />
            </div>
          ))}
        </div>
      </section>

      {/* Cache */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cache</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          xo caches generator files fetched from GitHub in <code>~/.xo/cache/</code>. Branch refs
          are always re-fetched on each run. Tag refs are cached forever (immutable).
        </p>

        <div className="space-y-6">
          {[
            {
              cmd: "xo cache list",
              desc: "List all cached generators with their owner, repo, ref, and cache path.",
              examples: ["xo cache list"],
            },
            {
              cmd: "xo cache clear [owner]",
              desc: "Clear the entire GitHub cache, or only the cache for a specific GitHub owner.",
              examples: ["xo cache clear", "xo cache clear my-org"],
            },
          ].map(({ cmd, desc, examples }) => (
            <div key={cmd} className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-md px-3 py-1 font-mono text-sm font-semibold text-primary">
                  {cmd}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <TerminalBlock commands={examples} />
            </div>
          ))}
        </div>
      </section>

      {/* Resolution */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Generator resolution</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          xo resolves a generator name in this order:
        </p>
        <div className="space-y-3">
          {[
            { step: "1", title: "Local path", desc: "Name starts with ./ or / → reads directly from that path. Requires --local flag." },
            { step: "2", title: "Linked generators", desc: "Checks ~/.xo/links.json for a match — set by xo link inside a generator repo." },
            { step: "3", title: "Registry", desc: "Checks ~/.xo/registry.json for a registered URL — set by xo registry add." },
            { step: "4", title: "@github/ reference", desc: "Name starts with @github/ → fetches workflow.yaml from GitHub and caches it in ~/.xo/cache/." },
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
        <Callout variant="tip">
          Use <code>@github/owner/repo/subpath</code> to reference a generator in a subdirectory
          of a repo — e.g. <code>@github/my-org/xo-ui/button</code>.
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
              code={`template: flutter-app
packageManager: pnpm
features:
  - payment/stripe
  - auth/jwt`}
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
      "generator": "@github/betaversionio/xo-flutter",
      "type": "create",
      "files": [
        { "filePath": "lib/main.dart", "action": "created" },
        { "filePath": "pubspec.yaml",  "action": "modified", "before": "..." }
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
