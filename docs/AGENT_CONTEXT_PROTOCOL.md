# Agent Context Protocol

Scope: current git worktree rooted at this repository

## 1) Purpose

Prevent context loss and reduce restart cost across long-running agent work.

## 2) Context Architecture

- `snapshot`: machine state
- `checkpoint`: semantic memory
- `brief`: fast resume
- `handoff`: fuller transfer
- `state`: compacted active work ledger
- `claim`: multi-agent ownership and path boundary

## 3) Core Commands

- `npm run ctx:save`
- `npm run ctx:checkpoint`
- `npm run ctx:compact`
- `npm run ctx:restore -- --mode brief`
- `npm run ctx:restore -- --mode handoff`
- `npm run ctx:check -- --strict`
- `npm run coord:claim`
- `npm run coord:check`
- `npm run coord:release`

## 4) Rules

- use checkpoints for non-trivial work
- list required read-first docs inside the checkpoint before meaningful work continues
- use briefs for fast resume
- use state artifacts to describe current head, owned files, remaining work, and merge target
- keep pinned facts durable and minimal
- do not commit runtime memory
- do not work on a feature branch without an active coordination claim
- do not treat provisional checkpoints as push-ready or handoff-ready artifacts
- run `ctx:save` + `ctx:compact` before `coord:release`
