import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hardenRecordingFile } from '../playwright-recorder/scripts/locator-hardening.js';
import { normalizeRecordingFile } from '../playwright-recorder/scripts/recording-cleanup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');
const publicDir = path.join(__dirname, 'public');
const recorderRoot = path.join(workspaceRoot, 'playwright-recorder');
const recordingsDir = path.join(recorderRoot, 'recordings');
const playwrightCliPath = path.join(recorderRoot, 'node_modules', 'playwright', 'cli.js');
const reportDir = path.join(recorderRoot, 'playwright-report');
const testResultsDir = path.join(recorderRoot, 'test-results');
const apiTesterRoot = path.join(workspaceRoot, 'api-tester');
const apiCasesDir = path.join(apiTesterRoot, 'cases');
const apiConfigFile = path.join(apiTesterRoot, 'config', 'settings.json');
const apiReportFile = path.join(apiTesterRoot, 'reports', 'report.html');
const apiSummaryFile = path.join(apiTesterRoot, 'reports', 'summary.json');
const dataGeneratorRoot = path.join(workspaceRoot, 'data-generator');
const dataGeneratorOutputDir = path.join(dataGeneratorRoot, 'outputs');
const fileBoundaryRoot = path.join(workspaceRoot, 'file-boundary-generator');
const fileBoundaryOutputDir = path.join(fileBoundaryRoot, 'outputs');
const utilityToolsRoot = path.join(workspaceRoot, 'utility-tools');
const utilityToolsOutputDir = path.join(utilityToolsRoot, 'outputs');
const runs = new Map();
let nextRunId = 1;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/tools') {
      return sendJson(res, getTools());
    }

    if (url.pathname === '/api/playwright/recordings') {
      return sendJson(res, getRecordings());
    }

    if (url.pathname === '/api/playwright/artifacts') {
      return sendJson(res, getArtifacts());
    }

    if (url.pathname === '/api/playwright/traces') {
      return sendJson(res, getTraces());
    }

    if (url.pathname === '/api/runs') {
      return sendJson(res, [...runs.values()].sort((a, b) => b.id - a.id));
    }

    if (url.pathname === '/api/data-generator/fields') {
      return sendJson(res, getDataFieldCatalog());
    }

    if (url.pathname === '/api/data-generator/files') {
      return sendJson(res, getGeneratedDataFiles());
    }

    if (url.pathname === '/api/data-generator/generate' && req.method === 'POST') {
      const body = await readJson(req);
      return generateDataFile(body, res);
    }

    if (url.pathname === '/api/data-generator/delete-files' && req.method === 'POST') {
      const body = await readJson(req);
      return deleteGeneratedFiles(dataGeneratorOutputDir, body, res, /\.(csv|sql)$/i);
    }

    if (url.pathname === '/api/file-boundary/formats') {
      return sendJson(res, getBoundaryFormats());
    }

    if (url.pathname === '/api/file-boundary/files') {
      return sendJson(res, getBoundaryFiles());
    }

    if (url.pathname === '/api/file-boundary/generate' && req.method === 'POST') {
      const body = await readJson(req);
      return generateBoundaryFiles(body, res);
    }

    if (url.pathname === '/api/file-boundary/delete-files' && req.method === 'POST') {
      const body = await readJson(req);
      return deleteGeneratedFiles(fileBoundaryOutputDir, body, res);
    }

    if (url.pathname === '/api/utilities/tree' && req.method === 'POST') {
      const body = await readJson(req);
      return generateDirectoryTree(body, res);
    }

    if (url.pathname === '/api/utilities/pick-directory' && req.method === 'POST') {
      const body = await readJson(req);
      return pickDirectory(body, res);
    }

    if (url.pathname === '/api/utilities/directories') {
      return sendJson(res, getWorkspaceDirectories(url.searchParams.get('path')));
    }

    if (url.pathname === '/api/api-tester/config') {
      if (req.method === 'GET') {
        return sendJson(res, getApiConfig());
      }
      if (req.method === 'POST') {
        const body = await readJson(req);
        return saveApiConfig(body, res);
      }
    }

    if (url.pathname === '/api/api-tester/cases') {
      if (req.method === 'GET') {
        return sendJson(res, getApiCases());
      }
      if (req.method === 'POST') {
        const body = await readJson(req);
        return saveApiCase(body, res);
      }
    }

    if (url.pathname === '/api/api-tester/summary') {
      return sendJson(res, getApiSummary());
    }

    if (url.pathname === '/api/api-tester/import-postman' && req.method === 'POST') {
      const body = await readJson(req);
      return importPostmanCollection(body, res);
    }

    if (url.pathname === '/api/api-tester/delete-cases' && req.method === 'POST') {
      const body = await readJson(req);
      return deleteApiCases(body, res);
    }

    if (url.pathname === '/api/api-tester/run' && req.method === 'POST') {
      const body = await readJson(req);
      return runApiCases(body, res);
    }

    if (url.pathname === '/api/api-tester/load-test' && req.method === 'POST') {
      const body = await readJson(req);
      return runApiLoadTest(body, res);
    }

    if (url.pathname === '/api/api-tester/open-report' && req.method === 'POST') {
      return openApiReport(res);
    }

    if (url.pathname === '/api/playwright/record' && req.method === 'POST') {
      const body = await readJson(req);
      return startRecord(body, res);
    }

    if (url.pathname === '/api/playwright/replay' && req.method === 'POST') {
      const body = await readJson(req);
      return startReplay(body, res);
    }

    if (url.pathname === '/api/playwright/harden' && req.method === 'POST') {
      const body = await readJson(req);
      return hardenRecording(body, res);
    }

    if (url.pathname === '/api/playwright/delete-recordings' && req.method === 'POST') {
      const body = await readJson(req);
      return deleteRecordings(body, res);
    }

    if (url.pathname === '/api/playwright/replay-all' && req.method === 'POST') {
      const body = await readJson(req);
      return startReplayAll(body, res);
    }

    if (url.pathname === '/api/playwright/open-report' && req.method === 'POST') {
      return openReport(res);
    }

    if (url.pathname === '/api/playwright/open-trace' && req.method === 'POST') {
      const body = await readJson(req);
      return openTrace(body, res);
    }

    if (url.pathname.startsWith('/playwright-report/')) {
      return serveFileFrom(reportDir, url.pathname.replace('/playwright-report/', ''), res);
    }

    if (url.pathname.startsWith('/api-report/')) {
      return serveFileFrom(path.dirname(apiReportFile), url.pathname.replace('/api-report/', ''), res);
    }

    if (url.pathname.startsWith('/data-output/')) {
      return serveFileFrom(dataGeneratorOutputDir, url.pathname.replace('/data-output/', ''), res);
    }

    if (url.pathname.startsWith('/boundary-output/')) {
      return serveFileFrom(fileBoundaryOutputDir, url.pathname.replace('/boundary-output/', ''), res);
    }

    if (url.pathname.startsWith('/utility-output/')) {
      return serveFileFrom(utilityToolsOutputDir, url.pathname.replace('/utility-output/', ''), res);
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, { error: error.message }, 500);
  }
});

