import { prisma } from "../src/index";
import { createHash } from "crypto";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hash(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const users = [
  {
    email: "admin@xo.dev",
    name: "xo team",
    githubUrl: "https://github.com/xo-dev",
    password: hash("Admin1234!"),
  },
  {
    email: "alice@example.com",
    name: "Alice Chen",
    githubUrl: "https://github.com/alice-chen",
    password: hash("Alice1234!"),
  },
  {
    email: "bob@example.com",
    name: "Bob Martinez",
    githubUrl: "https://github.com/bob-martinez",
    password: hash("Bob12345!"),
  },
  {
    email: "carol@example.com",
    name: "Carol Kim",
    githubUrl: "https://github.com/carol-kim",
    password: hash("Carol123!"),
  },
  {
    email: "dave@example.com",
    name: "Dave Singh",
    githubUrl: "https://github.com/dave-singh",
    password: hash("Dave1234!"),
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding database...\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const createdUsers: Record<string, string> = {};

  for (const u of users) {
    const record = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, githubUrl: u.githubUrl },
      create: u,
    });
    createdUsers[u.email] = record.id;
    console.log(`  ✓ user  ${u.email}`);
  }

  const xo    = createdUsers["admin@xo.dev"]!;
  const alice = createdUsers["alice@example.com"]!;
  const bob   = createdUsers["bob@example.com"]!;
  const carol = createdUsers["carol@example.com"]!;
  const dave  = createdUsers["dave@example.com"]!;

  // ── Generators ─────────────────────────────────────────────────────────────
  const generators = [
    // ── Project scaffolds ───────────────────────────────────────────────────
    {
      name: "xo-team/nextjs-starter",
      type: "Project" as const,
      githubUrl: "https://github.com/xo-dev/generator-nextjs-starter",
      description: "Next.js 15 starter with App Router, Tailwind CSS v4, shadcn/ui, React Hook Form, and Zod validation.",
      tags: ["nextjs", "react", "tailwind", "typescript", "shadcn"],
      downloads: 4821,
      authorId: xo,
    },
    {
      name: "xo-team/nest-api",
      type: "Project" as const,
      githubUrl: "https://github.com/xo-dev/generator-nest-api",
      description: "Production-ready NestJS REST API with Prisma, PostgreSQL, JWT auth, Swagger, and Zod validation.",
      tags: ["nestjs", "typescript", "postgresql", "swagger", "prisma"],
      downloads: 3104,
      authorId: xo,
    },
    {
      name: "xo-team/t3-stack",
      type: "Project" as const,
      githubUrl: "https://github.com/xo-dev/generator-t3-stack",
      description: "Full T3 Stack — Next.js, tRPC, Prisma, NextAuth, and Tailwind CSS, all wired up and ready to go.",
      tags: ["nextjs", "trpc", "prisma", "nextauth", "tailwind"],
      downloads: 2956,
      authorId: xo,
    },
    {
      name: "xo-team/turborepo",
      type: "Project" as const,
      githubUrl: "https://github.com/xo-dev/generator-turborepo",
      description: "Turborepo monorepo with shared TypeScript config, ESLint, a Next.js web app, and a NestJS API.",
      tags: ["monorepo", "turborepo", "typescript", "nextjs", "nestjs"],
      downloads: 1873,
      authorId: xo,
    },
    {
      name: "alice/remix-starter",
      type: "Project" as const,
      githubUrl: "https://github.com/alice-chen/generator-remix-starter",
      description: "Remix starter with Vite, Tailwind CSS, and a pre-configured root layout, error boundary, and loader pattern.",
      tags: ["remix", "react", "vite", "tailwind", "typescript"],
      downloads: 1245,
      authorId: alice,
    },
    {
      name: "bob/fastify-api",
      type: "Project" as const,
      githubUrl: "https://github.com/bob-martinez/generator-fastify-api",
      description: "Fastify REST API with TypeScript, Prisma, Zod schemas, JWT authentication, and OpenAPI plugin.",
      tags: ["fastify", "nodejs", "typescript", "prisma", "openapi"],
      downloads: 987,
      authorId: bob,
    },
    {
      name: "carol/vite-react",
      type: "Project" as const,
      githubUrl: "https://github.com/carol-kim/generator-vite-react",
      description: "Vite + React 19 starter with TypeScript, Tailwind, React Query, Zustand, and react-router-dom.",
      tags: ["vite", "react", "typescript", "tailwind", "zustand"],
      downloads: 2341,
      authorId: carol,
    },
    {
      name: "dave/docker-node",
      type: "Project" as const,
      githubUrl: "https://github.com/dave-singh/generator-docker-node",
      description: "Dockerized Node.js app with multi-stage build, docker-compose for local dev, and GitHub Actions CI.",
      tags: ["docker", "nodejs", "devops", "ci", "github-actions"],
      downloads: 762,
      authorId: dave,
    },
    {
      name: "alice/astro-blog",
      type: "Project" as const,
      githubUrl: "https://github.com/alice-chen/generator-astro-blog",
      description: "Astro blog starter with MDX, Tailwind typography, RSS feed, sitemap, and dark mode support.",
      tags: ["astro", "mdx", "tailwind", "blog", "typescript"],
      downloads: 534,
      authorId: alice,
    },
    {
      name: "dave/k8s-app",
      type: "Project" as const,
      githubUrl: "https://github.com/dave-singh/generator-k8s-app",
      description: "Kubernetes-ready Node.js service with Helm chart, health endpoints, Prometheus metrics, and Dockerfile.",
      tags: ["kubernetes", "helm", "docker", "devops", "nodejs"],
      downloads: 418,
      authorId: dave,
    },

    // ── Feature generators ──────────────────────────────────────────────────
    {
      name: "xo-team/shadcn-setup",
      type: "Feature" as const,
      githubUrl: "https://github.com/xo-dev/generator-shadcn-setup",
      description: "Adds shadcn/ui to any React project: installs dependencies, writes globals.css, and scaffolds Button, Card, and Dialog.",
      tags: ["shadcn", "tailwind", "radix", "ui", "react"],
      downloads: 5302,
      authorId: xo,
    },
    {
      name: "xo-team/auth-jwt",
      type: "Feature" as const,
      githubUrl: "https://github.com/xo-dev/generator-auth-jwt",
      description: "Adds JWT authentication: register/login endpoints, guard middleware, hashed passwords, and typed request context.",
      tags: ["auth", "jwt", "security", "nestjs", "typescript"],
      downloads: 3891,
      authorId: xo,
    },
    {
      name: "xo-team/prisma-setup",
      type: "Feature" as const,
      githubUrl: "https://github.com/xo-dev/generator-prisma-setup",
      description: "Adds Prisma with PostgreSQL: installs packages, writes schema.prisma, creates a db client singleton, and adds seed script.",
      tags: ["prisma", "postgresql", "orm", "typescript", "database"],
      downloads: 3244,
      authorId: xo,
    },
    {
      name: "xo-team/i18n",
      type: "Feature" as const,
      githubUrl: "https://github.com/xo-dev/generator-i18n",
      description: "Adds next-intl internationalisation: middleware, locale routing, message files for en/fr/es, and a useTranslations hook.",
      tags: ["i18n", "localization", "nextjs", "next-intl"],
      downloads: 1102,
      authorId: xo,
    },
    {
      name: "alice/stripe-integration",
      type: "Feature" as const,
      githubUrl: "https://github.com/alice-chen/generator-stripe-integration",
      description: "Wires up Stripe: checkout session, webhook handler, subscription status helpers, and a /billing route.",
      tags: ["stripe", "payments", "billing", "nextjs", "typescript"],
      downloads: 2178,
      authorId: alice,
    },
    {
      name: "alice/sentry-setup",
      type: "Feature" as const,
      githubUrl: "https://github.com/alice-chen/generator-sentry-setup",
      description: "Integrates Sentry error tracking: DSN config, Next.js instrumentation hooks, and a sample error boundary.",
      tags: ["sentry", "monitoring", "error-tracking", "nextjs"],
      downloads: 1456,
      authorId: alice,
    },
    {
      name: "bob/redis-cache",
      type: "Feature" as const,
      githubUrl: "https://github.com/bob-martinez/generator-redis-cache",
      description: "Adds Redis caching via ioredis: cache service with get/set/del helpers and decorators for controller-level caching.",
      tags: ["redis", "cache", "performance", "nestjs", "typescript"],
      downloads: 1893,
      authorId: bob,
    },
    {
      name: "bob/bull-queues",
      type: "Feature" as const,
      githubUrl: "https://github.com/bob-martinez/generator-bull-queues",
      description: "Adds BullMQ job queues to NestJS: queue module, example processor, retry logic, and Bull Board dashboard.",
      tags: ["bullmq", "queues", "background-jobs", "nestjs", "redis"],
      downloads: 1231,
      authorId: bob,
    },
    {
      name: "carol/storybook",
      type: "Feature" as const,
      githubUrl: "https://github.com/carol-kim/generator-storybook",
      description: "Adds Storybook 8 with Vite builder, Tailwind addon, dark mode decorator, and example stories for Button and Card.",
      tags: ["storybook", "testing", "ui", "react", "vite"],
      downloads: 876,
      authorId: carol,
    },
    {
      name: "carol/react-query",
      type: "Feature" as const,
      githubUrl: "https://github.com/carol-kim/generator-react-query",
      description: "Adds TanStack Query v5: QueryClient provider, devtools, a typed fetcher utility, and example useQuery/useMutation hooks.",
      tags: ["tanstack", "react-query", "data-fetching", "react", "typescript"],
      downloads: 2654,
      authorId: carol,
    },
    {
      name: "dave/github-actions",
      type: "Feature" as const,
      githubUrl: "https://github.com/dave-singh/generator-github-actions",
      description: "Adds GitHub Actions CI: lint, type-check, test, and build jobs with caching and automatic PR comments on failure.",
      tags: ["ci", "github-actions", "devops", "testing"],
      downloads: 1987,
      authorId: dave,
    },
    {
      name: "dave/docker-compose",
      type: "Feature" as const,
      githubUrl: "https://github.com/dave-singh/generator-docker-compose",
      description: "Adds a docker-compose.yml with app, PostgreSQL, Redis, and pgAdmin services pre-configured for local development.",
      tags: ["docker", "docker-compose", "devops", "postgresql", "redis"],
      downloads: 2103,
      authorId: dave,
    },
    {
      name: "alice/uploadthing",
      type: "Feature" as const,
      githubUrl: "https://github.com/alice-chen/generator-uploadthing",
      description: "Adds UploadThing file uploads to Next.js: API route, UploadButton component, and server-side upload handler.",
      tags: ["uploads", "nextjs", "storage", "typescript"],
      downloads: 743,
      authorId: alice,
    },
    {
      name: "bob/rate-limiting",
      type: "Feature" as const,
      githubUrl: "https://github.com/bob-martinez/generator-rate-limiting",
      description: "Adds NestJS rate limiting via @nestjs/throttler with Redis store: per-route and global limits, customisable config.",
      tags: ["rate-limiting", "security", "nestjs", "redis"],
      downloads: 891,
      authorId: bob,
    },
  ];

  for (const g of generators) {
    await prisma.generator.upsert({
      where: { name: g.name },
      update: {
        description: g.description,
        tags: g.tags,
        downloads: g.downloads,
      },
      create: g,
    });
    console.log(`  ✓ generator  ${g.name}  (${g.type})`);
  }

  console.log(`\n✅  Seeded ${users.length} users and ${generators.length} generators.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
