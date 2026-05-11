import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Signals & Detection" };

// ── code examples ─────────────────────────────────────────────────────────────

const detectsExample = `detects:
  - file: package.json
    exists: true
  - pkg: next
    exists: true`;

const detectsFlutterExample = `detects:
  - file: pubspec.yaml
    exists: true`;

const detectsTableRows = [
  ["file", "string", "Relative path — checks whether the file exists in the project"],
  ["pkg", "string", "Package name — checks package.json dependencies"],
  ["exists", "boolean", "File/pkg must be present (true) or absent (false). Default: true"],
  ["equals", "string", "Value must exactly equal this string"],
  ["matches", "string", "Value must match this regex"],
];

const detectActionsExample = `jobs:
  detect:
    steps:
      - uses: xo/detect-pm
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
      - uses: xo/file-exists
        id: hasPrisma
        with:
          path: prisma/schema.prisma

  install:
    needs: [detect]
    steps:
      - if: "steps.hasNext.outputs.installed == true"
        uses: xo/copy
        with:
          from: templates/next-route.ts
          to: app/api/stripe/route.ts

      - run: "{{ steps.pm.outputs.value }} db:push"`;

const detectPmOutputs = `# outputs: { value: "pnpm" | "npm" | "yarn" | "bun" }
- uses: xo/detect-pm
  id: pm

- run: "{{ steps.pm.outputs.value }} install"`;

const detectLangOutputs = `# outputs: { value: "typescript" | "javascript" | "dart" | "go" | "rust" | "python" }
- uses: xo/detect-lang
  id: lang

- if: "steps.lang.outputs.value == 'typescript'"
  uses: xo/copy
  with:
    from: templates/config.ts
    to: src/config.ts`;

const fileExistsOutputs = `# outputs: { exists: true | false }
- uses: xo/file-exists
  id: hasPrisma
  with:
    path: prisma/schema.prisma

- if: "steps.hasPrisma.outputs.exists == false"
  run: pnpm dlx prisma init`;

const pkgInstalledOutputs = `# outputs: { installed: true | false, version: "^14.0.0" | null }
- uses: xo/pkg-installed
  id: hasNext
  with:
    pkg: next

- if: "steps.hasNext.outputs.installed == true"
  uses: xo/copy
  with:
    from: templates/next-route.ts
    to: app/api/stripe/route.ts`;

const readJsonOutputs = `# outputs: { value: <any> }
- uses: xo/read-json
  id: pkgName
  with:
    file: package.json
    path: name

- run: echo "Project: {{ steps.pkgName.outputs.value }}"`;

const contextVarsExample = `- uses: xo/copy
  with:
    from: templates/component.tsx
    to: "{{ config.ui.componentsDir }}/{{ inputs.componentName }}.tsx"

- run: "{{ steps.pm.outputs.value }} add {{ inputs.pkg }}"`;

const templateVarsExample = `{# templates/app.dart #}
import 'package:flutter/material.dart';
{{#if (includes inputs.features "riverpod")}}
import 'package:flutter_riverpod/flutter_riverpod.dart';
{{/if}}

void main() {
  runApp(
    {{#if (includes inputs.features "riverpod")}}
    const ProviderScope(child: MyApp()),
    {{else}}
    const MyApp(),
    {{/if}}
  );
}`;