const port = Number(process.env.PORT || 4545);
server.listen(port, () => {
  console.log(`Tools Dashboard running at http://localhost:${port}`);
});

function getTools() {
  return [
    {
      id: 'playwright-recorder',
      name: 'Playwright Recorder',
      description: 'Record and replay browser automation scripts.',
      status: fs.existsSync(recorderRoot) ? 'ready' : 'missing',
      path: recorderRoot
    },
    {
      id: 'api-tester',
      name: 'API Tester',
      description: 'Run API automation cases with pytest and requests.',
      status: fs.existsSync(apiTesterRoot) ? 'ready' : 'missing',
      path: apiTesterRoot
    },
    {
      id: 'data-generator',
      name: 'Data Generator',
      description: 'Generate CSV and SQL test data.',
      status: fs.existsSync(dataGeneratorRoot) ? 'ready' : 'missing',
      path: dataGeneratorRoot
    },
    {
      id: 'file-boundary-generator',
      name: 'File Boundary Generator',
      description: 'Generate upload boundary files.',
      status: fs.existsSync(fileBoundaryRoot) ? 'ready' : 'missing',
      path: fileBoundaryRoot
    },
    {
      id: 'utility-tools',
      name: 'Utility Tools',
      description: 'Small daily-use utilities.',
      status: fs.existsSync(utilityToolsRoot) ? 'ready' : 'missing',
      path: utilityToolsRoot
    }
  ];
}

function generateDirectoryTree(body, res) {
  const targetPath = resolveWorkspacePath(String(body.path || workspaceRoot));
  const maxDepth = clampNumber(body.depth, 1, 12, 4);
  const includeFiles = body.includeFiles !== false;
  const ignorePatterns = parseIgnorePatterns(body.ignore || 'node_modules,.git,.pytest_cache,__pycache__,playwright-report,test-results');
  const tree = renderDirectoryTree(targetPath, {
    maxDepth,
    includeFiles,
    ignorePatterns
  });
  const fileName = `directory-tree-${formatTimestamp(new Date())}.txt`;
  fs.mkdirSync(utilityToolsOutputDir, { recursive: true });
  fs.writeFileSync(path.join(utilityToolsOutputDir, fileName), tree, 'utf8');
  return sendJson(res, {
    tree,
    file: {
      name: fileName,
      url: `/utility-output/${encodeURIComponent(fileName)}`
    }
  });
}

async function pickDirectory(body, res) {
  const initialPath = getInitialDirectory(body.path);
  const selectedPath = await openWindowsFolderPicker(initialPath);
  return sendJson(res, {
    cancelled: !selectedPath,
    path: selectedPath || ''
  });
}

function getInitialDirectory(value) {
  const targetPath = path.resolve(String(value || workspaceRoot));
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    return targetPath;
  }
  return workspaceRoot;
}

