#!/usr/bin/env node
import {
  countAheadCommits,
  collectCoordinationIssues,
  coordinationConfig,
  currentBranch,
  listChangedFiles,
  loadConfig,
  resolveBaseRef,
  readClaims,
  resolveRootDir,
  run,
} from './coordination-lib.mjs';
import {
  branchArtifactPath,
  isMeaningful,
  parseMarkdownArtifact,
  readWorkState,
} from './context-artifact-lib.mjs';

const rootDir = resolveRootDir();
const config = loadConfig(rootDir);
const coordination = coordinationConfig(config);
const branch = currentBranch(rootDir);
const mainBranch = config.git?.mainBranch || 'main';
const claims = readClaims(rootDir);
const branchClaims = claims.filter((claim) => claim.branch === branch);
const checkpoint = branch !== 'HEAD' ? parseMarkdownArtifact(branchArtifactPath(rootDir, 'checkpoints', branch)) : null;
const checkpointWorkId = checkpoint?.meta?.['Work ID']?.trim() ?? '';
const laneBaseRef = checkpoint?.meta?.['Start Head']?.trim() || mainBranch;
const changedFiles = listChangedFiles(rootDir, laneBaseRef);
const failures = [];
const warnings = [];

function requireMeaningfulSection(artifact, section, label) {
  const value = artifact?.sections?.[section] ?? '';
  if (!value || !isMeaningful(value)) {
    failures.push(`${label} must be present and meaningful`);
    return;
  }
}

function countBehindCommits(baseRef) {
  if (!baseRef) return 0;
  const result = run('git', ['rev-list', '--count', 'HEAD..' + baseRef], { cwd: rootDir });
  if (result.status !== 0) return 0;
  return Number.parseInt(result.stdout.trim(), 10) || 0;
}

if (branch === mainBranch && changedFiles.length > 0) {
  failures.push(`primary branch \`${branch}\` has active changes; move agent work to an isolated \`codex/\` branch first`);
}

if (branch !== 'HEAD' && branch !== mainBranch && !branch.startsWith('codex/')) {
  failures.push(`agent work must run on a \`codex/\` branch, but current branch is \`${branch}\``);
}

if (branchClaims.length === 1 && branchClaims[0].worktree && branchClaims[0].worktree !== process.cwd()) {
  failures.push(`claim \`${branchClaims[0].workId}\` belongs to worktree \`${branchClaims[0].worktree}\`, not the current directory`);
}

