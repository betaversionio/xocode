import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Signals Reference" };

const signalExample = `"file:package.json": true
"file:tsconfig.json": true
"file:tailwind.config.ts": true
"file:prisma/schema.prisma": false
"pkg:react": true
"pkg:next": true
"pkg:typescript": true
"script:build": true
"script:dev": true
framework: nextjs
packageManager: pnpm
language: typescript
isMonorepo: false`;

const detectsExample = `name: acme/prisma-setup
type: feature
detects:
  - signal: language
    equals: typescript
  - signal: packageManager
    matches: "^(npm|pnpm)$"
  - signal: "file:prisma/schema.prisma"
    exists: false
actions: []`;

const promptWhenExample = `name: addDockerCompose
type: confirm
message: Add docker-compose.yml?
when: "isMonorepo === false && framework === 'nestjs'"`;

const actionIfExample = `type: template
source: templates/jest.config.ts.hbs
target: jest.config.ts
if: "language === 'typescript'"`;

const templateSignalsExample = `// adapts to project setup automatically
export default {
  {{#if (eq packageManager "pnpm")}}
  packageManager: "pnpm",
  {{/if}}
  framework: "{{framework}}",
  language: "{{language}}",
};`;

export default function SignalsPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Building Generators</p>
        <h1 className="mb-3 text-3xl font-bold">Signals Reference</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Before any generator runs, xo scans the project and builds a flat key-value{" "}
          <strong>signal map</strong>. Signals describe what the project looks like — which files
          exist, which packages are installed, which framework is detected. Generators use signals
          to enforce compatibility and adapt their behavior.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How signal scanning works</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          xo's signal scanner is framework-agnostic. It scans well-known files and derives
          higher-level signals from them. Framework knowledge lives in generators through their{" "}
          <code>detects</code> rules — the engine stays dumb.
        </p>
        <p className="text-sm text-muted-foreground">
          A typical Next.js + TypeScript project signal map:
        </p>
        <CodeBlock code={signalExample} filename="signal map (computed at runtime)" lang="yaml" />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Signal categories</h2>

        <div className="space-y-2">
          <h3 className="font-semibold">
            <code>file:</code> prefix
          </h3>
          <p className="text-sm text-muted-foreground">
            <code>true</code> or <code>false</code> depending on whether the file exists in the project root.
            Checked files include: <code>package.json</code>, <code>tsconfig.json</code>,{" "}
            <code>pnpm-workspace.yaml</code>, <code>turbo.json</code>, <code>tailwind.config.ts/js</code>,{" "}
            <code>next.config.ts/js</code>, <code>vite.config.ts/js</code>, <code>vitest.config.ts</code>,{" "}
            <code>jest.config.ts/js</code>, <code>Dockerfile</code>, <code>docker-compose.yml/yaml</code>,{" "}
            <code>.env</code>, <code>.env.example</code>, <code>prisma/schema.prisma</code>,{" "}
            <code>prisma.config.ts</code>, <code>drizzle.config.ts</code>, and ESLint / Prettier config files.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">
            <code>pkg:</code> prefix
          </h3>
          <p className="text-sm text-muted-foreground">
            <code>true</code> for every package in <code>dependencies</code>,{" "}
            <code>devDependencies</code>, and <code>peerDependencies</code>.
          </p>
          <CodeBlock
            code={`- signal: "pkg:@nestjs/core"
  exists: true   # NestJS project
- signal: pkg:drizzle-orm
  exists: false  # NOT using Drizzle`}
            lang="yaml"
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">
            <code>script:</code> prefix
          </h3>
          <p className="text-sm text-muted-foreground">
            <code>true</code> for every script name defined in <code>package.json</code> <code>scripts</code>.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Derived signals</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {["Signal", "Type", "Possible values"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["framework", "string | undefined", "nextjs, nuxt, sveltekit, react, vue, svelte, nestjs, express, fastify"],
                  ["packageManager", "string", "pnpm, bun, yarn, npm"],
                  ["language", "string", "typescript, javascript"],
                  ["isMonorepo", "boolean", "true if pnpm-workspace.yaml or package.json workspaces present"],
                ].map(([s, t, v]) => (
                  <tr key={s} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{s}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Using signals in detects</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The <code>detects</code> array lets you declare which project types a generator is compatible
          with. All rules must pass — they are ANDed together.
        </p>
        <CodeBlock code={detectsExample} lang="yaml" />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Field", "Type", "Meaning"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["signal", "string", "The signal key to check (e.g. pkg:react, framework)"],
                ["exists", "boolean", "Signal must be truthy (true) or absent/falsy (false)"],
                ["equals", "string", "Signal value must exactly equal this string"],
                ["matches", "string", "Signal value must match this regex pattern"],
              ].map(([f, t, d]) => (
                <tr key={f} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{f}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout variant="warning" title="Generator blocked if detects fails">
          If any detect rule fails, xo refuses to run the generator with a clear error — it does not
          silently skip it.
        </Callout>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Using signals in prompts and actions</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Signals are merged into the context alongside prompt answers, so they're available in{" "}
          <code>when</code> (prompt conditions) and <code>if</code> (action conditions).
        </p>
        <p className="text-sm font-medium">In a prompt <code>when</code> field:</p>
        <CodeBlock code={promptWhenExample} lang="yaml" />
        <p className="mt-4 text-sm font-medium">In an action <code>if</code> field:</p>
        <CodeBlock code={actionIfExample} lang="yaml" />
        <Callout variant="info" title="Package signals in expressions">
          In <code>if</code> / <code>when</code> expressions, keys like <code>pkg:react</code> are
          not valid JS identifiers. Use <code>{"{ signal: 'pkg:react', exists: true }"}</code> in{" "}
          <code>detects</code> for package checks. For prompt/action conditions, use answers or
          derived signals like <code>framework</code> and <code>language</code> instead.
        </Callout>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Using signals in templates</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Signals are also available as Handlebars variables inside template files, letting content
          adapt to the project automatically.
        </p>
        <CodeBlock
          code={templateSignalsExample}
          filename="templates/xo.config.ts.hbs"
          lang="handlebars"
        />
      </section>
    </article>
  );
}
