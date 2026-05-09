# @xo/core

The xo engine. A TypeScript library that powers signal-based project introspection, declarative generator execution, and idempotent file operations.

This package is the brain behind the `xo` CLI and VS Code extension. You can also use it directly to embed xo's generator engine into your own tooling.

```
npm install @xo/core
```

---

## Architecture

xo's core is built around one principle: **the engine knows nothing about frameworks**. Every piece of framework knowledge lives inside generator definitions. The engine's job is to scan signals, evaluate rules, run prompts, and dispatch actions.

```
project files
     │
     ▼
signal-scanner ──► signals map (flat key-value)
     │
     ▼
rule-validator ──► requires / conflicts / detects checks
     │
     ▼
prompt-engine  ──► interactive answers
     │
     ▼
action-runner  ──► file-editor / script-runner / ast ops
     │
     ▼
state-manager  ──► .xo/state.json  (undo support)
config-manager ──► xo.config.json  (project record)
```

---

## Modules

### `run(name, cwd, opts?)` — main entry point

Runs a generator end-to-end: load → scan → validate → prompt → act → record.

```ts
import { run } from "@xo/core";

const result = await run("owner/repo", process.cwd(), { dryRun: false });
console.log(result.operationId); // UUID of the recorded operation
```

```ts
interface RunOptions {
  dryRun?: boolean;   // skip all writes, print what would happen
  preview?: boolean;  // reserved for future diff output
}

interface RunResult {
  generator: Generator;
  answers: Record<string, unknown>;
  filesChanged: FileSnapshot[];
  operationId?: string;
  dryRun: boolean;
}
```

---

### `signal-scanner`

Scans a project directory and returns a flat `Signal` map describing what it finds.

```ts
import { scanSignals } from "@xo/core";

const signals = await scanSignals("/path/to/project");
// {
//   "file:package.json": true,
//   "file:tsconfig.json": true,
//   "pkg:react": true,
//   "pkg:typescript": true,
//   "framework": "nextjs",
//   "packageManager": "pnpm",
//   "language": "typescript",
//   "isMonorepo": false,
//   ...
// }
```

**Signal prefixes:**

| Prefix | Example | Meaning |
|--------|---------|---------|
| `file:` | `file:package.json` | File exists at that path |
| `pkg:` | `pkg:react` | Package present in dependencies |
| `script:` | `script:build` | npm script present in package.json |
| _(none)_ | `framework` | Derived metadata value |

**Derived signals:** `framework`, `packageManager`, `language`, `isMonorepo`.

Detected frameworks: `nextjs`, `nuxt`, `sveltekit`, `react`, `vue`, `svelte`, `nestjs`, `express`, `fastify`.

---

### `generator-loader`

Resolves and loads a `generator.json` from multiple sources.

```ts
import { loadGenerator } from "@xo/core";

const { generator, dir } = await loadGenerator("owner/repo", process.cwd());
```

**Resolution order:**

1. Local path (`./` or `/` prefix) — reads directly from disk
2. Project-local — `.xo/generators/<name>/generator.json`
3. Global cache — `~/.xo/generators/<name>/generator.json`
4. GitHub — fetches from `https://raw.githubusercontent.com/<owner>/<repo>/main/generator.json`, caches globally

Name format `owner/repo/subpath` resolves to `main/subpath/generator.json` on GitHub.

```ts
interface LoadedGenerator {
  generator: Generator;
  dir: string;        // absolute path to the generator directory (for resolving template files)
}
```

---

### `rule-validator`

Validates a generator's compatibility rules against the current project state.

```ts
import { validateRequires, validateConflicts, validateDetects } from "@xo/core";

const requiresResult = validateRequires(generator.requires ?? [], appliedGenerators);
const conflictsResult = validateConflicts(generator.conflicts ?? [], appliedGenerators);
const detected = validateDetects(generator.detects ?? [], signals);

// { valid: boolean, errors: string[] }
```

**`DetectRule`** — each rule checks one signal:

