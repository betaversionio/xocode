# Project Config Reference

xo maintains two files in your project automatically. You never need to edit them by hand.

---

## `xo.config.yaml`

Lives at the project root. Stores project-level settings that workflows read and write.

### Example

```yaml
template: next-app
packageManager: pnpm
features:
  - payment/stripe
  - auth/jwt
  - ui/button
ui:
  componentsDir: src/components/ui
  hooksDir: src/hooks
  libDir: src/lib
database:
  provider: postgres
  url: postgresql://localhost:5432/mydb
auth:
  provider: jwt
```

### Top-level fields

#### `template`

Written automatically by `xo create`. Records which template scaffolded the project.

```yaml
template: next-app
```

#### `features`

Updated automatically by `xo add`. Tracks which feature workflows have been applied.

```yaml
features:
  - payment/stripe
  - auth/jwt
```

#### Namespace blocks

Any generator can define its own namespace. Common ones:

```yaml
ui:
  componentsDir: src/components/ui
  hooksDir: src/hooks

database:
  provider: postgres
  url: postgresql://localhost:5432/mydb

auth:
  provider: jwt
```

### Auto-population

When a workflow declares `requires`, xo checks if that key exists in `xo.config.yaml`. If missing, xo prompts the user and writes the answer back automatically — the config file builds up over time as you run workflows.

```yaml
# in workflow.yaml
requires:
  - ui.componentsDir
```

---

## `.xo/state.json`

Lives at `.xo/state.json`. Tracks every operation for `xo undo` support. Do not edit manually.

```json
{
  "operations": [
    {
      "id": "a3f1c2d4-6e8f-...",
      "timestamp": "2025-01-15T10:30:00Z",
      "generator": "payment/stripe",
      "type": "add",
      "files": [
        {
          "filePath": "app/api/stripe/route.ts",
          "action": "created"
        },
        {
          "filePath": ".env.example",
          "action": "modified",
          "before": "NODE_ENV=development\n"
        }
      ]
    }
  ]
}
```

Each operation records the file state before changes so `xo undo` can restore it exactly.

---

## Context Variables

Variables available inside any string value in a workflow using `{{double-braces}}`.

| Namespace | Source |
|---|---|
| `{{inputs.*}}` | Input values collected during the current workflow run |
| `{{config.*}}` | Values from `xo.config.yaml` |
| `{{steps.<id>.outputs.*}}` | Outputs from a previous step that has an `id` |
| `{{env.*}}` | Environment variables |

### Examples

```yaml
# Use a collected input
to: "{{config.ui.componentsDir}}/{{inputs.componentName}}.tsx"

# Use a step output
run: "{{steps.pm.outputs.value}} add stripe"

# Use an environment variable
value: "{{env.DATABASE_URL}}"
```

### How detection works

xo does not auto-scan your project. Detection is done explicitly via actions in a `detect` job:

```yaml
jobs:
  detect:
    steps:
      - uses: xo/detect-pm      # → steps.pm.outputs.value = "pnpm"
        id: pm
      - uses: xo/detect-lang    # → steps.lang.outputs.value = "typescript"
        id: lang
      - uses: xo/pkg-installed  # → steps.hasNext.outputs.installed = true
        id: hasNext
        with:
          pkg: next
      - uses: xo/file-exists    # → steps.hasPrisma.outputs.exists = false
        id: hasPrisma
        with:
          path: prisma/schema.prisma

  install:
    needs: [detect]
    steps:
      - if: "steps.hasNext.outputs.installed == true"
        uses: xo/copy
        with:
          from: templates/next-route.ts
          to: app/api/stripe/route.ts
```

This keeps xo core generic — the engine knows nothing about frameworks or languages. Generators define their own detection logic.

---

## Global xo Config (per machine)

```
~/.xo/
├── registry.json        ← registered generator names → GitHub URLs
└── cache/               ← workflow YAMLs fetched from GitHub
    └── my-org/
        └── xo-stripe/
            └── workflow.yaml
```

Managed via `xo registry` commands — see [CLI Reference](cli.md).
