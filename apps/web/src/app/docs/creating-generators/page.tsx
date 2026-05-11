import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock, TerminalBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Creating a Generator" };

// ── code examples ────────────────────────────────────────────────────────────

const folderStructure = `xo-button/
├── workflow.yaml             ← entry point (or workflows/add.yaml, workflows/create.yaml)
├── templates/
│   └── button.tsx            ← files copied / rendered into the user's project
├── actions/
│   ├── add-barrel.yaml       ← composite action (reusable steps)
│   └── validate-name.js      ← script action (custom Node.js logic)
└── scripts/
    └── post-install.sh`;

const minimalWorkflow = `# workflow.yaml
name: ui/button
on: [add]
description: Add a reusable Button component

inputs:
  componentName:
    prompt: "Component name?"
    default: Button

jobs:
  scaffold:
    steps:
      - uses: xo/copy
        with:
          from: templates/button.tsx
          to: "src/components/{{ inputs.componentName }}.tsx"`;

const multiTrigger = `xo-stripe/
├── workflows/
│   ├── add.yaml        ← xo add @github/my-org/xo-stripe
│   └── create.yaml     ← xo create @github/my-org/xo-stripe
└── templates/
    └── stripe-route.ts`;

const workflowFieldsTable = [
  ["name", "string", "Yes", "Unique identifier — conventionally owner/repo"],
  ["on", "trigger[]", "Yes", 'Which xo commands trigger this: "add", "create", "run"'],
  ["description", "string", "No", "Short description shown in the CLI"],
  ["detects", "DetectRule[]", "No", "File/package checks that must pass before running"],
  ["requires", "string[]", "No", "Generator names that must already be applied"],
  ["conflicts", "string[]", "No", "Generator names that must NOT be present"],
  ["provides", "string[]", "No", "Logical capability tags this generator declares"],
  ["inputs", "Record<string, Input>", "No", "Interactive prompts collected before jobs run"],
  ["jobs", "Record<string, Job>", "Yes", "Named jobs containing ordered steps"],
];

const inputsExample = `inputs:
  appName:
    prompt: "App display name?"
    type: text
    required: true

  framework:
    prompt: "Framework?"
    type: select
    choices:
      - { value: react, label: "React" }
      - { value: vue,   label: "Vue" }
    default: react

  features:
    prompt: "Features to include?"
    type: multiselect
    choices:
      - { value: auth,    label: "Auth" }
      - { value: storage, label: "Storage" }

  confirm:
    prompt: "Proceed?"
    type: confirm
    default: true`;

const inputValidationExample = `inputs:
  projectName:
    prompt: "Project name?"
    type: text
    required: true
    pattern: "^[a-z][a-z0-9_]*$"   # regex — must start with a lowercase letter
    min: 2                            # minimum character length
    max: 50                           # maximum character length

  version:
    prompt: "Version?"
    type: text
    pattern: "^\\d+\\.\\d+\\.\\d+$"   # semver — e.g. 1.0.0`;

const inputTypesTable = [
  ["text", "Free-text field", "pattern, min, max, required"],
  ["confirm", "Yes / No question", "default"],
  ["select", "Single-choice list", "choices, default"],
  ["multiselect", "Multi-choice checkboxes", "choices"],
];

const templateExample = `# templates/app.tsx
import { Provider } from '{{ inputs.stateManagement === "riverpod" ? "flutter_riverpod" : "flutter_bloc" }}';

// Handlebars helpers work in template content:
// {{ pascalCase inputs.appName }}
// {{ kebabCase inputs.projectName }}
// {{#if (includes inputs.features "auth")}} ... {{/if}}`;

const jobsExample = `jobs:
  detect:
    steps:
      - uses: xo/detect-pm
        id: pm
        parallel: true
      - uses: xo/pkg-installed
        id: hasNext
        parallel: true
        with:
          pkg: next

  install:
    needs: [detect]
    steps:
      - uses: xo/install-pkg
        with:
          pkg: stripe

  configure:
    needs: [install]
    steps:
      - if: "steps.hasNext.outputs.installed == true"
        uses: xo/copy
        with:
          from: templates/next-route.ts
          to: app/api/stripe/route.ts

      - run: "{{ steps.pm.outputs.value }} db:push"`;