```ts
interface DetectRule {
  signal: string;     // signal key, e.g. "pkg:react" or "framework"
  exists?: boolean;   // signal must be truthy (true) or absent/falsy (false)
  equals?: string;    // signal value must equal this string
  matches?: string;   // signal value must match this regex pattern
}
```

All rules in `detects` must pass for the generator to proceed.

---

### `prompt-engine`

Runs interactive prompts using inquirer, with conditional display.

```ts
import { runPrompts } from "@xo/core";

const answers = await runPrompts(generator.prompts ?? [], {
  ...signals,
  framework: "nextjs",
});
```

**Prompt types:** `input`, `confirm`, `select`, `multiselect`.

The `when` field is a JavaScript expression string evaluated against the current context (prior answers + signals). The prompt is skipped when it evaluates to falsy.

```json
{
  "name": "addDocker",
  "type": "confirm",
  "message": "Add Docker support?",
  "when": "framework === 'nestjs'"
}
```

---

### `template-engine`

Handlebars rendering with a set of built-in string helpers.

```ts
import { renderTemplate } from "@xo/core";

const output = renderTemplate("Hello, {{capitalize name}}!", { name: "world" });
// "Hello, World!"
```

**Built-in helpers:**

| Helper | Example input | Output |
|--------|--------------|--------|
| `capitalize` | `hello world` | `Hello world` |
| `camelCase` | `my-component` | `myComponent` |
| `kebabCase` | `MyComponent` | `my-component` |
| `snakeCase` | `MyComponent` | `my_component` |
| `pascalCase` | `my-component` | `MyComponent` |
| `eq` | `{{#if (eq a b)}}` | boolean equal |
| `ne` | `{{#if (ne a b)}}` | boolean not equal |
| `or` | `{{#if (or a b)}}` | logical or |
| `and` | `{{#if (and a b)}}` | logical and |

Template variables in `target` paths also support `{{variable}}` interpolation (via `interpolate`, not Handlebars — so no helpers in paths, just plain variable substitution).

---

### `file-editor`

Individual file operation functions, each mapping to an action type.

```ts
import {
  copyFile, templateFile, appendToFile, injectIntoFile,
  replaceInFile, mergeJsonFile, setEnvVar
} from "@xo/core";
```

**`copyFile`** — copies a file from the generator directory verbatim.

**`templateFile`** — renders a Handlebars template and writes it to the target path.

**`appendToFile`** — appends content to a file, creating it if absent. Adds a leading newline by default.

**`injectIntoFile`** — inserts content immediately after or before a marker string.
```json
{ "type": "inject", "target": "src/app.tsx", "after": "// routes", "content": "import AuthRoutes from './auth';" }
```

**`replaceInFile`** — regex find-and-replace across a file.
```json
{ "type": "replace", "target": "README.md", "search": "\\$\\{PROJECT_NAME\\}", "replace": "{{name}}", "flags": "g" }
```

**`mergeJsonFile`** — shallow-merges (or deep-merges with `"deep": true`) an object into a JSON file.
```json
{ "type": "json", "target": "package.json", "merge": { "scripts": { "format": "prettier --write ." } }, "deep": true }
```

**`setEnvVar`** — sets or updates a `KEY=value` line in `.env` (or a custom target file).
```json
{ "type": "env", "key": "DATABASE_URL", "value": "postgresql://localhost:5432/{{name}}" }
```

All functions accept a `ctx` object and perform `{{variable}}` interpolation on `target` paths before writing.

---

### `action-runner`

Dispatches all action types. Evaluates the optional `if` expression before running.

```ts
import { runAction, runActions } from "@xo/core";

await runActions(generator.actions ?? [], {
  generatorDir: "/path/to/generator",
  cwd: process.cwd(),
  ctx: { ...signals, ...answers },
  dryRun: false,
});
```

**All action types:**

