# Action System Reference

Actions are the operations a generator performs. They run in order after prompts are collected.

All actions support an optional `if` condition:

```json
{
  "type": "command",
  "run": "npm install pg",
  "if": "database == \"postgres\""
}
```

Supported `if` operators: `==`, `!=`, `&&`, `||`

---

## File Operations

### `copy`

Copies a file from the generator's `templates/` directory to the project.

```json
{
  "type": "copy",
  "from": "templates/button.tsx",
  "to": "src/components/button.tsx"
}
```

---

### `template`

Renders a Handlebars/EJS template file and writes the output to the project.

```json
{
  "type": "template",
  "from": "templates/service.hbs",
  "to": "src/{{prompt.moduleName}}/{{prompt.moduleName}}.service.ts"
}
```

---

### `append`

Appends content to the end of a file. Creates the file if it does not exist.

```json
{
  "type": "append",
  "file": ".env.example",
  "content": "STRIPE_SECRET_KEY=\nSTRIPE_WEBHOOK_SECRET=\n"
}
```

---

### `inject`

Inserts content at a specific location within a file, identified by a marker string.

After a marker:

```json
{
  "type": "inject",
  "file": "app.module.ts",
  "after": "imports: [",
  "content": "PaymentModule,"
}
```

Before a marker:

```json
{
  "type": "inject",
  "file": "src/index.ts",
  "before": "export default app",
  "content": "import './payment';"
}
```

---

### `replace`

Finds an exact string and replaces it.

```json
{
  "type": "replace",
  "file": "config.ts",
  "find": "DEBUG=false",
  "replace": "DEBUG=true"
}
```

---

### `json`

Reads a JSON file, sets a value at a dot-notation path, and writes it back.

```json
{
  "type": "json",
  "file": "package.json",
  "path": "dependencies.stripe",
  "value": "^14.0.0"
}
```

Deep paths are created if missing:

```json
{
  "type": "json",
  "file": "tsconfig.json",
  "path": "compilerOptions.paths.@payment",
  "value": ["./src/payment/index.ts"]
}
```

---

### `env`

Adds variables to an `.env` file. Skips any key that already exists (idempotent).

```json
{
  "type": "env",
  "file": ".env.example",
  "variables": {
    "STRIPE_SECRET_KEY": "",
    "STRIPE_WEBHOOK_SECRET": ""
  }
}
```

---

## Code Actions

### `ast-add-import`

Adds an import statement to a TypeScript/JavaScript file using AST manipulation. No-ops if the import already exists.

```json
{
  "type": "ast-add-import",
  "file": "src/app.module.ts",
  "import": "PaymentModule",
  "from": "./payment/payment.module"
}
```

---

## Execution Actions

### `command`

Runs a shell command in the project root.

```json
{
  "type": "command",
  "run": "pnpm install stripe"
}
```

With condition:

```json
{
  "type": "command",
  "run": "npm install pg",
  "if": "database == \"postgres\""
}
```

---

### `script`

Runs a shell script file from the generator's `scripts/` directory, or an inline script.

Run a file:

```json
{
  "type": "script",
  "file": "scripts/post-install.sh"
}
```

Inline script:

```json
{
  "type": "script",
  "run": "echo 'Setting up...' && chmod +x ./bin/cli"
}
```

---

## Composition Actions

### `xo-call`

Calls another xo generator from within the current generator.

```json
{
  "type": "xo-call",
  "command": "add",
  "target": "ui/button"
}
```

Generators declared in `dependencies` are resolved via `xo-call` automatically before any actions run.

---

## Idempotency Rules

| Action | Guarantee |
|---|---|
| `copy` | Skips if target file already exists and is identical |
| `template` | Skips if rendered output matches existing file |
| `append` | Checks for duplicate content before appending |
| `inject` | No-ops if marker content is already present |
| `replace` | No-ops if the find string is not found |
| `json` | Merges; does not overwrite existing keys unless value differs |
| `env` | Skips keys that already exist in the file |
| `ast-add-import` | No-ops if import already present |
| `command` | Caller's responsibility — use `if` conditions to guard |
