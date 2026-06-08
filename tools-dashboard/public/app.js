const state = {
  artifacts: null,
  apiCases: [],
  apiConfig: null,
  apiSummary: null,
  editingApiCase: null,
  deleteTargetNames: [],
  dataFields: [],
  dataFiles: [],
  dataPreview: [],
  boundaryFiles: [],
  boundaryFormats: [],
  latestDataFile: null,
  latestBoundaryFiles: [],
  loadResult: null,
  compressedImageUrl: null,
  directoryTreeText: '',
  recordings: [],
  runs: [],
  selectedNames: new Set(),
  tools: [],
  traces: []
};

const elements = {
  artifactMeta: document.querySelector('#artifactMeta'),
  artifactStatus: document.querySelector('#artifactStatus'),
  batchBoundaryButton: document.querySelector('#batchBoundaryButton'),
  boundaryArtifactMeta: document.querySelector('#boundaryArtifactMeta'),
  boundaryFileCount: document.querySelector('#boundaryFileCount'),
  boundaryFileList: document.querySelector('#boundaryFileList'),
  boundaryForm: document.querySelector('#boundaryForm'),
  boundaryFormatGrid: document.querySelector('#boundaryFormatGrid'),
  boundaryFormatSelect: document.querySelector('#boundaryFormatSelect'),
  browseTreePathButton: document.querySelector('#browseTreePathButton'),
  apiCaseAssertions: document.querySelector('#apiCaseAssertions'),
  apiCaseBody: document.querySelector('#apiCaseBody'),
  apiCaseCount: document.querySelector('#apiCaseCount'),
  apiCaseExtract: document.querySelector('#apiCaseExtract'),
  apiCaseHeaders: document.querySelector('#apiCaseHeaders'),
  apiCaseList: document.querySelector('#apiCaseList'),
  apiCaseMethod: document.querySelector('#apiCaseMethod'),
  apiCaseModal: document.querySelector('#apiCaseModal'),
  apiCaseModalTitle: document.querySelector('#apiCaseModalTitle'),
  apiCaseName: document.querySelector('#apiCaseName'),
  apiCaseOrder: document.querySelector('#apiCaseOrder'),
  apiCaseParams: document.querySelector('#apiCaseParams'),
  apiCasePath: document.querySelector('#apiCasePath'),
  apiConfigForm: document.querySelector('#apiConfigForm'),
  apiStatus: document.querySelector('#apiStatus'),
  apiSummary: document.querySelector('#apiSummary'),
  bulkBar: document.querySelector('#bulkBar'),
  bulkCount: document.querySelector('#bulkCount'),
  bulkDeleteButton: document.querySelector('#bulkDeleteButton'),
  cancelDeleteButton: document.querySelector('#cancelDeleteButton'),
  confirmCopy: document.querySelector('#confirmCopy'),
  confirmDeleteButton: document.querySelector('#confirmDeleteButton'),
  confirmList: document.querySelector('#confirmList'),
  confirmModal: document.querySelector('#confirmModal'),
  cancelApiCaseButton: document.querySelector('#cancelApiCaseButton'),
  dataArtifactMeta: document.querySelector('#dataArtifactMeta'),
  dataFieldGrid: document.querySelector('#dataFieldGrid'),
  dataFileCount: document.querySelector('#dataFileCount'),
  dataFileList: document.querySelector('#dataFileList'),
  dataFormatSelect: document.querySelector('#dataFormatSelect'),
  dataGeneratorForm: document.querySelector('#dataGeneratorForm'),
  dataPreview: document.querySelector('#dataPreview'),
  dataStatus: document.querySelector('#dataStatus'),
  directoryCurrentPath: document.querySelector('#directoryCurrentPath'),
  directoryList: document.querySelector('#directoryList'),
  directoryModal: document.querySelector('#directoryModal'),
  downloadDataLink: document.querySelector('#downloadDataLink'),
  fileBoundaryStatus: document.querySelector('#fileBoundaryStatus'),
  generateBoundaryButton: document.querySelector('#generateBoundaryButton'),
  generateDataButton: document.querySelector('#generateDataButton'),
  generateTreeButton: document.querySelector('#generateTreeButton'),
  imageCompressorForm: document.querySelector('#imageCompressorForm'),
  imageCompressMeta: document.querySelector('#imageCompressMeta'),
  imageInput: document.querySelector('#imageInput'),
  importPostmanButton: document.querySelector('#importPostmanButton'),
  loadCaseSelect: document.querySelector('#loadCaseSelect'),
  loadResult: document.querySelector('#loadResult'),
  loadTestForm: document.querySelector('#loadTestForm'),
  loadTestStatus: document.querySelector('#loadTestStatus'),
  openReportButton: document.querySelector('#openReportButton'),
  closeDirectoryModalButton: document.querySelector('#closeDirectoryModalButton'),
  newApiCaseButton: document.querySelector('#newApiCaseButton'),
  openApiReportButton: document.querySelector('#openApiReportButton'),
  postmanFileInput: document.querySelector('#postmanFileInput'),
  qualityValue: document.querySelector('#qualityValue'),
  refreshButton: document.querySelector('#refreshButton'),
  recordForm: document.querySelector('#recordForm'),
  recordingList: document.querySelector('#recordingList'),
  recordingCount: document.querySelector('#recordingCount'),
  replayAllButton: document.querySelector('#replayAllButton'),
  runAllApiButton: document.querySelector('#runAllApiButton'),
  runLoadTestButton: document.querySelector('#runLoadTestButton'),
  saveApiCaseButton: document.querySelector('#saveApiCaseButton'),
  runList: document.querySelector('#runList'),
  runStatus: document.querySelector('#runStatus'),
  runStatusText: document.querySelector('#runStatusText'),
  runStatusTime: document.querySelector('#runStatusTime'),
  apiResultList: document.querySelector('#apiResultList'),
  selectAllBox: document.querySelector('#selectAllBox'),
  tableNameRow: document.querySelector('#tableNameRow'),
  treeGeneratorForm: document.querySelector('#treeGeneratorForm'),
  treeOutput: document.querySelector('#treeOutput'),
  toolStatus: document.querySelector('#toolStatus'),
  utilityStatus: document.querySelector('#utilityStatus'),
  toast: document.querySelector('#toast')
};

