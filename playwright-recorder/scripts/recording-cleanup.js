import fs from 'node:fs';
import { hardenRecordingFile } from './locator-hardening.js';

export function normalizeRecordingFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { changed: false, removed: 0 };
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  const cleaned = [];
  let removed = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const nextLines = lines.slice(i + 1, i + 4).join('\n');

    if (isInvalidTermCheck(line)) {
      removed += 1;
      continue;
    }

    if (isTermClickBeforeCheckboxCheck(line, nextLines)) {
      removed += 1;
      continue;
    }

    cleaned.push(line);
  }

  const normalized = cleaned.join('\n');
  if (normalized !== original) {
    fs.writeFileSync(filePath, normalized, 'utf8');
    const hardened = hardenRecordingFile(filePath);
    return { changed: true, removed, hardened: hardened.replacements };
  }

  const hardened = hardenRecordingFile(filePath);
  return {
    changed: hardened.changed,
    removed: 0,
    hardened: hardened.replacements
  };
}

function isInvalidTermCheck(line) {
  return /\.getByRole\(['"]term['"]\)\.check\(\);/.test(line);
}

function isTermClickBeforeCheckboxCheck(line, nextLines) {
  return /\.getByRole\(['"]term['"]\)\.click\(\);/.test(line)
    && /getByRole\(['"]checkbox['"]/.test(nextLines);
}
