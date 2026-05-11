# Action Reference

Actions are reusable, atomic units of work. Steps in a workflow reference them with `uses:`.

There are two kinds of actions:

| Kind | Prefix | Where it lives |
|---|---|---|
| **Built-in** | `xo/` | Shipped with xo — no file needed |
| **Custom** | `./` or `@github/` | Your generator repo or a GitHub repo |

---

## Using an Action

```yaml
steps:
  - uses: xo/install-pkg        # built-in
    with:
      pkg: stripe

  - uses: xo/detect-pm          # built-in, produces outputs
    id: pm

  - uses: ./actions/setup.yaml  # custom composite action
    id: setup
    with:
      configFile: tailwind.config.ts

  - run: "{{steps.pm.outputs.value}} db:push"
```

Assign `id:` to any step to capture its outputs and reference them in later steps via `steps.<id>.outputs.<key>`.

---

## Custom Actions

Custom actions let you package reusable logic — either as YAML compositions of built-ins or as Node.js scripts — and reference them from any workflow in that generator repo, or publish them to GitHub for cross-generator reuse.

### Composite action (YAML)

A YAML file with `steps:` that composes `xo/*` built-ins. No code needed.

```
xo-button/
├── workflow.yaml
├── actions/
│   └── add-barrel.yaml   ← composite action
└── templates/
    └── Button.tsx
```

```yaml
# actions/add-barrel.yaml
name: add-barrel-export
description: Append a barrel export to an index file

inputs:
  exportName:
    prompt: "Export name?"
  filePath:
    prompt: "Source file path (without extension)?"

outputs:
  exportLine:
    value: "export { default as {{inputs.exportName}} } from './{{inputs.filePath}}';"

steps:
  - uses: xo/append
    with:
      file: src/components/index.ts
      content: "export { default as {{inputs.exportName}} } from './{{inputs.filePath}}';"
```

Reference it in `workflow.yaml`:

```yaml
- uses: ./actions/add-barrel.yaml
  id: barrel
  with:
    exportName: "{{inputs.componentName}}"
    filePath: "{{inputs.componentName}}"

# Use the output in a later step
- run: echo "Added: {{steps.barrel.outputs.exportLine}}"
```

Composite actions run in their own scoped context — their `steps.*` outputs are internal. Only values declared under `outputs:` are visible to the parent workflow.

---

### Script action (JS)

A plain `.js` file that exports an async function. Full Node.js — use any logic, call external APIs, read files, return outputs.

```
xo-button/
└── actions/
    └── log-info.js   ← script action
```

```js
// actions/log-info.js
export default async function run({ inputs, cwd, generatorDir, dryRun, env }) {
  const msg = `component "${inputs.componentName}" added to ${cwd}`;
  if (!dryRun) console.log(`    ✔ ${msg}`);
  return { message: msg };
}
```

Reference it in `workflow.yaml`:

```yaml
- uses: ./actions/log-info.js
  id: logger
  with:
    componentName: "{{inputs.componentName}}"

- run: echo "{{steps.logger.outputs.message}}"
```

The function receives:

| Field | Type | Description |
|---|---|---|
| `inputs` | `Record<string, unknown>` | Values resolved from `with:` + action defaults |
| `cwd` | `string` | Absolute path to the user's project |
| `generatorDir` | `string` | Absolute path to the action's directory |
| `dryRun` | `boolean` | Whether `--dry-run` was passed |
| `env` | `Record<string, string>` | `process.env` |

Return a plain object — every key becomes an output accessible as `steps.<id>.outputs.<key>`.

---

### Published action (GitHub)

An action in its own GitHub repo, shareable across generators. The repo must have an `action.yaml` at the root (or subpath).

```yaml
# @github/my-org/xo-ensure-ts — action.yaml
name: ensure-typescript
description: Installs TypeScript and writes tsconfig.json if missing

inputs:
  strict:
    default: "true"

steps:
  - uses: xo/pkg-installed
    id: hasTs
    with:
      pkg: typescript
  - if: "steps.hasTs.outputs.installed == false"
    uses: xo/install-pkg
    with:
      pkg: typescript
      dev: true
```

Reference it in any generator:

```yaml
- uses: @github/my-org/xo-ensure-ts
  with:
    strict: "true"

# Pin to a tag (cached forever)
- uses: @github/my-org/xo-ensure-ts@v1.2.0

# Subpath in a multi-action repo
- uses: @github/my-org/xo-actions/ensure-ts@v1.0.0
```

For private repos, set `XO_GITHUB_TOKEN` in your environment.

A GitHub action can also run a Node.js script. Declare `runs.using: node` and `runs.main`:

```yaml
# action.yaml
name: my-node-action
runs:
  using: node
  main: dist/index.js
```

xo fetches `dist/index.js` alongside `action.yaml` and executes it with the same function interface as local script actions.

---

### Choosing an action type

| You want to… | Use |
|---|---|
| Reuse a group of `xo/*` steps within one generator | Composite (`./actions/name.yaml`) |
| Run custom logic, call APIs, or do anything YAML can't express | Script (`./actions/name.js`) |
| Share an action across many generator repos | Published (`@github/owner/repo`) |

---

---

## Detection Actions

Detection actions inspect the project without modifying it. They always run — even in `--dry-run` mode — because they have no side effects. Assign an `id` to read their outputs in later steps.

### `xo/detect-pm`

Detects the package manager from lockfile presence.

```yaml
- uses: xo/detect-pm
  id: pm
  # outputs: { value: "pnpm" | "npm" | "yarn" | "bun" }
```

```yaml
- run: "{{steps.pm.outputs.value}} add stripe"
```

---

### `xo/detect-lang`

