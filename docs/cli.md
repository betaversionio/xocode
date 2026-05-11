# CLI Reference

## Commands

### `xo create <template>`

Scaffold a new project by running the generator's `create` workflow.

```bash
xo create next-app
xo create nestjs-api
xo create flutter-app
xo create @github/my-org/xo-next-app
```

---

### `xo add <feature>`

Add a feature to an existing project by running the generator's `add` workflow.

```bash
# From the registry
xo add ui/button
xo add payment/stripe

# Directly from GitHub — no registration needed
xo add @github/my-org/xo-stripe
xo add @github/my-org/xo-ui/button
xo add @github/my-org/xo-ui/button@v1.2.0
```

---

### `xo run <task>`

Run a named task by executing the generator's `run` workflow.

```bash
xo run build
xo run db:migrate
xo run lint
```

---

### `xo undo`

Revert the last `xo add` or `xo create` operation.

```bash
xo undo
```

---

### `xo history`

List all workflows applied in the current project.

```bash
xo history
```

---

## Local Development (link / unlink)

These commands are for **generator authors** building and testing a generator locally before publishing.

### `xo link [name]`

Link the current directory as a named generator. Run this inside your generator repo.

xo reads the `name` field from `workflow.yaml` automatically — pass a name explicitly only if you want to override it.

```bash
cd ~/projects/xo-button
xo link                    # reads name: ui/button from workflow.yaml
xo link ui/button          # same, explicit
```

Once linked, `xo add ui/button` in **any project** resolves to your local directory. No `--local` flag, no path, no publishing.

Changes to `workflow.yaml` or `templates/` are picked up immediately on the next run — no re-linking needed.

---

### `xo unlink [name]`

Remove the link for the current directory. Run inside the generator repo.

```bash
cd ~/projects/xo-button
xo unlink                  # finds the link by matching the current directory
xo unlink ui/button        # explicit name
```

---

### `xo links`

List all locally linked generators.

```bash
xo links

# Linked generators:
#   ui/button    /Users/me/projects/xo-button   1/15/2025
#   auth/jwt     /Users/me/projects/xo-auth     1/14/2025
```

---

## Registry

### `xo registry add <name>`

Register a generator from a GitHub URL.

```bash
# Single-workflow repo
xo registry add payment/stripe --url https://github.com/my-org/xo-stripe

# Multi-component repo — use --path for the subdirectory
xo registry add ui/button --url https://github.com/my-org/xo-ui --path button
xo registry add ui/alert  --url https://github.com/my-org/xo-ui --path alert
```

---

### `xo registry list`

List all registered generators.

```bash
xo registry list
```

---

### `xo registry remove <name>`

Remove a generator from the local registry.

```bash
xo registry remove payment/stripe
```

---

## Cache

xo caches generator files fetched from GitHub in `~/.xo/cache/`. The cache commands let you inspect and clear these cached files.

### `xo cache list`

Lists all cached generators.

```bash
xo cache list
```

### `xo cache clear`

Clears the entire GitHub cache, or only the cache for a specific GitHub owner.

```bash
xo cache clear              # clear all cached generators
xo cache clear my-org       # clear cache only for the given GitHub owner
```

> **Note:** Clearing the cache forces the next run to re-fetch generator files from GitHub. Generators pinned to a tag (`@v1.2.0`) are considered immutable and will be restored from GitHub on the next use.

---

## Flags

### `--input` / `-i`

Pre-fill a workflow input, skipping the interactive prompt for that value. Repeatable.

```bash
xo add ui/button -i componentName=Button -i variant=primary
xo add payment/stripe --input secretKey=sk_test_abc123
```

Required inputs not covered by `--input` are still prompted.

---

### `--dry-run`

Preview all actions without writing files or running commands.

```bash
xo add payment/stripe --dry-run
xo add ui/button --dry-run -i componentName=Button
```

---

### `--local`

Run a workflow from a local path without linking. Useful for one-off runs.

```bash
xo add ./my-generator --local
xo add ./my-generator --local -i name=MyComponent --dry-run
```

For repeated local testing, prefer `xo link` — it's persistent and doesn't require a path.

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
