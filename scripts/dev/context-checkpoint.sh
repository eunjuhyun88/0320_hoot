#!/usr/bin/env bash
set -euo pipefail

usage() {
	echo "Usage: bash scripts/dev/context-checkpoint.sh --work-id <id> --surface <surface-id> --objective <text> [options]"
	echo ""
	echo "Required:"
	echo "  --work-id <id>"
	echo "  --surface <surface-id>"
	echo "  --objective <text>"
	echo ""
	echo "Optional repeatable fields:"
	echo "  --status <in_progress|blocked|ready_for_impl|ready_for_push>"
	echo "  --why <text>"
	echo "  --scope <text>"
	echo "  --doc <path>"
	echo "  --file <path>"
	echo "  --decision <text>"
	echo "  --rejected <text>"
	echo "  --blocker <text>"
	echo "  --depends-on <work-id>"
	echo "  --done <text>"
	echo "  --question <text>"
	echo "  --next <text>"
	echo "  --exit <text>"
	echo "  --merge-target <branch>"
	echo "  --provisional"
}

sanitize() {
	printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+|-+$//g'
}

normalize_repo_path() {
	printf '%s' "$1" | sed -E 's#\\#/#g; s#^\./##; s#/$##'
}

meta_value() {
	local source="$1"
	local key="$2"
	awk -F': ' -v prefix="- $key" '$1 == prefix {print $2; exit}' "$source"
}

print_list() {
	local item=""
	local wrote=0
	for item in "$@"; do
		if [ -n "$item" ]; then
			echo "- $item"
			wrote=1
		fi
	done
	if [ "$wrote" -eq 0 ]; then
		echo "- none"
	fi
}

load_config_array() {
	local dotted_path="$1"
	node - "$ROOT_DIR" "$dotted_path" <<'EOF'
const fs = require('fs');
const path = require('path');
const [rootDir, dottedPath] = process.argv.slice(2);
const configPath = path.join(rootDir, 'context-kit.json');
let value = [];
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  value = dottedPath.split('.').reduce((current, key) => current?.[key], config) ?? [];
} catch {}
if (Array.isArray(value)) {
  for (const item of value) {
    if (item != null && String(item).length > 0) {
      process.stdout.write(`${String(item)}\n`);
    }
  }
}
EOF
}

WORK_ID=""
SURFACE=""
STATUS="in_progress"
OBJECTIVE=""
WHY_NOW=""
SCOPE=""
MERGE_TARGET=""
PROVISIONAL=0

declare -a DOCS=()
declare -a FILES=()
declare -a DECISIONS=()
declare -a REJECTED=()
declare -a BLOCKERS=()
declare -a DEPENDS_ON=()
declare -a COMPLETED_SCOPE=()
declare -a QUESTIONS=()
declare -a NEXT_ACTIONS=()
declare -a EXIT_CRITERIA=()

while [ "$#" -gt 0 ]; do
	case "$1" in
		--work-id)
			WORK_ID="${2:-}"
			shift 2
			;;
		--surface)
			SURFACE="${2:-}"
			shift 2
			;;
		--status)
			STATUS="${2:-}"
			shift 2
			;;
		--objective)
			OBJECTIVE="${2:-}"
			shift 2
			;;
		--why)
			WHY_NOW="${2:-}"
			shift 2
			;;
		--scope)
			SCOPE="${2:-}"
			shift 2
			;;
		--doc)
			DOCS+=("${2:-}")
			shift 2
			;;
		--file)
			FILES+=("${2:-}")
			shift 2
			;;
		--decision)
			DECISIONS+=("${2:-}")
			shift 2
			;;
		--rejected)
			REJECTED+=("${2:-}")
			shift 2
			;;
		--blocker)
			BLOCKERS+=("${2:-}")
			shift 2
			;;
		--depends-on)
			DEPENDS_ON+=("${2:-}")
			shift 2
			;;
		--done)
			COMPLETED_SCOPE+=("${2:-}")
			shift 2
			;;
		--question)
			QUESTIONS+=("${2:-}")
			shift 2
			;;
		--next)
			NEXT_ACTIONS+=("${2:-}")
			shift 2
			;;
		--exit)
			EXIT_CRITERIA+=("${2:-}")
			shift 2
			;;
		--merge-target)
			MERGE_TARGET="${2:-}"
			shift 2
			;;
		--provisional)
			PROVISIONAL=1
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