Detects the primary language of the project.

```yaml
- uses: xo/detect-lang
  id: lang
  # outputs: { value: "typescript" | "javascript" | "dart" | "go" | "rust" | "python" }
```

```yaml
- if: "steps.lang.outputs.value == 'typescript'"
  uses: xo/copy
  with:
    from: templates/config.ts
    to: src/config.ts
```

---

### `xo/file-exists`

Checks whether a file or directory exists at a path relative to the project root.

```yaml
- uses: xo/file-exists
  id: hasPrisma
  with:
    path: prisma/schema.prisma
  # outputs: { exists: true | false }
```

```yaml
- if: "steps.hasPrisma.outputs.exists == false"
  run: pnpm dlx prisma init
```

---

### `xo/pkg-installed`

Checks whether a package is in `dependencies`, `devDependencies`, or `peerDependencies`.

```yaml
- uses: xo/pkg-installed
  id: hasNext
  with:
    pkg: next
  # outputs: { installed: true | false, version: "^14.0.0" | null }
```

```yaml
- if: "steps.hasNext.outputs.installed == true"
  uses: xo/copy
  with:
    from: templates/next-route.ts
    to: app/api/stripe/route.ts
```

---

### `xo/read-json`

Reads a value from a JSON file at a dot-notation path.

```yaml
- uses: xo/read-json
  id: pkgName
  with:
    file: package.json
    path: name
  # outputs: { value: "my-app" }

- uses: xo/read-json
  id: nodeVersion
  with:
    file: package.json
    path: engines.node
  # outputs: { value: ">=18" | null }
```

---

## File Actions

### `xo/copy`

Copies a file from the generator's `templates/` directory to the project. Skips if destination already exists and is identical.

```yaml
- uses: xo/copy
  with:
    from: templates/button.tsx
    to: src/components/button.tsx
```

---

### `xo/template`

Renders a Handlebars/EJS template from `templates/` and writes the output. Skips if rendered output matches the existing file.

```yaml
- uses: xo/template
  with:
    from: templates/service.hbs
    to: "src/{{inputs.moduleName}}/{{inputs.moduleName}}.service.ts"
```

---

### `xo/append`

Appends content to a file. Creates the file if it does not exist. Checks for duplicate content before appending.

```yaml
- uses: xo/append
  with:
    file: .env.example
    content: "STRIPE_SECRET_KEY=\nSTRIPE_WEBHOOK_SECRET=\n"
```

---

### `xo/inject`

Inserts content at a specific location within a file, identified by a marker string. No-ops if the marker content is already present.

After a marker:

```yaml
- uses: xo/inject
  with:
    file: app.module.ts
    after: "imports: ["
    content: "PaymentModule,"
```

Before a marker:

```yaml
- uses: xo/inject
  with:
    file: src/index.ts
    before: "export default app"
    content: "import './payment';"
```

---

### `xo/replace`

Finds an exact string and replaces it. No-ops if the find string is not found.

```yaml
- uses: xo/replace
  with:
    file: config.ts
    find: "DEBUG=false"
    replace: "DEBUG=true"
```

---

### `xo/json`

Reads a JSON file, sets a value at a dot-notation path, and writes it back. Merges — does not overwrite existing keys unless the value differs.

```yaml
- uses: xo/json
  with:
    file: package.json
    path: dependencies.stripe
    value: "^14.0.0"
```

Deep paths are created if missing:

```yaml
- uses: xo/json
  with:
    file: tsconfig.json
    path: compilerOptions.paths.@payment
    value:
      - ./src/payment/index.ts
```

---

### `xo/env`

Adds variables to a `.env` file. Skips any key that already exists.

```yaml
- uses: xo/env
  with:
    file: .env.example
    variables:
      STRIPE_SECRET_KEY: ""
      STRIPE_WEBHOOK_SECRET: ""
```

---

## Code Actions

### `xo/ast-import`

Adds an import statement to a TypeScript/JavaScript file using AST manipulation. No-ops if the import already exists.

```yaml
- uses: xo/ast-import
  with:
    file: src/app.module.ts
    import: PaymentModule
    from: ./payment/payment.module
```

---

## Package Actions

### `xo/install-pkg`

Installs a package using the auto-detected package manager. If a `detect-pm` step with `id: pm` ran earlier in the workflow, its output is used directly. Skips if the package is already in `dependencies` or `devDependencies`.

```yaml
- uses: xo/install-pkg
  with:
    pkg: stripe
    dev: false
```

---

## Execution Actions

### `xo/run`

Runs a shell command in the project root. Equivalent to an inline `run:` step.

```yaml
- uses: xo/run
  with:
    command: pnpm db:push
```

Inline shorthand:

```yaml
- run: pnpm db:push
```

---

### `xo/script`

Runs a shell script file from the generator's `scripts/` directory.

```yaml
- uses: xo/script
  with:
    file: scripts/post-install.sh
```

---

## Idempotency Rules

| Action | Guarantee |
|---|---|
| `xo/copy` | Skips if destination already exists and is identical |
| `xo/template` | Skips if rendered output matches existing file |
| `xo/append` | Checks for duplicate content before appending |
| `xo/inject` | No-ops if marker content is already present |
| `xo/replace` | No-ops if find string is not found |
| `xo/json` | Merges; does not overwrite existing keys unless value differs |
| `xo/env` | Skips keys that already exist in the file |
| `xo/ast-import` | No-ops if import already present |
| `xo/install-pkg` | Skips if package already in `dependencies` or `devDependencies` |
| `xo/run` / `run:` | Caller's responsibility — use `if` conditions to guard |
| Detection actions | Read-only — always safe to re-run |
