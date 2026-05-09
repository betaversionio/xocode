import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TerminalBlock, CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Getting Started" };

export default function GettingStartedPage() {
  return (
    <article className="max-w-3xl space-y-10">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">Overview</p>
        <h1 className="mb-3 text-3xl font-bold">Getting Started</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          xo is a universal generator engine. Install it once, then use generators from GitHub to
          scaffold projects, add features, and automate repetitive setup — for any framework or language.
        </p>
      </div>

      {/* Install */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Install xo</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Install the <code>xocode</code> package globally. The binary is available as <code>xo</code>.
        </p>
        <TerminalBlock commands={["npm install -g xocode"]} />
        <p className="text-sm text-muted-foreground">Or with pnpm / yarn / bun:</p>
        <TerminalBlock commands={["pnpm add -g xocode", "yarn global add xocode", "bun add -g xocode"]} />
        <Callout variant="info">Requires Node.js 20 or higher.</Callout>
      </section>

      {/* Scaffold */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Scaffold a new project</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use <code>xo create</code> to bootstrap a new project from a template generator. Generators
          are identified by their GitHub path — <code>owner/repo</code> or <code>owner/repo/subpath</code>.
        </p>
        <TerminalBlock commands={["mkdir my-app && cd my-app", "xo create acme/nextjs-starter"]} />
        <p className="text-sm text-muted-foreground">xo will:</p>
        <ol className="ml-5 list-decimal space-y-1.5 text-sm text-muted-foreground">
          <li>Fetch <code>generator.json</code> from <code>https://github.com/acme/nextjs-starter</code></li>
          <li>Run any interactive prompts defined in the generator</li>
          <li>Execute all actions — copy files, render templates, run install commands</li>
          <li>Write <code>xo.config.json</code> to record the applied template</li>
        </ol>
      </section>

      {/* Add features */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Add features to an existing project</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <code>xo add</code> applies a feature generator to your existing project. Before running,
          xo validates compatibility via <code>detects</code>, <code>requires</code>, and <code>conflicts</code> rules.
        </p>
        <TerminalBlock
          commands={[
            "xo add acme/shadcn-setup",
            "xo add acme/auth-jwt",
            "xo add acme/docker",
          ]}
        />
      </section>

      {/* Dry run */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Preview before applying</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use <code>--dry-run</code> to see exactly what a generator would do without writing any files.
        </p>
        <TerminalBlock commands={["xo add acme/auth-jwt --dry-run"]} />
        <CodeBlock
          code={`[dry-run] template: templates/auth.service.ts.hbs → src/auth/auth.service.ts
[dry-run] template: templates/jwt.guard.ts.hbs → src/auth/jwt.guard.ts
[dry-run] json: package.json
[dry-run] command: pnpm install`}
          lang="output"
        />
      </section>

      {/* History and undo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. View history and undo</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          xo records every operation in <code>.xo/state.json</code>. Use <code>xo history</code> to list
          them and <code>xo undo</code> to revert the last one.
        </p>
        <TerminalBlock commands={["xo history"]} />
        <CodeBlock
          code={`Applied generators:

  a1b2c3d4  acme/nextjs-starter          5/4/2025, 10:32:00 AM
  e5f6a7b8  acme/shadcn-setup            5/4/2025, 10:45:12 AM
  c9d0e1f2  acme/auth-jwt               5/4/2025, 11:02:44 AM`}
          lang="output"
        />
        <TerminalBlock commands={["xo undo"]} />
        <CodeBlock code={`✓ Reverted "acme/auth-jwt" — 4 file(s) restored`} lang="output" />
        <Callout variant="tip" title="Commit your state files">
          Commit <code>.xo/state.json</code> and <code>xo.config.json</code> so your team shares the same generator history.
        </Callout>
      </section>

      {/* Local generators */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. Using local generators</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Run generators from a local path — useful during development or for private generators that live inside your repo.
        </p>
        <TerminalBlock
          commands={[
            "xo add ./generators/my-feature",
            "xo create ../shared-generators/api-template",
          ]}
        />
        <p className="text-sm text-muted-foreground">
          Generators stored in <code>.xo/generators/</code> inside your project are automatically
          discovered without any path prefix.
        </p>
      </section>

      {/* Next steps */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">What's next?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Create a generator", desc: "Build and publish your own generator.json", href: "/docs/creating-generators" },
            { title: "Actions reference", desc: "See all 11 action types with full examples", href: "/docs/actions" },
            { title: "Signals reference", desc: "Understand how xo introspects your project", href: "/docs/signals" },
            { title: "CLI reference", desc: "Full reference for all xo commands", href: "/docs/cli-reference" },
          ].map((item) => (
            <Card key={item.href} className="transition-shadow hover:shadow-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm group-hover:text-primary">
                  <Link href={item.href} className="hover:text-primary">
                    {item.title}
                  </Link>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <CardDescription className="text-xs">{item.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </article>
  );
}
