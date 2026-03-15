# CLAUDE.md

## Start Here

Read in order:
1. `memory/MEMORY.md`
2. `memory/session-log.md`
3. `memory/architecture.md`
4. `README.md`
5. `AGENTS.md`
6. `docs/README.md`

For context routing and compaction behavior:
- `docs/CONTEXT_ENGINEERING.md`
- `docs/CLAUDE_COMPATIBILITY.md`

For parallel agent work or handoffs:
- `docs/AGENT_BRANCHING.md`
- `docs/MULTI_AGENT_COORDINATION.md`
- `docs/GIT_WORKFLOW.md`

## Runtime Context Model

| Layer | Path |
| --- | --- |
| canonical project memory | `memory/` |
| canonical repo map | `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `docs/` |
| runtime working memory | `.agent-context/checkpoints/`, `.agent-context/briefs/`, `.agent-context/handoffs/` |
| Claude-native routing | `.claude/agents/`, `.claude/commands/`, `.claude/hooks/` |

## Required Commands

Before non-trivial work:
```bash
npm run ctx:checkpoint -- --work-id "W-..." --surface "web" --objective "..."
```

After meaningful progress:
```bash
npm run ctx:compact
```

Resume from compacted state:
```bash
npm run ctx:restore -- --mode brief
```

## Project Shape

- UI: `src-svelte/`
- Runtime and telemetry: `scripts/`
- Evaluation: `eval/`
- Memory and decisions: `memory/`
- Context automation: `scripts/dev/`

## Rules

- Keep root `CLAUDE.md` short.
- Put stable truth in committed docs, not in transient chat.
- Keep `.agent-context/` local-only.
- Continuous autoresearch must be orchestrated outside the browser.
- Frontend / backend separation and API-first boundaries are mandatory.
- Branch/worktree split is mandatory when multiple agents are active.
- **Commit after every meaningful change.** Do not batch multiple modifications into one large commit. Each file change, feature addition, or fix should be committed individually before moving on.
- **워크트리/브랜치 수동 삭제 절대 금지.** `git worktree remove`, `git branch -D`, `rm -rf` 워크트리 경로 — 전부 `PreToolUse` 훅이 차단함. 모든 정리는 반드시 `npm run safe:cleanup`을 통해서만 수행. 이 스크립트는 dirty(🟢)/pending(🟡) 워크트리를 자동으로 보호하고, stale(🔴)만 삭제함.
- Session start now hard-fails if `npm run agent:guard` does not pass.

## Git Merge Rules (Enforced)

1. **main 직접 커밋 금지** — `agent:guard`가 main 브랜치에서 무조건 차단.
2. **작업 시작**: `npm run safe:worktree -- <task-slug>`
3. **작업 완료 머지**: `npm run safe:merge` (fetch → rebase → build → ff-merge → push → cleanup 자동 수행)
4. **Stale 정리**: `npm run safe:cleanup` (dry-run) / `npm run safe:cleanup -- --force`
5. **dirty main 복구**: 절대 mixed-scope를 main에 직접 커밋하지 말 것. scope별 worktree로 분리 후 각각 `safe:merge`.
6. **허용 브랜치 prefix**: `codex/`, `claude/`, `feat/` — 그 외는 `agent:guard`가 차단.

자세한 절차: `docs/GIT_WORKFLOW.md`, `docs/AGENT_BRANCHING.md` 참조.
