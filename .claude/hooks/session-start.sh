#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

if [ -f "scripts/dev/agent-guard.mjs" ]; then
	node scripts/dev/agent-guard.mjs
fi

echo "[memento] Start order: README.md -> AGENTS.md -> docs/README.md -> ARCHITECTURE.md -> relevant canonical docs."
echo "[agent] Global rule: one agent = one codex branch = one claim = one scoped path set."
echo "[agent] Global rule: two active agents must never share the same working branch."
echo "[agent] Global rule: completed scoped work must be validated, merged to the approved integration branch, and pushed immediately."
echo "[agent] Global rule: provisional checkpoints do not satisfy push or handoff gates."

if [ -f "scripts/dev/context-restore.sh" ]; then
	if OUTPUT="$(bash scripts/dev/context-restore.sh --mode brief 2>/dev/null)"; then
		echo
		echo "[memento] Latest branch brief:"
		printf '%s\n' "$OUTPUT" | sed -n '1,120p'
	else
		echo "[memento] No branch brief yet. Create a semantic checkpoint before non-trivial work."
		echo "[memento] Example: npm run ctx:checkpoint -- --work-id \"W-...\" --surface \"<surface>\" --objective \"<objective>\" --doc \"memory/MEMORY.md\" --doc \"memory/session-log.md\" --file \"<owned-path>\" --next \"<next action>\" --exit \"<done means>\""
	fi
fi

if [ -f "scripts/dev/context-autopilot.mjs" ]; then
	node scripts/dev/context-autopilot.mjs session-start >/dev/null 2>&1 || true
fi