function openWindowsFolderPicker(initialPath) {
  return new Promise((resolve, reject) => {
    const script = [
      'Add-Type -AssemblyName System.Windows.Forms',
      '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
      '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
      '$dialog.Description = "选择目录"',
      '$dialog.ShowNewFolderButton = $true',
      `$dialog.SelectedPath = '${escapePowerShellSingleQuoted(initialPath)}'`,
      'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {',
      '  Write-Output $dialog.SelectedPath',
      '}'
    ].join('; ');

    const child = spawn('powershell.exe', ['-NoProfile', '-STA', '-Command', script], {
      cwd: workspaceRoot,
      shell: false,
      windowsHide: false
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || 'Folder picker failed.'));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function escapePowerShellSingleQuoted(value) {
  return String(value).replaceAll("'", "''");
}

function getWorkspaceDirectories(rawPath) {
  const currentPath = resolveWorkspacePath(String(rawPath || workspaceRoot));
  const parentPath = path.dirname(currentPath);
  const directories = fs
    .readdirSync(currentPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !['node_modules', '.git', '.pytest_cache', '__pycache__'].includes(entry.name))
    .map((entry) => {
      const dirPath = path.join(currentPath, entry.name);
      return {
        name: entry.name,
        path: dirPath
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    root: workspaceRoot,
    current: currentPath,
    parent: parentPath !== currentPath ? parentPath : null,
    directories
  };
}

function resolveWorkspacePath(value) {
  const targetPath = path.resolve(value || workspaceRoot);
  if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
    throw new Error('Directory does not exist.');
  }
  return targetPath;
}

function parseIgnorePatterns(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderDirectoryTree(rootPath, options) {
  const rootName = path.basename(rootPath) || rootPath;
  const lines = [`${rootName}/`];
  walkTree(rootPath, '', 1, options, lines);
  return lines.join('\r\n');
}

function walkTree(dirPath, prefix, depth, options, lines) {
  if (depth > options.maxDepth) {
    return;
  }

  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !shouldIgnoreEntry(entry.name, options.ignorePatterns))
    .filter((entry) => options.includeFiles || entry.isDirectory())
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
    lines.push(`${prefix}${connector}${entry.name}${entry.isDirectory() ? '/' : ''}`);
    if (entry.isDirectory()) {
      walkTree(path.join(dirPath, entry.name), nextPrefix, depth + 1, options, lines);
    }
  });
}

function shouldIgnoreEntry(name, ignorePatterns) {
  return ignorePatterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('\\*', '.*')}$`);
      return regex.test(name);
    }
    return name === pattern;
  });
}

function getBoundaryFormats() {
  return [
    { id: 'jpg', label: 'JPG 图片', group: '图片' },
    { id: 'png', label: 'PNG 图片', group: '图片' },
    { id: 'gif', label: 'GIF 图片', group: '图片' },
    { id: 'pdf', label: 'PDF 文档', group: '文档' },
    { id: 'docx', label: 'DOCX 文档', group: '文档' },
    { id: 'xlsx', label: 'XLSX 表格', group: '文档' },
    { id: 'txt', label: 'TXT 文本', group: '文本' },
    { id: 'csv', label: 'CSV 表格', group: '文本' },
    { id: 'json', label: 'JSON 文件', group: '文本' },
    { id: 'xml', label: 'XML 文件', group: '文本' },
    { id: 'zip', label: 'ZIP 压缩包', group: '压缩' },
    { id: 'bin', label: 'BIN 二进制', group: '其他' },
    { id: 'apk', label: 'APK 安装包', group: '其他' },
    { id: 'mp4', label: 'MP4 视频', group: '媒体' }
  ];
}

function getBoundaryFiles() {
  if (!fs.existsSync(fileBoundaryOutputDir)) {
    return [];
  }

  return fs
    .readdirSync(fileBoundaryOutputDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filePath = path.join(fileBoundaryOutputDir, entry.name);
      const stat = fs.statSync(filePath);
      return {
        name: entry.name,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
        url: `/boundary-output/${encodeURIComponent(entry.name)}`
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function deleteGeneratedFiles(outputDir, body, res, allowedPattern = null) {
  const names = Array.isArray(body.names) ? body.names : [body.name].filter(Boolean);
  const deleted = [];

  for (const rawName of names) {
    const fileName = path.basename(String(rawName || ''));
    if (!fileName || (allowedPattern && !allowedPattern.test(fileName))) {
      continue;
    }

    const filePath = path.resolve(outputDir, fileName);
    if (!filePath.startsWith(outputDir) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      continue;
    }

    fs.unlinkSync(filePath);
    deleted.push(fileName);
  }

  return sendJson(res, { deleted });
}

function generateBoundaryFiles(body, res) {
  fs.mkdirSync(fileBoundaryOutputDir, { recursive: true });
  const mode = String(body.mode || 'single');
  const files = mode === 'batch' ? generateBoundaryBatch(body) : [generateBoundarySingle(body)];
  return sendJson(res, { files, count: files.length });
}

function generateBoundarySingle(body) {
  const format = normalizeBoundaryFormat(body.format || 'png');
  const variant = String(body.variant || 'normal');
  const sizeBytes = clampNumber(body.sizeBytes, 0, 200 * 1024 * 1024, 1024);
  const nameMode = String(body.nameMode || 'normal');
  const customName = String(body.fileName || '').trim();
  const fileName = makeBoundaryFileName(customName, nameMode, variant, format);
  const content = makeBoundaryContent(format, variant, sizeBytes);
  const filePath = path.join(fileBoundaryOutputDir, fileName);
  fs.writeFileSync(filePath, content);
  return boundaryFileInfo(fileName, variant, format);
}

function generateBoundaryBatch(body) {
  const formats = Array.isArray(body.formats) && body.formats.length
    ? body.formats.map(normalizeBoundaryFormat)
    : ['jpg', 'png', 'pdf', 'txt', 'zip'];
  const limitBytes = clampNumber(Number(body.limitMb || 10) * 1024 * 1024, 1024, 200 * 1024 * 1024, 10 * 1024 * 1024);
  const nearLimit = Math.max(0, limitBytes - 1024);
  const overLimit = Math.min(200 * 1024 * 1024, limitBytes + 1024);
  const variants = [
    { variant: 'empty', sizeBytes: 0, nameMode: 'normal' },
    { variant: 'normal', sizeBytes: 1, nameMode: 'normal' },
    { variant: 'normal', sizeBytes: nearLimit, nameMode: 'normal' },
    { variant: 'normal', sizeBytes: limitBytes, nameMode: 'normal' },
    { variant: 'normal', sizeBytes: overLimit, nameMode: 'normal' },
    { variant: 'corrupt', sizeBytes: 1024, nameMode: 'normal' },
    { variant: 'spoof', sizeBytes: 1024, nameMode: 'doubleExt' },
    { variant: 'random', sizeBytes: 1024, nameMode: 'special' }
  ];
  const files = [];
  for (const format of formats) {
    for (const item of variants) {
      files.push(generateBoundarySingle({
        ...item,
        format,
        fileName: `${format}-${item.variant}-${item.sizeBytes}b`
      }));
    }
  }
  return files;
}

function makeBoundaryContent(format, variant, sizeBytes) {
  if (variant === 'empty') {
    return Buffer.alloc(0);
  }
  if (variant === 'random') {
    return randomBuffer(sizeBytes);
  }
  if (variant === 'spoof') {
    return padBuffer(Buffer.from('This is plain text content with a spoofed extension.\r\n', 'utf8'), sizeBytes);
  }

  const normalContent = makeNormalBoundaryContent(format);
  const content = variant === 'corrupt'
    ? normalContent.subarray(0, Math.max(1, Math.floor(normalContent.length / 3)))
    : normalContent;
  return padBuffer(content, sizeBytes);
}

function makeNormalBoundaryContent(format) {
  switch (format) {
    case 'jpg':
      return Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z', 'base64');
    case 'png':
      return Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000100ffff03000006000557bfab440000000049454e44ae426082', 'hex');
    case 'gif':
      return Buffer.from('47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b', 'hex');
    case 'pdf':
      return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n', 'utf8');
    case 'docx':
      return makeZipBuffer({
        '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
        'word/document.xml': '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/></w:body></w:document>'
      });
    case 'xlsx':
      return makeZipBuffer({
        '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
        'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"></workbook>'
      });
    case 'txt':
      return Buffer.from('upload boundary text file\r\n', 'utf8');
    case 'csv':
      return Buffer.from('\ufeffid,name\r\n1,test\r\n', 'utf8');
    case 'json':
      return Buffer.from(JSON.stringify({ id: 1, name: 'test' }, null, 2), 'utf8');
    case 'xml':
      return Buffer.from('<?xml version="1.0" encoding="UTF-8"?><root><id>1</id></root>', 'utf8');
    case 'zip':
      return makeZipBuffer({ 'readme.txt': 'upload boundary zip file\r\n' });
    case 'apk':
      return makeZipBuffer({ 'AndroidManifest.xml': 'fake apk for upload boundary testing\r\n' });
    case 'mp4':
      return Buffer.from('00000018667479706d703432000000006d70343269736f6d000000086d646174', 'hex');
    case 'bin':
    default:
      return randomBuffer(1024);
  }
}

function makeBoundaryFileName(customName, nameMode, variant, format) {
  const stamp = formatTimestamp(new Date());
  const base = customName
    ? customName.replace(/\.[^.]+$/, '')
    : `boundary-${variant}-${stamp}`;
  const nameByMode = {
    normal: base,
    chinese: `中文文件-${base}`,
    spaces: `file with spaces ${base}`,
    special: `special_测试_@_${base}`,
    long: `${base}-${'longname'.repeat(18)}`,
    doubleExt: `${base}.jpg`
  }[nameMode] || base;
  return `${nameByMode}.${format}`;
}

function boundaryFileInfo(fileName, variant, format) {
  const filePath = path.join(fileBoundaryOutputDir, fileName);
  const stat = fs.statSync(filePath);
  return {
    name: fileName,
    variant,
    format,
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
    url: `/boundary-output/${encodeURIComponent(fileName)}`
  };
}

function normalizeBoundaryFormat(format) {
  const value = String(format || '').toLowerCase().replace(/^\./, '');
  return getBoundaryFormats().some((item) => item.id === value) ? value : 'bin';
}

function padBuffer(content, sizeBytes) {
  if (sizeBytes === 0) {
    return Buffer.alloc(0);
  }
  if (content.length >= sizeBytes) {
    return content.subarray(0, sizeBytes);
  }
  return Buffer.concat([content, Buffer.alloc(sizeBytes - content.length, 0x20)]);
}

function randomBuffer(sizeBytes) {
  const buffer = Buffer.alloc(Math.max(0, sizeBytes));
  for (let index = 0; index < buffer.length; index += 1) {
    buffer[index] = randomInt(0, 255);
  }
  return buffer;
}

function makeZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, value] of Object.entries(entries)) {
    const nameBuffer = Buffer.from(name, 'utf8');
    const dataBuffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
    const crc = crc32(dataBuffer);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDataFieldCatalog() {
  return [
    { id: 'id', label: 'ID', group: '基础' },
    { id: 'name', label: '姓名', group: '用户' },
    { id: 'gender', label: '性别', group: '用户' },
    { id: 'phone', label: '手机号', group: '用户' },
    { id: 'email', label: '邮箱', group: '用户' },
    { id: 'username', label: '用户名', group: '用户' },
    { id: 'password', label: '密码', group: '用户' },
    { id: 'id_card', label: '身份证号', group: '用户' },
    { id: 'address', label: '地址', group: '地址' },
    { id: 'city', label: '城市', group: '地址' },
    { id: 'company', label: '公司', group: '业务' },
    { id: 'department', label: '部门', group: '业务' },
    { id: 'job_title', label: '职位', group: '业务' },
    { id: 'order_no', label: '订单号', group: '业务' },
    { id: 'product_name', label: '商品名', group: '业务' },
    { id: 'amount', label: '金额', group: '业务' },
    { id: 'status', label: '状态', group: '业务' },
    { id: 'date', label: '日期', group: '时间' },
    { id: 'datetime', label: '日期时间', group: '时间' },
    { id: 'uuid', label: 'UUID', group: '技术' },
    { id: 'ip', label: 'IP 地址', group: '技术' },
    { id: 'remark', label: '备注', group: '文本' }
  ];
}

function getGeneratedDataFiles() {
  if (!fs.existsSync(dataGeneratorOutputDir)) {
    return [];
  }

  return fs
    .readdirSync(dataGeneratorOutputDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(csv|sql)$/i.test(entry.name))
    .map((entry) => {
      const filePath = path.join(dataGeneratorOutputDir, entry.name);
      const stat = fs.statSync(filePath);
      return {
        name: entry.name,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
        url: `/data-output/${encodeURIComponent(entry.name)}`
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function generateDataFile(body, res) {
  const count = Math.max(1, Math.min(Number(body.count || 10), 10000));
  const selectedFields = Array.isArray(body.fields) && body.fields.length > 0
    ? body.fields
    : ['id', 'name', 'phone', 'email'];
  const fields = selectedFields.filter((field) => getDataFieldCatalog().some((item) => item.id === field));
  const format = String(body.format || 'csv').toLowerCase() === 'sql' ? 'sql' : 'csv';
  const tableName = sanitizeSqlIdentifier(String(body.tableName || 'test_data'));
  const rows = Array.from({ length: count }, (_, index) => generateDataRow(fields, index + 1));
  const content = format === 'sql'
    ? renderSql(tableName, fields, rows)
    : renderCsv(fields, rows);
  const fileName = `test-data-${formatTimestamp(new Date())}.${format}`;

  fs.mkdirSync(dataGeneratorOutputDir, { recursive: true });
  fs.writeFileSync(path.join(dataGeneratorOutputDir, fileName), content, 'utf8');

  return sendJson(res, {
    file: {
      name: fileName,
      url: `/data-output/${encodeURIComponent(fileName)}`,
      rows: rows.length,
      format
    },
    preview: rows.slice(0, 8),
    fields
  });
}

function generateDataRow(fields, rowNumber) {
  const row = {};
  for (const field of fields) {
    row[field] = generateFieldValue(field, rowNumber);
  }
  return row;
}

function generateFieldValue(field, rowNumber) {
  const now = Date.now();
  const date = new Date(now - randomInt(0, 365) * 24 * 60 * 60 * 1000);
  const names = ['张伟', '王芳', '李娜', '刘洋', '陈强', '杨敏', '赵磊', '黄静', '周杰', '吴丽'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '苏州'];
  const streets = ['人民路', '中山路', '建设路', '解放路', '幸福路', '科技大道'];
  const products = ['测试手机', '会员套餐', '办公电脑', '蓝牙耳机', '云服务包', '智能手表'];
  const companies = ['启航科技', '星河软件', '华盛贸易', '云帆信息', '鸿图网络'];
  const departments = ['测试部', '研发部', '产品部', '运营部', '财务部'];
  const jobs = ['测试工程师', '开发工程师', '产品经理', '运维工程师', '数据分析师'];
  const statuses = ['active', 'pending', 'disabled', 'success', 'failed'];

  switch (field) {
    case 'id':
      return rowNumber;
    case 'name':
      return pick(names);
    case 'gender':
      return pick(['男', '女']);
    case 'phone':
      return `1${pick(['3', '5', '7', '8', '9'])}${String(randomInt(0, 999999999)).padStart(9, '0')}`;
    case 'email':
      return `user${rowNumber}${randomInt(100, 999)}@example.com`;
    case 'username':
      return `test_user_${String(rowNumber).padStart(4, '0')}`;
    case 'password':
      return `Test@${randomInt(100000, 999999)}`;
    case 'id_card':
      return `${randomInt(110000, 659999)}${formatDateCompact(date)}${String(randomInt(1, 9999)).padStart(4, '0')}`;
    case 'address':
      return `${pick(cities)}${pick(streets)}${randomInt(1, 399)}号`;
    case 'city':
      return pick(cities);
    case 'company':
      return `${pick(companies)}有限公司`;
    case 'department':
      return pick(departments);
    case 'job_title':
      return pick(jobs);
    case 'order_no':
      return `ORD${formatDateCompact(new Date())}${String(rowNumber).padStart(5, '0')}${randomInt(10, 99)}`;
    case 'product_name':
      return pick(products);
    case 'amount':
      return (randomInt(100, 999999) / 100).toFixed(2);
    case 'status':
      return pick(statuses);
    case 'date':
      return formatDateOnly(date);
    case 'datetime':
      return `${formatDateOnly(date)} ${String(randomInt(0, 23)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;
    case 'uuid':
      return cryptoRandomUuid();
    case 'ip':
      return `${randomInt(10, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
    case 'remark':
      return `测试数据-${rowNumber}`;
    default:
      return '';
  }
}

function renderCsv(fields, rows) {
  const lines = [
    fields.join(','),
    ...rows.map((row) => fields.map((field) => escapeCsv(row[field])).join(','))
  ];
  return `\ufeff${lines.join('\r\n')}`;
}

function renderSql(tableName, fields, rows) {
  return rows
    .map((row) => {
      const columns = fields.map((field) => `\`${sanitizeSqlIdentifier(field)}\``).join(', ');
      const values = fields.map((field) => sqlValue(row[field])).join(', ');
      return `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});`;
    })
    .join('\r\n');
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function sqlValue(value) {
  if (typeof value === 'number') {
    return String(value);
  }
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function sanitizeSqlIdentifier(value) {
  const safeValue = String(value || '').replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  return safeValue || 'test_data';
}

function formatTimestamp(date) {
  return `${formatDateCompact(date)}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
}

function formatDateCompact(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateOnly(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function cryptoRandomUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getApiConfig() {
  if (!fs.existsSync(apiConfigFile)) {
    return { base_url: '', headers: {} };
  }

  return JSON.parse(fs.readFileSync(apiConfigFile, 'utf8'));
}

function saveApiConfig(body, res) {
  const config = {
    base_url: String(body.base_url || '').trim(),
    headers: parseObject(body.headers, 'headers')
  };

  fs.mkdirSync(path.dirname(apiConfigFile), { recursive: true });
  fs.writeFileSync(apiConfigFile, JSON.stringify(config, null, 2), 'utf8');
  return sendJson(res, config);
}

function getApiCases() {
  if (!fs.existsSync(apiCasesDir)) {
    return [];
  }

  return fs
    .readdirSync(apiCasesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const filePath = path.join(apiCasesDir, entry.name);
      const stat = fs.statSync(filePath);
      const apiCase = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        ...apiCase,
        file: entry.name,
        updatedAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => (a.order || 1000) - (b.order || 1000) || a.name.localeCompare(b.name));
}

function saveApiCase(body, res) {
  const apiCase = normalizeApiCase(body);
  const filePath = path.join(apiCasesDir, `${sanitizeRecordingName(apiCase.name)}.json`);
  fs.mkdirSync(apiCasesDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(apiCase, null, 2), 'utf8');
  return sendJson(res, apiCase);
}

function deleteApiCases(body, res) {
  const names = Array.isArray(body.names) ? body.names : [body.name].filter(Boolean);
  const deleted = [];

  for (const name of names) {
    const safeName = sanitizeRecordingName(String(name || ''));
    const filePath = path.resolve(apiCasesDir, `${safeName}.json`);
    if (!filePath.startsWith(apiCasesDir) || !fs.existsSync(filePath)) {
      continue;
    }
    fs.unlinkSync(filePath);
    deleted.push(safeName);
  }

  return sendJson(res, { deleted });
}

function importPostmanCollection(body, res) {
  const collection = body.collection || body;
  const imported = [];
  const items = flattenPostmanItems(collection.item || []);
  fs.mkdirSync(apiCasesDir, { recursive: true });

  items.forEach((item, index) => {
    const apiCase = normalizeApiCase({
      name: uniqueApiCaseName(`${String(index + 1).padStart(3, '0')}-${item.name || 'postman-case'}`),
      order: index + 1,
      method: item.request?.method || 'GET',
      path: postmanUrlToPath(item.request?.url),
      headers: postmanHeadersToObject(item.request?.header),
      params: postmanQueryToObject(item.request?.url),
      body: postmanBodyToJson(item.request?.body),
      extract: [],
      assertions: [{ type: 'status_code', expected: 200 }]
    });
    const filePath = path.join(apiCasesDir, `${apiCase.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(apiCase, null, 2), 'utf8');
    imported.push(apiCase.name);
  });

  return sendJson(res, { imported, count: imported.length });
}