const fullExample = `# workflow.yaml
name: payment/stripe
on: [add]
description: Add Stripe payment processing

detects:
  - file: package.json
    exists: true

dependencies:
  - auth/jwt

conflicts:
  - payment/paddle

provides:
  - payment

inputs:
  secretKey:
    prompt: "Stripe secret key?"
    required: true
    pattern: "^sk_(test|live)_[A-Za-z0-9]+$"

jobs:
  detect:
    steps:
      - uses: xo/detect-pm
        id: pm
        parallel: true
      - uses: xo/pkg-installed
        id: hasNext
        parallel: true
        with:
          pkg: next

  install:
    needs: [detect]
    steps:
      - uses: xo/install-pkg
        with:
          pkg: stripe
      - uses: xo/env
        with:
          file: .env.example
          variables:
            STRIPE_SECRET_KEY: ""
            STRIPE_WEBHOOK_SECRET: ""

  configure:
    needs: [install]
    steps:
      - if: "steps.hasNext.outputs.installed == true"
        uses: xo/copy
        with:
          from: templates/stripe-route.ts
          to: app/api/stripe/route.ts

      - uses: xo/ast-import
        with:
          file: src/app.module.ts
          import: StripeModule
          from: ./stripe/stripe.module

      - run: "{{ steps.pm.outputs.value }} db:push"`;

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

const detectsExample = `detects:
  - file: package.json
    exists: true
  - pkg: next
    exists: true`;

const githubPublish = `git init && git add .
git commit -m "feat: stripe generator"
git remote add origin git@github.com:my-org/xo-stripe.git
git push -u origin main`;

const githubUsage = `# Direct — no registration needed
xo add @github/my-org/xo-stripe

# Pin to a tag (cached forever)
xo add @github/my-org/xo-stripe@v1.0.0

# Subpath in a multi-generator repo
xo add @github/my-org/xo-generators/stripe`;