initLiquidPointer();

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => showPanel(button.dataset.panel));
});

elements.batchBoundaryButton.addEventListener('click', () => generateBoundaryFiles('batch'));
elements.browseTreePathButton.addEventListener('click', pickDirectory);
elements.bulkDeleteButton.addEventListener('click', () => openDeleteConfirm([...state.selectedNames]));
elements.cancelApiCaseButton.addEventListener('click', () => elements.apiCaseModal.close());
elements.cancelDeleteButton.addEventListener('click', () => elements.confirmModal.close());
elements.closeDirectoryModalButton.addEventListener('click', () => elements.directoryModal.close());
elements.confirmDeleteButton.addEventListener('click', deleteConfirmed);
elements.dataFormatSelect.addEventListener('change', renderDataFormatState);
elements.generateBoundaryButton.addEventListener('click', () => generateBoundaryFiles('single'));
elements.generateDataButton.addEventListener('click', generateData);
elements.generateTreeButton.addEventListener('click', generateDirectoryTree);
elements.imageCompressorForm.querySelector('#compressImageButton').addEventListener('click', compressImage);
elements.openReportButton.addEventListener('click', openReport);
elements.importPostmanButton.addEventListener('click', () => elements.postmanFileInput.click());
elements.newApiCaseButton.addEventListener('click', () => openApiCaseModal());
elements.openApiReportButton.addEventListener('click', openApiReport);
elements.postmanFileInput.addEventListener('change', importPostmanCollection);
elements.imageCompressorForm.elements.quality.addEventListener('input', updateQualityValue);
elements.refreshButton.addEventListener('click', refresh);
elements.replayAllButton.addEventListener('click', replayAll);
elements.runAllApiButton.addEventListener('click', () => runApiCase());
elements.runLoadTestButton.addEventListener('click', runLoadTest);
elements.saveApiCaseButton.addEventListener('click', saveApiCase);
elements.selectAllBox.addEventListener('change', () => {
  state.selectedNames = elements.selectAllBox.checked
    ? new Set(state.recordings.map((recording) => recording.name))
    : new Set();
  renderRecordings();
  renderRunningState();
});

elements.recordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(elements.recordForm);
  const payload = {
    name: form.get('name'),
    url: form.get('url'),
    force: form.get('force') === 'on'
  };

  try {
    await postJson('/api/playwright/record', payload, '录制已启动');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
});

elements.apiConfigForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(elements.apiConfigForm);
  try {
    await postJson('/api/api-tester/config', {
      base_url: form.get('base_url'),
      headers: parseJsonText(form.get('headers'), {})
    }, '接口配置已保存');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
});

updateQualityValue();
await refresh();
setInterval(refreshRuns, 2000);

function initLiquidPointer() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    return;
  }

  let frame = null;
  let lastEvent = null;
  window.addEventListener('pointermove', (event) => {
    lastEvent = event;
    if (frame) {
      return;
    }
    frame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--cursor-x', `${lastEvent.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${lastEvent.clientY}px`);
      frame = null;
    });
  }, { passive: true });
}

function showPanel(panel) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.panel === panel);
  });
  document.querySelectorAll('.panel').forEach((section) => {
    section.classList.toggle('active', section.id === `panel-${panel}`);
  });
}

async function refresh() {
  const [tools, recordings, runs, artifacts, traces, apiConfig, apiCases, apiSummary, dataFields, dataFiles, boundaryFormats, boundaryFiles] = await Promise.all([
    fetchJson('/api/tools'),
    fetchJson('/api/playwright/recordings'),
    fetchJson('/api/runs'),
    fetchJson('/api/playwright/artifacts'),
    fetchJson('/api/playwright/traces'),
    fetchJson('/api/api-tester/config'),
    fetchJson('/api/api-tester/cases'),
    fetchJson('/api/api-tester/summary'),
    fetchJson('/api/data-generator/fields'),
    fetchJson('/api/data-generator/files'),
    fetchJson('/api/file-boundary/formats'),
    fetchJson('/api/file-boundary/files')
  ]);

  state.tools = tools;
  state.recordings = recordings;
  state.runs = runs;
  state.artifacts = artifacts;
  state.apiConfig = apiConfig;
  state.apiCases = apiCases;
  state.apiSummary = apiSummary;
  state.dataFields = dataFields;
  state.dataFiles = dataFiles;
  state.boundaryFormats = boundaryFormats;
  state.boundaryFiles = boundaryFiles;
  state.traces = traces;
  state.selectedNames = new Set([...state.selectedNames].filter((name) => {
    return recordings.some((recording) => recording.name === name);
  }));

  renderTools();
  renderArtifacts();
  renderRecordings();
  renderApiTester();
  renderDataGenerator();
  renderBoundaryGenerator();
  renderRuns();
  renderRunningState();
}

