# AGENTS.md

## Repo docs

- **`README.md`** — how to run it, what it does, and the checks that must pass.
- **`DESIGN.md`** — the design system and the reasoning behind it, plus an audit
  trail of every finding and its resolution. Read it before changing anything
  visual; it is the contract, not decoration.

## Agent skills

### Issue tracker

Issues and specs live in this repository's GitHub Issues, driven by the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, each label string equal to its role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: a root `CONTEXT.md` plus `docs/adr/`, created lazily by `/domain-modeling`. See `docs/agents/domain.md`.
