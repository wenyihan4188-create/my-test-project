import fs from 'node:fs';

const helperImport = "import { clickByRoleName, clickByText, smartClick } from '../support/robust-actions.js';";

export function hardenRecordingFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { changed: false, replacements: 0 };
  }

  const original = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;
  let content = original;

  if (!content.includes(helperImport)) {
    content = content.replace(
      /^import \{ test, expect \} from '@playwright\/test';\r?$/m,
      (match) => `${match}\n${helperImport}`
    );
  }

  content = content.replace(
    /^\s*await\s+(page)\.click\('([^']+)'\);/gm,
    (match, root, selector) => {
      replacements += 1;
      return `  await smartClick(${root}, '${escapeJsString(selector)}');`;
    }
  );

  content = content.replace(
    /^\s*await\s+([a-zA-Z_$][\w$]*)\.getByRole\('([^']+)',\s*\{\s*name:\s*'([^']+)'(,\s*exact:\s*true)?\s*\}\)\.click\(\);/gm,
    (match, root, role, name, exact) => {
      replacements += 1;
      const options = exact ? ', { exact: true }' : '';
      return `  await clickByRoleName(${root}, '${role}', '${escapeJsString(name)}'${options});`;
    }
  );

  content = content.replace(
    /^\s*await\s+([a-zA-Z_$][\w$]*)\.getByText\('([^']+)'\)\.click\(\);/gm,
    (match, root, text) => {
      replacements += 1;
      return `  await clickByText(${root}, '${escapeJsString(text)}');`;
    }
  );

  content = content.replace(
    /^\s*await\s+([a-zA-Z_$][\w$]*)\.getByRole\('banner'\)\.locator\('a'\)\.filter\(\{\s*hasText:\s*\/\^([^/]+)\$\/\s*\}\)\.click\(\);/gm,
    (match, root, text) => {
      replacements += 1;
      return `  await clickByText(${root}.getByRole('banner'), '${escapeJsString(text)}', { selector: 'a', exact: true });`;
    }
  );

  if (replacements === 0 || content === original) {
    return { changed: false, replacements: 0 };
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { changed: true, replacements };
}

function escapeJsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