async function refreshRuns() {
  const [runs, recordings, artifacts, traces, apiSummary] = await Promise.all([
    fetchJson('/api/runs'),
    fetchJson('/api/playwright/recordings'),
    fetchJson('/api/playwright/artifacts'),
    fetchJson('/api/playwright/traces'),
    fetchJson('/api/api-tester/summary')
  ]);
  state.runs = runs;
  state.recordings = recordings;
  state.artifacts = artifacts;
  state.traces = traces;
  state.apiSummary = apiSummary;
  state.selectedNames = new Set([...state.selectedNames].filter((name) => {
    return recordings.some((recording) => recording.name === name);
  }));
  renderArtifacts();
  renderRecordings();
  renderApiSummary();
  renderRuns();
  renderRunningState();
}

function renderTools() {
  const recorder = state.tools.find((tool) => tool.id === 'playwright-recorder');
  const dataGenerator = state.tools.find((tool) => tool.id === 'data-generator');
  const fileBoundaryGenerator = state.tools.find((tool) => tool.id === 'file-boundary-generator');
  const utilityTools = state.tools.find((tool) => tool.id === 'utility-tools');
  elements.toolStatus.textContent = recorder?.status === 'ready' ? 'Ready' : 'Missing';
  elements.dataStatus.textContent = dataGenerator?.status === 'ready' ? 'Ready' : 'Missing';
  elements.fileBoundaryStatus.textContent = fileBoundaryGenerator?.status === 'ready' ? 'Ready' : 'Missing';
  elements.utilityStatus.textContent = utilityTools?.status === 'ready' ? 'Ready' : 'Missing';
}

function renderArtifacts() {
  const report = state.artifacts?.report;
  const trace = state.artifacts?.latestTrace;

  elements.artifactStatus.textContent = report?.exists ? 'Report ready' : 'No report';
  elements.openReportButton.disabled = !report?.exists;
  const reportText = report?.exists
    ? `报告：${formatDate(report.updatedAt)}`
    : '报告：还没有生成';
  const traceText = trace
    ? `Trace：${state.traces.length} 个，最新 ${formatDate(trace.updatedAt)}`
    : 'Trace：还没有生成';

  elements.artifactMeta.textContent = `${reportText} / ${traceText}`;
}

function renderApiTester() {
  const config = state.apiConfig || { base_url: '', headers: {} };
  elements.apiConfigForm.elements.base_url.value = config.base_url || '';
  elements.apiConfigForm.elements.headers.value = JSON.stringify(config.headers || {}, null, 2);
  elements.apiCaseCount.textContent = state.apiCases.length;
  elements.openApiReportButton.disabled = false;
  renderApiSummary();
  renderLoadTester();

  if (state.apiCases.length === 0) {
    elements.apiCaseList.innerHTML = '<div class="empty">还没有接口用例</div>';
    return;
  }

  elements.apiCaseList.innerHTML = state.apiCases.map((apiCase) => `
    <article class="recording-item">
      <div class="recording-main">
        <div class="recording-info">
          <p class="recording-title">${escapeHtml(apiCase.name)}</p>
          <div class="meta">#${escapeHtml(apiCase.order || 1000)} · ${escapeHtml(apiCase.method)} · ${escapeHtml(apiCase.path)} · ${apiCase.extract?.length || 0} extracts · ${apiCase.assertions?.length || 0} assertions</div>
        </div>
        <span class="tag">api</span>
      </div>
      <div class="recording-actions">
        <button class="primary-button" type="button" data-api-action="run" data-name="${escapeHtml(apiCase.name)}">运行</button>
        <button class="secondary-button" type="button" data-api-action="edit" data-name="${escapeHtml(apiCase.name)}">编辑</button>
        <button class="danger-button" type="button" data-api-action="delete" data-name="${escapeHtml(apiCase.name)}">删除</button>
      </div>
    </article>
  `).join('');

  elements.apiCaseList.querySelectorAll('[data-api-action]').forEach((button) => {
    button.addEventListener('click', () => handleApiCaseAction(button));
  });
}

function renderLoadTester() {
  if (!elements.loadCaseSelect) {
    return;
  }
  const selectedName = elements.loadCaseSelect.value;
  elements.loadCaseSelect.innerHTML = state.apiCases.map((apiCase) => `
    <option value="${escapeHtml(apiCase.name)}">${escapeHtml(apiCase.name)} · ${escapeHtml(apiCase.method)} ${escapeHtml(apiCase.path)}</option>
  `).join('');
  if (state.apiCases.some((apiCase) => apiCase.name === selectedName)) {
    elements.loadCaseSelect.value = selectedName;
  }
  elements.runLoadTestButton.disabled = state.apiCases.length === 0;
  if (!state.loadResult) {
    elements.loadResult.innerHTML = '<div class="empty">选择一个接口后可以进行轻量压测</div>';
  }
}

function renderApiSummary() {
  const summary = state.apiSummary;
  if (!elements.apiSummary) {
    return;
  }
  if (!summary?.exists) {
    elements.apiSummary.innerHTML = `
      <div class="summary-card muted-summary">
        <span>还没有接口测试结果</span>
        <strong>Run first</strong>
      </div>
    `;
    renderApiResultList([]);
    return;
  }

  elements.apiSummary.innerHTML = `
    <div class="summary-card">
      <span>总数</span>
      <strong>${summary.total || 0}</strong>
    </div>
    <div class="summary-card pass">
      <span>通过</span>
      <strong>${summary.passed || 0}</strong>
    </div>
    <div class="summary-card fail">
      <span>失败</span>
      <strong>${summary.failed || 0}</strong>
    </div>
    <div class="summary-card">
      <span>耗时</span>
      <strong>${Number(summary.duration || 0).toFixed(1)}s</strong>
    </div>
  `;
  renderApiResultList(summary.results || []);
}

