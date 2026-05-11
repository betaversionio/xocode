import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Actions Reference" };

// ── code examples ────────────────────────────────────────────────────────────

const usingActionExample = `steps:
  - uses: xo/install-pkg        # built-in
    with:
      pkg: stripe

  - uses: xo/detect-pm          # built-in — produces outputs
    id: pm

  - uses: ./actions/setup.yaml  # custom composite action
    id: setup
    with:
      configFile: tailwind.config.ts

  - run: "{{ steps.pm.outputs.value }} db:push"`;

const stepOutputsExample = `- uses: xo/detect-pm
  id: pm

- run: "{{ steps.pm.outputs.value }} install"`;

const parallelStepsExample = `steps:
  - uses: xo/detect-pm
    id: pm
    parallel: true
  - uses: xo/detect-lang
    id: lang
    parallel: true
  - uses: xo/file-exists    # waits for both above to finish
    id: hasPrisma
    with:
      path: prisma/schema.prisma`;

// Detection
const detectPmExample = `- uses: xo/detect-pm
  id: pm
  # outputs: { value: "pnpm" | "npm" | "yarn" | "bun" }

- run: "{{ steps.pm.outputs.value }} add stripe"`;

const detectLangExample = `- uses: xo/detect-lang
  id: lang
  # outputs: { value: "typescript" | "javascript" | "dart" | "go" | "rust" | "python" }

- if: "steps.lang.outputs.value == 'typescript'"
  uses: xo/copy
  with:
    from: templates/config.ts
    to: src/config.ts`;

const fileExistsExample = `- uses: xo/file-exists
  id: hasPrisma
  with:
    path: prisma/schema.prisma
  # outputs: { exists: true | false }

- if: "steps.hasPrisma.outputs.exists == false"
  run: pnpm dlx prisma init`;

const pkgInstalledExample = `- uses: xo/pkg-installed
  id: hasNext
  with:
    pkg: next
  # outputs: { installed: true | false, version: "^14.0.0" | null }

- if: "steps.hasNext.outputs.installed == true"
  uses: xo/copy
  with:
    from: templates/next-route.ts
    to: app/api/stripe/route.ts`;

const readJsonExample = `- uses: xo/read-json
  id: pkgName
  with:
    file: package.json
    path: name
  # outputs: { value: "my-app" }`;

// File actions
const copyExample = `# Single file
- uses: xo/copy
  with:
    from: templates/button.tsx
    to: src/components/button.tsx

# Entire directory (recursive)
- uses: xo/copy
  with:
    from: templates/components/
    to: src/components/

# Glob pattern — supports *, **, ?
- uses: xo/copy
  with:
    from: "lib/**/*.dart"
    to: lib/`;

const templateExample = `- uses: xo/template
  with:
    from: templates/service.hbs
    to: "src/{{ inputs.moduleName }}/{{ inputs.moduleName }}.service.ts"`;

const appendExample = `- uses: xo/append
  with:
    file: .env.example
    content: "STRIPE_SECRET_KEY=\\nSTRIPE_WEBHOOK_SECRET=\\n"`;

const injectExample = `# After a marker
- uses: xo/inject
  with:
    file: app.module.ts
    after: "imports: ["
    content: "PaymentModule,"

# Before a marker
- uses: xo/inject
  with:
    file: src/index.ts
    before: "export default app"
    content: "import './payment';"`;

const replaceExample = `- uses: xo/replace
  with:
    file: config.ts
    find: "DEBUG=false"
    replace: "DEBUG=true"`;

const jsonExample = `- uses: xo/json
  with:
    file: package.json
    path: dependencies.stripe
    value: "^14.0.0"`;

const envExample = `- uses: xo/env
  with:
    file: .env.example
    variables:
      STRIPE_SECRET_KEY: ""
      STRIPE_WEBHOOK_SECRET: ""`;

// Prompt
const promptInfoExample = `- uses: xo/prompt
  with:
    type: info
    message: "Setting up your Flutter project..."`;

const promptWarnExample = `- uses: xo/prompt
  with:
    type: warn
    message: "This will overwrite your existing pubspec.yaml"`;

const promptConfirmExample = `- id: proceed
  uses: xo/prompt
  with:
    type: confirm
    message: "Install heavy dependencies? (~200MB)"
    default: true

- if: "steps.proceed.outputs.confirmed == true"
  uses: xo/install-pkg
  with:
    pkg: some-heavy-pkg`;

// Code
const astImportExample = `- uses: xo/ast-import
  with:
    file: src/app.module.ts
    import: PaymentModule
    from: ./payment/payment.module`;

// Package
const installPkgExample = `- uses: xo/install-pkg
  with:
    pkg: stripe
    dev: false`;

