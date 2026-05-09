# CLI Reference

## Commands

### `xo create <template>`

Scaffold a new project from a template generator.

```bash
xo create next-app
xo create nestjs-api
xo create flutter-app
```

---

### `xo add <feature>`

Add a feature to an existing project.

```bash
xo add ui/button
xo add payment/stripe
xo add nestjs/payment-module
xo add auth/jwt
```

---

### `xo run <task>`

Run a named task defined in `xo.config.json` or the project's task list.

```bash
xo run build
xo run dev
xo run lint
```

---

## Flags

### `--dry-run`

Preview all actions without writing any files or running any commands.

```bash
xo add payment/stripe --dry-run
```

---

### `--preview`

Print a diff of all file changes before applying them.

```bash
xo add ui/button --preview
```

---

### `--undo`

Revert the last `xo add` or `xo create` operation using the state log.

```bash
xo undo
```

> Requires `.xo/state.json` to exist and contain a revertible snapshot.
