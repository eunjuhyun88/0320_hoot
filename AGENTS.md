# AGENTS.md

## Session Start

Read these first in order:
1. `memory/MEMORY.md`
2. `memory/session-log.md`
3. `memory/architecture.md`
4. `README.md`
5. `docs/README.md`

If the task changes retrieval, compaction, checkpoints, or prompt routing, also read:
- `docs/CONTEXT_ENGINEERING.md`
- `docs/AGENT_FACTORY.md`
- `docs/TOOL_DESIGN.md`

If more than one agent is active or a handoff is involved, also read:
- `docs/AGENT_BRANCHING.md`
- `docs/MULTI_AGENT_COORDINATION.md`
- `docs/GIT_WORKFLOW.md`

## Session End

Before ending a meaningful session:
1. Update `memory/session-log.md`
2. Update `memory/MEMORY.md` if decisions changed
3. Refresh runtime context with `npm run ctx:compact`

## Repo Rules

- Keep Korean for conversation, English for code and docs.
- Verify changes with `npm run build`.
- Do not replace the existing memory system; Memento runtime memory complements it.
- Canonical project truth lives in committed docs and `memory/`.
- Runtime working memory lives in `.agent-context/` and should not be committed.
- When parallel agents are active, branch/worktree split is mandatory.
- One active agent must have one active `codex/*` branch, one worktree, and one claim.
- Two active agents must never share the same working branch.
- Never continue another agent's dirty WIP on the same branch.
- Required read-first docs must be recorded in the semantic checkpoint before meaningful work continues.
- Provisional checkpoints and degraded briefs do not satisfy push, release, or handoff gates.
- Handoff/release must come from a clean worktree after `npm run ctx:save` and `npm run ctx:compact`.
- `npm run agent:guard` is the enforced lane check used by session-start, `agent:start`, and pre-push.
- Completed scoped work must be merged to the approved integration branch and pushed immediately after validation.

## Project Map

- Frontend shell: `src-svelte/`
- Runtime/controller scripts: `scripts/`
- Evaluation helpers: `eval/`
- Canonical project memory: `memory/`
- Context system scripts: `scripts/dev/`
- Claude-native helpers: `.claude/`

## Current Architecture Intent

- Short-term: Svelte frontend plus script-based runtime
- Target: frontend / backend split with `apps/web` and `apps/runtime-api`
- Continuous autoresearch must run outside the browser
- API-first boundary is mandatory

## Memento Workflow

Before non-trivial work:
```bash
npm run ctx:checkpoint -- --work-id "W-..." --surface "web" --objective "..." --why "..." --scope "..." --doc "memory/MEMORY.md" --file "<owned-path>" --next "..." --exit "..."
```

During long work:
```bash
npm run ctx:save -- --title "..."
```

To resume from compacted memory:
```bash
npm run ctx:restore -- --mode brief
```

To compact and refresh handoff state:
```bash
npm run ctx:compact -- --work-id "W-..."
```

## Surface Defaults

- `web`: `src-svelte/`, layout, pages, stores, visuals
- `runtime-api`: `scripts/`, controller, supervisor, telemetry, future API service
- `protocol`: tokenomics/protocol docs and protocol-facing UI

## Read-First Docs

- `ARCHITECTURE.md`
- `docs/SYSTEM_INTENT.md`
- `docs/CONTEXT_ENGINEERING.md`
- `docs/AGENT_BRANCHING.md`
- `docs/MULTI_AGENT_COORDINATION.md`
- `docs/GIT_WORKFLOW.md`

## Implementation Notes

- Use `rg` for search.
- Prefer small, scoped edits.
- Keep `README.md`, `AGENTS.md`, `CLAUDE.md`, `context-kit.json`, and `memory/` aligned.
- If context docs drift, run:
```bash
npm run docs:refresh
npm run docs:check
```
