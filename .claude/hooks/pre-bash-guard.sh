#!/usr/bin/env bash
set -euo pipefail

# ── Pre-Bash Guard ──
# Blocks destructive git worktree/branch commands.
# Agents MUST use `npm run safe:cleanup` instead.
#
# Triggered as a PreToolUse hook for Bash tool calls.
# The command being executed is passed via CLAUDE_TOOL_INPUT env var (JSON).

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

if [ -z "$TOOL_INPUT" ]; then
  exit 0
fi

# Extract the command string from JSON input
CMD="$(echo "$TOOL_INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('command',''))" 2>/dev/null || echo "")"

if [ -z "$CMD" ]; then
  exit 0
fi

BLOCKED=false
REASON=""

# Block: git worktree remove (must use safe:cleanup)
if echo "$CMD" | grep -qE 'git\s+worktree\s+remove'; then
  BLOCKED=true
  REASON="git worktree remove is blocked. Use 'npm run safe:cleanup' instead."
fi

# Block: git branch -D (force delete, must use safe:cleanup)
if echo "$CMD" | grep -qE 'git\s+branch\s+-[dD]'; then
  BLOCKED=true
  REASON="git branch -d/-D is blocked. Use 'npm run safe:cleanup' instead."
fi

# Block: rm -rf on worktree paths
if echo "$CMD" | grep -qE 'rm\s+-rf.*worktree'; then
  BLOCKED=true
  REASON="rm -rf on worktree paths is blocked. Use 'npm run safe:cleanup' instead."
fi

# Block: git worktree remove --force (extra emphasis)
if echo "$CMD" | grep -qE 'git\s+worktree\s+remove\s+--force'; then
  BLOCKED=true
  REASON="git worktree remove --force is STRICTLY PROHIBITED. Dirty worktrees may have unrecoverable work. Use 'npm run safe:cleanup' instead."
fi

if $BLOCKED; then
  echo "BLOCKED"
  echo ""
  echo "⛔ $REASON"
  echo ""
  echo "Safe alternatives:"
  echo "  npm run safe:cleanup          # dry-run: see what would be deleted"
  echo "  npm run safe:cleanup -- --force  # execute: delete ONLY stale items"
  echo ""
  echo "The safe:cleanup script automatically:"
  echo "  🟢 KEEPS worktrees with dirty files (uncommitted work)"
  echo "  🟡 KEEPS branches with unmerged commits (need merge first)"
  echo "  🔴 REMOVES only fully merged, clean items"
  exit 2
fi

exit 0