function runApiCases(body, res) {
  fs.mkdirSync(path.dirname(apiReportFile), { recursive: true });
  const args = [
    '-m',
    'pytest',
    '-p',
    'no:cacheprovider',
    'runner',
    '--html',
    'reports/report.html',
    '--self-contained-html'
  ];

  if (body.name) {
    args.push('--case', sanitizeRecordingName(String(body.name)));
  }

  return startRun('api', body.name ? `API ${body.name}` : 'API all cases', args, res, {
    cwd: apiTesterRoot,
    command: 'python'
  });
}

async function runApiLoadTest(body, res) {
  const caseName = sanitizeRecordingName(String(body.name || ''));
  const apiCase = getApiCases().find((item) => item.name === caseName);
  if (!apiCase) {
    return sendJson(res, { error: 'Choose an API case to load test.' }, 400);
  }

  const total = clampNumber(body.total, 1, 10000, 100);
  const concurrency = clampNumber(body.concurrency, 1, 500, 10);
  const timeout = clampNumber(body.timeout, 1, 120, 10) * 1000;
  const settings = getApiConfig();
  const requestPlan = buildLoadTestRequest(settings, apiCase);
  const startedAt = new Date();
  const results = await runConcurrentRequests(total, concurrency, () => sendLoadRequest(requestPlan, timeout));
  const finishedAt = new Date();
  const summary = summarizeLoadResults(apiCase.name, total, concurrency, startedAt, finishedAt, results);
  const files = saveLoadTestReport(summary, results);

  return sendJson(res, { summary, files });
}

