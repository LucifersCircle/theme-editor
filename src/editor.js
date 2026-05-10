// Paperback .pbcolors Theme Editor

// ── Early Prefs (from sync bootstrap, with local fallback) ────────────────
const _savedPrefs = (() => {
  if (window.__themeEditorBootPrefs) return window.__themeEditorBootPrefs;

  try {
    const saved = localStorage.getItem('theme-editor-prefs');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

// ── State ──────────────────────────────────────────────────────────────────
let theme = null;
let defaultTheme = null;
let colorEntries = [];
let mode = _savedPrefs?.mode === 'light' ? 'light' : 'dark';
let globalLinked = _savedPrefs?.globalLinked !== false;
const linkedState = Object.assign({}, _savedPrefs?.linkedState);
let selectedDefaultId = _savedPrefs?.selectedDefaultId || 0;
let themeManifest = [];
let activeThemeMeta = null;

// ── DOM References ─────────────────────────────────────────────────────────
const editorContent = document.getElementById('editor-content');
const editorTitle = document.getElementById('editor-title');
const btnLight = document.getElementById('btn-light');
const btnDark = document.getElementById('btn-dark');
const btnGlobalLink = document.getElementById('btn-global-link');
const btnReset = document.getElementById('btn-reset');
const btnResetToggle = document.getElementById('btn-reset-toggle');
const resetDropdown = document.getElementById('reset-dropdown');
const btnImport = document.getElementById('btn-import');
const btnExport = document.getElementById('btn-export');
const fileInput = document.getElementById('file-input');
const btnPreviewToggle = document.getElementById('btn-preview-toggle');
const previewPanel = document.querySelector('.preview-panel');
const workspace = document.querySelector('.workspace');
const previewContent = document.getElementById('preview-content');

let previewVisible = _savedPrefs?.previewVisible === true;
let previewTemplateLoaded = false;
let previewRenderNonce = 0;

const previewFamilyCache = new Map();
const PREVIEW_FAMILY_LOADERS = {
  v09: () => import('./preview/families/v09.js'),
  v08: () => import('./preview/families/v08.js')
};

const PREVIEW_DETECTION_KEYS = {
  v09: ['background', 'foreground', 'text', 'primary'],
  v08: ['backgroundColor', 'foregroundColor', 'bodyTextColor', 'buttonNormalTextColor']
};

const EXPORT_DEFAULT_NAME = 'default';
const EXPORT_EXTENSION = '.pbcolors';

// ── Color Conversion ───────────────────────────────────────────────────────

function floatToByte(f) {
  return Math.max(0, Math.min(255, Math.round(f * 255)));
}

function byteToFloat(b) {
  return b / 255;
}

function rgbaToHex(color) {
  const r = floatToByte(color.red);
  const g = floatToByte(color.green);
  const b = floatToByte(color.blue);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return {
    red: byteToFloat(parseInt(hex.slice(0, 2), 16)),
    green: byteToFloat(parseInt(hex.slice(2, 4), 16)),
    blue: byteToFloat(parseInt(hex.slice(4, 6), 16)),
    alpha: alpha != null ? alpha : 1
  };
}

function rgbaToCss(color) {
  const r = floatToByte(color.red);
  const g = floatToByte(color.green);
  const b = floatToByte(color.blue);
  const a = color.alpha;
  return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
}

function camelToKebab(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function keyAttr(keys) {
  return ` data-linked-keys="${keys.map(escapeHtml).join(',')}"`;
}

// ── Color Detection ────────────────────────────────────────────────────────

function isColorObject(obj) {
  return obj && typeof obj === 'object'
    && 'red' in obj && 'green' in obj && 'blue' in obj && 'alpha' in obj;
}

function isColorEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  return (entry.lightColor && isColorObject(entry.lightColor))
    || (entry.darkColor && isColorObject(entry.darkColor));
}

function detectColors(themeObj) {
  const colors = [];
  for (const key of Object.keys(themeObj)) {
    if (isColorEntry(themeObj[key])) {
      colors.push({
        name: key,
        lightColor: themeObj[key].lightColor,
        darkColor: themeObj[key].darkColor
      });
    }
  }
  return colors;
}

// ── Preview Rendering ──────────────────────────────────────────────────────

function getPreviewTemplateFallback() {
  return `
    <section class="preview-shell" data-preview-root>
      <div class="preview-intro">
        <div class="preview-intro-copy">
          <span class="preview-family-badge" data-preview-family-badge>Preview fallback</span>
          <h3>Component Sandbox</h3>
          <p data-preview-family-note>Template fetch failed. Using inline preview markup.</p>
        </div>
        <div class="preview-meta">
          <span class="preview-meta-label">Live bindings</span>
          <strong>Editor changes apply instantly</strong>
          <span>Imported themes swap the component set automatically.</span>
        </div>
      </div>
      <div class="preview-stage" data-preview-stage></div>
      <section class="preview-token-section">
        <div class="preview-token-header">
          <div>
            <span class="preview-token-label">Loaded keys</span>
            <h3>Token coverage</h3>
          </div>
          <p data-preview-token-summary></p>
        </div>
        <div class="preview-token-grid" data-preview-token-grid></div>
      </section>
    </section>
  `;
}

async function loadPreviewTemplate() {
  if (previewTemplateLoaded) return;

  try {
    const resp = await fetch('components/preview.html');
    if (!resp.ok) throw new Error('Failed to load preview template');
    previewContent.innerHTML = await resp.text();
  } catch (err) {
    console.error('Failed to load preview template:', err);
    previewContent.innerHTML = getPreviewTemplateFallback();
  }

  previewTemplateLoaded = true;
}

function scorePreviewFamily(keySet, signatureKeys) {
  return signatureKeys.reduce((count, key) => count + (keySet.has(key) ? 1 : 0), 0);
}

function detectPreviewFamily() {
  const keySet = new Set(colorEntries.map(entry => entry.name));
  const v09Score = scorePreviewFamily(keySet, PREVIEW_DETECTION_KEYS.v09);
  const v08Score = scorePreviewFamily(keySet, PREVIEW_DETECTION_KEYS.v08);

  if (v09Score === 0 && v08Score === 0) return 'custom';
  return v09Score >= v08Score ? 'v09' : 'v08';
}

async function loadPreviewFamily(familyId) {
  if (!PREVIEW_FAMILY_LOADERS[familyId]) return null;
  if (previewFamilyCache.has(familyId)) return previewFamilyCache.get(familyId);

  const mod = await PREVIEW_FAMILY_LOADERS[familyId]();
  const family = mod.default;
  previewFamilyCache.set(familyId, family);
  return family;
}

function applyPreviewVariables(root) {
  if (!root) return;

  root.style.cssText = '';
  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    root.style.setProperty(`--theme-${camelToKebab(entry.name)}`, rgbaToCss(color));
  });
}

function buildFallbackPreviewMarkup() {
  const keys = colorEntries.map(entry => entry.name);
  return `
    <section class="preview-showcase preview-fallback"${keyAttr(keys)}>
      <h4>Custom key set</h4>
      <p>The loaded theme does not match the bundled .8 or .9 defaults closely enough to pick a dedicated component layout yet.</p>
      <div class="preview-key-list">
        ${keys.map(key => `<span class="preview-key-chip"${keyAttr([key])}>${escapeHtml(key)}</span>`).join('')}
      </div>
    </section>
  `;
}

function buildPreviewTokens() {
  const tokenGrid = previewContent.querySelector('[data-preview-token-grid]');
  if (!tokenGrid) return;

  tokenGrid.innerHTML = '';

  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    const token = document.createElement('article');
    token.className = 'preview-token';
    token.dataset.linkedKeys = entry.name;

    const swatch = document.createElement('div');
    swatch.className = 'preview-token-swatch';
    swatch.style.background = rgbaToCss(color);

    const meta = document.createElement('div');
    meta.className = 'preview-token-meta';

    const name = document.createElement('strong');
    name.textContent = entry.name;

    const hex = document.createElement('code');
    hex.textContent = rgbaToHex(color);

    const alpha = document.createElement('span');
    alpha.textContent = `alpha ${Math.round(color.alpha * 100)}%`;

    meta.append(name, hex, alpha);
    token.append(swatch, meta);
    tokenGrid.appendChild(token);
  });
}

