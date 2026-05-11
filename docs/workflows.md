# Workflow Reference

A workflow is a YAML file that composes actions into a sequence with inputs, conditionals, and jobs. Workflows are the core unit of xo — every `xo add`, `xo create`, and `xo run` command executes a workflow.

---

## `workflow.yaml` — Full Reference

```yaml
name: payment/stripe
on: [add]
description: Add Stripe payment processing to an existing project

detects:
  - file: package.json
    exists: true
  - pkg: next
    exists: true

dependencies:
  - auth/jwt

conflicts:
  - payment/paddle

provides:
  - payment

inputs:
  secretKey:
    prompt: "Stripe secret key?"
    required: true
  webhookSecret:
    prompt: "Stripe webhook secret?"
    required: false

jobs:
  detect:
    steps:
      - uses: xo/detect-pm
        id: pm
      - uses: xo/pkg-installed
        id: hasNext
        with:
          pkg: next

  install:
    needs: [detect]
    steps:
      - uses: xo/install-pkg
        with:
          pkg: stripe

      - uses: xo/env
        with:
          file: .env.example
          variables:
            STRIPE_SECRET_KEY: ""
            STRIPE_WEBHOOK_SECRET: ""

  configure:
    needs: [install]
    steps:
      - if: "steps.hasNext.outputs.installed == true"
        uses: xo/copy
        with:
          from: templates/stripe-route.ts
          to: app/api/stripe/route.ts

      - uses: xo/ast-import
        with:
          file: src/app.module.ts
          import: StripeModule
          from: ./stripe/stripe.module

      - run: "{{steps.pm.outputs.value}} db:push"
```

---

## Fields

### `name`

Namespaced identifier. Used when calling `xo add <name>` or `xo create <name>`.

```yaml
name: payment/stripe
```

---

### `on`

Trigger(s) that activate this workflow.

```yaml
on: [add]           # xo add payment/stripe
on: [create]        # xo create payment/stripe
on: [run]           # xo run payment/stripe
on: [add, run]      # both
```

---

### `inputs`

Named inputs collected interactively from the user before jobs run.

```yaml
inputs:
  componentName:
    prompt: "Component name?"
    required: true
  variant:
    prompt: "Choose variant"
    type: select
    choices: [primary, secondary, ghost]
    default: primary
  confirmSetup:
    prompt: "Continue with setup?"
    type: confirm
```

Input types:

| Type | Description |
|---|---|
| `input` | Free text (default) |
| `select` | Single choice from a list |
| `confirm` | Yes / no |
| `multiselect` | Multiple choices |

---

### `jobs`

A workflow contains one or more named jobs. Jobs run sequentially. Use `needs` to declare an explicit dependency order.

```yaml
jobs:
  detect:
    steps: [...]
  install:
    needs: [detect]
    steps: [...]
  configure:
    needs: [install]
    steps: [...]
```

---

### `steps`

Each step runs a `uses` action or an inline `run` command.

**Using an action:**

```yaml
- uses: xo/install-pkg
  with:
    pkg: stripe
```

**Running a shell command:**

```yaml
- run: pnpm db:push
```

**Naming a step (for logs):**

```yaml
- name: Install Stripe SDK
  uses: xo/install-pkg
  with:
    pkg: stripe
```

**Capturing step output with `id`:**

```yaml
- uses: xo/detect-pm
  id: pm
```

Later steps reference it as `steps.pm.outputs.value`.

**Conditional step:**

```yaml
- if: "steps.hasNext.outputs.installed == true"
  uses: xo/copy
  with:
    from: templates/route.ts
    to: app/api/stripe/route.ts
```

`if` expressions support `==`, `!=`, `&&`, `||`.

---

## Step Outputs

Detection actions produce outputs that later steps can read. Assign an `id` to a step to capture its outputs.

```yaml
- uses: xo/detect-pm
  id: pm
  # outputs: { value: "pnpm" }

- uses: xo/pkg-installed
  id: hasNext
  with:
    pkg: next
  # outputs: { installed: true, version: "^14.0.0" }

- uses: xo/file-exists
  id: hasPrisma
  with:
    path: prisma/schema.prisma
  # outputs: { exists: false }
```

Reference outputs in `if` conditions:

```yaml
- if: "steps.hasNext.outputs.installed == true"
  uses: xo/copy
  ...

- if: "steps.hasPrisma.outputs.exists == false"
  run: pnpm dlx prisma init
```

Reference outputs in string values:

```yaml
- run: "{{steps.pm.outputs.value}} add stripe"
- uses: xo/copy
  with:
    to: "{{steps.lang.outputs.value == 'typescript' ? 'src/stripe.ts' : 'src/stripe.js'}}"
```

---

## Context Variables

Variables available inside any string value using `{{double-braces}}`.

| Namespace | Source |
|---|---|
| `{{inputs.*}}` | Answers from the input prompts |
| `{{config.*}}` | Values from `xo.config.yaml` |
| `{{steps.<id>.outputs.*}}` | Outputs from a previous step with that `id` |
| `{{env.*}}` | Environment variables |

### Examples

```yaml
- uses: xo/copy
  with:
    from: templates/component.tsx
    to: "{{config.ui.componentsDir}}/{{inputs.componentName}}.tsx"

- run: "{{steps.pm.outputs.value}} add {{inputs.pkg}}"

- uses: xo/env
  with:
    file: .env.example
    variables:
      DB_URL: "{{env.DATABASE_URL}}"
```

---

## `detects` — Pre-flight Check

Runs before inputs are collected. Use for quick compatibility checks — file existence and package presence only.

```yaml
detects:
  - file: package.json    # checks if file exists at this path
    exists: true
  - pkg: react            # checks package.json dependencies
    exists: true
```

For richer detection inside the workflow (framework, language, config values), use detection actions in a `detect` job. See [Action Reference](actions.md#detection-actions).

---

## Dependencies, Conflicts, Provides

```yaml
dependencies:
  - database/postgres                   # registry name — runs before this workflow
  - "@github/my-org/xo-base"           # direct GitHub ref
  - "@github/my-org/xo-base@v1.0.0"   # pinned to a tag

conflicts:
  - auth/firebase       # xo aborts if already installed

provides:
  - auth                # abstract capability tag
```

---

## Idempotency

Workflows are safe to re-run. Each built-in action handles idempotency — see [Action Reference](actions.md#idempotency-rules). For `run:` steps, guard with `if` conditions to prevent duplicate execution.