function buildLoadTestRequest(settings, apiCase) {
  const url = buildUrl(settings.base_url || '', apiCase.path || '');
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Load test URL must be absolute or Base URL must be configured.');
  }

  const headers = {
    ...(settings.headers || {}),
    ...(apiCase.headers || {})
  };
  const finalUrl = appendQueryParams(url, apiCase.params || {});
  const method = String(apiCase.method || 'GET').toUpperCase();
  const request = { method, headers, url: finalUrl };
  if (!['GET', 'HEAD'].includes(method) && apiCase.body !== null && apiCase.body !== undefined) {
    request.body = typeof apiCase.body === 'string' ? apiCase.body : JSON.stringify(apiCase.body);
    if (!Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }
  }
  return request;
}

function buildUrl(baseUrl, requestPath) {
  if (/^https?:\/\//i.test(requestPath)) {
    return requestPath;
  }
  if (!baseUrl) {
    return requestPath;
  }
  return new URL(requestPath.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`).toString();
}

function appendQueryParams(url, params) {
  const finalUrl = new URL(url);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') {
      finalUrl.searchParams.set(key, String(value));
    }
  }
  return finalUrl.toString();
}

async function runConcurrentRequests(total, concurrency, taskFactory) {
  const results = [];
  let nextIndex = 0;
  const workerCount = Math.min(total, concurrency);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < total) {
      const requestIndex = nextIndex + 1;
      nextIndex += 1;
      const result = await taskFactory();
      results.push({ index: requestIndex, ...result });
    }
  });
  await Promise.all(workers);
  return results.sort((a, b) => a.index - b.index);
}

async function sendLoadRequest(requestPlan, timeout) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(requestPlan.url, {
      method: requestPlan.method,
      headers: requestPlan.headers,
      body: requestPlan.body,
      signal: controller.signal
    });
    const duration = performance.now() - startedAt;
    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      duration: Math.round(duration),
      error: ''
    };
  } catch (error) {
    const duration = performance.now() - startedAt;
    return {
      ok: false,
      status: 0,
      duration: Math.round(duration),
      error: error.name === 'AbortError' ? 'timeout' : error.message
    };
  } finally {
    clearTimeout(timer);
  }
}

function summarizeLoadResults(caseName, total, concurrency, startedAt, finishedAt, results) {
  const durations = results.map((result) => result.duration).sort((a, b) => a - b);
  const success = results.filter((result) => result.ok).length;
  const failed = results.length - success;
  const elapsedSeconds = Math.max(0.001, (finishedAt.getTime() - startedAt.getTime()) / 1000);
  const statusCounts = {};
  for (const result of results) {
    const key = result.status || result.error || 'unknown';
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  }

  return {
    caseName,
    total,
    concurrency,
    success,
    failed,
    qps: Number((results.length / elapsedSeconds).toFixed(2)),
    avgMs: Math.round(durations.reduce((sum, item) => sum + item, 0) / Math.max(1, durations.length)),
    minMs: durations[0] || 0,
    maxMs: durations[durations.length - 1] || 0,
    p95Ms: percentile(durations, 95),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    statusCounts
  };
}

function saveLoadTestReport(summary, results) {
  const fileBase = `load-test-${sanitizeRecordingName(summary.caseName)}-${formatTimestamp(new Date())}`;
  const jsonFile = `${fileBase}.json`;
  const csvFile = `${fileBase}.csv`;
  const reportsDir = path.join(apiTesterRoot, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, jsonFile), JSON.stringify({ summary, results }, null, 2), 'utf8');
  fs.writeFileSync(path.join(reportsDir, csvFile), renderLoadCsv(results), 'utf8');
  return {
    json: `/api-report/${jsonFile}`,
    csv: `/api-report/${csvFile}`
  };
}

function renderLoadCsv(results) {
  const lines = ['index,ok,status,duration_ms,error'];
  for (const result of results) {
    lines.push([
      result.index,
      result.ok,
      result.status,
      result.duration,
      escapeCsv(result.error)
    ].join(','));
  }
  return `\ufeff${lines.join('\r\n')}`;
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }
  const index = Math.ceil((percentileValue / 100) * values.length) - 1;
  return values[Math.max(0, Math.min(index, values.length - 1))];
}

function clampNumber(value, min, max, fallback) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(parsedValue)));
}

function openApiReport(res) {
  if (!fs.existsSync(apiReportFile)) {
    return sendJson(res, { error: 'No API report found. Run API cases first.' }, 404);
  }

  return sendJson(res, {
    message: 'API report is ready.',
    url: '/api-report/report.html'
  });
}

function getApiSummary() {
  if (!fs.existsSync(apiSummaryFile)) {
    return { exists: false, total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, results: [] };
  }

  return {
    exists: true,
    ...JSON.parse(fs.readFileSync(apiSummaryFile, 'utf8'))
  };
}

function normalizeApiCase(body) {
  const name = String(body.name || '').trim();
  if (!name) {
    throw new Error('API case name is required.');
  }

  return {
    name: sanitizeRecordingName(name),
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 1000,
    method: String(body.method || 'GET').toUpperCase(),
    path: String(body.path || '').trim(),
    headers: parseObject(body.headers, 'headers'),
    params: parseObject(body.params, 'params'),
    body: parseNullableJson(body.body, 'body'),
    assertions: Array.isArray(body.assertions) ? body.assertions : [],
    extract: Array.isArray(body.extract) ? body.extract : []
  };
}

function uniqueApiCaseName(name) {
  const baseName = sanitizeRecordingName(name);
  let candidate = baseName;
  let index = 2;
  while (fs.existsSync(path.join(apiCasesDir, `${candidate}.json`))) {
    candidate = `${baseName}-${index}`;
    index += 1;
  }
  return candidate;
}

function flattenPostmanItems(items, parentName = '') {
  const result = [];
  for (const item of items) {
    const displayName = [parentName, item.name].filter(Boolean).join('-');
    if (item.item) {
      result.push(...flattenPostmanItems(item.item, displayName));
      continue;
    }
    if (item.request) {
      result.push({ ...item, name: displayName || item.name });
    }
  }
  return result;
}

function postmanUrlToPath(url) {
  if (!url) {
    return '';
  }
  const rawUrl = typeof url === 'string' ? url : url.raw;
  if (rawUrl) {
    const withoutBaseVariable = rawUrl.replace(/^\{\{[^}]+\}\}/, '');
    if (withoutBaseVariable !== rawUrl) {
      return stripQuery(withoutBaseVariable) || '/';
    }
    try {
      const parsedUrl = new URL(rawUrl);
      return parsedUrl.pathname || '/';
    } catch {
      return stripQuery(rawUrl);
    }
  }
  if (Array.isArray(url.path)) {
    return `/${url.path.join('/')}`;
  }
  return '';
}

function stripQuery(value) {
  return String(value || '').split('?')[0];
}

function postmanQueryToObject(url) {
  if (!url || typeof url === 'string') {
    return {};
  }
  const query = Array.isArray(url.query) ? url.query : [];
  return Object.fromEntries(
    query
      .filter((item) => !item.disabled && item.key)
      .map((item) => [item.key, item.value ?? ''])
  );
}

function postmanHeadersToObject(headers) {
  if (!Array.isArray(headers)) {
    return {};
  }
  return Object.fromEntries(
    headers
      .filter((item) => !item.disabled && item.key)
      .map((item) => [item.key, item.value ?? ''])
  );
}

function postmanBodyToJson(body) {
  if (!body) {
    return null;
  }
  if (body.mode === 'raw') {
    const raw = String(body.raw || '').trim();
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (body.mode === 'urlencoded' && Array.isArray(body.urlencoded)) {
    return Object.fromEntries(
      body.urlencoded
        .filter((item) => !item.disabled && item.key)
        .map((item) => [item.key, item.value ?? ''])
    );
  }
  return null;
}

function parseObject(value, label) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  throw new Error(`${label} must be a JSON object.`);
}

function parseNullableJson(value, label) {
  if (value === '' || value === undefined) {
    return null;
  }
  return value;
}

function getRecordings() {
  if (!fs.existsSync(recordingsDir)) {
    return [];
  }

  return fs
    .readdirSync(recordingsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.js'))
    .map((entry) => {
      const filePath = path.join(recordingsDir, entry.name);
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        name: entry.name.replace(/\.spec\.js$/i, ''),
        file: entry.name,
        actions: countRecordedActions(content),
        hardened: content.includes('../support/robust-actions.js'),
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getArtifacts() {
  const reportPath = path.join(reportDir, 'index.html');
  const latestTrace = findLatestTrace();

  return {
    report: fs.existsSync(reportPath)
      ? {
          exists: true,
          path: reportPath,
          updatedAt: fs.statSync(reportPath).mtime.toISOString()
        }
      : { exists: false },
    latestTrace
  };
}

function getTraces() {
  return findTraceFiles(testResultsDir)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function startRecord(body, res) {
  const name = String(body.name || '').trim();
  const url = String(body.url || '').trim();
  const force = Boolean(body.force);

  if (!name || !url) {
    return sendJson(res, { error: 'Recording name and URL are required.' }, 400);
  }

  const outputFile = path.join(recordingsDir, `${sanitizeRecordingName(name)}.spec.js`);
  if (fs.existsSync(outputFile) && !force) {
    return sendJson(res, { error: 'Recording already exists. Enable overwrite first.' }, 409);
  }

  const args = [playwrightCliPath, 'codegen', '--output', outputFile, url];
  return startRun('record', `Record ${name}`, args, res, {
    onSuccess: () => normalizeRecordingFile(outputFile)
  });
}

function hardenRecording(body, res) {
  const name = String(body.name || '').trim();
  if (!name) {
    return sendJson(res, { error: 'Choose a recording to harden.' }, 400);
  }

  const filePath = path.join(recordingsDir, `${sanitizeRecordingName(name)}.spec.js`);
  if (!fs.existsSync(filePath)) {
    return sendJson(res, { error: 'Recording not found.' }, 404);
  }

  const result = hardenRecordingFile(filePath);
  return sendJson(res, {
    changed: result.changed,
    replacements: result.replacements
  });
}

function deleteRecordings(body, res) {
  const names = Array.isArray(body.names)
    ? body.names
    : [body.name].filter(Boolean);

  const uniqueNames = [...new Set(names.map((name) => String(name || '').trim()).filter(Boolean))];
  if (uniqueNames.length === 0) {
    return sendJson(res, { error: 'Choose at least one recording to delete.' }, 400);
  }

  const deleted = [];
  const missing = [];

  for (const name of uniqueNames) {
    const safeName = sanitizeRecordingName(name);
    const filePath = path.resolve(recordingsDir, `${safeName}.spec.js`);

    if (!filePath.startsWith(recordingsDir)) {
      return sendJson(res, { error: 'Invalid recording path.' }, 400);
    }

    if (!fs.existsSync(filePath)) {
      missing.push(safeName);
      continue;
    }

    fs.unlinkSync(filePath);
    deleted.push(safeName);
  }

  return sendJson(res, { deleted, missing });
}

function startReplay(body, res) {
  const name = String(body.name || '').trim();
  if (!name) {
    return sendJson(res, { error: 'Choose a recording to replay.' }, 400);
  }

  const args = ['scripts/replay.js', '--name', name];
  if (body.headed) {
    args.push('--headed');
  }
  if (body.trace !== false) {
    args.push('--trace');
  }

  return startRun('replay', `Replay ${name}`, args, res);
}

function startReplayAll(body, res) {
  const recordings = getRecordings();
  if (recordings.length === 0) {
    return sendJson(res, { error: 'No recordings to replay.' }, 400);
  }

  const args = [playwrightCliPath, 'test'];
  if (body.trace !== false) {
    args.push('--trace', 'on');
  }

  return startRun('report', 'Replay all recordings', args, res);
}

function openReport(res) {
  const reportPath = path.join(reportDir, 'index.html');
  if (!fs.existsSync(reportPath)) {
    return sendJson(res, { error: 'No HTML report found. Run all recordings first.' }, 404);
  }

  return sendJson(res, {
    message: 'Report is ready.',
    url: '/playwright-report/index.html'
  });
}

function openTrace(body, res) {
  const requestedPath = String(body.path || '').trim();
  const trace = requestedPath ? findTraceByPath(requestedPath) : findLatestTrace();
  if (!trace) {
    return sendJson(res, { error: 'No trace.zip found. Replay with Trace first.' }, 404);
  }

  launchViewer([playwrightCliPath, 'show-trace', trace.path, '--host', '127.0.0.1', '--port', '0']);
  return sendJson(res, {
    message: 'Trace viewer started.',
    trace
  });
}

function startRun(type, label, args, res, options = {}) {
  const run = {
    id: nextRunId,
    type,
    label,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
    output: ''
  };

  nextRunId += 1;
  runs.set(run.id, run);

  const child = spawn(options.command || process.execPath, args, {
    cwd: options.cwd || recorderRoot,
    shell: false,
    windowsHide: false
  });

  child.stdout.on('data', (chunk) => appendOutput(run, chunk));
  child.stderr.on('data', (chunk) => appendOutput(run, chunk));
  child.on('error', (error) => {
    run.status = 'failed';
    run.finishedAt = new Date().toISOString();
    run.output += `\n${error.message}`;
  });
  child.on('exit', (code) => {
    run.status = code === 0 ? 'finished' : 'failed';
    run.exitCode = code;
    run.finishedAt = new Date().toISOString();

    if (code === 0 && options.onSuccess) {
      const result = options.onSuccess();
      if (result?.changed) {
        run.output += `\nCleaned recording: removed ${result.removed} unstable action(s).`;
      }
    }
  });

  sendJson(res, run, 202);
}

function launchViewer(args) {
  const child = spawn(process.execPath, args, {
    cwd: recorderRoot,
    detached: true,
    shell: false,
    stdio: 'ignore',
    windowsHide: false
  });

  child.unref();
}

function appendOutput(run, chunk) {
  run.output += chunk.toString();
  if (run.output.length > 12_000) {
    run.output = run.output.slice(-12_000);
  }
}

function countRecordedActions(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => /^\s*await\s+/.test(line))
    .length;
}

function sanitizeRecordingName(name) {
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

function findLatestTrace() {
  const traces = getTraces();
  if (traces.length === 0) {
    return null;
  }

  return traces[0];
}

function findTraceByPath(tracePath) {
  const absolutePath = path.resolve(tracePath);
  if (!absolutePath.startsWith(testResultsDir) || path.basename(absolutePath) !== 'trace.zip') {
    return null;
  }

  return getTraces().find((trace) => trace.path === absolutePath) || null;
}

function findTraceFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTraceFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name === 'trace.zip') {
      const stat = fs.statSync(entryPath);
      results.push({
        name: path.basename(path.dirname(entryPath)),
        path: entryPath,
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      });
    }
  }

  return results;
}

function serveStatic(pathname, res) {
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  return serveFileFrom(publicDir, requestPath.slice(1), res);
}

function serveFileFrom(rootDir, requestPath, res) {
  const cleanPath = requestPath || 'index.html';
  const filePath = path.resolve(rootDir, cleanPath);

  if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
    return sendJson(res, { error: 'Not found' }, 404);
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}
