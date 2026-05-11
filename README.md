# xo — Local Workflow Engine for Developers

`xo` is a local workflow engine for project scaffolding, feature addition, and task automation. Think of it as GitHub Actions — but running on your machine, against your project.

Define reusable **actions**, compose them into **workflows**, share them through the xo registry — all in plain YAML.

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

**Actions** are atomic, reusable units of work. They accept `with:` inputs and produce `outputs`. Built-in actions are prefixed `xo/`.

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

## Two Repo Roles

| | Generator repo | Project repo |
|---|---|---|
| Lives on | GitHub | Your machine |
| Contains | `workflow.yaml`, `templates/`, `scripts/` | `xo.config.yaml`, `.xo/state.json` |
| Written by | Generator author | xo (automatically) |
| Registered via | `xo registry add <name> --url <github-url>` | — |
| Used via | `xo add <name>` | — |

**Generator repo** — what you publish:
```
xo-stripe/
├── workflow.yaml
└── templates/
    └── stripe-route.ts
```

**Project repo** — what xo adds to your project:
```
my-app/
├── xo.config.yaml      ← tracks template, features, config namespaces
└── .xo/
    └── state.json      ← operation history (powers xo undo)
```

---

## Mental Model

| GitHub Actions | xo |
|---|---|
| `.github/workflows/ci.yml` | `workflow.yaml` in a generator repo |
| `actions/checkout` | `xo/install-pkg`, `xo/copy`, `xo/detect-pm` |
| `on: push` | `on: [add]`, `on: [create]`, `on: [run]` |
| `steps.<id>.outputs.*` | `steps.<id>.outputs.*` |
| GitHub Marketplace | xo registry |

The key difference: GitHub Actions runs in CI/CD in the cloud. xo runs locally on your machine. Detection is explicit — generators define their own detection steps via `xo/detect-pm`, `xo/file-exists`, `xo/pkg-installed`. The engine core knows nothing about frameworks or languages.

---

## Why xo?

- **Familiar model** — if you know GitHub Actions, you already know xo
- **Truly generic** — the engine has zero framework knowledge; generators teach it everything
- **Explicit detection** — project info is detected via actions, not auto-scanned
- **Composable** — workflows call other workflows; step outputs feed later steps
- **Idempotent** — safe to run multiple times
- **Registry-backed** — publish and discover generators via GitHub

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
| [CLI Reference](docs/cli.md) | All commands and flags |
| [Workflow Reference](docs/workflows.md) | `workflow.yaml` full reference |
| [Action Reference](docs/actions.md) | Built-in actions and detection actions |
| [Generator Reference](docs/generators.md) | Repo structure, registry, writing generators |
| [Project Config](docs/config.md) | `xo.config.yaml`, `.xo/state.json`, context variables |

---

## Status

> v0.1 MVP — spec complete, implementation in progress.
