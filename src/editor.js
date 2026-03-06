// Paperback .pbcolors Theme Editor

// ── Early Prefs (sync, before render) ─────────────────
const _savedPrefs = (() => {
  try {
    const s = localStorage.getItem('theme-editor-prefs');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
})();

// ── State ──────────────────────────────────────────────
let theme = null;
let defaultTheme = null; // deep copy of the original default theme
let colorEntries = []; // detected color fields
let mode = _savedPrefs?.mode === 'light' ? 'light' : 'dark';
let globalLinked = true; // global link default
const linkedState = {}; // per-color link overrides: { colorName: bool }

// ── DOM References ─────────────────────────────────────
const editorContent = document.getElementById('editor-content');
const btnLight = document.getElementById('btn-light');
const btnDark = document.getElementById('btn-dark');
const btnGlobalLink = document.getElementById('btn-global-link');
const btnReset = document.getElementById('btn-reset');
const btnImport = document.getElementById('btn-import');
const fileInput = document.getElementById('file-input');

// Apply saved prefs to DOM immediately (prevents flash)
btnLight.classList.toggle('active', mode === 'light');
btnDark.classList.toggle('active', mode === 'dark');

// Apply saved preview visibility immediately
if (_savedPrefs && typeof _savedPrefs.previewVisible === 'boolean') {
  const _pv = _savedPrefs.previewVisible;
  const _previewPanel = document.querySelector('.preview-panel');
  const _workspace = document.querySelector('.workspace');
  const _btnToggle = document.getElementById('btn-preview-toggle');
  _previewPanel.classList.toggle('collapsed', !_pv);
  _workspace.classList.toggle('preview-hidden', !_pv);
  _btnToggle.classList.toggle('active', _pv);
  _btnToggle.title = _pv ? 'Hide preview panel' : 'Show preview panel';
}

// ── Color Conversion ───────────────────────────────────

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

// ── Color Detection ────────────────────────────────────

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

// ── Local Persistence ──────────────────────────────────

const STORAGE_KEY = 'theme-editor-state';
const PREFS_KEY = 'theme-editor-prefs';

function saveState() {
  if (!theme) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify({ previewVisible, mode }));
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

function loadSavedPrefs() {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Theme Loading ──────────────────────────────────────

async function loadDefaultTheme() {
  const resp = await fetch('themes/default.pbcolors');
  if (!resp.ok) throw new Error('Failed to load default theme');
  return resp.json();
}

function modeKey() {
  return mode === 'dark' ? 'darkColor' : 'lightColor';
}

function otherModeKey() {
  return mode === 'dark' ? 'lightColor' : 'darkColor';
}

// ── Link State ─────────────────────────────────────────

function isLinked(colorName) {
  if (colorName in linkedState) return linkedState[colorName];
  return globalLinked;
}

function toggleLinked(colorName) {
  const current = isLinked(colorName);
  linkedState[colorName] = !current;
  updateLinkButton(colorName);
}

function setGlobalLinked(linked) {
  globalLinked = linked;
  // Clear individual overrides so everything follows global
  for (const key in linkedState) delete linkedState[key];
  btnGlobalLink.classList.toggle('linked', globalLinked);
  btnGlobalLink.title = globalLinked ? 'All colors linked (light = dark)' : 'Colors independent';
  // Update all per-row link buttons
  colorEntries.forEach(c => updateLinkButton(c.name));
}

function updateLinkButton(colorName) {
  const btn = document.querySelector(`.link-btn[data-color="${colorName}"]`);
  if (!btn) return;
  const linked = isLinked(colorName);
  const otherMode = mode === 'dark' ? 'light' : 'dark';
  btn.classList.toggle('linked', linked);
  btn.title = linked ? `Linked to ${otherMode}` : `Not linked to ${otherMode}`;
}

// ── Editor UI ──────────────────────────────────────────

function buildEditor() {
  editorContent.innerHTML = '';

  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    const hex = rgbaToHex(color);

    const row = document.createElement('div');
    row.className = 'color-row';
    row.dataset.color = entry.name;

    // Label
    const label = document.createElement('span');
    label.className = 'color-label';
    label.textContent = entry.name;

    // Color picker
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'color-picker';
    picker.value = hex;
    picker.dataset.color = entry.name;

    // Hex input
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'color-hex';
    hexInput.value = hex;
    hexInput.dataset.color = entry.name;
    hexInput.spellcheck = false;

    // Alpha display (only shown when alpha != 1)
    const alphaLabel = document.createElement('span');
    alphaLabel.className = 'color-alpha';
    alphaLabel.dataset.color = entry.name;
    if (color.alpha !== 1) {
      alphaLabel.textContent = `${Math.round(color.alpha * 100)}%`;
    }

    // Link button
    const linkBtn = document.createElement('button');
    linkBtn.className = 'link-btn';
    linkBtn.dataset.color = entry.name;
    const linked = isLinked(entry.name);
    linkBtn.classList.toggle('linked', linked);
    const otherMode = mode === 'dark' ? 'light' : 'dark';
    linkBtn.title = linked ? `Linked to ${otherMode}` : `Not linked to ${otherMode}`;

    // Event: color picker change
    picker.addEventListener('input', (e) => {
      const newHex = e.target.value;
      hexInput.value = newHex;
      applyColorChange(entry.name, newHex);
    });

    // Event: hex input change
    hexInput.addEventListener('change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
        // Normalize short hex
        if (val.length === 4) {
          val = '#' + val[1]+val[1] + val[2]+val[2] + val[3]+val[3];
        }
        picker.value = val;
        hexInput.value = val;
        applyColorChange(entry.name, val);
      } else {
        // Revert to current value
        hexInput.value = picker.value;
      }
    });

    // Event: link toggle
    linkBtn.addEventListener('click', () => toggleLinked(entry.name));

    row.append(label, picker, hexInput, alphaLabel, linkBtn);
    editorContent.appendChild(row);
  });
}

