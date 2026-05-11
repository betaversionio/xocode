# Generator Reference

A generator is a GitHub repository that contains one or more workflows, templates, and optional scripts. Generators are published to the xo registry and invoked by running `xo add <name>`, `xo create <name>`, or `xo run <name>`.

There are two repo roles in the xo ecosystem:

| Role | What it is |
|---|---|
| **Generator repo** | Provides workflows and templates. Lives on GitHub. |
| **Project repo** | Uses xo. A normal project that runs `xo add` commands. |

---

## Generator Repo Structure

### Single-trigger generator

Use this when your generator only responds to one command (e.g. `xo add`).

```
xo-stripe/                         ← GitHub: my-org/xo-stripe
├── workflow.yaml                   ← entry point
├── templates/
│   ├── stripe-route.ts             ← copied into the user's project
│   └── stripe-webhook.ts
└── scripts/
    └── post-install.sh
```

### Multi-trigger generator

Use `workflows/` when you want to handle both `xo add` and `xo create` from the same repo.

```
xo-stripe/
├── workflows/
│   ├── add.yaml                    ← xo add payment/stripe
│   └── create.yaml                 ← xo create payment/stripe
├── templates/
│   └── stripe-route.ts
└── scripts/
    └── post-install.sh
```

xo looks for `workflows/<trigger>.yaml` first, then falls back to `workflow.yaml` at the root.

### Multi-component repo (shadcn-style)

One repo can host many generators — each in its own subdirectory with its own `workflow.yaml` and `templates/`.

```
xo-ui/                              ← GitHub: my-org/xo-ui
├── button/
│   ├── workflow.yaml               ← name: ui/button
│   └── templates/
│       └── button.tsx
├── alert/
│   ├── workflow.yaml               ← name: ui/alert
│   └── templates/
│       └── alert.tsx
├── card/
│   ├── workflow.yaml               ← name: ui/card
│   └── templates/
│       └── card.tsx
└── shared/
    └── utils.ts                    ← shared across components
```

Register each component separately using `--path` to point at the subdirectory:

```bash
xo registry add ui/button --url https://github.com/my-org/xo-ui --path button
xo registry add ui/alert  --url https://github.com/my-org/xo-ui --path alert
xo registry add ui/card   --url https://github.com/my-org/xo-ui --path card
```

Then use them as normal:

```bash
xo add ui/button
xo add ui/alert
```

The `--path` entry is stored in `~/.xo/registry.json` and used when fetching from GitHub.

---

## Project Repo Structure

A project that uses xo needs no special setup. xo adds two things automatically:

```
my-next-app/                        ← any project
├── src/
├── package.json
├── xo.config.yaml                  ← written by xo, tracks project config
└── .xo/
    └── state.json                  ← operation history (powers xo undo)
```

`xo.config.yaml` after running a few workflows:

```yaml
template: next-app
packageManager: pnpm
features:
  - payment/stripe
  - auth/jwt
  - ui/button
ui:
  componentsDir: src/components/ui
```

`.xo/state.json` — do not edit manually:

```json
{
  "operations": [
    {
      "id": "a3f1c2d4-...",
      "timestamp": "2025-01-15T10:30:00Z",
      "generator": "payment/stripe",
      "type": "add",
      "files": [
        { "filePath": "app/api/stripe/route.ts", "action": "created" },
        { "filePath": ".env.example", "action": "modified", "before": "..." }
      ]
    }
  ]
}
```

---

## Global xo State (per machine)

```
~/.xo/
├── registry.json                   ← maps generator names → GitHub URLs
└── cache/
    └── my-org/
        └── xo-stripe/
            └── workflow.yaml       ← fetched from GitHub, cached locally
```

`~/.xo/registry.json`:

```json
{
  "payment/stripe": {
    "url": "https://github.com/my-org/xo-stripe",
    "addedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## Using a Generator — Two Ways

### 1. Direct GitHub reference (no registration needed)

Use the `@github/` prefix to run any public or private GitHub repo directly:

```bash
# Root workflow.yaml in the repo
xo add @github/my-org/xo-stripe

# Subpath — for multi-component repos (shadcn-style)
xo add @github/my-org/xo-ui/button

# Pin to a tag (cached forever — immutable)
xo add @github/my-org/xo-ui/button@v1.2.0

# Pin to a branch (always fetches latest)
xo add @github/my-org/xo-ui#main
xo add @github/my-org/xo-ui/button#dev

# Deep subpath
xo add @github/my-org/xo-ui/components/button@v2.0.0
```

For private repos, set `XO_GITHUB_TOKEN` in your environment:

```bash
XO_GITHUB_TOKEN=ghp_xxxx xo add @github/my-org/private-generators/auth
```

### 2. Registry (named shorthand)

Register a generator once, then use a short name forever:

```bash
xo registry add payment/stripe --url https://github.com/my-org/xo-stripe
xo add payment/stripe           # uses the registered name