async function renderPreview() {
  if (!previewTemplateLoaded || !theme) return;

  const renderNonce = ++previewRenderNonce;
  const root = previewContent.querySelector('[data-preview-root]');
  const badge = previewContent.querySelector('[data-preview-family-badge]');
  const note = previewContent.querySelector('[data-preview-family-note]');
  const stage = previewContent.querySelector('[data-preview-stage]');
  const summary = previewContent.querySelector('[data-preview-token-summary]');

  if (!root || !badge || !note || !stage || !summary) return;

  applyPreviewVariables(root);

  const familyId = detectPreviewFamily();
  let title = 'Custom keys';
  let description = 'Showing a generic preview shell because the imported theme uses a non-standard key set.';
  let stageHtml = buildFallbackPreviewMarkup();
  let summaryText = `${colorEntries.length} keys in ${mode} mode`;

  if (familyId !== 'custom') {
    try {
      const family = await loadPreviewFamily(familyId);
      if (renderNonce !== previewRenderNonce || !family) return;

      const result = family.render({
        mode,
        theme,
        colorEntries,
        keyAttr,
        rgbaToHex,
        rgbaToCss
      });

      title = family.title;
      description = family.description;
      stageHtml = result.stageHtml;
      summaryText = result.summaryText;
    } catch (err) {
      console.error(`Failed to load preview family "${familyId}":`, err);
    }
  }

  if (renderNonce !== previewRenderNonce) return;

  badge.textContent = title;
  note.textContent = description;
  stage.innerHTML = stageHtml;
  summary.textContent = summaryText;
  buildPreviewTokens();
}