function renderApiResultList(results) {
  if (!elements.apiResultList) {
    return;
  }
  if (!results.length) {
    elements.apiResultList.innerHTML = '';
    return;
  }

  elements.apiResultList.innerHTML = results.map((result) => `
    <article class="api-result ${escapeHtml(result.outcome)}">
      <div>
        <strong>${escapeHtml(result.name)}</strong>
        <span>${escapeHtml(result.outcome)} · ${Number(result.duration || 0).toFixed(2)}s</span>
      </div>
      ${result.message ? `<pre>${escapeHtml(compactFailure(result.message))}</pre>` : ''}
    </article>
  `).join('');
}

function handleApiCaseAction(button) {
  const action = button.dataset.apiAction;
  const name = button.dataset.name;
  const apiCase = state.apiCases.find((item) => item.name === name);

  if (action === 'run') {
    runApiCase(name);
    return;
  }

  if (action === 'edit') {
    openApiCaseModal(apiCase);
    return;
  }

  if (action === 'delete') {
    deleteApiCase(name);
  }
}

function renderDataGenerator() {
  renderDataFields();
  renderDataFiles();
  renderDataPreview();
  renderDataFormatState();
}

function renderDataFields() {
  if (!elements.dataFieldGrid || elements.dataFieldGrid.childElementCount > 0) {
    return;
  }

  const defaultFields = new Set(['id', 'name', 'phone', 'email', 'username', 'amount', 'date']);
  elements.dataFieldGrid.innerHTML = state.dataFields.map((field) => `
    <label class="field-chip">
      <input type="checkbox" value="${escapeHtml(field.id)}" ${defaultFields.has(field.id) ? 'checked' : ''}>
      <span>${escapeHtml(field.label)}</span>
    </label>
  `).join('');
}

function renderDataFiles() {
  elements.dataFileCount.textContent = state.dataFiles.length;
  if (state.latestDataFile) {
    elements.downloadDataLink.hidden = false;
    elements.downloadDataLink.href = state.latestDataFile.url;
    elements.downloadDataLink.download = state.latestDataFile.name;
    elements.dataArtifactMeta.textContent = `${state.latestDataFile.name} · ${state.latestDataFile.rows} rows · ${state.latestDataFile.format.toUpperCase()}`;
  } else if (state.dataFiles.length > 0) {
    const latestFile = state.dataFiles[0];
    elements.downloadDataLink.hidden = false;
    elements.downloadDataLink.href = latestFile.url;
    elements.downloadDataLink.download = latestFile.name;
    elements.dataArtifactMeta.textContent = `最近文件：${latestFile.name}`;
  } else {
    elements.downloadDataLink.hidden = true;
    elements.dataArtifactMeta.textContent = '还没有生成文件';
  }

  if (state.dataFiles.length === 0) {
    elements.dataFileList.innerHTML = '<div class="empty">还没有生成的数据文件</div>';
    return;
  }

  elements.dataFileList.innerHTML = state.dataFiles.map((file) => `
    <article class="recording-item">
      <div class="recording-main">
        <div class="recording-info">
          <p class="recording-title">${escapeHtml(file.name)}</p>
          <div class="meta">${formatDate(file.updatedAt)} · ${formatSize(file.size)}</div>
        </div>
        <span class="tag">${escapeHtml(file.name.split('.').pop())}</span>
      </div>
      <div class="recording-actions">
        <a class="secondary-link compact-link" href="${escapeHtml(file.url)}" download="${escapeHtml(file.name)}">下载</a>
        <button class="danger-button compact-link" type="button" data-generated-action="delete-data" data-name="${escapeHtml(file.name)}">删除</button>
      </div>
    </article>
  `).join('');

  elements.dataFileList.querySelectorAll('[data-generated-action="delete-data"]').forEach((button) => {
    button.addEventListener('click', () => deleteGeneratedDataFile(button.dataset.name));
  });
}

