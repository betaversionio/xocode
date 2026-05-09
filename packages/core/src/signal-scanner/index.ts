import path from "node:path";
import fs from "fs-extra";
import type { Signal } from "../types.js";

const COMMON_FILES = [
  "package.json",
  "tsconfig.json",
  "tsconfig.base.json",
  "pnpm-workspace.yaml",
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.cjs",
  "eslint.config.js",
  "eslint.config.mjs",
  "prettier.config.js",
  ".prettierrc",
  "tailwind.config.ts",
  "tailwind.config.js",
  "next.config.ts",
  "next.config.js",
  "vite.config.ts",
  "vite.config.js",
  "vitest.config.ts",
  "jest.config.ts",
  "jest.config.js",
  "turbo.json",
  "Dockerfile",
  ".env",
  ".env.example",
  "docker-compose.yml",
  "docker-compose.yaml",
  "prisma/schema.prisma",
  "prisma.config.ts",
  "drizzle.config.ts",
];

export async function scanSignals(cwd: string): Promise<Signal> {
  const signals: Signal = {};

  for (const file of COMMON_FILES) {
    signals[`file:${file}`] = await fs.pathExists(path.join(cwd, file));
  }

  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath).catch(() => ({}));
    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    for (const dep of Object.keys(allDeps)) {
      signals[`pkg:${dep}`] = true;
    }
    if (pkg.scripts) {
      for (const [scriptName] of Object.entries(pkg.scripts)) {
        signals[`script:${scriptName}`] = true;
      }
    }
    signals.isMonorepo = Boolean(pkg.workspaces || (await fs.pathExists(path.join(cwd, "pnpm-workspace.yaml"))));

    // Detect framework from deps
    if (allDeps["next"]) signals.framework = "nextjs";
    else if (allDeps["@nuxt/core"] || allDeps["nuxt"]) signals.framework = "nuxt";
    else if (allDeps["@sveltejs/kit"]) signals.framework = "sveltekit";
    else if (allDeps["react"]) signals.framework = "react";
    else if (allDeps["vue"]) signals.framework = "vue";
    else if (allDeps["svelte"]) signals.framework = "svelte";
    else if (allDeps["@nestjs/core"]) signals.framework = "nestjs";
    else if (allDeps["express"]) signals.framework = "express";
    else if (allDeps["fastify"]) signals.framework = "fastify";

    // Detect language
    if (allDeps["typescript"] || allDeps["ts-node"] || await fs.pathExists(path.join(cwd, "tsconfig.json"))) {
      signals.language = "typescript";
    } else {
      signals.language = "javascript";
    }
  }

  // Detect package manager
  if (await fs.pathExists(path.join(cwd, "pnpm-lock.yaml"))) {
    signals.packageManager = "pnpm";
  } else if (await fs.pathExists(path.join(cwd, "bun.lockb")) || await fs.pathExists(path.join(cwd, "bun.lock"))) {
    signals.packageManager = "bun";
  } else if (await fs.pathExists(path.join(cwd, "yarn.lock"))) {
    signals.packageManager = "yarn";
  } else {
    signals.packageManager = "npm";
  }

  return signals;
}
