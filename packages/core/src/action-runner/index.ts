import path from "node:path";
import fs from "fs-extra";
import { Project } from "ts-morph";
import type { Action } from "../types.js";
import { evaluate } from "../utils/expression.js";
import { interpolate } from "../utils/interpolate.js";
import { copyFile, templateFile, appendToFile, injectIntoFile, replaceInFile, mergeJsonFile, setEnvVar } from "../file-editor/index.js";
import { runCommand, runScript } from "../script-runner/index.js";

export interface ActionContext {
  generatorDir: string;
  cwd: string;
  ctx: Record<string, unknown>;
  dryRun?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cast<T>(x: unknown): T { return x as T; }

export async function runAction(action: Action, context: ActionContext): Promise<void> {
  const { generatorDir, cwd, ctx, dryRun } = context;
  const a = action as Record<string, unknown>;

  if (action.if && !evaluate(interpolate(action.if as string, ctx), ctx)) return;

  switch (action.type) {
    case "copy":
      if (dryRun) { console.log(`[dry-run] copy: ${a.source} → ${a.target}`); return; }
      await copyFile(generatorDir, cwd, cast(a), ctx);
      break;

    case "template":
      if (dryRun) { console.log(`[dry-run] template: ${a.source} → ${a.target}`); return; }
      await templateFile(generatorDir, cwd, cast(a), ctx);
      break;

    case "append":
      if (dryRun) { console.log(`[dry-run] append to: ${a.target}`); return; }
      await appendToFile(cwd, cast(a), ctx);
      break;

    case "inject":
      if (dryRun) { console.log(`[dry-run] inject into: ${a.target}`); return; }
      await injectIntoFile(cwd, cast(a), ctx);
      break;

    case "replace":
      if (dryRun) { console.log(`[dry-run] replace in: ${a.target}`); return; }
      await replaceInFile(cwd, cast(a), ctx);
      break;

    case "json":
      if (dryRun) { console.log(`[dry-run] merge json: ${a.target}`); return; }
      await mergeJsonFile(cwd, cast(a), ctx);
      break;

    case "env":
      if (dryRun) { console.log(`[dry-run] set env: ${a.key}`); return; }
      await setEnvVar(cwd, cast(a), ctx);
      break;

    case "ast-add-import":
      if (dryRun) { console.log(`[dry-run] ast-add-import: ${a.import} from "${a.from}" in ${a.target}`); return; }
      await astAddImport(cwd, cast(a), ctx);
      break;

    case "command":
      runCommand(cwd, cast(a), ctx, dryRun);
      break;

    case "script":
      await runScript(generatorDir, cwd, cast(a), ctx, dryRun);
      break;

    case "xo-call":
      // Handled externally by generator-runner to avoid circular imports
      break;

    default:
      throw new Error(`Unknown action type: ${(action as Action).type}`);
  }
}

export async function runActions(actions: Action[], context: ActionContext): Promise<void> {
  for (const action of actions) {
    await runAction(action, context);
  }
}

async function astAddImport(
  cwd: string,
  action: { target: string; from: string; import: string[] | string; isDefault?: boolean },
  ctx: Record<string, unknown>,
): Promise<void> {
  const targetPath = path.join(cwd, interpolate(action.target, ctx));
  if (!(await fs.pathExists(targetPath))) throw new Error(`ast-add-import: file not found: ${targetPath}`);

  const project = new Project({ useInMemoryFileSystem: false });
  const sourceFile = project.addSourceFileAtPath(targetPath);

  const namedImports = Array.isArray(action.import) ? action.import : [action.import];
  const moduleSpecifier = interpolate(action.from, ctx);

  const existing = sourceFile.getImportDeclaration(moduleSpecifier);
  if (existing) {
    if (!action.isDefault) {
      const currentNamed = existing.getNamedImports().map((n) => n.getName());
      const toAdd = namedImports.filter((n) => !currentNamed.includes(n));
      if (toAdd.length > 0) existing.addNamedImports(toAdd);
    }
  } else {
    if (action.isDefault && namedImports.length === 1) {
      sourceFile.addImportDeclaration({ defaultImport: namedImports[0], moduleSpecifier });
    } else {
      sourceFile.addImportDeclaration({ namedImports, moduleSpecifier });
    }
  }

  await sourceFile.save();
}
