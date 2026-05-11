<div align="center">
  <img src="https://raw.githubusercontent.com/betaversionio/xocode/main/apps/web/public/android-chrome-512x512.png" width="96" alt="xo logo" />
  <h1>xo — Local Workflow Engine for Developers</h1>
  <p>GitHub Actions for your local machine.</p>
</div>

---

`xo` is a local workflow engine for project scaffolding, feature addition, and task automation. Think of it as GitHub Actions — but running on your machine, against your project.

Define reusable **actions**, compose them into **workflows**, share them through the xo registry — all in plain YAML.

---

## Install

```bash
npm install -g @xo-code/cli
```

Then use it as `xo`:

```bash
xo --version
xo add ui/button
```

---

## Quick Start

```bash
# From the registry (registered name)
xo add payment/stripe
xo add ui/button

# Directly from GitHub — no registration needed
xo add @github/my-org/xo-stripe
xo add @github/my-org/xo-ui/button          # subpath (multi-component repo)
xo add @github/my-org/xo-ui/button@v1.2.0   # pinned to tag
xo add @github/my-org/xo-ui/button#dev      # pinned to branch
```

| Command | What it does |
|---|---|
| `xo create <template>` | Scaffold a new project |
| `xo add <feature>` | Add a feature to an existing project |
| `xo run <task>` | Run a named task |
| `xo undo` | Revert the last operation |

---

## How It Works

xo has two core concepts: **actions** and **workflows**.

**Actions** are atomic, reusable units of work. They accept `with:` inputs and produce `outputs`. Built-in actions are prefixed `xo/`. You can also write custom actions as YAML composites or Node.js scripts.

**Workflows** compose actions into jobs with inputs, conditionals, and dependency ordering — exactly like GitHub Actions workflow files.

```yaml
# workflow.yaml (lives in a generator repo on GitHub)
name: payment/stripe
on: [add]

inputs:
  secretKey:
    prompt: "Stripe secret key?"
    required: true

jobs:
  detect:
    steps:
      - uses: xo/detect-pm        # outputs: { value: "pnpm" }
        id: pm
      - uses: xo/pkg-installed    # outputs: { installed: true }
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

      - if: "steps.hasNext.outputs.installed == true"
        uses: xo/copy
        with:
          from: templates/stripe-route.ts
          to: app/api/stripe/route.ts

      - run: "{{steps.pm.outputs.value}} db:push"
```

---

## Custom Actions

Package reusable logic as YAML composites or Node.js scripts and reference them from any workflow.

**Composite action** (`./actions/add-barrel.yaml`):
```yaml
name: add-barrel-export
inputs:
  exportName:
    prompt: "Export name?"
outputs:
  exportLine:
    value: "export { default as {{inputs.exportName}} } from './{{inputs.exportName}}';"
steps:
  - uses: xo/append
    with:
      file: src/components/index.ts
      content: "export { default as {{inputs.exportName}} } from './{{inputs.exportName}}';"
```

**Script action** (`./actions/validate.js`):
```js
export default async function run({ inputs, cwd, dryRun }) {
  // full Node.js — call APIs, read files, anything
  return { valid: true };
}
```

**Published action** (shared via GitHub):
```yaml
- uses: @github/my-org/xo-ensure-ts@v1.0.0
  with:
    strict: "true"
```

---

## Local Generator Development

Test a generator locally without publishing using `xo link`:

```bash
cd ~/projects/xo-button
xo link                    # links ui/button → this directory

# from any project:
xo add ui/button           # resolves to your local directory
```

---

## CLI Output

```
$ xo add payment/stripe

Running workflow: payment/stripe

  job: detect
    ✔ xo/detect-pm → pnpm
    ✔ xo/pkg-installed(next) → true (^14.0.0)
  job: install
    ✔ xo/install-pkg → stripe
    ✔ xo/env → STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
    ✔ xo/copy → app/api/stripe/route.ts
    ✔ run: pnpm db:push

✔ payment/stripe added successfully
  Operation ID: a3f1c2d4
  Run xo undo to revert.
```

---

## Documentation

| Doc | Description |
|---|---|
| [CLI Reference](https://github.com/betaversionio/xocode/blob/main/docs/cli.md) | All commands and flags |
| [Workflow Reference](https://github.com/betaversionio/xocode/blob/main/docs/workflows.md) | `workflow.yaml` full schema |
| [Action Reference](https://github.com/betaversionio/xocode/blob/main/docs/actions.md) | Built-in + custom actions |
| [Generator Reference](https://github.com/betaversionio/xocode/blob/main/docs/generators.md) | Repo structure, registry, writing generators |

---

## Requirements

- Node.js >= 18
