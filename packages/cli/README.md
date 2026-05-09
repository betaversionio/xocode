# xocode

**xo** — the git of code generation. A universal, declarative, idempotent generator engine for any project, any framework, any language.

```
npm install -g xocode
```

## Commands

### `xo create <template>`

Scaffold a new project from a template generator.

```bash
xo create my-org/nextjs-starter
xo create my-org/nestjs-api --dir ./my-app
xo create ./local-generator
```

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview every action without writing any files |
| `--dir <path>` | Target directory (defaults to current directory) |

---

### `xo add <feature>`

Add a feature generator to an existing project.

```bash
xo add my-org/shadcn-setup
xo add my-org/auth-jwt
xo add my-org/docker --dry-run
```

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview every action without writing any files |

xo validates `requires` and `conflicts` rules before running — it will error if a prerequisite generator has not been applied or a conflicting one already has.

---

### `xo run <name>`

Run a generator regardless of its declared type. Useful for one-off generators that don't fit `create` / `add`.

```bash
xo run my-org/scaffold-component
```

---

### `xo undo`

Revert the most recent `xo create`, `xo add`, or `xo run` operation. Files that were created are deleted; files that were modified are restored to their prior content.

```bash
xo undo
```

---

### `xo history`

List every generator that has been applied in the current project, in order.

```bash
xo history
```

```
Applied generators:

  a1b2c3d4  my-org/nextjs-starter                          1/15/2025, 10:32:00 AM
  e5f6a7b8  my-org/shadcn-setup                            1/15/2025, 10:45:12 AM
  c9d0e1f2  my-org/auth-jwt                                1/15/2025, 11:02:44 AM
```

---

## How generators are resolved

When you run `xo add owner/repo`, xo looks for `generator.json` in this order:

1. **Local path** — if the name starts with `./` or `/`, loads from that path directly
2. **Project-local** — `.xo/generators/<name>/generator.json` in the current directory
3. **Global cache** — `~/.xo/generators/<name>/generator.json`
4. **GitHub** — fetches `https://raw.githubusercontent.com/<owner>/<repo>/main/generator.json` and caches it globally

The name `owner/repo/subpath` maps to `https://raw.githubusercontent.com/owner/repo/main/subpath/generator.json`.

---

## Writing a generator

A generator is a folder containing a `generator.json` manifest and any template files it needs.

```
my-generator/
  generator.json
  templates/
    index.ts.hbs
    README.md.hbs
```

**`generator.json`**

```json
{
  "name": "my-org/react-component",
  "type": "feature",
  "requires": ["my-org/react-setup"],
  "detects": [
    { "signal": "pkg:react", "exists": true }
  ],
  "prompts": [
    {
      "name": "componentName",
      "type": "input",
      "message": "Component name?"
    },
    {
      "name": "withTests",
      "type": "confirm",
      "message": "Add a test file?"
    }
  ],
  "actions": [
    {
      "type": "template",
      "source": "templates/index.ts.hbs",
      "target": "src/components/{{pascalCase componentName}}/index.tsx"
    },
    {
      "type": "template",
      "source": "templates/test.ts.hbs",
      "target": "src/components/{{pascalCase componentName}}/index.test.tsx",
      "if": "withTests"
    }
  ]
}
```

### Generator fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Unique registry name (e.g. `owner/repo`) |
| `type` | `"project"` \| `"feature"` | `project` = new scaffolds, `feature` = adds to existing |
| `requires` | `string[]` | Generators that must already be applied |
| `conflicts` | `string[]` | Generators that must NOT be applied |
| `provides` | `string[]` | Logical capabilities this generator provides |
| `detects` | `DetectRule[]` | Signal rules that must match for this generator to apply |
| `prompts` | `Prompt[]` | Interactive questions asked before running actions |
| `actions` | `Action[]` | Ordered list of file/command operations |

### Prompt types

| Type | Renders as |
|------|-----------|
| `input` | Free-text input |
| `confirm` | Yes / No |
| `select` | Single-choice list |
| `multiselect` | Multi-choice checkbox list |

All prompts support a `when` field (a JavaScript expression string) to conditionally show the prompt based on prior answers or project signals.

### Action types

| Type | What it does |
|------|-------------|
| `copy` | Copy a file from the generator directory as-is |
| `template` | Render a Handlebars template and write to target |
| `append` | Append content to an existing file |
| `inject` | Insert content `after` or `before` a marker string |
| `replace` | Regex find-and-replace inside a file |
| `json` | Deep-merge a JSON object into a JSON file |
| `env` | Set or update a key in a `.env` file |
| `ast-add-import` | Add a named or default import via AST (TypeScript files) |
| `command` | Run a shell command |
| `script` | Run a script file from the generator directory |
| `xo-call` | Invoke another generator (handled by the runner) |

Every action supports an `if` field — a JavaScript expression evaluated against the merged context of signals + prompt answers. The action is skipped when it evaluates to falsy.

### Template variables

Inside `.hbs` template files and in any `target` path, you can use `{{variableName}}`. Variables come from:

- Project signals (e.g. `{{framework}}`, `{{packageManager}}`)
- `xo.config.json` values
- Prompt answers

Built-in Handlebars helpers: `capitalize`, `camelCase`, `kebabCase`, `snakeCase`, `pascalCase`, `eq`, `ne`, `or`, `and`.

---

## Project state

xo writes two files to your project:

- **`xo.config.json`** — records the applied template and features for future compatibility checks
- **`.xo/state.json`** — tracks every operation with before-snapshots for `xo undo`

Both files should be committed to version control.

---

## Requirements

- Node.js >= 20