// Execution
const runExample = `# Inline shorthand
- run: pnpm db:push

# As an action
- uses: xo/run
  with:
    command: pnpm db:push`;

const scriptExample = `- uses: xo/script
  with:
    file: scripts/post-install.sh`;

// Custom actions
const compositeExample = `# actions/add-barrel.yaml
name: add-barrel-export
description: Append a barrel export to an index file

inputs:
  exportName:
    prompt: "Export name?"
  filePath:
    prompt: "Source file path (without extension)?"

outputs:
  exportLine:
    value: "export { default as {{ inputs.exportName }} } from './{{ inputs.filePath }}';"

steps:
  - uses: xo/append
    with:
      file: src/components/index.ts
      content: "export { default as {{ inputs.exportName }} } from './{{ inputs.filePath }}';"`;

const compositeUsageExample = `- uses: ./actions/add-barrel.yaml
  id: barrel
  with:
    exportName: "{{ inputs.componentName }}"
    filePath: "{{ inputs.componentName }}"

- run: echo "Added: {{ steps.barrel.outputs.exportLine }}"`;

const scriptActionExample = `// actions/log-info.js
export default async function run({ inputs, cwd, generatorDir, dryRun, env }) {
  const msg = \`component "\${inputs.componentName}" added to \${cwd}\`;
  if (!dryRun) console.log(\`    ✔ \${msg}\`);
  return { message: msg };
}`;

const scriptActionUsage = `- uses: ./actions/log-info.js
  id: logger
  with:
    componentName: "{{ inputs.componentName }}"

- run: echo "{{ steps.logger.outputs.message }}"`;

const promptActionExample = `# actions/app-naming.yaml
name: app-naming
description: Reusable app naming prompt set
runs:
  using: prompt

inputs:
  appName:
    prompt: "App display name?"
    type: text
    required: true
  projectName:
    prompt: "Project name (snake_case)?"
    type: text
    pattern: "^[a-z][a-z0-9_]*$"

outputs:
  appName: "{{ inputs.appName }}"
  projectName: "{{ inputs.projectName }}"`;

const promptActionUsage = `# In workflow.yaml — local reference
- id: naming
  uses: ./actions/app-naming.yaml

# Or shared from GitHub — same loading path as any action
- id: naming
  uses: @github/my-org/xo-prompts/app-naming

# Access outputs in later steps
- run: echo "Creating {{ steps.naming.outputs.appName }}"`;

const publishedActionExample = `# @github/my-org/xo-ensure-ts — action.yaml
name: ensure-typescript
description: Installs TypeScript if missing

inputs:
  strict:
    default: "true"

steps:
  - uses: xo/pkg-installed
    id: hasTs
    with:
      pkg: typescript
  - if: "steps.hasTs.outputs.installed == false"
    uses: xo/install-pkg
    with:
      pkg: typescript
      dev: true`;

const publishedActionUsage = `# Any version reference works
- uses: @github/my-org/xo-ensure-ts
- uses: @github/my-org/xo-ensure-ts@v1.2.0
- uses: @github/my-org/xo-actions/ensure-ts@v1.0.0`;

