import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Config Reference" };

const configExample = `template: next-app
packageManager: pnpm
features:
  - payment/stripe
  - auth/jwt
  - ui/button
ui:
  componentsDir: src/components/ui
  hooksDir: src/hooks
  libDir: src/lib
database:
  provider: postgres
  url: postgresql://localhost:5432/mydb
auth:
  provider: jwt`;

const stateExample = `{
  "operations": [
    {
      "id": "a3f1c2d4-6e8f-...",
      "timestamp": "2025-01-15T10:30:00Z",
      "generator": "payment/stripe",
      "type": "add",
      "files": [
        {
          "filePath": "app/api/stripe/route.ts",
          "action": "created"
        },
        {
          "filePath": ".env.example",
          "action": "modified",
          "before": "NODE_ENV=development\\n"
        }
      ]
    }
  ]
}`;

const requiresExample = `# in workflow.yaml
requires:
  - ui.componentsDir`;

const contextVarsExample = `# Use a config value
to: "{{ config.ui.componentsDir }}/{{ inputs.componentName }}.tsx"

# Use an environment variable
value: "{{ env.DATABASE_URL }}"

# Use a step output
run: "{{ steps.pm.outputs.value }} add stripe"`;

const globalDirExample = `~/.xo/
├── registry.json        ← registered generator names → GitHub URLs
├── links.json           ← locally linked generators (set by xo link)
└── cache/               ← workflow YAMLs fetched from GitHub
    └── my-org/
        └── xo-stripe/
            ├── workflow.yaml
            ├── .ref
            └── templates/`;

const contextVarsRows = [
  ["{{ inputs.* }}", "Input values collected during the current workflow run"],
  ["{{ config.* }}", "Values from xo.config.yaml"],
  ["{{ steps.<id>.outputs.* }}", "Outputs from a previous step that has an id"],
  ["{{ env.* }}", "Environment variables (process.env)"],
];

export default function ConfigPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Tools</p>
        <h1 className="mb-3 text-3xl font-bold">Config Reference</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          xo maintains two files in your project automatically. You never need to edit them by hand,
          but understanding their structure helps when debugging or sharing generator state with your
          team.
        </p>
      </div>

      {/* xo.config.yaml */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold"><code>xo.config.yaml</code></h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Lives at the project root. Stores project-level settings that workflows read and write.
          Commit this file so your team shares the same generator configuration.
        </p>
        <CodeBlock code={configExample} lang="yaml" />

        <div className="space-y-4">
          {[
            {
              field: "template",
              desc: "Written automatically by xo create. Records which template scaffolded the project. Used by requires/conflicts validation.",
              example: `template: next-app`,
            },
            {
              field: "features",
              desc: "Updated automatically by xo add. Tracks which feature workflows have been applied. Used to enforce conflicts and requires rules.",
              example: `features:\n  - payment/stripe\n  - auth/jwt`,
            },
            {
              field: "packageManager",
              desc: "Set by xo/detect-pm on first run. Used by subsequent generators so they run the right package manager command.",
              example: `packageManager: pnpm`,
            },
          ].map(({ field, desc, example }) => (
            <div key={field} className="space-y-2 rounded-xl border border-border p-5">
              <code className="block text-sm font-bold text-primary">{field}</code>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <CodeBlock code={example} lang="yaml" />
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-border p-5">
          <p className="text-sm font-bold text-primary">Namespace blocks</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Any generator can define its own namespace. Common examples are <code>ui</code>,{" "}
            <code>database</code>, and <code>auth</code> — but any key is valid. Workflows read and
            write these via <code>{"{{ config.* }}"}</code> and the <code>xo/json</code> action.
          </p>
          <CodeBlock
            code={`ui:\n  componentsDir: src/components/ui\n  hooksDir: src/hooks\n\ndatabase:\n  provider: postgres\n  url: postgresql://localhost:5432/mydb`}
            lang="yaml"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-border p-5">
          <p className="text-sm font-bold text-primary">Auto-population via requires</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            When a workflow declares <code>requires</code>, xo checks if that key exists in{" "}
            <code>xo.config.yaml</code>. If missing, xo prompts the user and writes the answer back
            automatically — the config file builds up over time as you run workflows.
          </p>
          <CodeBlock code={requiresExample} lang="yaml" />
        </div>
      </section>

      {/* .xo/state.json */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold"><code>.xo/state.json</code></h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Lives at <code>.xo/state.json</code>. Tracks every operation for <code>xo undo</code>{" "}
          support. Commit this file so your team shares the same generator history. Do not edit
          manually.
        </p>
        <CodeBlock code={stateExample} lang="json" />

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Field", "Description"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["id", "UUID for this operation. Used by xo undo to target the right operation."],
                ["timestamp", "ISO 8601 timestamp of when the operation ran."],
                ["generator", "The generator reference that was applied (registry name or @github/ path)."],
                ["type", "\"create\", \"add\", or \"run\" — matches the xo command used."],
                ["files", "Array of file changes. Each entry records the path, action (created/modified/deleted), and the before-snapshot for modified files."],
              ].map(([f, d]) => (
                <tr key={f} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{f}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout variant="tip">
          Run <code>xo history</code> to see all operations in a human-readable format. Run{" "}
          <code>xo undo</code> to revert the most recent one.
        </Callout>
      </section>

      {/* Context variables */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Context variables</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Variables available inside any string value in a workflow using{" "}
          <code>{"{{ double-braces }}"}</code>.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Namespace", "Source"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contextVarsRows.map(([ns, src]) => (
                <tr key={ns} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{ns}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CodeBlock code={contextVarsExample} lang="yaml" />
      </section>

      {/* Global config */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Global xo config (per machine)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          xo stores per-machine state in <code>~/.xo/</code>. This is managed automatically via{" "}
          <code>xo registry</code>, <code>xo link</code>, and <code>xo cache</code> commands — you
          don't need to edit these files directly.
        </p>
        <CodeBlock code={globalDirExample} lang="bash" />

        <div className="space-y-3">
          {[
            {
              file: "~/.xo/registry.json",
              desc: "Maps short generator names to GitHub URLs. Managed by xo registry add / remove.",
            },
            {
              file: "~/.xo/links.json",
              desc: "Maps generator names to local filesystem paths. Managed by xo link / unlink.",
            },
            {
              file: "~/.xo/cache/",
              desc: "Cached workflow.yaml files fetched from GitHub. Branch refs re-fetch on every run; tag refs are cached forever. Managed by xo cache clear.",
            },
          ].map(({ file, desc }) => (
            <div key={file} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <code className="shrink-0 text-sm font-semibold text-primary">{file}</code>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          See the{" "}
          <Link href="/docs/cli-reference" className="font-medium text-primary hover:underline">
            CLI Reference
          </Link>{" "}
          for the full list of registry, link, and cache commands.
        </p>
      </section>
    </article>
  );
}