export default function CreatingGeneratorsPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Building Generators</p>
        <h1 className="mb-3 text-3xl font-bold">Creating a Generator</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          A generator is a directory with a <code>workflow.yaml</code> entry point plus any templates,
          actions, and scripts it references. This page walks through everything from a minimal example
          to a production-ready multi-job generator.
        </p>
      </div>

      {/* Folder structure */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Folder structure</h2>
        <CodeBlock code={folderStructure} lang="text" />
        <p className="text-sm text-muted-foreground">
          Use <code>workflow.yaml</code> at the root for a single trigger. Use{" "}
          <code>workflows/add.yaml</code> + <code>workflows/create.yaml</code> for multiple triggers
          from the same repo:
        </p>
        <CodeBlock code={multiTrigger} lang="text" />
      </section>

      {/* Minimal example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Minimal example</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The smallest valid generator — one input, one job, one step:
        </p>
        <CodeBlock code={minimalWorkflow} filename="workflow.yaml" lang="yaml" />
        <Callout variant="tip">
          Inside templates and <code>with:</code> values, use{" "}
          <code>{"{{ inputs.name }}"}</code> for prompt answers,{" "}
          <code>{"{{ steps.id.outputs.key }}"}</code> for step outputs, and Handlebars helpers like{" "}
          <code>pascalCase</code>, <code>kebabCase</code>, <code>includes</code>.
        </Callout>
      </section>

      {/* workflow.yaml reference */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">workflow.yaml reference</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Field", "Type", "Required", "Description"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workflowFieldsTable.map(([field, type, req, desc]) => (
                <tr key={field} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{field}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{type}</td>
                  <td className="px-4 py-2.5 text-xs">{req}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Defining inputs</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Inputs are collected interactively before any jobs run. Answers are available in templates
          and step <code>with:</code> values as <code>{"{{ inputs.name }}"}</code>.
        </p>
        <CodeBlock code={inputsExample} lang="yaml" />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Type", "Renders as", "Extra fields"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inputTypesTable.map(([t, r, e]) => (
                <tr key={t} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{t}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{r}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Input validation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Input validation</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Text inputs support <code>pattern</code>, <code>min</code>, and <code>max</code>. Validation
          runs inline — a clear error is shown and the prompt is re-displayed on failure.
        </p>
        <CodeBlock code={inputValidationExample} lang="yaml" />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Field", "Type", "Description"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["pattern", "string", "ECMAScript regex the value must satisfy"],
                ["min", "number", "Minimum character length"],
                ["max", "number", "Maximum character length"],
              ].map(([field, type, desc]) => (
                <tr key={field} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{field}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{type}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Jobs and steps */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Jobs and steps</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Jobs run in topological order based on <code>needs:</code> dependencies. Each job contains
          an ordered list of steps. Use <code>if:</code> on any step to conditionally skip it.
        </p>
        <CodeBlock code={jobsExample} lang="yaml" />
      </section>

      {/* Parallel steps */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Parallel steps</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add <code>parallel: true</code> to steps that can run concurrently. Consecutive parallel
          steps are grouped into a batch and executed via <code>Promise.all</code>. The batch
          completes before the next non-parallel step begins.
        </p>
        <CodeBlock code={parallelStepsExample} lang="yaml" />
        <Callout variant="tip">
          Parallelise independent detection steps to reduce total workflow time — particularly
          useful when each check makes a separate file-system or network call.
        </Callout>
      </section>

      {/* Templates */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Handlebars templates</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Template files (used with <code>xo/template</code>) support the full Handlebars syntax.
          Variables come from <code>inputs</code>, step <code>outputs</code>, and the project{" "}
          <code>config</code>.
        </p>
        <CodeBlock code={templateExample} lang="tsx" />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Helper", "Input", "Output"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["pascalCase", "my-component", "MyComponent"],
                ["camelCase", "my-component", "myComponent"],
                ["kebabCase", "MyComponent", "my-component"],
                ["snakeCase", "MyComponent", "my_component"],
                ["capitalize", "hello world", "Hello world"],
                ["eq / ne", "{{#if (eq a b)}}", "boolean equal / not-equal"],
                ["or / and", "{{#if (or a b)}}", "logical or / and"],
                ["includes", "{{#if (includes arr val)}}", "array includes check (multiselect)"],
              ].map(([h, i, o]) => (
                <tr key={h} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{h}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{i}</td>
                  <td className="px-4 py-2.5 text-xs">{o}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detects */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pre-flight detect rules</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Declare <code>detects</code> to verify compatibility before inputs are collected or any
          steps run. Multiple rules are AND-ed. Supported assertions: <code>exists</code>,{" "}
          <code>equals</code>, <code>matches</code>.
        </p>
        <CodeBlock code={detectsExample} lang="yaml" />
      </section>

      {/* Full example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Full working example</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A complete multi-job generator with inputs, detect rules, parallel steps, dependencies,
          and conditional steps:
        </p>
        <CodeBlock code={fullExample} filename="workflow.yaml" lang="yaml" />
      </section>

      {/* Testing locally */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Testing locally</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use <code>xo link</code> inside your generator repo to register it by name. From any
          project, run it with the short name — no path, no <code>--local</code> flag needed.
          Changes to <code>workflow.yaml</code> or templates are picked up immediately.
        </p>
        <TerminalBlock commands={["cd ~/projects/xo-stripe", "xo link"]} />
        <TerminalBlock commands={["cd ~/my-app", "xo add payment/stripe", "xo add payment/stripe --dry-run -i secretKey=sk_test_abc"]} />
        <p className="text-sm text-muted-foreground">
          For a one-off run without linking:
        </p>
        <TerminalBlock commands={["xo add ./xo-stripe --local"]} />
      </section>

      {/* Publishing */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Publishing to GitHub</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Push to any public GitHub repo — no registry account required. Users reference it with the{" "}
          <code>@github/</code> prefix, or you can register a short name with{" "}
          <code>xo registry add</code>.
        </p>
        <TerminalBlock commands={githubPublish.split("\n")} />
        <CodeBlock code={githubUsage} lang="bash" />
        <Callout variant="tip">
          For private repos, users set <code>XO_GITHUB_TOKEN=ghp_xxx</code> in their environment.
          Branch refs are always re-fetched; tag refs are cached forever.
        </Callout>
      </section>

      <div className="flex gap-4 pt-2">
        <Button asChild variant="link" className="h-auto p-0 text-primary">
          <Link href="/docs/actions">
            Actions reference <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild variant="link" className="h-auto p-0 text-primary">
          <Link href="/docs/cli-reference">
            CLI reference <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