function applyColorChange(colorName, hex) {
  const entry = theme[colorName];
  const currentColor = entry[modeKey()];
  const newColor = hexToRgba(hex, currentColor.alpha);

  // Update active mode
  entry[modeKey()] = newColor;

  // If linked, also update the other mode
  if (isLinked(colorName)) {
    const otherColor = entry[otherModeKey()];
    entry[otherModeKey()] = hexToRgba(hex, otherColor.alpha);
  }

  // Re-detect entries to keep state in sync
  colorEntries = detectColors(theme);
  saveState();
}

function refreshEditor() {
  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    const hex = rgbaToHex(color);

    const row = document.querySelector(`.color-row[data-color="${entry.name}"]`);
    if (!row) return;

    row.querySelector('.color-picker').value = hex;
    row.querySelector('.color-hex').value = hex;

    const alphaEl = row.querySelector('.color-alpha');
    alphaEl.textContent = color.alpha !== 1 ? `${Math.round(color.alpha * 100)}%` : '';

    updateLinkButton(entry.name);
  });
}

// ── Mode Toggle ────────────────────────────────────────

function setMode(newMode) {
  mode = newMode;
  btnLight.classList.toggle('active', mode === 'light');
  btnDark.classList.toggle('active', mode === 'dark');
  if (colorEntries.length > 0) {
    refreshEditor();
  }
  savePrefs();
}

btnLight.addEventListener('click', () => setMode('light'));
btnDark.addEventListener('click', () => setMode('dark'));
btnGlobalLink.addEventListener('click', () => setGlobalLinked(!globalLinked));

// ── Preview Toggle ─────────────────────────────────────

const btnPreviewToggle = document.getElementById('btn-preview-toggle');
const previewPanel = document.querySelector('.preview-panel');
const workspace = document.querySelector('.workspace');
let previewVisible = _savedPrefs?.previewVisible === true;

function setPreviewVisible(visible) {
  previewVisible = visible;
  previewPanel.classList.toggle('collapsed', !previewVisible);
  workspace.classList.toggle('preview-hidden', !previewVisible);
  btnPreviewToggle.classList.toggle('active', previewVisible);
  btnPreviewToggle.title = previewVisible ? 'Hide preview panel' : 'Show preview panel';
  savePrefs();
}

btnPreviewToggle.addEventListener('click', () => setPreviewVisible(!previewVisible));

// ── Reset to Defaults ──────────────────────────────────

function resetToDefaults() {
  if (!defaultTheme) return;
  if (!confirm('Reset all colors to the original defaults?')) return;

  theme = JSON.parse(JSON.stringify(defaultTheme));
  colorEntries = detectColors(theme);
  // Clear link overrides
  for (const key in linkedState) delete linkedState[key];
  buildEditor();
  clearSavedState();
}

btnReset.addEventListener('click', resetToDefaults);

// ── Import .pbcolors ───────────────────────────────────

function loadThemeFromJSON(json) {
  const colors = detectColors(json);
  if (colors.length === 0) {
    alert('Invalid .pbcolors file: no color entries found.');
    return;
  }
  theme = json;
  colorEntries = colors;
  for (const key in linkedState) delete linkedState[key];
  buildEditor();
  saveState();
  console.log(`Imported theme with ${colors.length} colors`);
}

function handleImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      loadThemeFromJSON(json);
    } catch (err) {
      alert('Failed to parse file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

btnImport.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImport(e.target.files[0]);
  }
});

// ── Export .pbcolors ───────────────────────────────────

const btnExport = document.getElementById('btn-export');

function exportTheme() {
  if (!theme) return;
  const json = JSON.stringify(theme, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'themeColors.pbcolors';
  a.click();
  URL.revokeObjectURL(url);
}

btnExport.addEventListener('click', exportTheme);

// ── Initialization ─────────────────────────────────────

async function init() {
  try {
    // Always load default for the reset feature
    const defaultData = await loadDefaultTheme();
    defaultTheme = JSON.parse(JSON.stringify(defaultData));

    // Use saved state if available, otherwise default
    const saved = loadSavedState();
    theme = saved || JSON.parse(JSON.stringify(defaultData));
    colorEntries = detectColors(theme);
    console.log(`Loaded ${colorEntries.length} colors${saved ? ' (from saved state)' : ' (defaults)'}`);

    // Mode and preview already restored from _savedPrefs at top level
    setMode(mode);
    setGlobalLinked(true);
    buildEditor();
  } catch (err) {
    console.error('Failed to initialize editor:', err);
  }
}

init();