| Type | Required fields | Description |
|------|----------------|-------------|
| `copy` | `source`, `target` | Copy file as-is from generator dir |
| `template` | `source`, `target` | Render Handlebars template |
| `append` | `target`, `content` | Append content to file |
| `inject` | `target`, `content`, `after`\|`before` | Insert content at marker |
| `replace` | `target`, `search`, `replace` | Regex replace in file |
| `json` | `target`, `merge` | Merge JSON object into file |
| `env` | `key`, `value` | Set env var in `.env` |
| `ast-add-import` | `target`, `from`, `import` | Add TS import via AST |
| `command` | `command` | Run shell command |
| `script` | `script` | Run script file from generator dir |
| `xo-call` | `generator` | Invoke another generator |

Every action supports:
- **`if`** — JavaScript expression; action is skipped when falsy
- **`cwd`** — for `command` and `script`, a subdirectory relative to the project root

**`ast-add-import`** uses ts-morph to safely add TypeScript imports without duplicating them:
```json
{
  "type": "ast-add-import",
  "target": "src/app.module.ts",
  "from": "@nestjs/config",
  "import": ["ConfigModule", "ConfigService"]
}
```

---

### `state-manager`

Tracks operations and their file snapshots for undo support. Writes to `.xo/state.json`.

```ts
import { recordOperation, undoLastOperation, listOperations, getLastOperation } from "@xo/core";

// Record an operation (called automatically by run())
const id = await recordOperation(cwd, "owner/repo", "add", filesChanged);

// Undo the last operation
const op = await undoLastOperation(cwd);

// List all operations
const ops = await listOperations(cwd);

// Peek at the last without undoing
const last = await getLastOperation(cwd);
```

```ts
interface OperationRecord {
  id: string;
  timestamp: string;        // ISO 8601
  generator: string;
  type: "create" | "add" | "run";
  files: FileSnapshot[];
}

interface FileSnapshot {
  filePath: string;          // relative to project root
  action: "created" | "modified" | "deleted";
  before?: string;           // file content before the operation (undefined = file was new)
}
```

---

### `config-manager`

Reads and writes `xo.config.json` in the project root.

```ts
import { readConfig, writeConfig, mergeConfig } from "@xo/core";

const config = await readConfig(cwd);
await mergeConfig(cwd, { features: ["owner/auth-jwt"] });
```

`run()` automatically sets `config.template` on `create` operations and appends to `config.features` on `add` operations.

---

### `script-runner`

Executes shell commands and script files synchronously, streaming output to the terminal.

```ts
import { runCommand, runScript } from "@xo/core";

runCommand(cwd, { command: "pnpm install" }, ctx, dryRun);
await runScript(generatorDir, cwd, { script: "scripts/postinstall.sh" }, ctx, dryRun);
```

Both accept a `dryRun` flag that logs the command without executing it.

---

### Utilities

```ts
import { interpolate } from "@xo/core";
// Resolves {{variable}} and {{nested.key}} — used for target path interpolation

import { evaluate } from "@xo/core";
// Evaluates a JS expression string against a context object — used for if/when fields
```

---

## Types

```ts
interface Generator {
  name: string;
  type: "project" | "feature";
  requires?: string[];
  dependencies?: string[];
  conflicts?: string[];
  provides?: string[];
  detects?: DetectRule[];
  prompts?: Prompt[];
  actions?: Action[];
}

interface DetectRule {
  signal: string;
  exists?: boolean;
  equals?: string;
  matches?: string;
}

interface Prompt {
  name: string;
  type: "input" | "select" | "confirm" | "multiselect";
  message: string;
  choices?: string[];
  when?: string;
}

interface Action {
  type: ActionType;
  if?: string;
  [key: string]: unknown;
}

type ActionType =
  | "copy" | "template" | "append" | "inject" | "replace"
  | "json" | "env" | "ast-add-import" | "command" | "script" | "xo-call";

interface Signal {
  [key: string]: string | boolean | undefined;
}

interface XoConfig {
  template?: string;
  framework?: string;
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  features?: string[];
  [namespace: string]: unknown;
}
```

---

## Requirements

- Node.js >= 20
