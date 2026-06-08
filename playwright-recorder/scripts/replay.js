import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  parseArgs,
  playwrightCliPath,
  printUsage,
  recordingPathFromName,
  recordingsDir,
  toolRoot
} from './cli.js';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage('replay', [
    '--name login-demo',
    '--name login-demo --headed',
    '--file recordings/login-demo.spec.js --trace'
  ]);
  process.exit(0);
}

let testFile;
try {
  testFile = args.file
    ? path.resolve(toolRoot, args.file)
    : recordingPathFromName(args.name);
} catch (error) {
  console.error(error.message);
  printUsage('replay', ['--name login-demo']);
  process.exit(1);
}

if (!fs.existsSync(testFile)) {
  console.error(`Recording not found: ${testFile}`);
  process.exit(1);
}

const testFilter = path.relative(recordingsDir, testFile).replaceAll(path.sep, '/');

if (testFilter.startsWith('..') || path.isAbsolute(testFilter)) {
  console.error(`Recording must be inside: ${recordingsDir}`);
  process.exit(1);
}

const playwrightArgs = [playwrightCliPath, 'test', testFilter];

if (args.headed) {
  playwrightArgs.push('--headed');
}

if (args.debug) {
  playwrightArgs.push('--debug');
}

if (args.trace) {
  playwrightArgs.push('--trace', 'on');
}

if (args.list) {
  playwrightArgs.push('--list');
}

const child = spawn(process.execPath, playwrightArgs, {
  cwd: toolRoot,
  stdio: 'inherit',
  shell: false
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
