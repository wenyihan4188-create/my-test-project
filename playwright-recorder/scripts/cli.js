import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const toolRoot = path.resolve(__dirname, '..');
export const recordingsDir = path.join(toolRoot, 'recordings');
export const playwrightCliPath = path.join(toolRoot, 'node_modules', 'playwright', 'cli.js');

export function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];

    if (!value.startsWith('--')) {
      continue;
    }

    const key = value.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

export function recordingPathFromName(name) {
  const safeName = sanitizeName(name);
  return path.join(recordingsDir, `${safeName}.spec.js`);
}

export function sanitizeName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Missing --name. Example: --name login-demo');
  }

  const safeName = name
    .trim()
    .replace(/\.spec\.js$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!safeName) {
    throw new Error('The recording name must contain letters or numbers.');
  }

  return safeName;
}

export function printUsage(command, examples) {
  console.log(`Usage: npm run ${command} -- ${examples[0]}`);
  console.log('');
  console.log('Examples:');
  for (const example of examples) {
    console.log(`  npm run ${command} -- ${example}`);
  }
}
