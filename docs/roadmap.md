# Roadmap

## Phase 1 — Core MVP

```
xo create <template>
xo add <feature>
basic input/select prompts
template copy action
```

Deliverables:
- CLI entry point (`commander`)
- `generator.json` parser
- `template` and `copy` actions
- `inquirer` prompt runner
- Handlebars template rendering

---

## Phase 2 — File Editing + Env

```
append action
inject action
replace action
env action
json action
command execution
```

Deliverables:
- Full `file-editor` module
- `.env` idempotent writer
- `package.json` JSON patcher
- Shell command runner

---

## Phase 3 — Config + Composition

```
xo.config.json read/write
requires validation
generator dependencies
xo-call action
state tracking (.xo/state.json)
```

Deliverables:
- `config-manager` module
- `rule-validator` module
- `state-manager` module
- Recursive dependency resolver

---

## Phase 4 — Advanced

```
AST editing (ast-add-import)
project introspection
conflicts / provides graph
xo undo
--dry-run and --preview flags
```

Deliverables:
- `introspector` module
- `ts-morph` AST integration
- Feature graph (conflicts + provides)
- Undo via state snapshots
- Dry-run mode (no writes, print diff)
