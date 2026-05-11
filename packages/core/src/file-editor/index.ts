import path from "node:path";
import https from "node:https";
import fs from "fs-extra";
import { renderTemplate, renderFilename } from "../template-engine/index.js";
import { interpolate } from "../utils/interpolate.js";

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location!).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function githubAuthHeaders(): Record<string, string> {
  const token = process.env["XO_GITHUB_TOKEN"];
  return token
    ? { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" }
    : { Accept: "application/vnd.github.v3+json" };
}

async function fetchJson(url: string): Promise<unknown> {
  const headers = githubAuthHeaders();
  return new Promise((resolve, reject) => {
    const reqUrl = new URL(url);
    const options = {
      hostname: reqUrl.hostname,
      path: reqUrl.pathname + reqUrl.search,
      headers,
    };
    https.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location!).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`GitHub API HTTP ${res.statusCode} for ${url}`));
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

// ── GitHub Contents API ──────────────────────────────────────────────────────

interface GHContentsItem {
  type: "file" | "dir" | "symlink";
  path: string;             // full path from repo root
  download_url: string | null;
  url: string;              // Contents API URL for this item
}

interface StoredGitHubRef {
  owner: string;
  repo: string;
  subpath?: string;
  ref: string;
}

async function readStoredRef(generatorDir: string): Promise<StoredGitHubRef | null> {
  const refPath = path.join(generatorDir, ".ref");
  if (!(await fs.pathExists(refPath))) return null;
  try {
    return JSON.parse(await fs.readFile(refPath, "utf8")) as StoredGitHubRef;
  } catch {
    return null;
  }
}

// Returns the Contents API path for a source path (accounting for subpath prefix in the repo).
function apiPath(storedRef: StoredGitHubRef, sourcePath: string): string {
  return storedRef.subpath ? `${storedRef.subpath}/${sourcePath}` : sourcePath;
}

async function ghContentsRequest(
  owner: string,
  repo: string,
  repoPath: string,
  ref: string,
): Promise<GHContentsItem | GHContentsItem[] | null> {
  const encoded = repoPath.split("/").map(encodeURIComponent).join("/");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(ref)}`;
  try {
    return (await fetchJson(url)) as GHContentsItem | GHContentsItem[];
  } catch {
    return null;
  }
}

// Recursively copy a GitHub directory into destDir, preserving relative structure.
async function copyGitHubDir(
  items: GHContentsItem[],
  owner: string,
  repo: string,
  ref: string,
  destDir: string,
  repoPrefix: string,     // the repo path prefix to strip when computing relative destination
): Promise<void> {
  for (const item of items) {
    const relPath = item.path.startsWith(repoPrefix + "/")
      ? item.path.slice(repoPrefix.length + 1)
      : path.basename(item.path);

    if (item.type === "file" && item.download_url) {
      const fileDest = path.join(destDir, relPath);
      await fs.ensureDir(path.dirname(fileDest));
      const content = await fetchText(item.download_url);
      await fs.writeFile(fileDest, content, "utf8");
    } else if (item.type === "dir") {
      const subItems = await ghContentsRequest(owner, repo, item.path, ref);
      if (Array.isArray(subItems)) {
        await copyGitHubDir(subItems, owner, repo, ref, destDir, repoPrefix);
      }
    }
  }
}

// List all file paths (relative to dirRepoPath) in a GitHub dir recursively.
async function listGitHubFilePaths(
  owner: string,
  repo: string,
  ref: string,
  dirRepoPath: string,
): Promise<string[]> {
  const data = await ghContentsRequest(owner, repo, dirRepoPath, ref);
  if (!Array.isArray(data)) return [];

  const files: string[] = [];
  for (const item of data) {
    const rel = item.path.startsWith(dirRepoPath + "/")
      ? item.path.slice(dirRepoPath.length + 1)
      : item.path;

    if (item.type === "file") {
      files.push(rel);
    } else if (item.type === "dir") {
      const sub = await listGitHubFilePaths(owner, repo, ref, item.path);
      for (const f of sub) files.push(`${rel}/${f}`);
    }
  }
  return files;
}

// ── Glob helpers ─────────────────────────────────────────────────────────────

function hasGlobChars(s: string): boolean {
  return /[*?{[]/.test(s);
}

// Converts a glob pattern to a RegExp. Supports *, **, and ?.
function globToRegex(pattern: string): RegExp {
  let re = "";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i]!;
    if (ch === "*" && pattern[i + 1] === "*") {
      re += ".*";
      i += 2;
      if (pattern[i] === "/") i++; // consume trailing slash after **
    } else if (ch === "*") {
      re += "[^/]*";
      i++;
    } else if (ch === "?") {
      re += "[^/]";
      i++;
    } else {
      re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
      i++;
    }
  }
  return new RegExp(`^${re}$`);
}

// Returns the non-glob directory prefix of a pattern (e.g. "lib/**/*.dart" → "lib").
function globDirPrefix(pattern: string): string {
  const idx = pattern.search(/[*?{[]/);
  if (idx === -1) return pattern;
  const before = pattern.slice(0, idx);
  return before.endsWith("/") ? before.slice(0, -1) : path.dirname(before);
}

// Recursively list all file paths relative to `dir`.
async function listLocalFilesRec(dir: string): Promise<string[]> {
  const files: string[] = [];
  async function walk(current: string, rel: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(path.join(current, entry.name), entryRel);
      } else {
        files.push(entryRel);
      }
    }
  }
  await walk(dir, "");
  return files;
}

// ── Source reader (local or remote text) ─────────────────────────────────────

async function readTextSource(generatorDir: string, source: string): Promise<string> {
  const rawbasePath = path.join(generatorDir, ".rawbase");
  if (await fs.pathExists(rawbasePath)) {
    const base = (await fs.readFile(rawbasePath, "utf8")).trim();
    return fetchText(`${base}/${source}`);
  }
  return fs.readFile(path.join(generatorDir, source), "utf8");
}

// ── Public action interfaces ─────────────────────────────────────────────────

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

// ── copyFile ─────────────────────────────────────────────────────────────────

export async function copyFile(
  generatorDir: string,
  cwd: string,
  action: CopyAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const isGlob = hasGlobChars(action.source);
  const dest = path.join(cwd, resolveTarget(action.target, ctx));
  const rawbasePath = path.join(generatorDir, ".rawbase");
  const isRemote = await fs.pathExists(rawbasePath);

  if (isRemote) {
    const base = (await fs.readFile(rawbasePath, "utf8")).trim();
    const storedRef = await readStoredRef(generatorDir);

    if (isGlob && storedRef) {
      // Glob copy from GitHub: list the directory prefix, filter by pattern, copy matches.
      const dirPrefix = globDirPrefix(action.source);
      const repoDirPath = apiPath(storedRef, dirPrefix);
      const regex = globToRegex(action.source);
      const filePaths = await listGitHubFilePaths(storedRef.owner, storedRef.repo, storedRef.ref, repoDirPath);

      for (const relFile of filePaths) {
        const fullRelPath = dirPrefix !== "." ? `${dirPrefix}/${relFile}` : relFile;
        if (regex.test(fullRelPath)) {
          const rawUrl = `${base}/${fullRelPath}`;
          const fileDest = path.join(dest, relFile);
          await fs.ensureDir(path.dirname(fileDest));
          await fs.writeFile(fileDest, await fetchText(rawUrl), "utf8");
          console.log(`      → ${fullRelPath}`);
        }
      }
      return;
    }

    // Try as directory via Contents API
    if (storedRef && !isGlob) {
      const repoPath = apiPath(storedRef, action.source);
      const data = await ghContentsRequest(storedRef.owner, storedRef.repo, repoPath, storedRef.ref);
      if (Array.isArray(data)) {
        // It's a directory — copy recursively into dest
        await fs.ensureDir(dest);
        await copyGitHubDir(data, storedRef.owner, storedRef.repo, storedRef.ref, dest, repoPath);
        return;
      }
    }

    // Single file (existing behaviour)
    const content = await fetchText(`${base}/${action.source}`);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, content, "utf8");
    return;
  }

  // ── Local ─────────────────────────────────────────────────────────────────

  if (isGlob) {
    const dirPrefix = globDirPrefix(action.source);
    const baseDir = path.join(generatorDir, dirPrefix);
    const regex = globToRegex(action.source);

    const allFiles = await listLocalFilesRec(baseDir);
    for (const relFile of allFiles) {
      const fullRelPath = dirPrefix !== "." ? `${dirPrefix}/${relFile}` : relFile;
      if (regex.test(fullRelPath)) {
        const fileDest = path.join(dest, relFile);
        await fs.ensureDir(path.dirname(fileDest));
        await fs.copy(path.join(baseDir, relFile), fileDest, { overwrite: true });
        console.log(`      → ${fullRelPath}`);
      }
    }
    return;
  }

  // Single file or directory (fs.copy handles both)
  const src = path.join(generatorDir, action.source);
  await fs.ensureDir(path.dirname(dest));
  await fs.copy(src, dest, { overwrite: true });
}

// ── Other actions (unchanged) ─────────────────────────────────────────────────

export async function templateFile(
  generatorDir: string,
  cwd: string,
  action: TemplateAction,
  ctx: Record<string, unknown>,
): Promise<void> {
  const raw = await readTextSource(generatorDir, action.source);
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
