#!/usr/bin/env bash
set -euo pipefail

usage() {
	echo "Usage: bash scripts/dev/check-context-quality.sh [--branch <name>] [--strict]"
	echo ""
	echo "Default checks the latest branch brief/handoff artifacts."
	echo "--strict fails when no semantic checkpoint-backed handoff exists."
}

sanitize() {
	printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+|-+$//g'
}

has_fixed_text() {
	local needle="$1"
	local path="$2"
	if command -v rg >/dev/null 2>&1; then
		rg -Fq "$needle" "$path"
	else
		grep -Fq -- "$needle" "$path"
	fi
}

extract_section() {
	local source="$1"
	local header="$2"
	awk -v h="## $header" '
		$0 == h {in_section=1; next}
		in_section && /^## / {exit}
		in_section {print}
	' "$source"
}

first_non_empty() {
	awk 'NF {print; exit}'
}

STRICT=0
TARGET_BRANCH=""

while [ "$#" -gt 0 ]; do
	case "$1" in
		--branch)
			TARGET_BRANCH="${2:-}"
			shift 2
			;;
		--strict)
			STRICT=1
			shift 1
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "Unknown option: $1"
			usage
			exit 1
			;;
	esac
done

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

if [ -z "$TARGET_BRANCH" ]; then
	TARGET_BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo HEAD)"
fi