if [ -z "$WORK_ID" ] || [ -z "$SURFACE" ] || [ -z "$OBJECTIVE" ]; then
	echo "Missing required arguments."
	usage
	exit 1
fi

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo HEAD)"
if git rev-parse --verify HEAD >/dev/null 2>&1; then
	HEAD_SHA="$(git rev-parse --short HEAD)"
else
	HEAD_SHA="no-commit"
fi
TS_HUMAN="$(date '+%Y-%m-%d %H:%M:%S %z')"
TS_KEY="$(date '+%Y%m%d-%H%M%S')"
BRANCH_SAFE="$(sanitize "${BRANCH//\//-}")"
WORK_SAFE="$(sanitize "$WORK_ID")"

BASE_DIR="$ROOT_DIR/.agent-context"
CHECKPOINT_DIR="$BASE_DIR/checkpoints"
RUNTIME_DIR="$BASE_DIR/runtime"
CATALOG_FILE="$BASE_DIR/catalog.tsv"
CHECKPOINT_FILE="$CHECKPOINT_DIR/${WORK_SAFE}.md"
BRANCH_LATEST_FILE="$CHECKPOINT_DIR/${BRANCH_SAFE}-latest.md"
WORK_POINTER_FILE="$RUNTIME_DIR/${BRANCH_SAFE}.work-id"

mkdir -p "$CHECKPOINT_DIR" "$RUNTIME_DIR"

START_HEAD=""
if [ -f "$CHECKPOINT_FILE" ]; then
	START_HEAD="$(meta_value "$CHECKPOINT_FILE" "Start Head")"
fi
[ -n "$START_HEAD" ] || START_HEAD="$HEAD_SHA"

if [ -z "$MERGE_TARGET" ] && [ -f "$CHECKPOINT_FILE" ]; then
	MERGE_TARGET="$(meta_value "$CHECKPOINT_FILE" "Merge Target")"
fi
if [ -z "$MERGE_TARGET" ]; then
	MERGE_TARGET="$(node scripts/dev/context-config.mjs get-string git.integrationBranch 2>/dev/null || true)"
fi
if [ -z "$MERGE_TARGET" ]; then
	MERGE_TARGET="$(node scripts/dev/context-config.mjs get-string git.mainBranch 2>/dev/null || true)"
fi
if [ -z "$MERGE_TARGET" ]; then
	MERGE_TARGET="main"
fi

VALIDATION_ERRORS=0
PROVISIONAL_LABEL="no"
if [ "$PROVISIONAL" -eq 1 ]; then
	PROVISIONAL_LABEL="yes"
fi

if [[ "$BRANCH" == codex/* ]] && [ "$PROVISIONAL" -ne 1 ]; then
	if [ -z "$WHY_NOW" ]; then
		echo "[ctx:checkpoint] fail: --why is required on codex branches" >&2
		VALIDATION_ERRORS=1
	fi
	if [ -z "$SCOPE" ]; then
		echo "[ctx:checkpoint] fail: --scope is required on codex branches" >&2
		VALIDATION_ERRORS=1
	fi
	if [ "${#FILES[@]}" -eq 0 ]; then
		echo "[ctx:checkpoint] fail: at least one --file or owned path is required on codex branches" >&2
		VALIDATION_ERRORS=1
	fi
	if [ "${#DOCS[@]}" -eq 0 ]; then
		echo "[ctx:checkpoint] fail: at least one --doc is required on codex branches" >&2
		VALIDATION_ERRORS=1
	fi
	if [ "${#NEXT_ACTIONS[@]}" -eq 0 ]; then
		echo "[ctx:checkpoint] fail: at least one --next action is required on codex branches" >&2
		VALIDATION_ERRORS=1
	fi
	if [ "${#EXIT_CRITERIA[@]}" -eq 0 ]; then
		echo "[ctx:checkpoint] fail: at least one --exit criterion is required on codex branches" >&2
		VALIDATION_ERRORS=1
	fi

	REQUIRED_DOCS=()
	while IFS= read -r required_doc; do
		[ -n "$required_doc" ] && REQUIRED_DOCS+=("$required_doc")
	done < <(load_config_array coordination.requiredCheckpointDocs)
	for required_doc in "${REQUIRED_DOCS[@]-}"; do
		required_doc="$(normalize_repo_path "$required_doc")"
		FOUND=0
		for opened_doc in "${DOCS[@]-}"; do
			if [ "$(normalize_repo_path "$opened_doc")" = "$required_doc" ]; then
				FOUND=1
				break
			fi
		done
		if [ "$FOUND" -ne 1 ]; then
			echo "[ctx:checkpoint] fail: required read-first doc missing from checkpoint docs: $required_doc" >&2
			VALIDATION_ERRORS=1
		fi
	done
fi

if [ "$VALIDATION_ERRORS" -ne 0 ]; then
	echo "[ctx:checkpoint] blocked: checkpoint is missing required memory or execution details." >&2
	exit 1
fi

{
	echo "# Checkpoint"
	echo ""
	echo "- Work ID: $WORK_ID"
	echo "- Branch: $BRANCH"
	echo "- Start Head: $START_HEAD"
	echo "- Head: $HEAD_SHA"
	echo "- Surface: $SURFACE"
	echo "- Status: $STATUS"
	echo "- Provisional: $PROVISIONAL_LABEL"
	echo "- Merge Target: $MERGE_TARGET"
	echo "- Updated At: $TS_HUMAN"
	echo ""
	echo "## Objective"
	echo "$OBJECTIVE"
	echo ""
	echo "## Why Now"
	if [ -n "$WHY_NOW" ]; then
		echo "$WHY_NOW"
	else
		echo "- none"
	fi
	echo ""
	echo "## Scope"
	if [ -n "$SCOPE" ]; then
		echo "$SCOPE"
	else
		echo "- none"
	fi
	echo ""
	echo "## Completed Scope"
	print_list "${COMPLETED_SCOPE[@]-}"
	echo ""
	echo "## Owned Files"
	print_list "${FILES[@]-}"
	echo ""
	echo "## Canonical Docs Opened"
	print_list "${DOCS[@]-}"
	echo ""
	echo "## Decisions Made"
	print_list "${DECISIONS[@]-}"
	echo ""
	echo "## Rejected Alternatives"
	print_list "${REJECTED[@]-}"
	echo ""
	echo "## Blocking Risks"
	print_list "${BLOCKERS[@]-}"
	echo ""
	echo "## Depends On Work"
	print_list "${DEPENDS_ON[@]-}"
	echo ""
	echo "## Open Questions"
	print_list "${QUESTIONS[@]-}"
	echo ""
	echo "## Next Actions"
	print_list "${NEXT_ACTIONS[@]-}"
	echo ""
	echo "## Exit Criteria"
	print_list "${EXIT_CRITERIA[@]-}"
} > "$CHECKPOINT_FILE"

cp "$CHECKPOINT_FILE" "$BRANCH_LATEST_FILE"
printf '%s\n' "$WORK_ID" > "$WORK_POINTER_FILE"

if [ ! -f "$CATALOG_FILE" ]; then
	echo -e "timestamp\tartifact_type\tbranch\twork_id\tsurface\tstatus\tpath" > "$CATALOG_FILE"
fi

printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
	"$TS_KEY" \
	"checkpoint" \
	"$BRANCH" \
	"$WORK_ID" \
	"$SURFACE" \
	"$STATUS" \
	"${CHECKPOINT_FILE#$ROOT_DIR/}" >> "$CATALOG_FILE"

echo "[ctx:checkpoint] saved: ${CHECKPOINT_FILE#$ROOT_DIR/}"
echo "[ctx:checkpoint] branch latest: ${BRANCH_LATEST_FILE#$ROOT_DIR/}"