if (branch !== 'HEAD' && branch.startsWith('codex/')) {
  if (!checkpoint) {
    failures.push(`codex branch \`${branch}\` has no semantic checkpoint`);
  } else {
    const provisional = String(checkpoint.meta?.Provisional ?? '').toLowerCase();
    if (provisional === 'yes') {
      failures.push(`checkpoint for \`${branch}\` is still provisional; replace it before continuing`);
    }

    const startHead = checkpoint.meta?.['Start Head']?.trim() ?? '';
    if (!startHead) {
      failures.push(`checkpoint for \`${branch}\` is missing Start Head`);
    }
    const mergeTarget = checkpoint.meta?.['Merge Target']?.trim() ?? '';
    if (!mergeTarget) {
      failures.push(`checkpoint for \`${branch}\` is missing Merge Target`);
    }

    requireMeaningfulSection(checkpoint, 'Objective', 'checkpoint objective');
    requireMeaningfulSection(checkpoint, 'Why Now', 'checkpoint why now');
    requireMeaningfulSection(checkpoint, 'Scope', 'checkpoint scope');
    requireMeaningfulSection(checkpoint, 'Owned Files', 'checkpoint owned files');
    requireMeaningfulSection(checkpoint, 'Canonical Docs Opened', 'checkpoint canonical docs opened');
    requireMeaningfulSection(checkpoint, 'Next Actions', 'checkpoint next actions');
    requireMeaningfulSection(checkpoint, 'Exit Criteria', 'checkpoint exit criteria');

    if (branchClaims.length === 1) {
      if (checkpointWorkId && branchClaims[0].workId !== checkpointWorkId) {
        failures.push(`claim \`${branchClaims[0].workId}\` does not match checkpoint work id \`${checkpointWorkId}\``);
      }
      if (checkpoint.meta?.Surface && branchClaims[0].surface && checkpoint.meta.Surface !== branchClaims[0].surface) {
        failures.push(`claim surface \`${branchClaims[0].surface}\` does not match checkpoint surface \`${checkpoint.meta.Surface}\``);
      }
    }

    if (changedFiles.length > coordination.maxChangedFiles) {
      failures.push(
        `branch \`${branch}\` has ${changedFiles.length} changed files since \`${laneBaseRef}\`; split scope or merge before continuing (max ${coordination.maxChangedFiles})`,
      );
    }

    if (startHead) {
      const laneCommits = countAheadCommits(rootDir, startHead);
      if (laneCommits > coordination.maxAheadCommits) {
        failures.push(
          `branch \`${branch}\` has ${laneCommits} lane commits since Start Head \`${startHead}\`; merge or split the lane before continuing (max ${coordination.maxAheadCommits})`,
        );
      }
    }

    const baseRef = resolveBaseRef(rootDir, config);
    const behindCommits = countBehindCommits(baseRef);
    if (behindCommits > coordination.maxAheadCommits) {
      failures.push(
        `branch \`${branch}\` is ${behindCommits} commits behind \`${baseRef}\`; sync or merge before continuing`,
      );
    }

    const workId = checkpointWorkId || branchClaims[0]?.workId || '';
    const workState = workId ? readWorkState(rootDir, workId)?.value ?? null : null;
    if (!workState) {
      warnings.push(`work state missing for \`${workId || branch}\`; run \`npm run ctx:save\` and \`npm run ctx:compact -- --work-id "${workId || 'W-...'}"\``);
    } else {
      if (String(workState.provisional ?? '').toLowerCase() === 'yes') {
        failures.push(`work state for \`${workId}\` is still provisional`);
      }
      if (workState.branch && workState.branch !== branch) {
        failures.push(`work state branch \`${workState.branch}\` does not match current branch \`${branch}\``);
      }
      if (workState.startHead && startHead && workState.startHead !== startHead) {
        failures.push(`work state Start Head \`${workState.startHead}\` does not match checkpoint Start Head \`${startHead}\``);
      }
    }

    const updatedAtSource = workState?.updatedAt || checkpoint.meta?.['Updated At'] || '';
    const updatedAtMs = Date.parse(updatedAtSource);
    if (
      Number.isFinite(updatedAtMs) &&
      coordination.maxUnmergedHours > 0 &&
      changedFiles.length > 0 &&
      (Date.now() - updatedAtMs) > coordination.maxUnmergedHours * 60 * 60 * 1000
    ) {
      failures.push(
        `branch \`${branch}\` has been active for more than ${coordination.maxUnmergedHours}h without merge cadence; checkpoint/save/merge it now`,
      );
    }
  }
}

const coordinationIssues = collectCoordinationIssues({
  claims,
  coordination,
  currentBranchName: branch,
  changedFiles,
});
failures.push(...coordinationIssues.failures);
warnings.push(...coordinationIssues.warnings);

if (failures.length > 0) {
  console.error('[agent:guard] blocked:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  for (const warning of warnings) {
    console.error(`[agent:guard] warn: ${warning}`);
  }
  console.error('[agent:guard] required pattern: one agent = one codex branch = one claim = one scoped path set');
  console.error('[agent:guard] completion rule: once scoped work is validated, merge it to the approved integration branch immediately and push immediately');
  console.error(`[agent:guard] next: npm run safe:worktree -- <task-slug> ${mainBranch}`);
  console.error('[agent:guard] next: npm run ctx:checkpoint -- --work-id "W-..." --surface "<surface>" --objective "<objective>"');
  console.error('[agent:guard] next: npm run coord:claim -- --work-id "W-..." --agent "<agent>" --surface "<surface>" --summary "<summary>" --path "<prefix>"');
  console.error('[agent:guard] next: npm run ctx:save -- --title "<status>" && npm run ctx:compact -- --work-id "W-..."');
  process.exit(1);
}

for (const warning of warnings) {
  console.log(`[agent:guard] warn: ${warning}`);
}
console.log(`[agent:guard] ok: ${branch}`);
console.log('[agent:guard] reminder: validate completed scoped work, then merge and push it immediately');
