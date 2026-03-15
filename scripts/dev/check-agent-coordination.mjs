#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  collectCoordinationIssues,
  coordinationConfig,
  coordinationPaths,
  currentBranch,
  ensureDir,
  loadConfig,
  listChangedFiles,
  readClaims,
  resolveRootDir,
} from './coordination-lib.mjs';
import {
  branchArtifactPath,
  firstMeaningfulLine,
  listItems,
  parseMarkdownArtifact,
  readWorkState,
} from './context-artifact-lib.mjs';

const rootDir = resolveRootDir();
const config = loadConfig(rootDir);
const coordination = coordinationConfig(config);
const claims = readClaims(rootDir);
const currentBranchName = currentBranch(rootDir);
const mainBranch = config.git?.mainBranch || 'main';
const currentCheckpoint = currentBranchName === 'HEAD'
  ? null
  : parseMarkdownArtifact(branchArtifactPath(rootDir, 'checkpoints', currentBranchName));
const changedFilesBaseRef = currentCheckpoint?.meta?.['Start Head']?.trim() || mainBranch;
const changedFiles = listChangedFiles(rootDir, changedFilesBaseRef);
const { failures, warnings } = collectCoordinationIssues({
  claims,
  coordination,
  currentBranchName,
  changedFiles,
});
const { coordinationDir, reportPath } = coordinationPaths(rootDir);

ensureDir(coordinationDir);

function summarizeSection(value) {
  const items = listItems(value);
  if (items.length > 0) {
    return items.slice(0, 2).join('<br>');
  }
  const first = firstMeaningfulLine(value);
  return first || '-';
}

const claimStateRows = claims.map((claim) => {
  const checkpoint = parseMarkdownArtifact(branchArtifactPath(rootDir, 'checkpoints', claim.branch));
  const stateEntry = readWorkState(rootDir, claim.workId);
  const state = stateEntry?.value ?? null;

  if (!checkpoint) {
    warnings.push(`claim \`${claim.workId}\` has no branch checkpoint for \`${claim.branch}\``);
  } else if ((checkpoint.meta?.['Work ID'] ?? '') !== claim.workId) {
    failures.push(`claim \`${claim.workId}\` does not match checkpoint work id \`${checkpoint.meta?.['Work ID'] ?? 'unknown'}\` on branch \`${claim.branch}\``);
  }

  if (!state) {
    warnings.push(`claim \`${claim.workId}\` has no compacted work state yet`);
  } else {
    if (state.branch && state.branch !== claim.branch) {
      failures.push(`claim \`${claim.workId}\` state branch \`${state.branch}\` does not match claim branch \`${claim.branch}\``);
    }
    if (state.workId && state.workId !== claim.workId) {
      failures.push(`claim \`${claim.workId}\` state work id \`${state.workId}\` does not match active claim`);
    }
  }

  return {
    workId: claim.workId,
    branch: claim.branch,
    surface: claim.surface,
    provisional: state?.provisional ?? checkpoint?.meta?.Provisional ?? 'unknown',
    mergeTarget: state?.mergeTarget ?? checkpoint?.meta?.['Merge Target'] ?? 'unknown',
    startHead: state?.startHead ?? checkpoint?.meta?.['Start Head'] ?? 'unknown',
    status: state?.status ?? checkpoint?.meta?.Status ?? 'unknown',
    ownedFiles: summarizeSection(state?.ownedFiles ?? checkpoint?.sections?.['Owned Files'] ?? ''),
    nextActions: summarizeSection(state?.nextActions ?? checkpoint?.sections?.['Next Actions'] ?? ''),
    checkpointPath: checkpoint ? path.relative(rootDir, checkpoint.path) : 'none',
    statePath: stateEntry ? path.relative(rootDir, stateEntry.path) : 'none',
  };
});

const reportLines = [
  '# Coordination Report',
  '',
  `- Current branch: \`${currentBranchName}\``,
  `- Active claims: \`${claims.length}\``,
  `- Changed files base: \`${changedFilesBaseRef}\``,
  '',
  '## Active Claims',
  '',
  '| Work ID | Branch | Agent | Surface | Lease Expires | Paths | Checkpoint | State | Provisional |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...(
    claims.length > 0
      ? claims.map((claim) => {
        const row = claimStateRows.find((item) => item.workId === claim.workId);
        return `| \`${claim.workId}\` | \`${claim.branch}\` | \`${claim.agent}\` | \`${claim.surface}\` | \`${claim.leaseExpiresAt ?? 'n/a'}\` | ${(claim.paths ?? []).map((item) => `\`${item}\``).join(', ') || '-'} | \`${row?.checkpointPath ?? 'none'}\` | \`${row?.statePath ?? 'none'}\` | \`${row?.provisional ?? 'unknown'}\` |`;
      })
      : ['| none | - | - | - | - | - | - | - | - |']
  ),
  '',
  '## Active Work State',
  '',
  '| Work ID | Branch | Start Head | Merge Target | Status | Owned Files | Next Actions |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...(
    claimStateRows.length > 0
      ? claimStateRows.map((row) => `| \`${row.workId}\` | \`${row.branch}\` | \`${row.startHead}\` | \`${row.mergeTarget}\` | \`${row.status}\` | ${row.ownedFiles || '-'} | ${row.nextActions || '-'} |`)
      : ['| none | - | - | - | - | - | - |']
  ),
  '',
  '## Current Branch Changed Files',
  '',
  ...(changedFiles.length > 0 ? changedFiles.map((item) => `- \`${item}\``) : ['- none']),
  '',
  '## Failures',
  '',
  ...(failures.length > 0 ? failures.map((item) => `- ${item}`) : ['- none']),
  '',
  '## Warnings',
  '',
  ...(warnings.length > 0 ? warnings.map((item) => `- ${item}`) : ['- none']),
  '',
];
fs.writeFileSync(reportPath, `${reportLines.join('\n')}\n`);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[coord:check] fail: ${failure}`);
  }
  for (const warning of warnings) {
    console.error(`[coord:check] warn: ${warning}`);
  }
  console.error(`[coord:check] report: ${path.relative(rootDir, reportPath)}`);
  process.exit(1);
}

for (const warning of warnings) {
  console.log(`[coord:check] warn: ${warning}`);
}
console.log('[coord:check] coordination checks passed.');
console.log(`[coord:check] report: ${path.relative(rootDir, reportPath)}`);