export default function SignalsPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Building Generators</p>
        <h1 className="mb-3 text-3xl font-bold">Signals & Detection</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          xo has two detection mechanisms: <strong>pre-flight detect rules</strong> that run before
          any input is collected, and <strong>detection actions</strong> (<code>xo/detect-*</code>)
          that run explicitly inside a workflow's <code>detect</code> job. xo never auto-scans —
          generators declare exactly what they need to know.
        </p>
      </div>

      {/* Pre-flight detects */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pre-flight detect rules</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Declare <code>detects:</code> in <code>workflow.yaml</code> to verify project compatibility
          before inputs are collected or any steps run. All rules are AND-ed — every one must pass.
          If any rule fails, xo refuses to run with a clear error message.
        </p>
        <CodeBlock code={detectsExample} lang="yaml" />
        <p className="text-sm text-muted-foreground">Flutter example — only runs in Flutter projects:</p>
        <CodeBlock code={detectsFlutterExample} lang="yaml" />

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
              {detectsTableRows.map(([f, t, d]) => (
                <tr key={f} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{f}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout variant="info">
          <code>detects</code> is for simple file/package existence checks only. For richer
          detection — detecting the package manager, language, or reading JSON values — use detection
          actions inside a <code>detect</code> job.
        </Callout>
      </section>

      {/* Detection actions overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Detection actions</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Detection actions run inside a workflow's <code>detect</code> job and expose their findings
          as step outputs. They always run — even in <code>--dry-run</code> mode — because they have
          no side effects. Assign an <code>id</code> to capture their outputs.
        </p>
        <p className="text-sm text-muted-foreground">
          A typical detect job parallelises all checks then gates later jobs on the results:
        </p>
        <CodeBlock code={detectActionsExample} lang="yaml" />
      </section>

      {/* Individual detection actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Detection action reference</h2>

        {[
          {
            name: "xo/detect-pm",
            desc: "Detects the active package manager by checking for lockfiles (pnpm-lock.yaml, yarn.lock, bun.lockb, package-lock.json).",
            example: detectPmOutputs,
          },
          {
            name: "xo/detect-lang",
            desc: "Detects the primary language of the project from well-known indicator files (tsconfig.json → typescript, pubspec.yaml → dart, go.mod → go, Cargo.toml → rust, pyproject.toml → python).",
            example: detectLangOutputs,
          },
          {
            name: "xo/file-exists",
            desc: "Checks whether a file or directory exists at a path relative to the project root.",
            example: fileExistsOutputs,
          },
          {
            name: "xo/pkg-installed",
            desc: "Checks whether a package is listed in dependencies, devDependencies, or peerDependencies.",
            example: pkgInstalledOutputs,
          },
          {
            name: "xo/read-json",
            desc: "Reads a value from a JSON file at a dot-notation path. Useful for reading project name, version, or any config value.",
            example: readJsonOutputs,
          },
        ].map((action) => (
          <div key={action.name} className="space-y-3 rounded-xl border border-border p-5">
            <code className="block text-sm font-bold text-primary">{action.name}</code>
            <p className="text-sm leading-relaxed text-muted-foreground">{action.desc}</p>
            <CodeBlock code={action.example} lang="yaml" />
          </div>
        ))}
      </section>

      {/* Context variables */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Context variables</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Any string value in a step's <code>with:</code>, <code>run:</code>, or <code>if:</code>
          can reference context via <code>{"{{ double-braces }}"}</code>:
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
              {[
                ["{{ inputs.* }}", "Answers collected from workflow inputs"],
                ["{{ steps.<id>.outputs.* }}", "Outputs from a previous step that has an id"],
                ["{{ config.* }}", "Values from xo.config.yaml in the project"],
                ["{{ env.* }}", "Environment variables (process.env)"],
              ].map(([ns, src]) => (
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

      {/* Templates */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Using detection results in templates</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Template files (used with <code>xo/template</code>) have full access to <code>inputs</code>,
          step <code>outputs</code>, and <code>config</code> via Handlebars. Use the{" "}
          <code>{"{{#if (includes inputs.features \"name\")}}"}</code> helper to conditionally render
          blocks based on multiselect answers.
        </p>
        <CodeBlock code={templateVarsExample} lang="handlebars" />
        <p className="text-sm text-muted-foreground">
          See the{" "}
          <Link href="/docs/actions" className="font-medium text-primary hover:underline">
            Actions Reference
          </Link>{" "}
          for the full list of Handlebars helpers available in templates.
        </p>
      </section>
    </article>
  );
}
