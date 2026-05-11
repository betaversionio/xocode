import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Workflow Reference" };

const fullExample = `name: payment/stripe
on: [add]
description: Add Stripe payment processing to an existing project

detects:
  - file: package.json
    exists: true
  - pkg: next
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
  webhookSecret:
    prompt: "Stripe webhook secret?"
    required: false

jobs:
  detect:
    steps:
      - uses: xo/detect-pm
        id: pm
      - uses: xo/pkg-installed
        id: hasNext
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

const onExample = `on: [add]           # xo add payment/stripe
on: [create]        # xo create payment/stripe
on: [run]           # xo run payment/stripe
on: [add, run]      # both`;

const inputsExample = `inputs:
  componentName:
    prompt: "Component name?"
    required: true
    min: 2
    max: 50
  variant:
    prompt: "Choose variant"
    type: select
    choices: [primary, secondary, ghost]
    default: primary
  confirmSetup:
    prompt: "Continue with setup?"
    type: confirm
  features:
    prompt: "Select features"
    type: multiselect
    choices: [auth, payments, analytics]`;

const jobsExample = `jobs:
  detect:
    steps: [...]
  install:
    needs: [detect]
    steps: [...]
  configure:
    needs: [install]
    steps: [...]`;

const stepsActionExample = `- uses: xo/install-pkg
  with:
    pkg: stripe`;

const stepsRunExample = `- run: pnpm db:push`;

const stepsNameExample = `- name: Install Stripe SDK
  uses: xo/install-pkg
  with:
    pkg: stripe`;

const stepsIdExample = `- uses: xo/detect-pm
  id: pm

# Later steps reference: steps.pm.outputs.value`;

const stepsIfExample = `- if: "steps.hasNext.outputs.installed == true"
  uses: xo/copy
  with:
    from: templates/route.ts
    to: app/api/stripe/route.ts`;

const stepsParallelExample = `- uses: xo/detect-pm
  id: pm
  parallel: true
- uses: xo/detect-lang
  id: lang
  parallel: true
- uses: xo/pkg-installed
  id: hasNext
  parallel: true
  with:
    pkg: next
# ^ all three run concurrently, then the next sequential step runs`;

const stepOutputsExample = `- uses: xo/detect-pm
  id: pm
  # outputs: { value: "pnpm" }

- uses: xo/pkg-installed
  id: hasNext
  with:
    pkg: next
  # outputs: { installed: true, version: "^14.0.0" }

- uses: xo/file-exists
  id: hasPrisma
  with:
    path: prisma/schema.prisma
  # outputs: { exists: false }

# Use in if:
- if: "steps.hasNext.outputs.installed == true"
  uses: xo/copy
  with:
    from: templates/route.ts
    to: app/api/stripe/route.ts

# Use in run:
- run: "{{ steps.pm.outputs.value }} add stripe"`;

const contextVarsExample = `- uses: xo/copy
  with:
    from: templates/component.tsx
    to: "{{ config.ui.componentsDir }}/{{ inputs.componentName }}.tsx"

- run: "{{ steps.pm.outputs.value }} add {{ inputs.pkg }}"

- uses: xo/env
  with:
    file: .env.example
    variables:
      DB_URL: "{{ env.DATABASE_URL }}"`;

const detectsExample = `detects:
  - file: package.json    # checks if file exists at this path
    exists: true
  - pkg: react            # checks package.json dependencies
    exists: true`;

const depsExample = `dependencies:
  - database/postgres                   # registry name — runs before this workflow
  - "@github/my-org/xo-base"           # direct GitHub ref
  - "@github/my-org/xo-base@v1.0.0"   # pinned to a tag

conflicts:
  - auth/firebase       # xo aborts if already installed

provides:
  - auth                # abstract capability tag`;

const inputTypesRows = [
  ["text", "Free text input (default)"],
  ["select", "Single choice from a list"],
  ["confirm", "Yes / no boolean"],
  ["multiselect", "Multiple choices from a list"],
];

const contextVarsRows = [
  ["{{ inputs.* }}", "Answers collected from workflow inputs"],
  ["{{ steps.<id>.outputs.* }}", "Outputs from a previous step that has an id"],
  ["{{ config.* }}", "Values from xo.config.yaml in the project"],
  ["{{ env.* }}", "Environment variables (process.env)"],
];

