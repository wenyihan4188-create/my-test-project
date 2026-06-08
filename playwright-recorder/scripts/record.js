import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { parseArgs, playwrightCliPath, printUsage, recordingPathFromName, toolRoot } from './cli.js';
import { normalizeRecordingFile } from './recording-cleanup.js';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage('record', [
    '--name login-demo --url https://example.com',
    '--name search-flow --url https://www.bing.com'
  ]);
  process.exit(0);
}

if (!args.url) {
  console.error('Missing --url.');
  printUsage('record', ['--name login-demo --url https://example.com']);
  process.exit(1);
}

let outputFile;
try {
  outputFile = recordingPathFromName(args.name);
} catch (error) {
  console.error(error.message);
  printUsage('record', ['--name login-demo --url https://example.com']);
  process.exit(1);
}

if (fs.existsSync(outputFile) && !args.force) {
  console.error(`Recording already exists: ${outputFile}`);
  console.error('Pass --force to overwrite it.');
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [playwrightCliPath, 'codegen', '--output', outputFile, args.url],
  {
    cwd: toolRoot,
    stdio: 'inherit',
    shell: false
  }
);

child.on('exit', (code) => {
  if (code === 0) {
    const result = normalizeRecordingFile(outputFile);
    if (result.changed) {
      console.log(`Cleaned recording: removed ${result.removed} unstable action(s).`);
    }
  }
  process.exit(code ?? 0);
});