// ── Hover Linking ──────────────────────────────────────────────────────────

function getLinkedKeys(element) {
  if (!element) return [];
  if (element.dataset?.color) return [element.dataset.color];
  if (!element.dataset?.linkedKeys) return [];
  return element.dataset.linkedKeys
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);
}

function normalizeHoverNode(node) {
  if (node instanceof Element) return node;
  return node?.parentElement || null;
}

function getLinkedHoverHost(node) {
  const element = normalizeHoverNode(node);
  return element?.closest('.color-row[data-color], [data-linked-keys]') || null;
}

function updateHoverHighlights(keys) {
  const activeKeys = new Set(keys);

  document.querySelectorAll('.color-row[data-color]').forEach(row => {
    row.classList.toggle('linked-hover', activeKeys.has(row.dataset.color));
  });

  previewContent.querySelectorAll('[data-linked-keys]').forEach(block => {
    const matches = getLinkedKeys(block).some(key => activeKeys.has(key));
    block.classList.toggle('linked-hover', matches);
  });
}

function clearHoverHighlights() {
  updateHoverHighlights([]);
}

function handleLinkedHoverStart(event) {
  const host = getLinkedHoverHost(event.target);
  if (!host) return;

  const related = normalizeHoverNode(event.relatedTarget);
  if (related && host.contains(related)) return;

  updateHoverHighlights(getLinkedKeys(host));
}

function handleLinkedHoverEnd(event) {
  const host = getLinkedHoverHost(event.target);
  if (!host) return;

  const related = normalizeHoverNode(event.relatedTarget);
  if (related && host.contains(related)) return;

  const nextHost = getLinkedHoverHost(related);
  if (nextHost) {
    updateHoverHighlights(getLinkedKeys(nextHost));
    return;
  }

  clearHoverHighlights();
}

editorContent.addEventListener('mouseover', handleLinkedHoverStart);
editorContent.addEventListener('mouseout', handleLinkedHoverEnd);
previewContent.addEventListener('mouseover', handleLinkedHoverStart);
previewContent.addEventListener('mouseout', handleLinkedHoverEnd);

// ── Local Persistence ──────────────────────────────────────────────────────

const STORAGE_KEY = 'theme-editor-state';
const PREFS_KEY = 'theme-editor-prefs';
const THEME_META_KEY = 'theme-editor-meta';

