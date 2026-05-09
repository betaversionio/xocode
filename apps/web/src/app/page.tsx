'use client';

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  GitBranch,
  Layers,
  Zap,
  Terminal,
  RefreshCcw,
  Package,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TerminalBlock, CodeBlock } from "@/components/code-block";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const features = [
  {
    icon: GitBranch,
    title: "Declarative generators",
    desc: "Define everything as a generator.json manifest. No code required — just declare what to copy, render, inject, or merge.",
  },
  {
    icon: Zap,
    title: "Signal-based introspection",
    desc: "xo scans your project and builds a signal map — file presence, detected framework, package manager, dependencies. Generators adapt automatically.",
  },
  {
    icon: Layers,
    title: "Composable by design",
    desc: "Generators declare requires and conflicts. xo enforces the dependency graph so you never apply an incompatible generator.",
  },
  {
    icon: RefreshCcw,
    title: "Idempotent & undoable",
    desc: "Every operation is recorded with before-snapshots. Run xo undo to instantly revert any generator application.",
  },
  {
    icon: Package,
    title: "GitHub-native registry",
    desc: "Publish a generator by pushing generator.json to any GitHub repo. No registry account, no upload step — just a URL.",
  },
  {
    icon: Terminal,
    title: "Works everywhere",
    desc: "CLI, VS Code extension, or embedded as a TypeScript library via @xo/core.",
  },
];

const generatorExample = `{
  "name": "acme/react-component",
  "type": "feature",
  "requires": ["acme/react-setup"],
  "detects": [
    { "signal": "pkg:react", "exists": true }
  ],
  "prompts": [
    {
      "name": "componentName",
      "type": "input",
      "message": "Component name?"
    },
    {
      "name": "withTests",
      "type": "confirm",
      "message": "Add a test file?"
    }
  ],
  "actions": [
    {
      "type": "template",
      "source": "templates/component.tsx.hbs",
      "target": "src/components/{{pascalCase componentName}}/index.tsx"
    },
    {
      "type": "template",
      "source": "templates/test.tsx.hbs",
      "target": "src/components/{{pascalCase componentName}}/index.test.tsx",
      "if": "withTests"
    }
  ]
}`;

const faqs = [
  {
    q: "What makes xo different from Plop or Yeoman?",
    a: "xo uses a declarative JSON format instead of code, has first-class support for signal-based detection so generators self-configure, and maintains a full undo history. It also uses GitHub repos as a zero-friction registry.",
  },
  {
    q: "Do I need to create an account to publish a generator?",
    a: "No. A generator is just a generator.json file in any public GitHub repository. Anyone can run it with xo add <github-user>/<repo>.",
  },
  {
    q: "Can I use xo with any framework or language?",
    a: "Yes. xo is framework-agnostic. Generators work with any project structure — React, Vue, Next.js, NestJS, plain Node, Go, Python, or anything else.",
  },
  {
    q: "How does xo undo work?",
    a: "Before applying any action, xo captures a snapshot of every file it will touch. xo undo replays those snapshots in reverse, restoring the project to its exact previous state.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen w-full overflow-hidden bg-background">
        {/* Radial spotlight */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_55%)]" />
        </div>

        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground) / 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground) / 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "4rem 4rem",
          }}
        />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-lg backdrop-blur dark:bg-background/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Open source · MIT license
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center"
          >
            <h1 className="text-7xl font-black tracking-tighter text-primary sm:text-8xl md:text-9xl">
              xo
            </h1>
            <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              The git of code generation.
            </p>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl text-center text-lg text-muted-foreground md:text-xl"
          >
            A universal, declarative, composable generator engine. Scaffold projects,
            add features, and automate repetitive setup — for any framework, any language.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="h-12 gap-2 rounded-lg bg-foreground px-8 text-sm font-medium text-background shadow-2xl transition-all hover:-translate-y-[1px] hover:bg-foreground/90"
              asChild
            >
              <Link href="/docs/getting-started">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-lg border-border/60 px-8 text-sm font-medium transition-all hover:bg-muted/50"
              asChild
            >
              <Link href="/docs/creating-generators">Build a generator</Link>
            </Button>
          </motion.div>

          {/* Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 w-full max-w-lg"
          >
            <TerminalBlock
              commands={["npm install -g xocode", "xo create acme/nextjs-starter", "xo add acme/auth-jwt"]}
              className="text-left"
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center"
          >
            {[
              { value: "JSON", label: "No code required" },
              { value: "GitHub", label: "Native registry" },
              { value: "∞", label: "Frameworks supported" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-primary">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            className="mx-auto mb-16 max-w-lg text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p
              variants={fadeUp}
              className="mb-3 text-[13px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              Why xo?
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Everything a generator engine should be
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <Card className="shadow-glass h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="leading-relaxed">{f.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CODE EXAMPLE ═══ */}
      <section className="border-t border-border/40 bg-muted/10 py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <motion.div
              className="space-y-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <motion.div variants={fadeUp}>
                <p className="mb-2 text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
                  Simple by design
                </p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  A generator is just a JSON file
                </h2>
              </motion.div>
              <motion.p variants={fadeUp} className="leading-relaxed text-muted-foreground">
                Drop a <code>generator.json</code> in any GitHub repo and anyone can
                run it with <code>xo add</code>. No registry account needed.
              </motion.p>
              <motion.div
                className="mx-auto grid max-w-3xl gap-3"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
              >
                {[
                  "Declare prompts to collect user input",
                  "Handlebars templates for dynamic filenames and content",
                  "detects rules so generators only run in compatible projects",
                  "requires and conflicts for safe composition",
                  "Every operation is reversible with xo undo",
                ].map((point) => (
                  <motion.div
                    key={point}
                    variants={fadeUp}
                    className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card p-3 transition-colors hover:border-border/80 hover:bg-muted/30"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40 transition-colors group-hover:text-foreground" />
                    <span className="text-sm leading-relaxed">{point}</span>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp}>
                <Button asChild variant="link" className="h-auto p-0 text-primary">
                  <Link href="/docs/creating-generators">
                    Learn to build generators <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease }}
            >
              <CodeBlock code={generatorExample} filename="generator.json" lang="json" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            className="mb-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p
              variants={fadeUp}
              className="mb-3 text-[13px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              FAQ
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Common questions
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden border-t border-border/40">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground) / 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground) / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "3rem 3rem",
          }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[100px]" />
        </div>

        <motion.div
          className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center md:py-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={fadeUp} className="mb-3 text-sm font-medium text-muted-foreground">
            Ready?
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Build your first generator.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 max-w-sm text-muted-foreground">
            Follow the guide and have a working generator running in under 10 minutes.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex gap-3">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-lg bg-foreground px-8 text-sm font-medium text-background shadow-2xl transition-all hover:-translate-y-[1px] hover:bg-foreground/90"
              asChild
            >
              <Link href="/docs/getting-started">
                Read the docs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <footer className="border-t border-border/40 px-4 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-muted-foreground">
          <span>© 2025 xo. MIT License.</span>
          <span>Built with Next.js</span>
        </div>
      </footer>
    </div>
  );
}
