import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { execSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import prompts from "prompts";
import {
  readGlobalConfig,
  getConfigValue,
  setConfigValue,
  CONFIG_META,
} from "./global-config.js";
import {
  runWorkflow,
  undoLastOperation,
  listOperations,
  getLastOperation,
  addToRegistry,
  removeFromRegistry,
  listRegistry,
  linkGenerator,
  unlinkGenerator,
  listLinked,
} from "@xo/core";

const program = new Command();

declare const __PKG_VERSION__: string;

program
  .name("xo")
  .description("Local workflow engine for developers — compose actions into workflows")
  .version(__PKG_VERSION__)
  .showHelpAfterError("(add --help for additional information)")
  .showSuggestionAfterError(true);

function parseInputFlags(flags: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const flag of flags) {
    const eq = flag.indexOf("=");
    if (eq === -1) {
      result[flag] = true;
    } else {
      result[flag.slice(0, eq)] = flag.slice(eq + 1);
    }
  }
  return result;
}

// ─── xo create ───────────────────────────────────────────────────────────────

program
  .command("create <template>")
  .description("Scaffold a new project by running a generator's create workflow")
  .option("--dry-run", "Preview all actions without writing files or running commands")
  .option("--local", "Load workflow from a local path instead of the registry")
  .option("--dir <path>", "Target directory (default: current directory)")
  .option("-i, --input <key=value>", "Pre-fill a workflow input (repeatable)", collect, [])
  .action(async (template: string, opts: { dryRun?: boolean; local?: boolean; dir?: string; input: string[] }) => {
    const cwd = opts.dir ?? process.cwd();
    const inputs = parseInputFlags(opts.input);

    try {
      console.log(chalk.bold(`\nRunning workflow: ${chalk.cyan(template)}\n`));
      const result = await runWorkflow(template, cwd, {
        dryRun: opts.dryRun,
        local: opts.local,
        trigger: "create",
        inputs,
      });
      if (opts.dryRun) {
        console.log(chalk.yellow("\nDry run — no files were written."));
      } else {
        console.log(chalk.green(`\n✔ ${chalk.bold(result.workflow.name ?? template)} created successfully`));
        console.log(chalk.dim(`  Operation ID: ${result.operationId}`));
        console.log(chalk.dim(`  Run ${chalk.white("xo undo")} to revert.`));
      }
    } catch (err) {
      console.error(chalk.red(`\n✖ ${(err as Error).message}`));
      process.exit(1);
    }
  });

// ─── xo add ──────────────────────────────────────────────────────────────────

program
  .command("add <feature>")
  .description("Add a feature to an existing project by running its add workflow")
  .option("--dry-run", "Preview all actions without writing files or running commands")
  .option("--local", "Load workflow from a local path instead of the registry")
  .option("-i, --input <key=value>", "Pre-fill a workflow input (repeatable)", collect, [])
  .action(async (feature: string, opts: { dryRun?: boolean; local?: boolean; input: string[] }) => {
    const cwd = process.cwd();
    const inputs = parseInputFlags(opts.input);

    try {
      console.log(chalk.bold(`\nRunning workflow: ${chalk.cyan(feature)}\n`));
      const result = await runWorkflow(feature, cwd, {
        dryRun: opts.dryRun,
        local: opts.local,
        trigger: "add",
        inputs,
      });
      if (opts.dryRun) {
        console.log(chalk.yellow("\nDry run — no files were written."));
      } else {
        console.log(chalk.green(`\n✔ ${chalk.bold(result.workflow.name ?? feature)} added successfully`));
        console.log(chalk.dim(`  Operation ID: ${result.operationId}`));
        console.log(chalk.dim(`  Run ${chalk.white("xo undo")} to revert.`));
      }
    } catch (err) {
      console.error(chalk.red(`\n✖ ${(err as Error).message}`));
      process.exit(1);
    }
  });

// ─── xo run ──────────────────────────────────────────────────────────────────