function saveState() {
  if (!theme) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify({
    previewVisible, mode, globalLinked, linkedState, selectedDefaultId
  }));
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const colors = detectColors(parsed);
    return colors.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function loadSavedThemeMeta() {
  try {
    const saved = localStorage.getItem(THEME_META_KEY);
    return saved ? normalizeThemeMeta(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

function saveThemeMeta() {
  if (!activeThemeMeta) {
    localStorage.removeItem(THEME_META_KEY);
    return;
  }

  localStorage.setItem(THEME_META_KEY, JSON.stringify(activeThemeMeta));
}

function clearSavedThemeMeta() {
  localStorage.removeItem(THEME_META_KEY);
}

// ── Theme Loading ──────────────────────────────────────────────────────────

async function loadManifest() {
  const resp = await fetch('themes/index.json');
  if (!resp.ok) throw new Error('Failed to load theme manifest');
  return resp.json();
}

async function loadThemeFile(filename) {
  const resp = await fetch('themes/' + filename);
  if (!resp.ok) throw new Error('Failed to load theme: ' + filename);
  return resp.json();
}

function stripPbcolorsExtension(value) {
  return value.replace(/\.pbcolors$/i, '');
}

function normalizeThemeMeta(meta) {
  if (!meta || typeof meta !== 'object') return null;

  const name = typeof meta.name === 'string' ? meta.name.trim() : '';
  const author = typeof meta.author === 'string' ? meta.author.trim() : '';
  const source = typeof meta.source === 'string' ? meta.source.trim() : '';

  if (!name && !author) return null;
  return { name, author, source };
}

function getManifestThemeMeta(index) {
  const entry = themeManifest[index];
  if (!entry) return null;

  return normalizeThemeMeta({
    name: entry.name || entry.label || stripPbcolorsExtension(entry.file || ''),
    author: entry.author,
    source: 'manifest'
  });
}

function getImportedThemeMeta(file) {
  return normalizeThemeMeta({
    name: stripPbcolorsExtension(file?.name || ''),
    source: 'import'
  });
}

function getInitialThemeMeta(saved) {
  const defaultMeta = getManifestThemeMeta(selectedDefaultId);
  if (!saved) return defaultMeta;

  const savedMeta = loadSavedThemeMeta();
  if (!savedMeta) return defaultMeta;
  if (savedMeta.source === 'import' || savedMeta.author || savedMeta.name !== defaultMeta?.name) {
    return savedMeta;
  }

  return defaultMeta;
}

function setActiveThemeMeta(meta, { persist = false } = {}) {
  activeThemeMeta = normalizeThemeMeta(meta);
  updateEditorTitle();
  if (persist) saveThemeMeta();
}

function updateEditorTitle() {
  if (!editorTitle) return;

  if (!activeThemeMeta?.name) {
    editorTitle.textContent = 'Editor';
    return;
  }

  editorTitle.textContent = activeThemeMeta.author
    ? `Editing "${activeThemeMeta.name}" by "${activeThemeMeta.author}"`
    : `Editing "${activeThemeMeta.name}"`;
}

// ── Reset Dropdown ─────────────────────────────────────────────────────────

function buildResetDropdown() {
  resetDropdown.innerHTML = '';
  themeManifest.forEach((entry, i) => {
    const item = document.createElement('button');
    item.className = 'split-dropdown-item';
    if (i === selectedDefaultId) item.classList.add('active');
    item.textContent = entry.label;
    item.addEventListener('click', () => selectDefault(i));
    resetDropdown.appendChild(item);
  });
}

function updateResetLabel() {
  const label = themeManifest[selectedDefaultId]?.label || 'defaults';
  btnReset.textContent = 'Reset to: ' + label;
}

async function selectDefault(index) {
  selectedDefaultId = index;
  updateResetLabel();
  resetDropdown.classList.add('hidden');

  resetDropdown.querySelectorAll('.split-dropdown-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  try {
    const data = await loadThemeFile(themeManifest[index].file);
    defaultTheme = JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.error('Failed to load selected default:', err);
  }

  savePrefs();
}

btnResetToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  resetDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  resetDropdown.classList.add('hidden');
});

// ── Mode + Link State ──────────────────────────────────────────────────────

function modeKey() {
  return mode === 'dark' ? 'darkColor' : 'lightColor';
}

function otherModeKey() {
  return mode === 'dark' ? 'lightColor' : 'darkColor';
}

function isLinked(colorName) {
  if (colorName in linkedState) return linkedState[colorName];
  return globalLinked;
}

function toggleLinked(colorName) {
  linkedState[colorName] = !isLinked(colorName);
  updateLinkButton(colorName);
  savePrefs();
}

function setGlobalLinked(linked) {
  globalLinked = linked;
  for (const key in linkedState) delete linkedState[key];
  btnGlobalLink.classList.toggle('linked', globalLinked);
  btnGlobalLink.title = globalLinked ? 'All colors linked (light = dark)' : 'Colors independent';
  colorEntries.forEach(entry => updateLinkButton(entry.name));
  savePrefs();
}

function updateLinkButton(colorName) {
  const btn = document.querySelector(`.link-btn[data-color="${colorName}"]`);
  if (!btn) return;

  const linked = isLinked(colorName);
  const otherMode = mode === 'dark' ? 'light' : 'dark';
  btn.classList.toggle('linked', linked);
  btn.title = linked ? `Linked to ${otherMode}` : `Not linked to ${otherMode}`;
}

// ── Editor UI ──────────────────────────────────────────────────────────────

function buildEditor() {
  editorContent.innerHTML = '';

  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    const hex = rgbaToHex(color);

    const row = document.createElement('div');
    row.className = 'color-row';
    row.dataset.color = entry.name;

    const label = document.createElement('span');
    label.className = 'color-label';
    label.textContent = entry.name;

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'color-picker';
    picker.value = hex;
    picker.dataset.color = entry.name;

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'color-hex';
    hexInput.value = hex;
    hexInput.dataset.color = entry.name;
    hexInput.spellcheck = false;

    const alphaLabel = document.createElement('span');
    alphaLabel.className = 'color-alpha';
    alphaLabel.dataset.color = entry.name;
    if (color.alpha !== 1) {
      alphaLabel.textContent = `${Math.round(color.alpha * 100)}%`;
    }

    const linkBtn = document.createElement('button');
    linkBtn.className = 'link-btn';
    linkBtn.dataset.color = entry.name;
    linkBtn.classList.toggle('linked', isLinked(entry.name));
    const otherMode = mode === 'dark' ? 'light' : 'dark';
    linkBtn.title = isLinked(entry.name) ? `Linked to ${otherMode}` : `Not linked to ${otherMode}`;

    picker.addEventListener('input', (e) => {
      const newHex = e.target.value;
      hexInput.value = newHex;
      applyColorChange(entry.name, newHex);
    });

    hexInput.addEventListener('change', (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith('#')) value = '#' + value;

      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
        if (value.length === 4) {
          value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
        }
        picker.value = value;
        hexInput.value = value;
        applyColorChange(entry.name, value);
      } else {
        hexInput.value = picker.value;
      }
    });

    linkBtn.addEventListener('click', () => toggleLinked(entry.name));

    row.append(label, picker, hexInput, alphaLabel, linkBtn);
    editorContent.appendChild(row);
  });
}

