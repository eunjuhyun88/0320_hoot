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

## Allowed Branch Prefixes

Agent work may use any of these prefixes:

- `codex/<slug>` — primary agent execution branches
- `claude/<slug>` — Claude Code auto-generated worktree branches
- `feat/<slug>` — product integration branches

All three are recognized by `agent:guard`, coordination claims, and pre-push hooks.
Any other prefix is blocked.

## Required Pattern

Use this shape for every non-trivial task:

- branch: `codex/<agent>-<work-id>-<slug>` (or `claude/<slug>`, `feat/<slug>`)
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
npm run ctx:checkpoint -- --work-id "W-20260315-runtime-control" --surface "runtime-api" --objective "unify runtime control path"
npm run coord:claim -- --work-id "W-20260315-runtime-control" --agent "claude" --surface "runtime-api" --summary "runtime control path" --path "apps/runtime-api" --path "scripts" --path "packages"
```

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
2. compact context
3. release or hand off the claim
4. give the next agent the branch, work ID, owned paths, and blocking risks

```bash
npm run ctx:save -- --title "runtime control handoff"
npm run ctx:compact
npm run coord:release -- --work-id "W-20260315-runtime-control" --status handoff --handoff-to "codex"
```

## Merge Rules

- Integration happens by commit, not by shared dirty state.
- Merge or cherry-pick only validated commits.
- Do not leave completed work parked on a local-only agent branch.
- After a scoped task is done, merge it into the approved integration branch immediately and push the result immediately.
- **Use `npm run safe:merge`** from the feature branch to run the full cycle automatically:

```
fetch origin/main → rebase → build → ff-merge to main → push → cleanup
```

- If manual merge is needed, run these before push or merge:

```bash
npm run docs:check
npm run ctx:check -- --strict
npm run coord:check
npm run build
```

## Dirty Main Recovery

When `main` has accumulated mixed-scope uncommitted changes:

1. **Do not commit the mixed state directly to main.**
2. List staged files: `git diff --cached --name-only`.
3. Group files by surface: runtime (`apps/`, `packages/`, `scripts/`), network (`NetworkView`, `NetworkHUD`), research (`jobStore`, `AutoresearchPage`), docs (`memory/`, `README.md`).
4. For each scope:
   - `npm run safe:worktree -- <scope-slug>`
   - Move that scope's files to the new branch.
   - Validate: `npm run build`.
   - `npm run safe:merge`.
5. After all scopes are merged: `git checkout main && git reset --hard origin/main`.

Key principle: **split by scope first, then merge each independently**.

## Cleanup

### Mandatory Rule

**NEVER manually run `git worktree remove`, `git branch -D`, or `rm -rf` on worktree directories.**
These commands are blocked by `PreToolUse` hook. All cleanup MUST go through the safe cleanup script.

### Required Process

1. **Dry-run first**: `npm run safe:cleanup` — shows what would be deleted
2. **Review the output**: verify 🟢 ACTIVE and 🟡 PENDING items are correct
3. **Execute**: `npm run safe:cleanup -- --force` — deletes ONLY 🔴 STALE items

### What the script protects

- 🟢 **ACTIVE**: has dirty files → **never deleted**
- 🟡 **PENDING**: has unmerged commits → **never deleted** (merge first)
- 🔴 **STALE**: clean + fully merged → safe to delete

### What is prohibited

- `git worktree remove` / `git worktree remove --force` → use `safe:cleanup`
- `git branch -d` / `git branch -D` → use `safe:cleanup`
- `rm -rf` on any worktree path → use `safe:cleanup`
- Deleting a dirty worktree without saving its patch first
- Deleting a branch without verifying its commits are in main

## What To Reject

Reject the workflow if any of these appear:

- "keep working in my current dirty branch and just avoid conflicts"
- "two agents can both edit the same store and sort it out later"
- "continue from another agent's uncommitted workspace"
- "skip the claim because this is small"
- "commit everything to main and sort it out later"
- "merge without fetching origin first"

Those patterns create merge debt and broken context lineage.
