# Architecture

## The Core Philosophy — xo is the Git of Code Generation

Git does not know what a `.js` or `.py` file means. It tracks signals (file presence, content changes) universally. The meaning lives outside git — in the user's workflow.

xo works the same way:

- **xo core never knows about any framework**
- The introspector is a dumb signal scanner — it just reads what's present
- Each generator ships its own detection rules and declares what signals match it
- New frameworks, new languages, new tools — all supported without touching xo core

This means xo works for any stack that will ever exist, not just the ones we know today.

---

## Engine Module Map

```
xo/
 ├─ cli/                  # command definitions (create, add, run)
 └─ engine/
     ├─ signal-scanner/   # dumb project scanner — collects raw signals only
     ├─ config-manager/   # reads and writes xo.config.json
     ├─ rule-validator/   # checks requires, conflicts, provides, detects
     ├─ prompt-engine/    # runs prompts, collects answers
     ├─ generator-runner/ # orchestrates the full lifecycle
     ├─ action-runner/    # dispatches each action type
     ├─ file-editor/      # append, inject, replace, copy
     ├─ template-engine/  # handlebars/ejs rendering
     ├─ script-runner/    # command and shell script execution
     └─ state-manager/    # reads and writes .xo/state.json
```

---

## Execution Lifecycle

When you run `xo add payment/stripe`:

```
1. load generator       → parse generator.json
2. scan signals         → collect raw project signals (files, json values, lockfiles)
3. load config          → read xo.config.json
4. validate rules       → check requires, conflicts, provides, detects
5. run prompts          → collect missing answers from user
6. resolve dependencies → run dependency generators via xo-call
7. execute actions      → run actions in order
8. run scripts          → execute any command/script actions
9. update state         → write to .xo/state.json
```

---

## Module Responsibilities

### `signal-scanner`

The introspector does **not** know about any framework. It only collects raw signals from the project and exposes them for generators to interpret.

**What it scans:**

| Signal type | Example |
|---|---|
| File presence | `package.json` exists → `signal.file.package.json = true` |
| JSON value | `package.json → dependencies.next` → `signal.json.package.json.dependencies.next = "^14"` |
| File glob | `*.config.js` present → `signal.glob.*.config.js = ["tailwind.config.js"]` |
| Lockfile | `pnpm-lock.yaml` → `signal.file.pnpm-lock.yaml = true` |
| Directory | `src/app/` exists → `signal.dir.src/app = true` |

**What it does NOT do:**

- It does not infer `framework: next` from `package.json`
- It does not maintain a list of known frameworks
- It never maps signals to meaning — that is the generator's job

Signals are exposed as `{{signal.*}}` variables.

---

### Generators Define Their Own Detection

Each generator declares what signals identify the project it belongs to, using a `detects` block:

```json
{
  "name": "next-app",
  "type": "project",
  "detects": [
    { "signal": "file.package.json", "exists": true },
    { "signal": "json.package.json.dependencies.next", "exists": true }
  ]
}
```

```json
{
  "name": "flutter-app",
  "type": "project",
  "detects": [
    { "signal": "file.pubspec.yaml", "exists": true }
  ]
}
```

```json
{
  "name": "django-app",
  "type": "project",
  "detects": [
    { "signal": "file.manage.py", "exists": true },
    { "signal": "file.requirements.txt", "exists": true }
  ]
}
```

xo core runs all installed generators' `detects` rules against the collected signals and sets `{{system.template}}` to the matched generator name. **xo core contains zero framework knowledge.**

---

### Detection Rule Operators

```json
{ "signal": "file.package.json", "exists": true }
{ "signal": "json.package.json.dependencies.next", "exists": true }
{ "signal": "json.package.json.dependencies.next", "matches": "^\\d+\\.\\d+" }
{ "signal": "file.pubspec.yaml", "exists": false }
```

Supported operators: `exists`, `matches`, `equals`

Multiple rules in `detects` are AND-ed together.

---

### `config-manager`

- Reads `xo.config.json` from project root
- Writes missing keys when a `requires` prompt is answered
- Writes `template` key when `xo create` runs
- Exposes values as `{{config.*}}` variables

---

### `rule-validator`

- Checks all `requires` keys exist in config (or triggers prompts)
- Checks no `conflicts` generators are in `.xo/state.json`
- Checks `provides` tags to avoid redundant installs
- Runs `detects` rules to verify compatibility before `xo add`

---

### `prompt-engine`

- Evaluates `when` conditions before showing each prompt
- Exposes answers as `{{prompt.*}}` variables
- Built on top of inquirer

---

### `generator-runner`

The central orchestrator. Calls all other modules in lifecycle order. Handles recursive dependency resolution without cycles.

---

### `action-runner`

Dispatches to the correct handler based on `type`. Evaluates `if` conditions before executing. Handles idempotency checks.

---

### `file-editor`

Handles all file mutation actions: `copy`, `append`, `inject`, `replace`, `json`, `env`, `ast-add-import`. Each operation reads current state before writing to ensure idempotency.

---

### `template-engine`

Renders `.hbs` or `.ejs` template files with the merged variable context (`prompt`, `config`, `env`, `signal`, `system`).

---

### `script-runner`

Executes `command` and `script` actions. Streams stdout/stderr to the terminal. Runs in the project root directory.

---

### `state-manager`

Reads and writes `.xo/state.json`. Tracks installed features and supports `xo undo` by storing pre-action snapshots.

---

## Variable Namespaces

| Namespace | Source |
|---|---|
| `{{prompt.*}}` | Answers collected from user this session |
| `{{config.*}}` | Values from `xo.config.json` |
| `{{env.*}}` | Environment variables |
| `{{signal.*}}` | Raw signals collected by signal-scanner |
| `{{system.*}}` | Derived values: matched template, packageManager, etc. |

### Variable Resolution Order

```
1. prompt answers      (highest priority)
2. xo.config.json
3. environment vars
4. signal-scanner output (lowest priority)
```

---

## Generator Resolution

Generators are looked up in this order:

```
1. local  → .xo/generators/<name>/generator.json
2. global → ~/.xo/generators/<name>/generator.json
3. registry → xo registry (future)
```

---

## Why This Scales Forever

| Old approach | xo approach |
|---|---|
| xo core knows Next.js | next-app generator knows Next.js |
| xo core knows Flutter | flutter-app generator knows Flutter |
| new framework = update xo | new framework = new generator, zero core changes |
| hardcoded detection table | pluggable signal + detects rules |

xo core is a runner. Knowledge lives in generators.