function applyColorChange(colorName, hex) {
  const entry = theme[colorName];
  const currentColor = entry[modeKey()];
  entry[modeKey()] = hexToRgba(hex, currentColor.alpha);

  if (isLinked(colorName)) {
    const otherColor = entry[otherModeKey()];
    entry[otherModeKey()] = hexToRgba(hex, otherColor.alpha);
  }

  colorEntries = detectColors(theme);
  saveState();
  void renderPreview();
}

function refreshEditor() {
  colorEntries.forEach(entry => {
    const row = document.querySelector(`.color-row[data-color="${entry.name}"]`);
    if (!row) return;

    const color = entry[modeKey()];
    const hex = rgbaToHex(color);

    row.querySelector('.color-picker').value = hex;
    row.querySelector('.color-hex').value = hex;
    row.querySelector('.color-alpha').textContent = color.alpha !== 1 ? `${Math.round(color.alpha * 100)}%` : '';

    updateLinkButton(entry.name);
  });
}

// ── Controls ───────────────────────────────────────────────────────────────

function setMode(newMode) {
  mode = newMode;
  btnLight.classList.toggle('active', mode === 'light');
  btnDark.classList.toggle('active', mode === 'dark');

  if (colorEntries.length > 0) {
    refreshEditor();
  }

  void renderPreview();
  savePrefs();
}

