#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function normalizeBranch(branch) {
  return String(branch).replaceAll('/', '-');
}

function sanitize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function branchArtifactPath(rootDir, kind, branch) {
  const branchSafe = sanitize(normalizeBranch(branch));
  return path.join(rootDir, '.agent-context', kind, `${branchSafe}-latest.md`);
}

export function workStatePath(rootDir, workId) {
  return path.join(rootDir, '.agent-context', 'state', `${sanitize(workId)}.json`);
}

export function readWorkState(rootDir, workId) {
  const targetPath = workStatePath(rootDir, workId);
  if (!fs.existsSync(targetPath)) return null;
  return {
    path: targetPath,
    value: JSON.parse(fs.readFileSync(targetPath, 'utf8')),
  };
}

export function parseMarkdownArtifact(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const meta = {};
  const sections = {};
  let currentSection = null;

  for (const line of lines) {
    if (/^## /.test(line)) {
      currentSection = line.replace(/^## /, '').trim();
      sections[currentSection] = [];
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line);
      continue;
    }

    const match = line.match(/^- ([^:]+):\s*(.*)$/);
    if (match) {
      meta[match[1].trim()] = match[2].trim();
    }
  }

  return {
    path: filePath,
    meta,
    sections: Object.fromEntries(
      Object.entries(sections).map(([key, value]) => [key, value.join('\n').trim()]),
    ),
  };
}

export function firstMeaningfulLine(value) {
  if (!value) return '';
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? '';
}

export function listItems(value) {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^- /.test(line))
    .map((line) => line.replace(/^- /, '').trim())
    .filter((line) => line.length > 0 && !/^none$/i.test(line));
}

export function isMeaningful(value) {
  const first = firstMeaningfulLine(value);
  if (!first) return false;
  return !/^(unknown|- none|none|n\/a)$/i.test(first);
}
