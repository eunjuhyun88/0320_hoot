# Agent Branching Guide

This document is the canonical operating guide for concurrent agents in this repository.

## Non-Negotiables

1. One active agent = one branch.
2. One active branch = one worktree.
3. One active branch = one coordination claim.
4. One active claim must declare one surface and explicit path boundaries.
5. No agent may continue work on another agent's dirty branch or uncommitted worktree.
6. When a scoped task is complete, validate it, merge it, and push it immediately.

If any of those are false, parallel work is not safe.

## Required Pattern

Use this shape for every non-trivial task:

- branch: `codex/<agent>-<work-id>-<slug>`
- worktree: dedicated path created with `npm run safe:worktree -- <slug> [base-branch]`
- work ID: `W-YYYYMMDD-<slug>`
- claim: one active `coord:claim` covering only the owned paths

Examples:

- `codex/claude-W-20260315-runtime-control`
- `codex/codex-W-20260315-web-cutover`

## Start Sequence

1. Inspect the current repo state.
2. Create a fresh worktree.
3. Create a checkpoint.
4. Create a coordination claim.

```bash
npm run safe:status
npm run safe:worktree -- runtime-control main
npm run ctx:checkpoint -- --work-id "W-20260315-runtime-control" --surface "runtime-api" --objective "unify runtime control path" --why "replace shared branch drift with explicit runtime control ownership" --scope "apps/runtime-api + scripts + packages runtime control" --doc "memory/MEMORY.md" --file "apps/runtime-api/src/server.ts" --next "wire the proxy path" --exit "runtime control path validated and merged"
npm run coord:claim -- --work-id "W-20260315-runtime-control" --agent "claude" --surface "runtime-api" --summary "runtime control path" --path "apps/runtime-api" --path "scripts" --path "packages"
```

## Memory Gate

- Read the required canonical docs first and list them in the checkpoint.
- A provisional checkpoint is only a bootstrap artifact for a newly entered lane.
- Replace provisional checkpoints with a task-specific checkpoint before handoff, push, or release.
- Refresh `ctx:save` and `ctx:compact` before handing work to another agent.

## Automatic Enforcement

The repo now blocks non-compliant agent lanes automatically:

- `.claude/hooks/session-start.sh` runs `npm run agent:guard`
- `scripts/dev/start-agent-run.mjs` runs `npm run agent:guard`
- `.githooks/pre-push` runs `npm run agent:guard`

Manual check:

```bash
npm run agent:guard
```

## Scope Rules

- Split work by path prefix first, then by surface.
- If two agents need the same file family, split the task into sequential handoffs instead of concurrent edits.
- Generated docs and local runtime logs are the only acceptable shared low-risk paths.
- A second task on the same surface still needs a different branch if the path boundaries differ.

## Work-In-Progress Rules

- Keep incomplete work inside the agent's own branch only.
- Do not stack two unrelated tasks in one dirty branch.
- Do not ask another agent to "continue from here" unless the current branch is checkpointed and the claim is handed off.
- If another agent already has uncommitted work on the needed path, stop and re-partition the task.

## Handoff Rules

Before another agent takes over:

1. save a checkpoint
2. save a fresh snapshot
3. compact context
4. release or hand off the claim from a clean worktree
5. give the next agent the work ID, owned paths, remaining scope, and blocking risks

```bash
npm run ctx:save -- --title "runtime control handoff"
npm run ctx:compact -- --work-id "W-20260315-runtime-control"
npm run coord:release -- --work-id "W-20260315-runtime-control" --status handoff --handoff-to "codex"
```

## Merge Rules

- Integration happens by commit, not by shared dirty state.
- `safe:worktree` refuses to reuse an existing working branch for a new worktree.
- Merge or cherry-pick only validated commits.
- Do not leave completed work parked on a local-only agent branch.
- After a scoped task is done, merge it into the approved integration branch immediately and push the result immediately.
- `ctx:check -- --strict` and `coord:check` now reject provisional or degraded handoff state.
- Run these before push or merge:

```bash
npm run docs:check
npm run ctx:check -- --strict
npm run coord:check
npm run build
```

## What To Reject

Reject the workflow if any of these appear:

- "keep working in my current dirty branch and just avoid conflicts"
- "two agents can both edit the same store and sort it out later"
- "continue from another agent's uncommitted workspace"
- "reuse the same branch in another worktree so we can go faster"
- "skip the claim because this is small"

Those patterns create merge debt and broken context lineage.
