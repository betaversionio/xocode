# Generator Configuration Reference

A generator is a directory containing a `generator.json` file, optional templates, and optional scripts.

## Directory Layout

```
ui/button/
 ├─ generator.json
 ├─ templates/
 │   └─ button.tsx
 └─ scripts/
     └─ post-install.sh
```

---

## `generator.json` — Full Reference

```json
{
  "name": "ui/button",
  "type": "feature",
  "requires": ["ui.componentsDir"],
  "dependencies": ["ui/base"],
  "conflicts": ["ui/mui"],
  "provides": ["ui"],
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

## Fields

### `name`

Namespaced path identifier. Used when calling `xo add <name>`.

```json
{ "name": "payment/stripe" }
```

---

### `type`

```json
{ "type": "feature" }
```

- `"feature"` — added to an existing project via `xo add`
- `"project"` — creates a new project via `xo create`

---

### `requires`

Dot-notation paths into `xo.config.json`. If a key is missing, xo prompts the user and saves the answer automatically.

```json
{
  "requires": ["ui.componentsDir", "database.url"]
}
```

---

### `dependencies`

Other generators that must be applied before this one. xo resolves and runs them automatically.

```json
{
  "dependencies": ["database/postgres", "auth/jwt"]
}
```

---

### `detects`

Rules that identify what kind of project this generator belongs to. Used by `xo add` to verify compatibility before running, and by `xo` to auto-detect the project's origin template.

xo core does not know any frameworks. Every generator teaches xo how to recognize itself via signal rules.

```json
{
  "detects": [
    { "signal": "file.package.json", "exists": true },
    { "signal": "json.package.json.dependencies.next", "exists": true }
  ]
}
```

Flutter example:
```json
{
  "detects": [
    { "signal": "file.pubspec.yaml", "exists": true }
  ]
}
```

Multiple rules are AND-ed. Supported operators: `exists`, `equals`, `matches`.

Signals come from the signal-scanner — see [Architecture](architecture.md) for full signal reference.

---

### `conflicts`

Generators that cannot coexist with this one. xo aborts with an error if a conflicting generator is already installed.

```json
{
  "conflicts": ["auth/firebase"]
}
```

---

### `provides`

Abstract capability tags. Used to check if a requirement is already satisfied without caring about the specific implementation.

```json
{
  "provides": ["auth", "ui"]
}
```

---

## Prompt System

### Types

| Type | Description |
|---|---|
| `input` | Free text input |
| `select` | Single choice from a list |
| `confirm` | Yes / no boolean |
| `multiselect` | Multiple choices from a list |

### Basic prompt

```json
{
  "prompts": [
    {
      "name": "componentName",
      "type": "input",
      "message": "Component name"
    }
  ]
}
```

### Select prompt

```json
{
  "prompts": [
    {
      "name": "framework",
      "type": "select",
      "message": "Choose framework",
      "choices": ["react", "next", "flutter"]
    }
  ]
}
```

### Conditional prompt

The `when` field is an expression evaluated against previously collected prompt values and config.

```json
{
  "prompts": [
    {
      "name": "uiLibrary",
      "type": "select",
      "message": "Choose UI library",
      "when": "framework == \"react\"",
      "choices": ["shadcn", "mui", "chakra"]
    }
  ]
}
```

### Supported `when` operators

```
==   equals
!=   not equals
&&   and
||   or
```

---

## Variable System

Variables are available inside any string value using `{{double-braces}}`.

| Namespace | Source |
|---|---|
| `{{prompt.*}}` | Answers from the current prompt session |
| `{{config.*}}` | Values from `xo.config.json` |
| `{{env.*}}` | Environment variables |
| `{{system.*}}` | Auto-detected project info (framework, packageManager, etc.) |

### Examples

```
{{prompt.componentName}}
{{config.ui.componentsDir}}
{{env.NODE_ENV}}
{{system.packageManager}}
```