function renderDataPreview() {
  if (!state.dataPreview.length) {
    elements.dataPreview.innerHTML = '<div class="empty">生成后会显示前 8 条预览</div>';
    return;
  }

  const fields = Object.keys(state.dataPreview[0]);
  elements.dataPreview.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${fields.map((field) => `<th>${escapeHtml(field)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${state.dataPreview.map((row) => `
            <tr>${fields.map((field) => `<td>${escapeHtml(row[field])}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDataFormatState() {
  elements.tableNameRow.hidden = elements.dataFormatSelect.value !== 'sql';
}

async function generateData() {
  const form = new FormData(elements.dataGeneratorForm);
  const fields = [...elements.dataFieldGrid.querySelectorAll('input:checked')].map((input) => input.value);
  if (fields.length === 0) {
    showToast('请至少选择一个字段');
    return;
  }

  try {
    const result = await postJson('/api/data-generator/generate', {
      count: Number(form.get('count') || 20),
      format: form.get('format'),
      tableName: form.get('tableName'),
      fields
    }, '测试数据已生成');
    state.latestDataFile = result.file;
    state.dataPreview = result.preview || [];
    state.dataFiles = await fetchJson('/api/data-generator/files');
    renderDataGenerator();
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteGeneratedDataFile(name) {
  if (!confirm(`确认删除数据文件 ${name}？`)) {
    return;
  }

  try {
    await postJson('/api/data-generator/delete-files', { names: [name] }, '数据文件已删除');
    if (state.latestDataFile?.name === name) {
      state.latestDataFile = null;
    }
    state.dataFiles = await fetchJson('/api/data-generator/files');
    renderDataGenerator();
  } catch (error) {
    showToast(error.message);
  }
}

function renderBoundaryGenerator() {
  renderBoundaryFormats();
  renderBoundaryFiles();
}

function renderBoundaryFormats() {
  if (!elements.boundaryFormatSelect || elements.boundaryFormatSelect.childElementCount > 0) {
    return;
  }

  const defaults = new Set(['jpg', 'png', 'pdf', 'txt', 'csv', 'zip']);
  elements.boundaryFormatSelect.innerHTML = state.boundaryFormats.map((format) => `
    <option value="${escapeHtml(format.id)}">${escapeHtml(format.label)}</option>
  `).join('');
  elements.boundaryFormatGrid.innerHTML = state.boundaryFormats.map((format) => `
    <label class="field-chip">
      <input type="checkbox" value="${escapeHtml(format.id)}" ${defaults.has(format.id) ? 'checked' : ''}>
      <span>${escapeHtml(format.label)}</span>
    </label>
  `).join('');
}

function renderBoundaryFiles() {
  elements.boundaryFileCount.textContent = state.boundaryFiles.length;
  if (state.latestBoundaryFiles.length > 0) {
    elements.boundaryArtifactMeta.textContent = `刚生成 ${state.latestBoundaryFiles.length} 个文件`;
  } else if (state.boundaryFiles.length > 0) {
    elements.boundaryArtifactMeta.textContent = `最近文件：${state.boundaryFiles[0].name}`;
  } else {
    elements.boundaryArtifactMeta.textContent = '还没有生成边界文件';
  }

  if (state.boundaryFiles.length === 0) {
    elements.boundaryFileList.innerHTML = '<div class="empty">还没有生成的边界文件</div>';
    return;
  }

  elements.boundaryFileList.innerHTML = state.boundaryFiles.map((file) => `
    <article class="recording-item">
      <div class="recording-main">
        <div class="recording-info">
          <p class="recording-title">${escapeHtml(file.name)}</p>
          <div class="meta">${formatDate(file.updatedAt)} · ${formatSize(file.size)}</div>
        </div>
        <span class="tag">${escapeHtml(file.name.split('.').pop())}</span>
      </div>
      <div class="recording-actions">
        <a class="secondary-link compact-link" href="${escapeHtml(file.url)}" download="${escapeHtml(file.name)}">下载</a>
        <button class="danger-button compact-link" type="button" data-generated-action="delete-boundary" data-name="${escapeHtml(file.name)}">删除</button>
      </div>
    </article>
  `).join('');

  elements.boundaryFileList.querySelectorAll('[data-generated-action="delete-boundary"]').forEach((button) => {
    button.addEventListener('click', () => deleteBoundaryFile(button.dataset.name));
  });
}

async function generateBoundaryFiles(mode) {
  const form = new FormData(elements.boundaryForm);
  const selectedFormats = [...elements.boundaryFormatGrid.querySelectorAll('input:checked')].map((input) => input.value);
  if (mode === 'batch' && selectedFormats.length === 0) {
    showToast('请至少选择一个批量格式');
    return;
  }

  try {
    const result = await postJson('/api/file-boundary/generate', {
      mode,
      format: form.get('format'),
      variant: form.get('variant'),
      sizeBytes: Number(form.get('sizeKb') || 0) * 1024,
      nameMode: form.get('nameMode'),
      fileName: form.get('fileName'),
      limitMb: Number(form.get('limitMb') || 10),
      formats: selectedFormats
    }, mode === 'batch' ? '边界文件已批量生成' : '边界文件已生成');
    state.latestBoundaryFiles = result.files || [];
    state.boundaryFiles = await fetchJson('/api/file-boundary/files');
    renderBoundaryGenerator();
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteBoundaryFile(name) {
  if (!confirm(`确认删除边界文件 ${name}？`)) {
    return;
  }

  try {
    await postJson('/api/file-boundary/delete-files', { names: [name] }, '边界文件已删除');
    state.latestBoundaryFiles = state.latestBoundaryFiles.filter((file) => file.name !== name);
    state.boundaryFiles = await fetchJson('/api/file-boundary/files');
    renderBoundaryGenerator();
  } catch (error) {
    showToast(error.message);
  }
}

function renderRecordings() {
  elements.recordingCount.textContent = state.recordings.length;
  elements.bulkBar.hidden = state.recordings.length === 0;
  elements.bulkCount.textContent = `已选 ${state.selectedNames.size} 个`;
  elements.bulkDeleteButton.disabled = state.selectedNames.size === 0;
  elements.selectAllBox.checked = state.recordings.length > 0
    && state.selectedNames.size === state.recordings.length;
  elements.selectAllBox.indeterminate = state.selectedNames.size > 0
    && state.selectedNames.size < state.recordings.length;

  if (state.recordings.length === 0) {
    elements.recordingList.innerHTML = '<div class="empty">还没有录制脚本</div>';
    return;
  }

  elements.recordingList.innerHTML = state.recordings.map((recording) => `
    <article class="recording-item">
      <div class="recording-main">
        <label class="recording-select">
          <input type="checkbox" data-action="select" data-name="${escapeHtml(recording.name)}" ${state.selectedNames.has(recording.name) ? 'checked' : ''}>
          <span class="sr-only">选择 ${escapeHtml(recording.name)}</span>
        </label>
        <div class="recording-info">
          <p class="recording-title">${escapeHtml(recording.name)}</p>
          <div class="meta">${formatDate(recording.updatedAt)} · ${recording.actions} actions · ${formatSize(recording.size)} · ${recording.hardened ? '已增强' : '未增强'}</div>
        </div>
        <span class="tag">spec</span>
      </div>
      <div class="recording-actions">
        <button class="primary-button" type="button" data-action="replay" data-name="${escapeHtml(recording.name)}">回放</button>
        <button class="secondary-button" type="button" data-action="replay-headed" data-name="${escapeHtml(recording.name)}">有界面回放</button>
        <button class="secondary-button" type="button" data-action="harden" data-name="${escapeHtml(recording.name)}">增强定位</button>
      </div>
    </article>
  `).join('');

  elements.recordingList.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', () => handleRecordingAction(element));
    element.addEventListener('change', () => handleRecordingAction(element));
  });
}

function handleRecordingAction(element) {
  const action = element.dataset.action;
  const name = element.dataset.name;

  if (action === 'select') {
    if (element.checked) {
      state.selectedNames.add(name);
    } else {
      state.selectedNames.delete(name);
    }
    renderRecordings();
    renderRunningState();
    return;
  }

  if (action === 'harden') {
    harden(name);
    return;
  }

  replay(name, action);
}

function renderRuns() {
  if (state.runs.length === 0) {
    elements.runList.innerHTML = '<div class="empty">暂无运行记录</div>';
    return;
  }

  elements.runList.innerHTML = state.runs.map((run) => `
    <article class="run-item">
      <div class="run-main">
        <div>
          <p class="run-title">${escapeHtml(run.label)}</p>
          <div class="meta">${formatDate(run.startedAt)} · ${escapeHtml(statusText(run.status))}</div>
        </div>
        <span class="tag">${escapeHtml(run.type)}</span>
      </div>
      ${run.output ? `<pre>${escapeHtml(run.output)}</pre>` : ''}
    </article>
  `).join('');
}

function renderRunningState() {
  const running = state.runs.find((run) => run.status === 'running');
  const busy = Boolean(running);

  elements.runStatus.hidden = !busy;
  elements.replayAllButton.disabled = busy;
  elements.recordForm.querySelector('button[type="submit"]').disabled = busy;
  elements.recordingList.querySelectorAll('button[data-action]').forEach((button) => {
    button.disabled = busy;
  });

  if (!running) {
    return;
  }

  const startedAt = new Date(running.startedAt);
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
  elements.runStatusText.textContent = `${running.label} 正在运行`;
  elements.runStatusTime.textContent = `${seconds}s`;
}

function openDeleteConfirm(names) {
  const uniqueNames = [...new Set(names)].filter(Boolean);
  if (uniqueNames.length === 0) {
    showToast('请选择要删除的脚本');
    return;
  }

  state.deleteTargetNames = uniqueNames;
  elements.confirmCopy.textContent = uniqueNames.length === 1
    ? '这个操作会永久删除该录制脚本。'
    : `这个操作会永久删除 ${uniqueNames.length} 个录制脚本。`;
  elements.confirmList.innerHTML = uniqueNames
    .map((name) => `<span>${escapeHtml(name)}</span>`)
    .join('');
  elements.confirmModal.showModal();
}

async function deleteConfirmed() {
  try {
    const names = [...state.deleteTargetNames];
    const result = await postJson('/api/playwright/delete-recordings', { names }, `已删除 ${names.length} 个脚本`);
    for (const name of result.deleted || []) {
      state.selectedNames.delete(name);
    }
    state.deleteTargetNames = [];
    elements.confirmModal.close();
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

async function replay(name, action) {
  try {
    await postJson('/api/playwright/replay', {
      name,
      headed: action === 'replay-headed',
      trace: true
    }, '回放已启动，完成后会生成 Trace');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

function openApiCaseModal(apiCase = null) {
  state.editingApiCase = apiCase?.name || null;
  elements.apiCaseModalTitle.textContent = apiCase ? '编辑接口' : '新增接口';
  elements.apiCaseName.value = apiCase?.name || '';
  elements.apiCaseName.disabled = Boolean(apiCase);
  elements.apiCaseOrder.value = apiCase?.order || nextApiCaseOrder();
  elements.apiCaseMethod.value = apiCase?.method || 'GET';
  elements.apiCasePath.value = apiCase?.path || '';
  elements.apiCaseHeaders.value = JSON.stringify(apiCase?.headers || {}, null, 2);
  elements.apiCaseParams.value = JSON.stringify(apiCase?.params || {}, null, 2);
  elements.apiCaseBody.value = apiCase?.body === null || apiCase?.body === undefined
    ? ''
    : JSON.stringify(apiCase.body, null, 2);
  elements.apiCaseExtract.value = JSON.stringify(apiCase?.extract || [], null, 2);
  elements.apiCaseAssertions.value = JSON.stringify(apiCase?.assertions || [
    { type: 'status_code', expected: 200 }
  ], null, 2);
  elements.apiCaseModal.showModal();
}

async function saveApiCase() {
  try {
    await postJson('/api/api-tester/cases', {
      name: elements.apiCaseName.value,
      order: Number(elements.apiCaseOrder.value || 1000),
      method: elements.apiCaseMethod.value,
      path: elements.apiCasePath.value,
      headers: parseJsonText(elements.apiCaseHeaders.value, {}),
      params: parseJsonText(elements.apiCaseParams.value, {}),
      body: parseJsonText(elements.apiCaseBody.value, null),
      extract: parseJsonText(elements.apiCaseExtract.value, []),
      assertions: parseJsonText(elements.apiCaseAssertions.value, [])
    }, '接口用例已保存');
    elements.apiCaseModal.close();
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

function nextApiCaseOrder() {
  if (state.apiCases.length === 0) {
    return 1;
  }
  return Math.max(...state.apiCases.map((apiCase) => Number(apiCase.order || 1000))) + 1;
}

async function runApiCase(name) {
  try {
    await postJson('/api/api-tester/run', { name }, name ? '接口用例已启动' : '全部接口已启动');
    showPanel('runs');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

async function runLoadTest() {
  const form = new FormData(elements.loadTestForm);
  elements.runLoadTestButton.disabled = true;
  elements.loadTestStatus.textContent = 'Running';
  elements.loadResult.innerHTML = `
    <div class="run-status">
      <div class="run-status-row">
        <span>接口压测正在运行</span>
        <span>${Number(form.get('total') || 0)} requests</span>
      </div>
      <div class="progress-bar" aria-hidden="true"><span></span></div>
    </div>
  `;

  try {
    const result = await postJson('/api/api-tester/load-test', {
      name: form.get('name'),
      concurrency: Number(form.get('concurrency') || 10),
      total: Number(form.get('total') || 100),
      timeout: Number(form.get('timeout') || 10)
    }, '接口压测完成');
    state.loadResult = result;
    renderLoadResult(result);
  } catch (error) {
    elements.loadResult.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    showToast(error.message);
  } finally {
    elements.loadTestStatus.textContent = 'Idle';
    elements.runLoadTestButton.disabled = state.apiCases.length === 0;
  }
}

function renderLoadResult(result) {
  const summary = result.summary;
  elements.loadResult.innerHTML = `
    <div class="load-summary">
      <div class="summary-card">
        <span>总请求</span>
        <strong>${summary.total}</strong>
      </div>
      <div class="summary-card pass">
        <span>成功</span>
        <strong>${summary.success}</strong>
      </div>
      <div class="summary-card fail">
        <span>失败</span>
        <strong>${summary.failed}</strong>
      </div>
      <div class="summary-card">
        <span>QPS</span>
        <strong>${summary.qps}</strong>
      </div>
      <div class="summary-card">
        <span>平均耗时</span>
        <strong>${summary.avgMs}ms</strong>
      </div>
      <div class="summary-card">
        <span>P95</span>
        <strong>${summary.p95Ms}ms</strong>
      </div>
      <div class="summary-card">
        <span>最小/最大</span>
        <strong>${summary.minMs}/${summary.maxMs}ms</strong>
      </div>
      <div class="summary-card">
        <span>并发</span>
        <strong>${summary.concurrency}</strong>
      </div>
    </div>
    <div class="load-actions">
      <a class="secondary-link compact-link" href="${escapeHtml(result.files.json)}" target="_blank" rel="noopener">JSON 报告</a>
      <a class="secondary-link compact-link" href="${escapeHtml(result.files.csv)}" download>CSV 明细</a>
    </div>
    <div class="artifact-meta">状态分布：${escapeHtml(formatStatusCounts(summary.statusCounts))}</div>
  `;
}

function formatStatusCounts(statusCounts) {
  return Object.entries(statusCounts || {})
    .map(([status, count]) => `${status}: ${count}`)
    .join(' / ');
}

async function deleteApiCase(name) {
  if (!confirm(`确认删除接口用例 ${name}？`)) {
    return;
  }

  try {
    await postJson('/api/api-tester/delete-cases', { names: [name] }, '接口用例已删除');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

async function openApiReport() {
  try {
    const result = await postJson('/api/api-tester/open-report', {}, '接口报告已打开');
    if (result.url) {
      window.open(result.url, '_blank', 'noopener');
    }
  } catch (error) {
    showToast(error.message);
  }
}

async function compressImage() {
  const file = elements.imageInput.files?.[0];
  if (!file) {
    showToast('请先选择图片');
    return;
  }

  const form = new FormData(elements.imageCompressorForm);
  const quality = Number(form.get('quality') || 0.75);
  const maxWidth = Number(form.get('maxWidth') || 1920);
  const format = String(form.get('format') || 'image/jpeg');

  try {
    const image = await loadImageFromFile(file);
    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, format, quality);
    const extension = format.split('/')[1].replace('jpeg', 'jpg');
    const outputName = `${file.name.replace(/\.[^.]+$/, '')}-compressed.${extension}`;
    if (state.compressedImageUrl) {
      URL.revokeObjectURL(state.compressedImageUrl);
    }
    state.compressedImageUrl = URL.createObjectURL(blob);
    const ratio = file.size > 0 ? Math.max(0, 100 - (blob.size / file.size) * 100) : 0;
    elements.imageCompressMeta.innerHTML = `
      原始 ${formatSize(file.size)} / 压缩后 ${formatSize(blob.size)} / 压缩率 ${ratio.toFixed(1)}%
      <a class="secondary-link compact-link inline-download" href="${state.compressedImageUrl}" download="${escapeHtml(outputName)}">下载图片</a>
    `;
  } catch (error) {
    showToast(error.message);
  }
}

function updateQualityValue() {
  const quality = Number(elements.imageCompressorForm.elements.quality.value || 0);
  elements.qualityValue.textContent = `${Math.round(quality * 100)}%`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, format, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片压缩失败'));
        return;
      }
      resolve(blob);
    }, format, quality);
  });
}

async function generateDirectoryTree() {
  const form = new FormData(elements.treeGeneratorForm);
  try {
    const result = await postJson('/api/utilities/tree', {
      path: form.get('path'),
      depth: Number(form.get('depth') || 4),
      ignore: form.get('ignore'),
      includeFiles: form.get('includeFiles') === 'on'
    }, '目录树已生成');
    state.directoryTreeText = result.tree;
    elements.treeOutput.innerHTML = `
      <div class="recording-actions tree-actions">
        <button class="secondary-button compact-link" id="copyTreeButton" type="button">复制目录树</button>
      </div>
      <pre>${escapeHtml(result.tree)}</pre>
    `;
    document.querySelector('#copyTreeButton').addEventListener('click', copyDirectoryTree);
  } catch (error) {
    showToast(error.message);
  }
}

async function copyDirectoryTree() {
  if (!state.directoryTreeText) {
    showToast('还没有可复制的目录树');
    return;
  }

  try {
    await navigator.clipboard.writeText(state.directoryTreeText);
    showToast('目录树已复制');
  } catch {
    fallbackCopyText(state.directoryTreeText);
    showToast('目录树已复制');
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

async function pickDirectory() {
  const currentPath = elements.treeGeneratorForm.elements.path.value;
  elements.browseTreePathButton.disabled = true;
  try {
    const response = await fetch('/api/utilities/pick-directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Request failed: ${response.status}`);
    }
    if (result.cancelled) {
      showToast('已取消选择目录');
      return;
    }
    showToast('目录已选择');
    elements.treeGeneratorForm.elements.path.value = result.path;
    await generateDirectoryTree();
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.browseTreePathButton.disabled = false;
  }
}

async function openDirectoryPicker(path = null) {
  const formPath = elements.treeGeneratorForm.elements.path.value;
  const targetPath = path || formPath;
  try {
    const data = await fetchJson(`/api/utilities/directories?path=${encodeURIComponent(targetPath)}`);
    renderDirectoryPicker(data);
    elements.directoryModal.showModal();
  } catch (error) {
    showToast(error.message);
  }
}

function renderDirectoryPicker(data) {
  elements.directoryCurrentPath.textContent = data.current;
  const parentButton = data.parent
    ? `<button class="directory-item" type="button" data-dir-path="${escapeHtml(data.parent)}">..</button>`
    : '';
  const directoryButtons = data.directories.map((directory) => `
    <button class="directory-item" type="button" data-dir-path="${escapeHtml(directory.path)}">
      <span>${escapeHtml(directory.name)}</span>
      <small>${escapeHtml(directory.path)}</small>
    </button>
  `).join('');
  const currentButton = `
    <button class="primary-button" type="button" data-select-current="${escapeHtml(data.current)}">
      选择当前目录并生成
    </button>
  `;

  elements.directoryList.innerHTML = `
    <div class="directory-actions">${currentButton}</div>
    ${parentButton}
    ${directoryButtons || '<div class="empty">当前目录下没有子目录</div>'}
  `;

  elements.directoryList.querySelectorAll('[data-dir-path]').forEach((button) => {
    button.addEventListener('click', () => openDirectoryPicker(button.dataset.dirPath));
  });
  elements.directoryList.querySelector('[data-select-current]').addEventListener('click', async (event) => {
    elements.treeGeneratorForm.elements.path.value = event.currentTarget.dataset.selectCurrent;
    elements.directoryModal.close();
    await generateDirectoryTree();
  });
}

async function importPostmanCollection() {
  const file = elements.postmanFileInput.files?.[0];
  if (!file) {
    return;
  }

  try {
    const collection = JSON.parse(await file.text());
    const result = await postJson('/api/api-tester/import-postman', { collection }, 'Postman Collection 已导入');
    showToast(`已导入 ${result.count} 个接口用例`);
    elements.postmanFileInput.value = '';
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

async function harden(name) {
  try {
    const result = await postJson('/api/playwright/harden', { name }, '定位增强完成');
    if (!result.changed) {
      showToast('这个脚本暂时没有可增强的定位');
    }
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

async function replayAll() {
  try {
    await postJson('/api/playwright/replay-all', { trace: true }, '全部回放已启动，完成后会生成报告和 Trace');
    showPanel('runs');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
}

async function openReport() {
  try {
    const result = await postJson('/api/playwright/open-report', {}, '测试报告已打开');
    if (result.url) {
      window.open(result.url, '_blank', 'noopener');
    }
  } catch (error) {
    showToast(error.message);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function postJson(url, payload, message) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  showToast(message);
  return data;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => elements.toast.classList.remove('show'), 2200);
}

function statusText(status) {
  if (status === 'running') {
    return 'running';
  }
  if (status === 'finished') {
    return 'passed';
  }
  return status;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function compactFailure(message) {
  const lines = String(message || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.slice(-8).join('\n');
}

function parseJsonText(value, fallback) {
  const text = String(value || '').trim();
  if (!text) {
    return fallback;
  }
  return JSON.parse(text);
}
