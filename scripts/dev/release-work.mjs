#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  appendCoordinationEvent,
  currentBranch,
  coordinationPaths,
  ensureDir,
  readClaims,
  resolveRootDir,
  run,
  sanitize,
  withCoordinationLock,
  writeJson,
} from './coordination-lib.mjs';
import {
  branchArtifactPath,
  firstMeaningfulLine,
  isMeaningful,
  parseMarkdownArtifact,
  readWorkState,
} from './context-artifact-lib.mjs';

function usage() {
  console.log('Usage: node scripts/dev/release-work.mjs --work-id <id> [--status <done|handoff|abandoned>] [--note <text>] [--handoff-to <agent>]');
}

const rootDir = resolveRootDir();
const args = process.argv.slice(2);
const options = {
  workId: '',
  status: 'done',
  note: '',
  handoffTo: '',
};

for (let index = 0; index < args.length; index += 1) {
  const current = args[index];
  const next = args[index + 1];
  if (current === '--work-id') {
    options.workId = next ?? '';
    index += 1;
    continue;
  }
  if (current === '--status') {
    options.status = next ?? options.status;
    index += 1;
    continue;
  }
  if (current === '--note') {
    options.note = next ?? '';
    index += 1;
    continue;
  }
  if (current === '--handoff-to') {
    options.handoffTo = next ?? '';
    index += 1;
    continue;
  }
  if (current === '-h' || current === '--help') {
    usage();
    process.exit(0);
  }
  throw new Error(`[coord:release] unknown option: ${current}`);
}

if (!options.workId) {
  usage();
  process.exit(1);
}
if (!['done', 'handoff', 'abandoned'].includes(options.status)) {
  throw new Error('[coord:release] status must be done, handoff, or abandoned');
}
if (options.status === 'handoff' && !options.handoffTo) {
  throw new Error('[coord:release] --handoff-to is required when status=handoff');
}

function requireArtifact(artifact, label, failures) {
  if (!artifact) {
    failures.push(`${label} missing`);
  }
}

function requireMeaningfulSection(artifact, section, label, failures) {
  const value = artifact?.sections?.[section] ?? '';
  if (!value || !isMeaningful(value)) {
    failures.push(`${label} must be present and meaningful`);
  }
}

function requireSection(artifact, section, label, failures) {
  const value = artifact?.sections?.[section] ?? '';
  if (!value) {
    failures.push(`${label} missing`);
  }
}