export default function ActionsPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Building Generators</p>
        <h1 className="mb-3 text-3xl font-bold">Actions Reference</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Actions are reusable, atomic units of work. Steps in a workflow reference them with{" "}
          <code>uses:</code>. Built-in actions ship with xo (<code>xo/</code> prefix); custom actions
          live in your generator repo (<code>./</code>) or on GitHub (<code>@github/</code>).
        </p>
      </div>

      {/* Using actions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Using an action</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Assign <code>id:</code> to any step to capture its outputs and reference them in later steps
          via <code>{"{{ steps.<id>.outputs.<key> }}"}</code>.
        </p>
        <CodeBlock code={usingActionExample} lang="yaml" />
      </section>

      {/* Step execution */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Step execution</h2>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">Step outputs</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Any step with <code>id:</code> exposes its results as{" "}
            <code>{"{{ steps.<id>.outputs.<key> }}"}</code> in subsequent steps.
          </p>
          <CodeBlock code={stepOutputsExample} lang="yaml" />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">Parallel steps</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add <code>parallel: true</code> to steps that can safely run concurrently. Consecutive
            parallel steps form a batch executed via <code>Promise.all</code>. The batch completes
            before the next non-parallel step begins.
          </p>
          <CodeBlock code={parallelStepsExample} lang="yaml" />
          <Callout variant="tip">
            Parallelise independent detection steps to reduce workflow time — especially useful when
            each check makes a separate file-system or network call.
          </Callout>
        </div>
      </section>

      {/* Detection actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Detection actions</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Detection actions inspect the project without modifying it. They always run — even in{" "}
          <code>--dry-run</code> mode — because they have no side effects. Assign an <code>id</code>{" "}
          to read their outputs in later steps.
        </p>

        {[
          {
            name: "xo/detect-pm",
            desc: "Detects the package manager from lockfile presence.",
            example: detectPmExample,
          },
          {
            name: "xo/detect-lang",
            desc: "Detects the primary language of the project.",
            example: detectLangExample,
          },
          {
            name: "xo/file-exists",
            desc: "Checks whether a file or directory exists at a path relative to the project root.",
            example: fileExistsExample,
          },
          {
            name: "xo/pkg-installed",
            desc: "Checks whether a package is in dependencies, devDependencies, or peerDependencies.",
            example: pkgInstalledExample,
          },
          {
            name: "xo/read-json",
            desc: "Reads a value from a JSON file at a dot-notation path.",
            example: readJsonExample,
          },
        ].map((a) => (
          <div key={a.name} className="space-y-3 rounded-xl border border-border p-5">
            <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
              {a.name}
            </Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
            <CodeBlock code={a.example} lang="yaml" />
          </div>
        ))}
      </section>

      {/* File actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">File actions</h2>

        <div className="space-y-3 rounded-xl border border-border p-5">
          <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
            xo/copy
          </Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Copies a file, directory, or glob match from the generator to the project. For remote
            generators (GitHub), directories are enumerated via the GitHub Contents API. For local
            generators, <code>fs.copy</code> handles them natively.
          </p>
          <CodeBlock code={copyExample} lang="yaml" />
          <Callout variant="info">
            Glob wildcards: <code>*</code> matches any characters within a path segment,{" "}
            <code>**</code> matches across directory separators, <code>?</code> matches a single
            character. When <code>from</code> has no glob characters and points at a directory, the
            whole directory is copied recursively.
          </Callout>
        </div>

        {[
          {
            name: "xo/template",
            desc: "Renders a Handlebars template from the generator and writes the output. Supports {{ inputs.* }}, {{ steps.*.outputs.* }}, and all Handlebars helpers.",
            example: templateExample,
          },
          {
            name: "xo/append",
            desc: "Appends content to a file. Creates the file if it does not exist.",
            example: appendExample,
          },
          {
            name: "xo/inject",
            desc: "Inserts content immediately after or before a marker string in an existing file. Throws if the marker is not found. Exactly one of after or before is required.",
            example: injectExample,
          },
          {
            name: "xo/replace",
            desc: "Finds a regex pattern in a file and replaces it. The search field is a regex string.",
            example: replaceExample,
          },
          {
            name: "xo/json",
            desc: "Reads a JSON file, sets a value at a dot-notation path, and writes it back. Deep paths are created if missing.",
            example: jsonExample,
          },
          {
            name: "xo/env",
            desc: "Adds or updates variables in a .env file. Skips any key that already exists.",
            example: envExample,
          },
        ].map((a) => (
          <div key={a.name} className="space-y-3 rounded-xl border border-border p-5">
            <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
              {a.name}
            </Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
            <CodeBlock code={a.example} lang="yaml" />
          </div>
        ))}
      </section>

      {/* Prompt actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Prompt actions</h2>

        <div className="space-y-4 rounded-xl border border-border p-5">
          <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
            xo/prompt
          </Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Displays a message or requests confirmation from the user mid-workflow. Use{" "}
            <code>type: info</code> or <code>type: warn</code> for status messages, and{" "}
            <code>type: confirm</code> to gate steps behind a yes/no answer.
          </p>
          <CodeBlock code={promptInfoExample} lang="yaml" />
          <CodeBlock code={promptWarnExample} lang="yaml" />
          <CodeBlock code={promptConfirmExample} lang="yaml" />
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {["type", "Description", "Outputs"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["info", "Prints an informational message", "—"],
                  ["warn", "Prints a warning message", "—"],
                  ["success", "Prints a success message", "—"],
                  ["confirm", "Asks a yes/no question", "{ confirmed: boolean }"],
                ].map(([t, d, o]) => (
                  <tr key={t} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs text-primary">{t}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{d}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Code actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Code actions</h2>

        <div className="space-y-3 rounded-xl border border-border p-5">
          <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
            xo/ast-import
          </Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Adds an import statement to a TypeScript/JavaScript file using AST manipulation (ts-morph).
            No-ops if the import already exists.
          </p>
          <CodeBlock code={astImportExample} lang="yaml" />
        </div>
      </section>

      {/* Package actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Package actions</h2>

        <div className="space-y-3 rounded-xl border border-border p-5">
          <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
            xo/install-pkg
          </Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Installs a package using the auto-detected package manager. If a{" "}
            <code>xo/detect-pm</code> step with <code>id: pm</code> ran earlier in the workflow, its
            output is used directly. Skips if the package is already installed.
          </p>
          <CodeBlock code={installPkgExample} lang="yaml" />
        </div>
      </section>

      {/* Execution actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Execution actions</h2>

        <div className="space-y-3 rounded-xl border border-border p-5">
          <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
            xo/run · run:
          </Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Runs a shell command in the project root. The inline <code>run:</code> shorthand is
            equivalent and preferred.
          </p>
          <CodeBlock code={runExample} lang="yaml" />
        </div>

        <div className="space-y-3 rounded-xl border border-border p-5">
          <Badge variant="secondary" className="rounded-md px-2.5 py-1 font-mono text-sm font-semibold text-primary">
            xo/script
          </Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Runs a shell script file from the generator's directory.
          </p>
          <CodeBlock code={scriptExample} lang="yaml" />
        </div>
      </section>

      {/* Custom actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Custom actions</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Package reusable logic as <code>action.yaml</code> files. Reference them locally with{" "}
          <code>uses: ./actions/name.yaml</code> or share them on GitHub with{" "}
          <code>uses: @github/owner/repo</code>.
        </p>

        {/* Composite */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Composite action (YAML)</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A YAML file with <code>steps:</code> that composes <code>xo/*</code> built-ins. No code
            needed. Only values declared under <code>outputs:</code> are visible to the parent workflow.
          </p>
          <CodeBlock code={compositeExample} lang="yaml" />
          <CodeBlock code={compositeUsageExample} lang="yaml" />
        </div>

        {/* Script */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Script action (JS)</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A plain <code>.js</code> file that exports an async function. Full Node.js — use any
            logic, call external APIs, read files, return outputs. The function receives{" "}
            <code>{"{ inputs, cwd, generatorDir, dryRun, env }"}</code> and returns a plain object
            whose keys become step outputs.
          </p>
          <CodeBlock code={scriptActionExample} lang="js" />
          <CodeBlock code={scriptActionUsage} lang="yaml" />
        </div>

        {/* Prompt action */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Prompt action — reusable input sets</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            An <code>action.yaml</code> with <code>runs.using: prompt</code> collects inputs
            interactively and exposes the answers as step outputs — no steps required. Works with local{" "}
            <code>./actions/</code> references, <code>@github/</code> sharing, and pinned tags. Use
            <code>with:</code> to pre-fill or override specific inputs.
          </p>
          <CodeBlock code={promptActionExample} lang="yaml" />
          <CodeBlock code={promptActionUsage} lang="yaml" />
          <Callout variant="tip">
            Prompt actions are the recommended way to share common input sets — e.g. "app naming",
            "framework selector", "auth options" — across multiple generators.
          </Callout>
        </div>

        {/* Published */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Published action (GitHub)</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            An action in its own GitHub repo, shareable across generators. The repo must have an{" "}
            <code>action.yaml</code> at the root (or subpath). For private repos, set{" "}
            <code>XO_GITHUB_TOKEN</code> in your environment.
          </p>
          <CodeBlock code={publishedActionExample} lang="yaml" />
          <CodeBlock code={publishedActionUsage} lang="yaml" />
        </div>

        {/* Choosing */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["You want to…", "Use"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Reuse a group of xo/* steps within one generator", "Composite (./actions/name.yaml)"],
                ["Run custom logic, call APIs, or do anything YAML can't express", "Script (./actions/name.js)"],
                ["Collect a reusable set of inputs and expose as outputs", "Prompt action (runs.using: prompt)"],
                ["Share an action across many generator repos", "Published (@github/owner/repo)"],
              ].map(([goal, use]) => (
                <tr key={goal} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{goal}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Idempotency */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Idempotency</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Most built-in actions are safe to re-run — they check before writing and skip if the result
          is already in place.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Action", "Guarantee"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["xo/copy", "Overwrites destination — caller should use if to guard"],
                ["xo/template", "Overwrites destination with rendered output"],
                ["xo/append", "Checks for duplicate content before appending"],
                ["xo/inject", "No-ops if marker content is already present"],
                ["xo/replace", "No-ops if find string is not found"],
                ["xo/json", "Merges; does not overwrite existing keys unless value differs"],
                ["xo/env", "Skips keys that already exist in the file"],
                ["xo/ast-import", "No-ops if import already present"],
                ["xo/install-pkg", "Skips if package already in dependencies"],
                ["xo/run / run:", "Caller's responsibility — use if conditions to guard"],
                ["xo/prompt", "Side-effect free for info/warn/success; confirm is interactive"],
                ["Detection actions", "Read-only — always safe to re-run"],
              ].map(([action, guarantee]) => (
                <tr key={action} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{action}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{guarantee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
