import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
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

program
  .name("xo")
  .description("Local workflow engine for developers — compose actions into workflows")
  .version("0.1.0");

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

// ─── helpers ──────────────────────────────────────────────────────────────────

function collect(val: string, acc: string[]): string[] {
  acc.push(val);
  return acc;
}

program.parse();
