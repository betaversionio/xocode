import path from "node:path";
import fs from "fs-extra";
import { renderTemplate, renderFilename } from "../template-engine/index.js";
import { interpolate } from "../utils/interpolate.js";

export interface CopyAction {
  source: string;
  target: string;
}

export interface TemplateAction {
  source: string;
  target: string;
}

export interface AppendAction {
  target: string;
  content: string;
  newline?: boolean;
}

export interface InjectAction {
  target: string;
  content: string;
  after?: string;
  before?: string;
}

export interface ReplaceAction {
  target: string;
  search: string;
  replace: string;
  flags?: string;
}

export interface JsonAction {
  target: string;
  merge: Record<string, unknown>;
  deep?: boolean;
}

export interface EnvAction {
  target?: string;
  key: string;
  value: string;
}

function resolveTarget(target: string, ctx: Record<string, unknown>): string {
  return renderFilename(interpolate(target, ctx), ctx);
}

export async function copyFile(
  generatorDir: string,
  cwd: string,
  action: CopyAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const src = path.join(generatorDir, action.source);
  const dest = path.join(cwd, resolveTarget(action.target, ctx));
  await fs.ensureDir(path.dirname(dest));
  await fs.copy(src, dest, { overwrite: true });
}

export async function templateFile(
  generatorDir: string,
  cwd: string,
  action: TemplateAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const src = path.join(generatorDir, action.source);
  const raw = await fs.readFile(src, "utf8");
  const rendered = renderTemplate(raw, ctx);
  const dest = path.join(cwd, resolveTarget(action.target, ctx));
  await fs.ensureDir(path.dirname(dest));
  await fs.writeFile(dest, rendered, "utf8");
}

export async function appendToFile(
  cwd: string,
  action: AppendAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const dest = path.join(cwd, resolveTarget(action.target, ctx));
  const content = renderTemplate(interpolate(action.content, ctx), ctx);
  const prefix = action.newline !== false ? "\n" : "";
  await fs.ensureDir(path.dirname(dest));
  if (await fs.pathExists(dest)) {
    await fs.appendFile(dest, prefix + content, "utf8");
  } else {
    await fs.writeFile(dest, content, "utf8");
  }
}

export async function injectIntoFile(
  cwd: string,
  action: InjectAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const dest = path.join(cwd, resolveTarget(action.target, ctx));
  if (!(await fs.pathExists(dest))) throw new Error(`inject: target file not found: ${dest}`);
  const content = renderTemplate(interpolate(action.content, ctx), ctx);
  let text = await fs.readFile(dest, "utf8");

  if (action.after) {
    const marker = interpolate(action.after, ctx);
    const idx = text.indexOf(marker);
    if (idx === -1) throw new Error(`inject: marker not found in ${action.target}: "${marker}"`);
    const insertAt = idx + marker.length;
    text = text.slice(0, insertAt) + "\n" + content + text.slice(insertAt);
  } else if (action.before) {
    const marker = interpolate(action.before, ctx);
    const idx = text.indexOf(marker);
    if (idx === -1) throw new Error(`inject: marker not found in ${action.target}: "${marker}"`);
    text = text.slice(0, idx) + content + "\n" + text.slice(idx);
  } else {
    text = text + "\n" + content;
  }

  await fs.writeFile(dest, text, "utf8");
}

export async function replaceInFile(
  cwd: string,
  action: ReplaceAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const dest = path.join(cwd, resolveTarget(action.target, ctx));
  if (!(await fs.pathExists(dest))) throw new Error(`replace: target file not found: ${dest}`);
  const text = await fs.readFile(dest, "utf8");
  const search = interpolate(action.search, ctx);
  const replacement = renderTemplate(interpolate(action.replace, ctx), ctx);
  const regex = new RegExp(search, action.flags ?? "g");
  await fs.writeFile(dest, text.replace(regex, replacement), "utf8");
}

export async function mergeJsonFile(
  cwd: string,
  action: JsonAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const dest = path.join(cwd, resolveTarget(action.target, ctx));
  await fs.ensureDir(path.dirname(dest));
  const existing = (await fs.pathExists(dest)) ? await fs.readJson(dest).catch(() => ({})) : {};
  const merged = action.deep ? deepMerge(existing, action.merge) : { ...existing, ...action.merge };
  await fs.writeJson(dest, merged, { spaces: 2 });
}

export async function setEnvVar(
  cwd: string,
  action: EnvAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const dest = path.join(cwd, action.target ?? ".env");
  await fs.ensureDir(path.dirname(dest));
  const key = interpolate(action.key, ctx);
  const value = interpolate(action.value, ctx);
  const line = `${key}=${value}`;

  if (await fs.pathExists(dest)) {
    let text = await fs.readFile(dest, "utf8");
    const keyRegex = new RegExp(`^${key}=.*$`, "m");
    if (keyRegex.test(text)) {
      text = text.replace(keyRegex, line);
    } else {
      text = text.endsWith("\n") ? text + line + "\n" : text + "\n" + line + "\n";
    }
    await fs.writeFile(dest, text, "utf8");
  } else {
    await fs.writeFile(dest, line + "\n", "utf8");
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && out[k] !== null) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