withCoordinationLock(rootDir, () => {
  const { claimsDir, historyDir, branchesDir } = coordinationPaths(rootDir);
  const claim = readClaims(rootDir).find((item) => item.workId === options.workId);
  if (!claim) {
    throw new Error(`[coord:release] active claim not found: ${options.workId}`);
  }
  const branch = currentBranch(rootDir);
  if (branch !== claim.branch) {
    throw new Error(`[coord:release] current branch \`${branch}\` does not match claim branch \`${claim.branch}\``);
  }

  const failures = [];
  const dirty = run('git', ['status', '--short'], { cwd: rootDir }).stdout.trim();
  if (options.status !== 'abandoned' && dirty) {
    failures.push('release requires a clean worktree; commit or discard local changes first');
  }
  if (options.status === 'abandoned' && !options.note.trim()) {
    failures.push('abandoned release requires --note to explain why the lane was dropped');
  }

  const checkpoint = parseMarkdownArtifact(branchArtifactPath(rootDir, 'checkpoints', claim.branch));
  const brief = parseMarkdownArtifact(branchArtifactPath(rootDir, 'briefs', claim.branch));
  const handoff = parseMarkdownArtifact(branchArtifactPath(rootDir, 'handoffs', claim.branch));
  const stateEntry = readWorkState(rootDir, options.workId);
  const workState = stateEntry?.value ?? null;

  requireArtifact(checkpoint, 'checkpoint artifact', failures);
  requireArtifact(brief, 'brief artifact', failures);
  requireArtifact(handoff, 'handoff artifact', failures);

  if (checkpoint) {
    if ((checkpoint.meta?.['Work ID'] ?? '') !== options.workId) {
      failures.push(`checkpoint work id \`${checkpoint.meta?.['Work ID'] ?? 'unknown'}\` does not match release work id \`${options.workId}\``);
    }
    if (String(checkpoint.meta?.Provisional ?? '').toLowerCase() === 'yes') {
      failures.push('checkpoint is still provisional');
    }
    requireMeaningfulSection(checkpoint, 'Objective', 'checkpoint objective', failures);
    requireMeaningfulSection(checkpoint, 'Why Now', 'checkpoint why now', failures);
    requireMeaningfulSection(checkpoint, 'Scope', 'checkpoint scope', failures);
    requireMeaningfulSection(checkpoint, 'Owned Files', 'checkpoint owned files', failures);
    requireMeaningfulSection(checkpoint, 'Canonical Docs Opened', 'checkpoint canonical docs opened', failures);
    requireMeaningfulSection(checkpoint, 'Next Actions', 'checkpoint next actions', failures);
    requireMeaningfulSection(checkpoint, 'Exit Criteria', 'checkpoint exit criteria', failures);
    if (options.status !== 'abandoned') {
      requireMeaningfulSection(checkpoint, 'Completed Scope', 'checkpoint completed scope', failures);
    }
  }

  if (brief) {
    if (/^none$/i.test(brief.meta?.['Source checkpoint'] ?? '')) {
      failures.push('brief is a degraded fallback without semantic checkpoint');
    }
    if (String(brief.meta?.Provisional ?? '').toLowerCase() === 'yes') {
      failures.push('brief still reflects a provisional checkpoint');
    }
    requireMeaningfulSection(brief, 'Current Objective', 'brief current objective', failures);
    requireMeaningfulSection(brief, 'Immediate Next Step', 'brief immediate next step', failures);
    requireMeaningfulSection(brief, 'Read These First', 'brief read these first', failures);
    requireSection(brief, 'Validation Snapshot', 'brief validation snapshot', failures);
  }

  if (handoff) {
    if (String(handoff.meta?.Provisional ?? '').toLowerCase() === 'yes') {
      failures.push('handoff still reflects a provisional checkpoint');
    }
    requireMeaningfulSection(handoff, 'What Changed', 'handoff what changed', failures);
    requireMeaningfulSection(handoff, 'Why This Direction Was Chosen', 'handoff why this direction was chosen', failures);
    requireMeaningfulSection(handoff, 'Scope', 'handoff scope', failures);
    requireSection(handoff, 'Completed Scope', 'handoff completed scope', failures);
    requireSection(handoff, 'Remaining Work', 'handoff remaining work', failures);
    requireSection(handoff, 'Risks / Traps', 'handoff risks / traps', failures);
    requireSection(handoff, 'Open Questions', 'handoff open questions', failures);
    requireSection(handoff, 'Exit Criteria', 'handoff exit criteria', failures);
    requireMeaningfulSection(handoff, 'Validate Before Push', 'handoff validate before push', failures);

    if (options.status === 'handoff' && !isMeaningful(handoff.sections?.['Remaining Work'] ?? '')) {
      failures.push('handoff release requires meaningful Remaining Work');
    }
  }

  if (!workState && options.status !== 'abandoned') {
    failures.push('compacted work state missing; run `npm run ctx:save` and `npm run ctx:compact` first');
  } else if (workState) {
    if (workState.workId !== options.workId) {
      failures.push(`work state work id \`${workState.workId}\` does not match release work id \`${options.workId}\``);
    }
    if (workState.branch && workState.branch !== claim.branch) {
      failures.push(`work state branch \`${workState.branch}\` does not match claim branch \`${claim.branch}\``);
    }
    if (String(workState.provisional ?? '').toLowerCase() === 'yes') {
      failures.push('compacted work state is still provisional');
    }
  }

  if (failures.length > 0) {
    throw new Error(`[coord:release] blocked:\n- ${failures.join('\n- ')}`);
  }

  const timestamp = new Date().toISOString();
  const workSafe = sanitize(options.workId);
  const branchSafe = sanitize(String(claim.branch ?? '').replaceAll('/', '-'));
  const claimPath = path.join(claimsDir, `${workSafe}.json`);
  const branchPath = path.join(branchesDir, `${branchSafe}.json`);
  const historyPath = path.join(historyDir, `${workSafe}-${timestamp.replace(/[:]/g, '-')}.json`);
  ensureDir(historyDir);

  const released = {
    ...claim,
    status: options.status,
    releasedAt: timestamp,
    releaseNote: options.note,
    handoffTo: options.handoffTo || null,
  };

  writeJson(historyPath, released);
  writeJson(path.join(historyDir, `${workSafe}-latest.json`), released);

  fs.rmSync(claimPath, { force: true });

  if (fs.existsSync(branchPath)) {
    try {
      const branchPointer = JSON.parse(fs.readFileSync(branchPath, 'utf8'));
      if (branchPointer.workId === claim.workId) {
        fs.rmSync(branchPath, { force: true });
      }
    } catch {
      fs.rmSync(branchPath, { force: true });
    }
  }

  appendCoordinationEvent(rootDir, [timestamp, 'release', claim.workId, claim.branch ?? '-', claim.agent ?? '-', claim.surface ?? '-', options.status]);
  console.log(`[coord:release] archived: ${path.relative(rootDir, historyPath)}`);
  console.log(`[coord:release] status: ${options.status}`);
  if (options.status === 'handoff') {
    const remainingWork = firstMeaningfulLine(handoff?.sections?.['Remaining Work'] ?? '');
    console.log(`[coord:release] next: ${remainingWork || 'see handoff artifact'}`);
  }
});
