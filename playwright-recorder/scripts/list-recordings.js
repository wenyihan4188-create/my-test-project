import fs from 'node:fs';
import path from 'node:path';
import { recordingsDir } from './cli.js';

const files = fs
  .readdirSync(recordingsDir)
  .filter((file) => file.endsWith('.spec.js'))
  .sort();

if (files.length === 0) {
  console.log('No recordings yet.');
  process.exit(0);
}

for (const file of files) {
  console.log(path.basename(file, '.spec.js'));
}
