# Memory Index

## Session Start Rule
**ALWAYS read these files first before any work:**
1. This file (MEMORY.md) — state + decisions
2. session-log.md — pending tasks
3. architecture.md / protocol-domain.md as needed
**ALWAYS update session-log.md at end of session.**

## User Preferences
- Language: Korean (한국어) for conversation, English for code/docs
- Commit style: conventional commits (`feat:`, `fix:`, `chore:`)
- Branch strategy:
  - product integration branches can still use `feat/xxx`
  - active agent execution branches must use `codex/*`
  - completed scoped work should be merged and pushed immediately after validation
- Prefers concise Korean responses, no over-explaining
- Dislikes dashboard clutter — keep pages focused on their purpose
- Uses Chrome MCP for visual QA
- **Don't reduce info, only add** — user explicitly rejected removing visualizations

## Project State
- Branch: `codex/dashboard-widget-lane` (clean after dashboard/runtime UI refactor + local artifact cleanup)
- `feat/next-iteration` is fast-forwarded to `4a19153` and now matches `codex/dashboard-widget-lane`
- All builds pass (`npm run build`)
- No test runner configured — verify via build
- `memento-kit` core repo layer integrated
- `docs:refresh` and `docs:check` pass
- `.agent-context/` runtime memory now available for checkpoints / briefs / handoffs
- parallel refactor scaffold added:
  - `apps/web`
  - `apps/runtime-api`
  - `packages/contracts`
  - `packages/domain`
  - `packages/autoresearch-adapter`
- exact Karpathy upstream stack is now pinned and bootstrappable:
  - `config/autoresearch-upstreams.json`
  - `runtime/upstreams/stack.lock.json` (generated, ignored)
  - `karpathy/autoresearch@c2450add72cc80317be1fe8111974b892da10944`
  - `karpathy/nanochat@6ed7d1d82cee16c2e26f45d559ad3338447a6c1b`

## Key Decisions (confirmed by user)
- Economics tab → renamed **Protocol**
- Research tab → renamed **Magnet** (NavBar) / "Model Magnet Research" (full name)
- OntologyPage connected to router at `/ontology`
- Protocol page new sections: Page Header, PPAP Pipeline, Trust Score, Your Journey
- **All 6 viz elements must stay**: Branch panel + 5 viz cards (MetricChart, ParamScatter, ModHeatmap, ExpTree, DistributedMesh)
- **GPU 프로모션**: 1→2→4→8 GPU 티어드 승격 시뮬레이션
- **AutoresearchPage 분할**: 1,153줄 → 80줄 셸 + 4개 서브컴포넌트
- **유저 개입(intervention)**: Pause/Resume, Branch Boost/Pause — fire and forget가 아닌 실시간 조향
- **Frontend / Backend 분리 필수**
- **API-first 구조 필수**: 외부 API나 runtime을 쉽게 붙일 수 있어야 함
- **Autoresearch는 브라우저 밖에서 지속 실행**되어야 함
- **Memento context system 적용**: canonical docs + runtime memory + Claude hooks 조합
- **Auto-commit 범위는 context artifacts 중심으로 제한**: 코드 전체 자동 커밋이 아니라 안전한 context/doc autosave

## Architecture Updates (2026-03-15)
- **RunningDashboard**: 5-Zone 레이아웃 (Command Bar → Hero Metric → Branch Control → Analysis Grid 2×2 → Terminal)
- **jobStore**: 피드백 루프 (`selectModification()` 가중치 선택), `togglePause/toggleCategoryBoost/toggleCategoryPause` API
- **jobStore 파생 스토어**: `improvementDelta`, `bestBranch`, `isPaused` + 기존 유지
- **BranchInfo**: `boosted`, `paused` 필드 추가
- **AutoresearchJob 상태**: `paused`, `boostedCategories`, `pausedCategories`, `baselineMetric` 추가
- **Architecture baseline documented** in `memory/architecture.md`
- **Target refactor direction**: `apps/web` + `apps/runtime-api` + shared contracts/domain packages
- **Persistence direction**: runtime state should move toward durable storage instead of in-browser timers only
- **Memento layer installed**:
  - `context-kit.json`
  - `scripts/dev/*`
  - `.claude/*`
  - `.githooks/*`
  - `docs/*` generated/context docs
- **Claude local risk guides created**:
  - `src-svelte/lib/stores/CLAUDE.md`
  - `scripts/CLAUDE.md`
  - `runtime/CLAUDE.md`
  - `memory/CLAUDE.md`
