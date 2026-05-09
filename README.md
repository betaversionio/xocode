# xo — Universal Generator Engine

`xo` is a cross-language, declarative CLI tool for project scaffolding, feature addition, and task automation. Think of it as a single replacement for `create-*` scripts, Yeoman, Nx generators, and shadcn — all driven by plain JSON.

---

## Quick Summary

| Command | What it does |
|---|---|
| `xo create <template>` | Scaffold a new project |
| `xo add <feature>` | Add a feature to an existing project |
| `xo run <task>` | Run a named task |

```bash
xo create next-app
xo add payment/stripe
xo add ui/button
xo run build
```

---

## Why xo?

- **Cross-language** — works with Node, Java, Python, Flutter, and more
- **Declarative** — generators are plain JSON files, no custom code needed
- **Composable** — generators can call other generators
- **Idempotent** — safe to run multiple times; no duplicate imports, env vars, or deps
- **Introspective** — auto-detects your framework, package manager, and tooling

---

## How It Works

1. You run `xo add payment/stripe`
2. xo detects your project (Next.js, pnpm, Tailwind, etc.)
3. It loads the `payment/stripe` generator JSON
4. Prompts you for any missing info
5. Runs dependency generators first
6. Executes actions: copies files, injects code, updates `.env`, installs packages
7. Saves state to `.xo/state.json`

---

## Generator at a Glance

```json
{
  "name": "ui/button",
  "type": "feature",
  "requires": ["ui.componentsDir"],
  "dependencies": ["ui/base"],
  "prompts": [
    {
      "name": "componentName",
      "type": "input",
      "message": "Component name"
    }
  ],
  "actions": [
    {
      "type": "copy",
      "from": "templates/button.tsx",
      "to": "{{config.ui.componentsDir}}/{{componentName}}.tsx"
    }
  ]
}
```

---

## Project Config

```json
{
  "template": "next-app",
  "framework": "next",
  "packageManager": "pnpm",
  "ui": {
    "componentsDir": "src/components/ui"
  }
}
```

---

## CLI Output

```
$ xo add payment/stripe

✔ detected Next.js project
✔ updating .env.example
✔ installing stripe
✔ updating app.module.ts
✔ done
```

---

## Documentation

| Doc | Description |
|---|---|
| [CLI Reference](docs/cli.md) | All commands and flags |
| [Generator Config](docs/generators.md) | `generator.json` full reference |
| [Action System](docs/actions.md) | All action types with examples |
| [Project Config](docs/config.md) | `xo.config.json` reference |
| [Architecture](docs/architecture.md) | Engine internals and module map |
| [Roadmap](docs/roadmap.md) | MVP phases and build order |

---

## Implementation Stack (Node)

| Concern | Library |
|---|---|
| CLI | commander |
| Prompts | inquirer |
| Templates | handlebars / ejs |
| File system | fs-extra |
| AST editing | ts-morph |

---

## Status

> v0.1 MVP — spec complete, implementation in progress.
