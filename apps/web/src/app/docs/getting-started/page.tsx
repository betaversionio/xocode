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
          xo is a universal workflow engine for developers. Install it once, then run generators from
          any GitHub repo to scaffold projects, add features, and automate repetitive setup — for any
          framework or language.
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
          Use <code>xo create</code> to bootstrap a new project from a generator. Reference any
          public GitHub repo directly with the <code>@github/</code> prefix — no registration needed.
        </p>
        <TerminalBlock commands={[
          "mkdir my-app && cd my-app",
          "xo create @github/my-org/xo-next-app",
        ]} />
        <p className="text-sm text-muted-foreground">xo will:</p>
        <ol className="ml-5 list-decimal space-y-1.5 text-sm text-muted-foreground">
          <li>Fetch <code>workflow.yaml</code> from the GitHub repo (cached locally)</li>
          <li>Run any interactive prompts defined under <code>inputs:</code></li>
          <li>Execute all jobs and steps — copy files, render templates, run commands</li>
          <li>Write <code>xo.config.yaml</code> to record the applied template</li>
        </ol>
      </section>

      {/* Add features */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Add features to an existing project</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <code>xo add</code> applies a generator's <em>add</em> workflow to your project. Before
          running, xo validates compatibility via <code>detects</code>, <code>requires</code>, and{" "}
          <code>conflicts</code> rules declared in the generator.
        </p>
        <TerminalBlock commands={[
          "xo add @github/my-org/xo-stripe",
          "xo add @github/my-org/xo-ui/button",
          "xo add @github/my-org/xo-ui/button@v1.2.0",
        ]} />
        <p className="text-sm text-muted-foreground">
          Pin to a tag (<code>@v1.2.0</code>) for a stable, cached-forever version. Use a branch
          suffix (<code>#main</code>) to always pull latest.
        </p>
      </section>

      {/* Pre-fill inputs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Pre-fill inputs</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pass <code>-i key=value</code> to skip specific prompts. Useful for scripting or CI.
        </p>
        <TerminalBlock commands={[
          "xo add @github/my-org/xo-stripe -i secretKey=sk_test_abc",
          "xo create @github/my-org/xo-flutter -i appName='My App' -i projectName=my_app",
        ]} />
      </section>

      {/* Dry run */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Preview before applying</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use <code>--dry-run</code> to see exactly what a generator would do without writing any
          files or running any commands.
        </p>
        <TerminalBlock commands={["xo add @github/my-org/xo-stripe --dry-run"]} />
        <CodeBlock
          code={`Running workflow: @github/my-org/xo-stripe

  job: detect
    ✔ xo/detect-pm → pnpm
    ✔ xo/pkg-installed(next) → true (^14.0.0)
  job: install
    [dry-run] install-pkg: pnpm add stripe
    [dry-run] env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  job: configure
    [dry-run] copy: templates/stripe-route.ts → app/api/stripe/route.ts
    [dry-run] run: pnpm db:push

Dry run — no files were written.`}
          lang="output"
        />
      </section>

      {/* History and undo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. View history and undo</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          xo records every operation in <code>.xo/state.json</code>. Use <code>xo history</code> to
          list them and <code>xo undo</code> to revert the last one.
        </p>
        <TerminalBlock commands={["xo history"]} />
        <CodeBlock
          code={`Applied generators:

  a1b2c3d4  @github/my-org/xo-next-app   create   5/4/2025, 10:32:00 AM
  e5f6a7b8  @github/my-org/xo-stripe     add      5/4/2025, 10:45:12 AM`}
          lang="output"
        />
        <TerminalBlock commands={["xo undo"]} />
        <Callout variant="tip">
          Commit <code>.xo/state.json</code> and <code>xo.config.yaml</code> so your team shares
          the same generator history and can undo operations consistently.
        </Callout>
      </section>

      {/* Build generators */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7. Build your own generator</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A generator is a GitHub repo with a <code>workflow.yaml</code> file, templates, and
          optional custom actions. Use <code>xo link</code> to test it locally from any project
          — no publishing required.
        </p>
        <TerminalBlock commands={[
          "cd ~/projects/xo-my-generator",
          "xo link                  # register by name from workflow.yaml",
        ]} />
        <TerminalBlock commands={[
          "cd ~/my-app",
          "xo add my-generator      # resolves to ~/projects/xo-my-generator",
        ]} />
        <p className="text-sm text-muted-foreground">
          Push to GitHub and share with the <code>@github/owner/repo</code> reference — no registry
          account needed.
        </p>
      </section>

      {/* Next steps */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">What's next?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Create a generator", desc: "Build your own workflow.yaml with inputs, jobs, and steps", href: "/docs/creating-generators" },
            { title: "Actions reference", desc: "All built-in xo/* actions with full examples", href: "/docs/actions" },
            { title: "CLI reference", desc: "Full reference for xo create, add, link, cache, and more", href: "/docs/cli-reference" },
            { title: "Signals reference", desc: "How xo detects your project's framework and language", href: "/docs/signals" },
          ].map((item) => (
            <Card key={item.href} className="transition-shadow hover:shadow-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm">
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