export default function WorkflowsPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Building Generators</p>
        <h1 className="mb-3 text-3xl font-bold">Workflow Reference</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          A workflow is a YAML file that composes actions into a sequence with inputs, conditionals,
          and jobs. Workflows are the core unit of xo — every <code>xo add</code>,{" "}
          <code>xo create</code>, and <code>xo run</code> command executes a workflow.
        </p>
      </div>

      {/* Full example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Full example</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A complete <code>workflow.yaml</code> showing all top-level fields:
        </p>
        <CodeBlock code={fullExample} lang="yaml" />
      </section>

      {/* name */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold"><code>name</code></h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Namespaced identifier. Used when calling <code>xo add &lt;name&gt;</code> or{" "}
          <code>xo create &lt;name&gt;</code> after registering the generator.
        </p>
        <CodeBlock code={`name: payment/stripe`} lang="yaml" />
      </section>

      {/* on */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold"><code>on</code></h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Trigger(s) that activate this workflow. A generator can respond to one or multiple triggers.
        </p>
        <CodeBlock code={onExample} lang="yaml" />
      </section>

      {/* inputs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold"><code>inputs</code></h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Named inputs collected interactively from the user before any jobs run. All answers are
          available as <code>{"{{ inputs.* }}"}</code> in steps.
        </p>
        <CodeBlock code={inputsExample} lang="yaml" />

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Type", "Description"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inputTypesRows.map(([t, d]) => (
                <tr key={t} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{t}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground">
          Input validation fields: <code>required</code> (boolean), <code>min</code> (min character
          length), <code>max</code> (max character length), <code>pattern</code> (regex string).
        </p>
      </section>

      {/* jobs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold"><code>jobs</code></h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A workflow contains one or more named jobs. Jobs run sequentially. Use <code>needs</code>{" "}
          to declare an explicit dependency order.
        </p>
        <CodeBlock code={jobsExample} lang="yaml" />
      </section>

      {/* steps */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold"><code>steps</code></h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each step runs a <code>uses</code> action or an inline <code>run</code> command.
        </p>

        {[
          { title: "Using an action", code: stepsActionExample },
          { title: "Running a shell command", code: stepsRunExample },
          { title: "Naming a step (for logs)", code: stepsNameExample },
          { title: "Capturing output with id", code: stepsIdExample },
          { title: "Conditional step (if)", code: stepsIfExample },
          { title: "Parallel steps", code: stepsParallelExample },
        ].map(({ title, code }) => (
          <div key={title} className="space-y-2">
            <p className="text-sm font-medium">{title}</p>
            <CodeBlock code={code} lang="yaml" />
          </div>
        ))}

        <Callout variant="info">
          <code>if</code> expressions support <code>==</code>, <code>!=</code>, <code>{"&&"}</code>,{" "}
          <code>||</code>. The expression is evaluated after context variable interpolation.
        </Callout>
      </section>

      {/* step outputs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Step outputs</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Detection actions produce outputs that later steps can read. Assign an <code>id</code> to a
          step to capture its outputs as <code>{"steps.<id>.outputs.*"}</code>.
        </p>
        <CodeBlock code={stepOutputsExample} lang="yaml" />
      </section>

      {/* context variables */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Context variables</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Variables available inside any string value using <code>{"{{ double-braces }}"}</code> —
          in <code>with:</code>, <code>run:</code>, <code>if:</code>, and template files.
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

      {/* detects */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold"><code>detects</code> — pre-flight check</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Runs before inputs are collected. All rules are AND-ed — every one must pass, or xo
          refuses to run. Use for quick compatibility checks: file existence and package presence.
        </p>
        <CodeBlock code={detectsExample} lang="yaml" />
        <Callout variant="info">
          For richer detection (package manager, language, reading JSON values), use detection
          actions in a <code>detect</code> job. See the{" "}
          <Link href="/docs/signals" className="font-medium text-primary hover:underline">
            Signals Reference
          </Link>.
        </Callout>
      </section>

      {/* dependencies / conflicts / provides */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dependencies, conflicts, provides</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Control how generators compose and validate against each other.
        </p>
        <CodeBlock code={depsExample} lang="yaml" />

        <div className="space-y-3">
          {[
            {
              field: "dependencies",
              desc: "Generators that must be applied before this one. xo resolves them in order.",
            },
            {
              field: "conflicts",
              desc: "Generators that must NOT be applied. xo aborts if any conflict is found in xo.config.yaml.",
            },
            {
              field: "provides",
              desc: "Abstract capability tags this generator satisfies. Other generators can list a tag in their conflicts to prevent double-installation.",
            },
          ].map(({ field, desc }) => (
            <div key={field} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <code className="shrink-0 text-sm font-bold text-primary">{field}</code>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* idempotency */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Idempotency</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Workflows are safe to re-run. Each built-in action handles idempotency internally — see
          the{" "}
          <Link href="/docs/actions" className="font-medium text-primary hover:underline">
            Actions Reference
          </Link>{" "}
          for per-action rules. For <code>run:</code> steps, guard with <code>if</code> conditions
          to prevent duplicate execution.
        </p>
      </section>
    </article>
  );
}