program
  .command("run <task>")
  .description("Run a named task workflow")
  .option("--dry-run", "Preview all actions without writing files or running commands")
  .option("--local", "Load workflow from a local path instead of the registry")
  .option("-i, --input <key=value>", "Pre-fill a workflow input (repeatable)", collect, [])
  .action(async (task: string, opts: { dryRun?: boolean; local?: boolean; input: string[] }) => {
    const cwd = process.cwd();
    const inputs = parseInputFlags(opts.input);

    try {
      console.log(chalk.bold(`\nRunning workflow: ${chalk.cyan(task)}\n`));
      const result = await runWorkflow(task, cwd, {
        dryRun: opts.dryRun,
        local: opts.local,
        trigger: "run",
        inputs,
      });
      if (opts.dryRun) {
        console.log(chalk.yellow("\nDry run — no files were written."));
      } else {
        console.log(chalk.green(`\n✔ ${chalk.bold(result.workflow.name ?? task)} completed`));
      }
    } catch (err) {
      console.error(chalk.red(`\n✖ ${(err as Error).message}`));
      process.exit(1);
    }
  });

// ─── xo undo ─────────────────────────────────────────────────────────────────

program
  .command("undo")
  .description("Revert the last xo operation")
  .action(async () => {
    const cwd = process.cwd();
    const last = await getLastOperation(cwd);
    if (!last) { console.log(chalk.yellow("Nothing to undo.")); return; }

    const spinner = ora(`Undoing "${last.generator}" (${last.id.slice(0, 8)})...`).start();
    try {
      const op = await undoLastOperation(cwd);
      if (op) {
        spinner.succeed(chalk.green(`Reverted "${op.generator}" — ${op.files.length} file(s) restored`));
      } else {
        spinner.warn(chalk.yellow("Nothing to undo."));
      }
    } catch (err) {
      spinner.fail(chalk.red(`Undo failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// ─── xo history ──────────────────────────────────────────────────────────────

program
  .command("history")
  .description("List all workflows applied in this project")
  .action(async () => {
    const cwd = process.cwd();
    const ops = await listOperations(cwd);
    if (ops.length === 0) {
      console.log(chalk.dim("No workflows have been applied in this project."));
      return;
    }
    console.log(chalk.bold("\nApplied workflows:\n"));
    for (const op of ops) {
      const date = new Date(op.timestamp).toLocaleString();
      console.log(
        `  ${chalk.cyan(op.id.slice(0, 8))}  ${chalk.dim(`[${op.type}]`)} ${chalk.white(op.generator.padEnd(36))}  ${chalk.dim(date)}`,
      );
    }
    console.log();
  });

// ─── xo link ─────────────────────────────────────────────────────────────────

program
  .command("link [name]")
  .description(
    "Link a local generator repo so it can be used by name without publishing.\n" +
    "Run inside the generator directory. Name is read from workflow.yaml if omitted.",
  )
  .action(async (name?: string) => {
    const cwd = process.cwd();
    try {
      const resolved = await linkGenerator(cwd, name);
      console.log(chalk.green(`✔ Linked ${chalk.bold(resolved)} → ${cwd}`));
      console.log(chalk.dim(`  Now run ${chalk.white(`xo add ${resolved}`)} from any project.`));
    } catch (err) {
      console.error(chalk.red(`✖ ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("unlink [name]")
  .description("Remove a linked local generator.")
  .action(async (name?: string) => {
    const cwd = process.cwd();
    try {
      const removed = await unlinkGenerator(cwd, name);
      if (removed) {
        console.log(chalk.green(`✔ Unlinked ${chalk.bold(removed)}`));
      } else {
        console.log(chalk.yellow(`No linked generator found for this directory.`));
      }
    } catch (err) {
      console.error(chalk.red(`✖ ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("links")
  .description("List all locally linked generators.")
  .action(async () => {
    const entries = await listLinked();
    if (entries.length === 0) {
      console.log(chalk.dim("No generators linked. Run xo link inside a generator directory."));
      return;
    }
    console.log(chalk.bold("\nLinked generators:\n"));
    for (const entry of entries) {
      const date = new Date(entry.linkedAt).toLocaleDateString();
      console.log(
        `  ${chalk.cyan(entry.name.padEnd(30))}  ${chalk.dim(entry.dir)}  ${chalk.dim(date)}`,
      );
    }
    console.log();
  });

// ─── xo registry ─────────────────────────────────────────────────────────────

const registry = program.command("registry").description("Manage the xo generator registry");

registry
  .command("add <name>")
  .description("Register a generator from a GitHub URL")
  .requiredOption("--url <url>", "GitHub URL of the generator repository")
  .option("--path <subpath>", "Subpath within the repo (for multi-workflow repos)")
  .action(async (name: string, opts: { url: string; path?: string }) => {
    const spinner = ora(`Registering ${chalk.cyan(name)}...`).start();
    try {
      await addToRegistry(name, opts.url, opts.path);
      const pathSuffix = opts.path ? chalk.dim(` (path: ${opts.path})`) : "";
      spinner.succeed(chalk.green(`Registered "${name}" → ${opts.url}${pathSuffix}`));
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });

registry
  .command("remove <name>")
  .description("Remove a generator from the registry")
  .action(async (name: string) => {
    const removed = await removeFromRegistry(name);
    if (removed) {
      console.log(chalk.green(`Removed "${name}" from registry.`));
    } else {
      console.log(chalk.yellow(`"${name}" was not in the registry.`));
    }
  });

registry
  .command("list")
  .description("List all registered generators")
  .action(async () => {
    const entries = await listRegistry();
    if (entries.length === 0) {
      console.log(chalk.dim("No generators registered. Use: xo registry add <name> --url <url>"));
      return;
    }
    console.log(chalk.bold("\nRegistered generators:\n"));
    for (const entry of entries) {
      const date = new Date(entry.addedAt).toLocaleDateString();
      const pathSuffix = entry.path ? chalk.dim(` [${entry.path}]`) : "";
      console.log(
        `  ${chalk.cyan(entry.name.padEnd(30))}${pathSuffix}  ${chalk.dim(entry.url)}  ${chalk.dim(date)}`,
      );
    }
    console.log();
  });

// ─── xo init ─────────────────────────────────────────────────────────────────

program
  .command("init [dir]")
  .description("Scaffold a new generator repo (workflow.yaml, templates/, actions/)")
  .action(async (dir?: string) => {
    const targetDir = path.resolve(dir ?? process.cwd());

    console.log(chalk.bold("\nInitializing new xo generator\n"));

    const answers = await prompts([
      {
        type: "text",
        name: "name",
        message: "Generator name (e.g. ui/button or payment/stripe)?",
        validate: (v: string) => v.trim().length > 0 ? true : "Name is required",
      },
      {
        type: "text",
        name: "description",
        message: "Short description?",
      },
      {
        type: "multiselect",
        name: "triggers",
        message: "Which triggers does this generator handle?",
        choices: [
          { title: "add", value: "add", selected: true },
          { title: "create", value: "create" },
          { title: "run", value: "run" },
        ],
        min: 1,
      },
    ], { onCancel: () => process.exit(0) });

    const { name, description, triggers } = answers as {
      name: string;
      description: string;
      triggers: string[];
    };

    const triggersYaml = `[${triggers.join(", ")}]`;
    const hasMultipleTriggers = triggers.length > 1;

    await fs.ensureDir(targetDir);
    await fs.ensureDir(path.join(targetDir, "templates"));
    await fs.ensureDir(path.join(targetDir, "actions"));

    if (hasMultipleTriggers) {
      await fs.ensureDir(path.join(targetDir, "workflows"));
      for (const trigger of triggers) {
        await fs.writeFile(
          path.join(targetDir, "workflows", `${trigger}.yaml`),
          buildWorkflowYaml(name, `[${trigger}]`, description),
          "utf8",
        );
      }
    } else {
      await fs.writeFile(
        path.join(targetDir, "workflow.yaml"),
        buildWorkflowYaml(name, triggersYaml, description),
        "utf8",
      );
    }

    await fs.writeFile(
      path.join(targetDir, "README.md"),
      buildReadme(name, description, triggers),
      "utf8",
    );

    console.log(chalk.green(`\n✔ Generator scaffolded at ${chalk.bold(targetDir)}\n`));
    console.log(chalk.dim("  Files created:"));
    if (hasMultipleTriggers) {
      for (const t of triggers) console.log(chalk.dim(`    workflows/${t}.yaml`));
    } else {
      console.log(chalk.dim("    workflow.yaml"));
    }
    console.log(chalk.dim("    templates/"));
    console.log(chalk.dim("    actions/"));
    console.log(chalk.dim("    README.md"));
    console.log();
    console.log(chalk.dim(`  Next steps:`));
    console.log(chalk.dim(`    1. Add your templates to ${chalk.white("templates/")}`));
    console.log(chalk.dim(`    2. Fill in the jobs in ${chalk.white(hasMultipleTriggers ? "workflows/*.yaml" : "workflow.yaml")}`));
    console.log(chalk.dim(`    3. Run ${chalk.white("xo link")} to test locally`));
    console.log();
  });

// ─── xo cache ────────────────────────────────────────────────────────────────

const cache = program.command("cache").description("Manage the local xo cache");

cache
  .command("clear [owner]")
  .description("Clear cached GitHub workflows. Optionally scope to a specific owner (e.g. betaversionio).")
  .action(async (owner?: string) => {
    const cacheDir = owner
      ? path.join(os.homedir(), ".xo", "cache", "github", owner)
      : path.join(os.homedir(), ".xo", "cache", "github");

    if (!(await fs.pathExists(cacheDir))) {
      console.log(chalk.dim("Cache is already empty."));
      return;
    }

    await fs.remove(cacheDir);
    const label = owner ? chalk.cyan(`@github/${owner}`) : "all GitHub workflows";
    console.log(chalk.green(`✔ Cleared cache for ${label}`));
  });

cache
  .command("list")
  .description("Show what is currently cached.")
  .action(async () => {
    const cacheDir = path.join(os.homedir(), ".xo", "cache", "github");
    if (!(await fs.pathExists(cacheDir))) {
      console.log(chalk.dim("Cache is empty."));
      return;
    }

    const owners = await fs.readdir(cacheDir);
    if (owners.length === 0) {
      console.log(chalk.dim("Cache is empty."));
      return;
    }

    console.log(chalk.bold("\nCached GitHub workflows:\n"));
    for (const owner of owners) {
      const ownerDir = path.join(cacheDir, owner);
      const repos = await fs.readdir(ownerDir).catch(() => [] as string[]);
      for (const repo of repos) {
        const repoDir = path.join(ownerDir, repo);
        const refs = await fs.readdir(repoDir).catch(() => [] as string[]);
        for (const ref of refs) {
          const rawbasePath = path.join(repoDir, ref, ".rawbase");
          const base = (await fs.pathExists(rawbasePath))
            ? (await fs.readFile(rawbasePath, "utf8")).trim()
            : `github.com/${owner}/${repo}@${ref}`;
          console.log(`  ${chalk.cyan(`@github/${owner}/${repo}`)}  ${chalk.dim(base)}`);
        }
      }
    }
    console.log();
  });

// ─── xo self-update ──────────────────────────────────────────────────────────

program
  .command("self-update")
  .description("Check for a newer version of xo and update if available")
  .action(async () => {
    const PACKAGE = "@xo-code/cli";
    const current = program.version() ?? "0.0.0";
    const spinner = ora("Checking for updates...").start();

    try {
      const res = await fetch(`https://registry.npmjs.org/${PACKAGE}/latest`);
      if (!res.ok) throw new Error(`Registry returned ${res.status}`);
      const { version: latest } = await res.json() as { version: string };

      if (latest === current) {
        spinner.succeed(chalk.green(`Already on the latest version (${current})`));
        return;
      }

      if (!isNewer(latest, current)) {
        spinner.succeed(chalk.green(`Already on the latest version (${current})`));
        return;
      }

      spinner.text = `Updating ${current} → ${chalk.green(latest)}...`;
      execSync(`npm install -g ${PACKAGE}@${latest}`, { stdio: "inherit" });
      spinner.succeed(chalk.green(`Updated to ${latest} — run xo --version to confirm`));
    } catch (err) {
      spinner.fail(chalk.red(`Update failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// ─── xo config ───────────────────────────────────────────────────────────────

const config = program.command("config").description("Get and set global xo configuration");

config
  .command("get <key>")
  .description("Get a config value")
  .action(async (key: string) => {
    try {
      const value = await getConfigValue(key);
      if (value === undefined) {
        console.log(chalk.dim(`${key} is not set`));
      } else {
        console.log(`${chalk.dim(key + ":")} ${chalk.white(String(value))}`);
      }
    } catch (err) {
      console.error(chalk.red(`✖ ${(err as Error).message}`));
      process.exit(1);
    }
  });

config
  .command("set <key> <value>")
  .description("Set a config value")
  .action(async (key: string, value: string) => {
    try {
      await setConfigValue(key, value);
      console.log(chalk.green(`✔ ${key} = ${value}`));
    } catch (err) {
      console.error(chalk.red(`✖ ${(err as Error).message}`));
      process.exit(1);
    }
  });

config
  .command("list")
  .description("List all config keys, their current values, and defaults")
  .action(async () => {
    const current = await readGlobalConfig();
    console.log(chalk.bold("\nxo global config\n"));
    for (const [key, meta] of Object.entries(CONFIG_META)) {
      const value = (current as unknown as Record<string, unknown>)[key];
      const valueStr = value === undefined ? chalk.dim("(not set)") : chalk.white(String(value));
      const defaultStr = meta.default ? chalk.dim(` default: ${meta.default}`) : "";
      console.log(`  ${chalk.cyan(key.padEnd(16))} ${valueStr}${defaultStr}`);
      console.log(`  ${" ".repeat(16)} ${chalk.dim(meta.description)}`);
      console.log();
    }
  });

// ─── helpers ──────────────────────────────────────────────────────────────────

function collect(val: string, acc: string[]): string[] {
  acc.push(val);
  return acc;
}

function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [lMaj, lMin, lPat] = parse(latest);
  const [cMaj, cMin, cPat] = parse(current);
  if (lMaj !== cMaj) return (lMaj ?? 0) > (cMaj ?? 0);
  if (lMin !== cMin) return (lMin ?? 0) > (cMin ?? 0);
  return (lPat ?? 0) > (cPat ?? 0);
}

// ─── xo init helpers ─────────────────────────────────────────────────────────

function buildWorkflowYaml(name: string, triggers: string, description: string): string {
  return `name: ${name}
on: ${triggers}
description: ${description || name}

inputs: {}
  # componentName:
  #   prompt: "Component name?"
  #   default: MyComponent

jobs:
  detect:
    steps:
      - uses: xo/detect-pm
        id: pm
      # - uses: xo/pkg-installed
      #   id: hasDep
      #   with:
      #     pkg: react

  main:
    needs: [detect]
    steps: []
      # - uses: xo/template
      #   with:
      #     from: templates/example.ts
      #     to: "src/{{inputs.componentName}}.ts"
`;
}

function buildReadme(name: string, description: string, triggers: string[]): string {
  const installLines = triggers
    .map((t) => `xo ${t} ${name}`)
    .join("\n");
  return `# ${name}

${description || "An xo generator."}

## Usage

\`\`\`bash
${installLines}
\`\`\`

## Development

\`\`\`bash
xo link          # link locally for testing
xo ${triggers[0]} ${name}  # run from any project
xo unlink        # remove when done
\`\`\`
`;
}

// ─── auto-update notification ─────────────────────────────────────────────────

const UPDATE_CACHE = path.join(os.homedir(), ".xo", "update-check.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day

program.hook("postAction", async () => {
  try {
    const globalConfig = await readGlobalConfig();
    if (!globalConfig.autoUpdate) return;

    let cache: { lastCheck: number; latest: string } = { lastCheck: 0, latest: __PKG_VERSION__ };
    if (await fs.pathExists(UPDATE_CACHE)) {
      cache = await fs.readJson(UPDATE_CACHE).catch(() => cache);
    }

    const now = Date.now();
    let latest = cache.latest;

    if (now - cache.lastCheck >= CHECK_INTERVAL_MS) {
      const registryBase = globalConfig.registryUrl.replace(/\/$/, "");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`${registryBase}/@xo-code/cli/latest`, {
          signal: controller.signal,
        });
        if (res.ok) {
          ({ version: latest } = await res.json() as { version: string });
          await fs.ensureDir(path.dirname(UPDATE_CACHE));
          await fs.writeJson(UPDATE_CACHE, { lastCheck: now, latest });
        }
      } finally {
        clearTimeout(timer);
      }
    }

    if (isNewer(latest, __PKG_VERSION__)) {
      console.log(
        chalk.dim(`\n  Update available `) +
        chalk.yellow(__PKG_VERSION__) +
        chalk.dim(" → ") +
        chalk.green(latest) +
        chalk.dim("  run ") +
        chalk.white("xo self-update"),
      );
    }
  } catch {
    // silently ignore — update check is best-effort
  }
});

program.parse();