- **Autopilot extension added**: semantic autosave + compact + context-only auto-commit on `stop` / `pre-push`
- **Canonical rollout summary added** in `docs/exec-plans/active/continuous-autoresearch-refactor.md`
- **Engineering authority doc populated** in `docs/ENGINEERING.md`
- **Runtime API scaffold added** and smoke-tested (`health`, `job create`, `pause command`)
- **Exact upstream integration added**:
  - `npm run autoresearch:bootstrap`
  - controller/supervisor default to pinned upstream repos
  - runtime-api exposes `/api/runtime/upstream`
  - supervisor prompt references nanochat round-1 files (`nanochat/gpt.py`, `nanochat/optim.py`, `scripts/base_train.py`)
- **Runtime API now reads filesystem-backed runtime summaries**:
  - `/api/runtime/workspaces`
  - `/api/runtime/mesh`
  - `runtimeRoot` query parameter supported for parallel runtime packs
- **Frontend store now supports runtime mirroring**:
  - `jobStore` can mirror `/api/runtime/mesh`
  - `AutoresearchPage` prefers runtime mesh over browser simulation
  - local simulation remains as fallback only
- **Dashboard surface now has a dedicated orchestration store**:
  - `src-svelte/lib/stores/dashboardStore.ts`
  - `DashboardPage.svelte` now acts as a view shell over store-driven mesh playback, summary aggregation, and runtime hookup
  - widget layout persistence is now split by auth mode in `widgetStore` (`guest` vs `member`) to avoid logged-out layouts hiding portfolio widgets after login
- **Current dashboard/widget lane has a cleaner UI boundary**:
  - `src-svelte/lib/services/*` is the dashboard-facing data adapter layer
  - `src-svelte/lib/components/AppDock.svelte`, `WidgetContainer.svelte`, `InfoBar.svelte`, `ResearchStats.svelte`, `ConvergenceChart.svelte` are part of the new dashboard surface
  - build warnings in touched dashboard/research surfaces were cleared on 2026-03-15
- **Runtime control path now works end-to-end for simulate mode**:
  - controller exposes `/commands`
  - runtime-api exposes `POST /api/runtime/control`
  - runtime mesh includes controller control state (`supportsCommands`, `paused`, boosted/paused categories, `lastCommandAt`)
  - `jobStore` runtime mode can issue pause/boost/pause-category/stop commands
- **Canonical multi-agent branching guide added**:
  - `docs/AGENT_BRANCHING.md`
  - root routers (`README.md`, `AGENTS.md`, `CLAUDE.md`) now require it for parallel agent work or handoffs
- **Agent lane enforcement is now active**:
  - `npm run agent:guard`
  - `.claude/hooks/session-start.sh` runs the guard
  - `scripts/dev/start-agent-run.mjs` runs the guard
  - `.githooks/pre-push` runs the guard
  - non-`codex/` agent branches are now intentionally blocked
  - integrated runtime-control lane remains on `codex/multi-agent-enforcement`
  - current dirty UI/widget lane was split to `codex/dashboard-widget-lane`
  - active claim: `W-20260315-dashboard-widget-lane`
- **Immediate merge/push rule is now canonical**:
  - completed scoped work must not remain parked on a local-only agent branch
  - after validation, merge to the approved integration branch immediately and push immediately
  - this rule is documented in `docs/AGENT_BRANCHING.md`, `docs/GIT_WORKFLOW.md`, `AGENTS.md`, and `CLAUDE.md`
  - this rule is also surfaced by `scripts/dev/agent-guard.mjs`, `.claude/hooks/session-start.sh`, and `scripts/dev/start-agent-run.mjs`
- **Current branch audit snapshot (2026-03-15)**:
  - `main` still matches `origin/main` at `26982c1`
  - local `feat/next-iteration` is `4a19153`, ahead of `origin/feat/next-iteration` (`d7b73a6`) by 17 commits
  - current implementation lane is `codex/dashboard-widget-lane` at `4a19153`
  - `main -> feat/next-iteration` is now fast-forward ready locally
  - `.claude/worktrees/crazy-lumiere` remains the only dirty non-canonical lane on `claude/crazy-lumiere`
- **Main-merge cleanup landed on the dashboard lane**:
  - `cd847a3 chore: stop tracking local runtime artifacts`
  - `e4ac3d7 refactor: consolidate dashboard runtime ui state`
  - `4a19153 chore: refresh generated context artifacts`
  - local runtime/worktree artifacts are no longer tracked under `.claude/worktrees/*`, `.claude/launch.json`, or `runtime/autoresearch-loop*`
- **Stale Claude worktree was synced to latest enforcement commit**:
  - `.claude/worktrees/kind-leavitt` fast-forwarded from `546a59f` to `d0d1338`
  - worktree is now clean, but still intentionally blocked by `agent:guard` because branch is `claude/kind-leavitt`
  - backup copy of prior local `.claude/launch.json` saved at `.agent-context/quarantine/kind-leavitt-launch.json`

## Topic Files
- [session-log.md](session-log.md) — what was done, pending tasks
- [architecture.md](architecture.md) — current baseline, target split, refactor roadmap