BRANCH_SAFE="$(sanitize "${TARGET_BRANCH//\//-}")"
BASE_DIR="$ROOT_DIR/.agent-context"
BRIEF_FILE="$BASE_DIR/briefs/${BRANCH_SAFE}-latest.md"
HANDOFF_FILE="$BASE_DIR/handoffs/${BRANCH_SAFE}-latest.md"
CHECKPOINT_FILE="$BASE_DIR/checkpoints/${BRANCH_SAFE}-latest.md"

node --input-type=module - "$ROOT_DIR" "$TARGET_BRANCH" "$STRICT" <<'EOF'
import path from 'node:path';
import {
  branchArtifactPath,
  firstMeaningfulLine,
  isMeaningful,
  parseMarkdownArtifact,
  readWorkState,
  workStatePath,
} from './scripts/dev/context-artifact-lib.mjs';

const [rootDir, branchName, strictValue] = process.argv.slice(2);
const strict = strictValue === '1';
const failures = [];

function rel(filePath) {
  return path.relative(rootDir, filePath);
}

function pass(message) {
  console.log(`[ctx:check] ok: ${message}`);
}

function fail(message) {
  console.log(`[ctx:check] fail: ${message}`);
  failures.push(message);
}

function requireArtifact(kind, artifact, filePath, { strictOnly = false } = {}) {
  if (artifact) {
    pass(`${kind} exists: ${rel(filePath)}`);
    return true;
  }
  if (!strictOnly || strict) {
    fail(`${kind} missing${strictOnly ? ' for strict mode' : ''}: ${rel(filePath)}`);
  }
  return false;
}

function requireMeta(artifact, key, label, { meaningful = false } = {}) {
  const value = artifact?.meta?.[key] ?? '';
  if (!value) {
    fail(`${label} missing`);
    return '';
  }
  if (meaningful && !isMeaningful(value)) {
    fail(`${label} is not meaningful`);
    return value;
  }
  pass(`${label} present`);
  return value;
}

function requireSection(artifact, section, label, { meaningful = false, strictMeaningful = false } = {}) {
  const value = artifact?.sections?.[section] ?? '';
  if (!value) {
    fail(`${label} missing`);
    return '';
  }
  const needsMeaningful = meaningful || (strictMeaningful && strict);
  if (needsMeaningful && !isMeaningful(value)) {
    fail(`${label} is not meaningful`);
    return value;
  }
  pass(`${label} present`);
  return value;
}

const checkpointPath = branchArtifactPath(rootDir, 'checkpoints', branchName);
const briefPath = branchArtifactPath(rootDir, 'briefs', branchName);
const handoffPath = branchArtifactPath(rootDir, 'handoffs', branchName);

const checkpoint = parseMarkdownArtifact(checkpointPath);
const brief = parseMarkdownArtifact(briefPath);
const handoff = parseMarkdownArtifact(handoffPath);

requireArtifact('brief', brief, briefPath);
requireArtifact('handoff', handoff, handoffPath);
requireArtifact('checkpoint', checkpoint, checkpointPath, { strictOnly: true });

let workId = '';
if (checkpoint) {
  workId = requireMeta(checkpoint, 'Work ID', 'checkpoint work id', { meaningful: true });
  requireMeta(checkpoint, 'Start Head', 'checkpoint start head', { meaningful: true });
  requireMeta(checkpoint, 'Merge Target', 'checkpoint merge target', { meaningful: true });

  const provisional = requireMeta(checkpoint, 'Provisional', 'checkpoint provisional flag');
  if (/^yes$/i.test(provisional) && strict) {
    fail('checkpoint is still provisional');
  } else if (/^yes$/i.test(provisional)) {
    pass('checkpoint provisional flag present');
  }

  requireSection(checkpoint, 'Objective', 'checkpoint objective', { meaningful: true });
  requireSection(checkpoint, 'Why Now', 'checkpoint why now', { meaningful: true });
  requireSection(checkpoint, 'Scope', 'checkpoint scope', { meaningful: true });
  requireSection(checkpoint, 'Completed Scope', 'checkpoint completed scope');
  requireSection(checkpoint, 'Owned Files', 'checkpoint owned files', { meaningful: true });
  requireSection(checkpoint, 'Canonical Docs Opened', 'checkpoint canonical docs opened', { meaningful: true });
  requireSection(checkpoint, 'Blocking Risks', 'checkpoint blocking risks');
  requireSection(checkpoint, 'Depends On Work', 'checkpoint dependencies');
  requireSection(checkpoint, 'Open Questions', 'checkpoint open questions');
  requireSection(checkpoint, 'Next Actions', 'checkpoint next actions', { meaningful: true });
  requireSection(checkpoint, 'Exit Criteria', 'checkpoint exit criteria', { meaningful: true });
}

const stateEntry = workId ? readWorkState(rootDir, workId) : null;
const workState = stateEntry?.value ?? null;
if (strict) {
  if (!workState) {
    fail(`work state missing for strict mode: ${rel(stateEntry?.path ?? workStatePath(rootDir, workId || branchName))}`);
  } else {
    pass(`work state exists: ${rel(stateEntry.path)}`);
    if (workState.workId !== workId) {
      fail(`work state work id mismatch: expected \`${workId}\`, got \`${workState.workId}\``);
    } else {
      pass('work state work id matches checkpoint');
    }
    if (workState.branch !== branchName) {
      fail(`work state branch mismatch: expected \`${branchName}\`, got \`${workState.branch}\``);
    } else {
      pass('work state branch matches checkpoint');
    }
    if (String(workState.provisional ?? '').toLowerCase() === 'yes') {
      fail('work state is still provisional');
    } else {
      pass('work state is non-provisional');
    }
  }
}

if (brief) {
  requireMeta(brief, 'Source checkpoint', 'brief source checkpoint');
  if (strict && /^none$/i.test(brief.meta['Source checkpoint'] ?? '')) {
    fail('brief is a degraded fallback without semantic checkpoint');
  }
  if (strict && /^yes$/i.test(brief.meta['Provisional'] ?? '')) {
    fail('brief still reflects a provisional checkpoint');
  }
  requireSection(brief, 'Current Objective', 'brief current objective', { meaningful: true });
  requireSection(brief, 'Why Now', 'brief why now', { meaningful: true });
  requireSection(brief, 'Completed Scope', 'brief completed scope');
  requireSection(brief, 'Owned Files', 'brief owned files', { strictMeaningful: true });
  requireSection(brief, 'Blocking Risks', 'brief blocking risks');
  requireSection(brief, 'Open Questions', 'brief open questions');
  requireSection(brief, 'Immediate Next Step', 'brief immediate next step', { meaningful: true });
  requireSection(brief, 'Exit Criteria', 'brief exit criteria', { strictMeaningful: true });
  requireSection(brief, 'Validation Snapshot', 'brief validation snapshot', { meaningful: true });
  requireSection(brief, 'Read These First', 'brief read these first', { meaningful: true });
  requireSection(brief, 'Risks / Warnings', 'brief risks / warnings');

  if ((brief.sections['Watch Log Tail'] ?? '').trim()) {
    fail('brief contains watch log tail');
  } else {
    pass('brief excludes watch log tail');
  }
}

if (handoff) {
  if (strict && /^yes$/i.test(handoff.meta['Provisional'] ?? '')) {
    fail('handoff still reflects a provisional checkpoint');
  }
  requireSection(handoff, 'What Changed', 'handoff what changed', { meaningful: true });
  requireSection(handoff, 'Why This Direction Was Chosen', 'handoff why this direction was chosen', { meaningful: true });
  requireSection(handoff, 'Scope', 'handoff scope', { meaningful: true });
  requireSection(handoff, 'Completed Scope', 'handoff completed scope');
  requireSection(handoff, 'Branch Diff Context', 'handoff branch diff context');
  requireSection(handoff, 'Remaining Work', 'handoff remaining work');
  requireSection(handoff, 'Rejected Alternatives', 'handoff rejected alternatives');
  requireSection(handoff, 'Risks / Traps', 'handoff risks / traps');
  requireSection(handoff, 'Depends On Work', 'handoff dependencies');
  requireSection(handoff, 'Open Questions', 'handoff open questions');
  requireSection(handoff, 'Exit Criteria', 'handoff exit criteria');
  requireSection(handoff, 'Validate Before Push', 'handoff validate before push', { meaningful: true });
  requireSection(handoff, 'Resume Commands', 'handoff resume commands', { meaningful: true });

  const artifactWarnings = firstMeaningfulLine(handoff.sections['Artifact Warnings'] ?? '');
  if (strict && artifactWarnings) {
    fail('handoff still contains artifact warnings');
  } else if (artifactWarnings) {
    pass('handoff artifact warnings section present');
  }
}

if (failures.length > 0) {
  console.log('[ctx:check] context quality failed.');
  process.exit(1);
}

console.log('[ctx:check] context quality passed.');
EOF