# Multi-component repo — register each with --path
xo registry add ui/button --url https://github.com/my-org/xo-ui --path button
xo add ui/button
```

```bash
xo registry list
xo registry remove payment/stripe
```

---

## Testing a Generator Locally

### `xo link` — preferred for repeated testing

`xo link` works like `npm link`: register your local directory once, then use the generator by name from any project — no paths, no `--local` flag, and no re-linking when you edit files.

```bash
# Inside your generator repo
cd ~/projects/xo-button
xo link                    # reads name: ui/button from workflow.yaml
```

Now from any project:

```bash
xo add ui/button           # resolves to ~/projects/xo-button automatically
```

Changes to `workflow.yaml` or `templates/` are picked up immediately on the next run. When you're done testing:

```bash
cd ~/projects/xo-button
xo unlink                  # removes the link by matching the current directory
```

See all currently linked generators:

```bash
xo links
```

Pre-fill inputs to skip prompts during testing:

```bash
xo add ui/button -i componentName=Button -i variant=primary
xo add ui/button --dry-run -i componentName=TestCard
```

`--dry-run` previews all actions without writing files or running commands.

### `--local` — one-off runs

For a single run without linking, pass a path directly:

```bash
xo add ./path/to/my-generator --local
xo create ./path/to/my-template --local --dry-run
```

For repeated testing, prefer `xo link` — it's persistent and doesn't require a path each time.

---

## Writing a Generator

A generator's `workflow.yaml` is the entry point. See [Workflow Reference](workflows.md) for the full schema. For reusable logic beyond `xo/*` built-ins, see [Custom Actions](actions.md#custom-actions).

### Generator repo structure (with custom actions)

```
xo-button/
├── workflow.yaml             ← entry point
├── templates/
│   └── Button.tsx            ← rendered into the project
├── actions/
│   ├── add-barrel.yaml       ← composite action (composes xo/* steps)
│   └── validate-name.js      ← script action (custom Node.js logic)
└── scripts/
    └── post-install.sh
```

Actions in `actions/` are local to this generator. Reference them with `uses: ./actions/name.yaml` or `uses: ./actions/name.js`. To share an action across multiple generators, publish it as a GitHub action and reference it with `uses: @github/owner/repo`.

---

### Minimal example — add a UI component

```
xo-button/
├── workflow.yaml
└── templates/
    └── button.tsx
```

```yaml
# workflow.yaml
name: ui/button
on: [add]
description: Add a reusable Button component

detects:
  - pkg: react
    exists: true

inputs:
  componentName:
    prompt: "Component name?"
    default: Button

jobs:
  detect:
    steps:
      - uses: xo/file-exists
        id: hasComponentsDir
        with:
          path: "{{config.ui.componentsDir}}"

  copy:
    needs: [detect]
    steps:
      - uses: xo/copy
        with:
          from: templates/button.tsx
          to: "{{config.ui.componentsDir}}/{{inputs.componentName}}.tsx"
```

### Full example — add Stripe with multi-job orchestration

```
xo-stripe/
├── workflow.yaml
└── templates/
    ├── stripe-route.ts
    └── stripe-service.ts
```

```yaml
# workflow.yaml
name: payment/stripe
on: [add]
description: Add Stripe payment processing

detects:
  - file: package.json
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
    pattern: "^sk_(test|live)_[A-Za-z0-9]+$"   # optional regex validation

jobs:
  detect:
    steps:
      - uses: xo/detect-pm
        id: pm
        parallel: true
      - uses: xo/pkg-installed
        id: hasNext
        parallel: true
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

## `detects` — Pre-flight Compatibility Check

Declare `detects` rules to verify the project is compatible before inputs are collected or any steps run. These are simple file and package checks — xo does not auto-scan anything.

```yaml
detects:
  - file: package.json
    exists: true
  - pkg: next
    exists: true
```

Flutter example:

```yaml
detects:
  - file: pubspec.yaml
    exists: true
```

Multiple rules are AND-ed. Supported operators: `exists`, `equals`, `matches`.

For richer detection inside the workflow (detecting framework, language, specific config values), use detection actions in a `detect` job — see [Action Reference](actions.md#detection-actions).

---

## Input Validation

Workflow inputs support `pattern`, `min`, and `max` fields for lightweight validation before any steps run.

```yaml
inputs:
  projectName:
    prompt: "Project name?"
    type: text
    required: true
    pattern: "^[a-z][a-z0-9_]*$"   # regex — must start with a lowercase letter
    min: 2                            # minimum character length
    max: 50                           # maximum character length

  version:
    prompt: "Version?"
    type: text
    pattern: "^\\d+\\.\\d+\\.\\d+$"  # semver — e.g. 1.0.0
```

| Field | Type | Description |
|---|---|---|
| `pattern` | `string` | ECMAScript regex the value must satisfy |
| `min` | `number` | Minimum character length (text inputs) |
| `max` | `number` | Maximum character length (text inputs) |

Validation runs after the user types each value. A clear error message is shown and the prompt is re-displayed on failure.

---

## Dependencies, Conflicts, Provides

```yaml
dependencies:
  - database/postgres   # runs before this workflow automatically
  - auth/jwt

conflicts:
  - auth/firebase       # xo aborts if already installed

provides:
  - auth                # abstract capability tag
```
