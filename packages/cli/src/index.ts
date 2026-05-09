import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { run, undoLastOperation, listOperations, getLastOperation } from "@xo/core";

const program = new Command();

program
  .name("xo")
  .description("Universal generator engine — the git of code generation")
  .version("0.1.0");

program
  .command("create <template>")
  .description("Scaffold a new project from a template generator")
  .option("--dry-run", "Preview actions without writing files")
  .option("--dir <path>", "Target directory (default: current directory)")
  .action(async (template: string, opts: { dryRun?: boolean; dir?: string }) => {
    const cwd = opts.dir ? opts.dir : process.cwd();
    const spinner = ora(`Loading generator ${chalk.cyan(template)}...`).start();

    try {
      const result = await run(template, cwd, { dryRun: opts.dryRun });
      spinner.succeed(
        chalk.green(`Generator "${result.generator.name ?? template}" applied successfully`),
      );
      if (opts.dryRun) {
        console.log(chalk.yellow("\nDry run — no files were written."));
      } else {
        console.log(chalk.dim(`\nOperation ID: ${result.operationId}`));
        console.log(chalk.dim(`Run ${chalk.white("xo undo")} to revert.`));
      }
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("add <feature>")
  .description("Add a feature generator to an existing project")
  .option("--dry-run", "Preview actions without writing files")
  .action(async (feature: string, opts: { dryRun?: boolean }) => {
    const cwd = process.cwd();
    const spinner = ora(`Applying feature ${chalk.cyan(feature)}...`).start();

    try {
      const result = await run(feature, cwd, { dryRun: opts.dryRun });
      spinner.succeed(
        chalk.green(`Feature "${result.generator.name ?? feature}" added successfully`),
      );
      if (opts.dryRun) {
        console.log(chalk.yellow("\nDry run — no files were written."));
      } else {
        console.log(chalk.dim(`\nOperation ID: ${result.operationId}`));
        console.log(chalk.dim(`Run ${chalk.white("xo undo")} to revert.`));
      }
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("run <name>")
  .description("Run a named generator regardless of its type")
  .option("--dry-run", "Preview actions without writing files")
  .action(async (name: string, opts: { dryRun?: boolean }) => {
    const cwd = process.cwd();
    const spinner = ora(`Running ${chalk.cyan(name)}...`).start();

    try {
      const result = await run(name, cwd, { dryRun: opts.dryRun });
      spinner.succeed(chalk.green(`"${result.generator.name ?? name}" completed`));
      if (opts.dryRun) console.log(chalk.yellow("\nDry run — no files were written."));
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("undo")
  .description("Revert the last xo operation")
  .action(async () => {
    const cwd = process.cwd();
    const last = await getLastOperation(cwd);
    if (!last) {
      console.log(chalk.yellow("Nothing to undo."));
      return;
    }

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

program
  .command("history")
  .description("List all applied generators in this project")
  .action(async () => {
    const cwd = process.cwd();
    const ops = await listOperations(cwd);
    if (ops.length === 0) {
      console.log(chalk.dim("No generators have been applied in this project."));
      return;
    }
    console.log(chalk.bold("\nApplied generators:\n"));
    for (const op of ops) {
      const date = new Date(op.timestamp).toLocaleString();
      console.log(
        `  ${chalk.cyan(op.id.slice(0, 8))}  ${chalk.white(op.generator.padEnd(40))}  ${chalk.dim(date)}`,
      );
    }
    console.log();
  });

program.parse();