function setPreviewVisible(visible) {
  previewVisible = visible;
  previewPanel.classList.toggle('collapsed', !previewVisible);
  workspace.classList.toggle('preview-hidden', !previewVisible);
  btnPreviewToggle.classList.toggle('active', previewVisible);
  btnPreviewToggle.title = previewVisible ? 'Hide preview panel' : 'Show preview panel';
  savePrefs();
}

btnLight.addEventListener('click', () => setMode('light'));
btnDark.addEventListener('click', () => setMode('dark'));
btnGlobalLink.addEventListener('click', () => setGlobalLinked(!globalLinked));
btnPreviewToggle.addEventListener('click', () => setPreviewVisible(!previewVisible));

// ── Reset / Import / Export ────────────────────────────────────────────────

function resetToDefaults() {
  if (!defaultTheme) return;

  const label = themeManifest[selectedDefaultId]?.label || 'defaults';
  if (!confirm(`Reset all colors to ${label}?`)) return;

  theme = JSON.parse(JSON.stringify(defaultTheme));
  colorEntries = detectColors(theme);
  globalLinked = true;
  setActiveThemeMeta(getManifestThemeMeta(selectedDefaultId));

  for (const key in linkedState) delete linkedState[key];

  btnGlobalLink.classList.toggle('linked', globalLinked);
  btnGlobalLink.title = 'All colors linked (light = dark)';

  buildEditor();
  clearSavedState();
  clearSavedThemeMeta();
  void renderPreview();
  savePrefs();
}

function loadThemeFromJSON(json, meta) {
  const colors = detectColors(json);
  if (colors.length === 0) {
    alert('Invalid .pbcolors file: no color entries found.');
    return;
  }

  theme = json;
  colorEntries = colors;
  globalLinked = true;
  setActiveThemeMeta(meta, { persist: true });

  for (const key in linkedState) delete linkedState[key];

  btnGlobalLink.classList.toggle('linked', globalLinked);
  btnGlobalLink.title = 'All colors linked (light = dark)';

  buildEditor();
  saveState();
  void renderPreview();
  savePrefs();
  console.log(`Imported theme with ${colors.length} colors`);
}

function handleImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      loadThemeFromJSON(JSON.parse(e.target.result), getImportedThemeMeta(file));
    } catch (err) {
      alert('Failed to parse file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function getExportFileName() {
  const requestedName = prompt('Theme name:', EXPORT_DEFAULT_NAME);
  if (requestedName === null) return null;

  const baseName = requestedName
    .trim()
    .replace(/\.pbcolors$/i, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\.+$/g, '')
    .trim();

  return `${baseName || EXPORT_DEFAULT_NAME}${EXPORT_EXTENSION}`;
}

function exportTheme() {
  if (!theme) return;

  const fileName = getExportFileName();
  if (!fileName) return;

  const json = JSON.stringify(theme, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

btnReset.addEventListener('click', resetToDefaults);
btnImport.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImport(e.target.files[0]);
  }
});
btnExport.addEventListener('click', exportTheme);

// ── Initialization ─────────────────────────────────────────────────────────

async function init() {
  try {
    await loadPreviewTemplate();

    themeManifest = await loadManifest();
    if (selectedDefaultId >= themeManifest.length) selectedDefaultId = 0;

    buildResetDropdown();
    updateResetLabel();

    const defaultData = await loadThemeFile(themeManifest[selectedDefaultId].file);
    defaultTheme = JSON.parse(JSON.stringify(defaultData));

    const saved = loadSavedState();
    if (!saved) clearSavedThemeMeta();

    theme = saved || JSON.parse(JSON.stringify(defaultData));
    colorEntries = detectColors(theme);
    setActiveThemeMeta(getInitialThemeMeta(saved));

    console.log(`Loaded ${colorEntries.length} colors${saved ? ' (from saved state)' : ' (defaults)'}`);

    setMode(mode);
    setPreviewVisible(previewVisible);
    btnGlobalLink.classList.toggle('linked', globalLinked);
    btnGlobalLink.title = globalLinked ? 'All colors linked (light = dark)' : 'Colors independent';
    buildEditor();
    await renderPreview();
  } catch (err) {
    console.error('Failed to initialize editor:', err);
  }
}

init();
