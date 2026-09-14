// Paperback .pbcolors Theme Editor

const PREVIEW_ENABLED = window.__themeEditorPreviewEnabled === true;

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
let previewEditingKey = null;
let previewEditTargetIndex = -1;
let previewEditOriginal = null;
let previewPickerHsv = { h: 0, s: 0, v: 0 };
let previewPickerHex = null;
let previewPickerMode = null;
let previewPickerPointer = null;
let editorReady = false;
let lastPreviewEdit = typeof _savedPrefs?.previewEditor?.key === 'string' ? {
  key: _savedPrefs.previewEditor.key,
  targetIndex: Number.isInteger(_savedPrefs.previewEditor.targetIndex) ? _savedPrefs.previewEditor.targetIndex : -1,
  open: _savedPrefs.previewEditor.open === true
} : null;
let pendingPreviewEditor = lastPreviewEdit?.open ? { ...lastPreviewEdit } : null;

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
const exportDialog = document.getElementById('export-dialog');
const exportForm = document.getElementById('export-form');
const exportNameInput = document.getElementById('export-name');
const btnExportCancel = document.getElementById('btn-export-cancel');
const fileInput = document.getElementById('file-input');
const btnPreviewToggle = document.getElementById('btn-preview-toggle');
const previewPanel = document.querySelector('.preview-panel');
const workspace = document.querySelector('.workspace');
const previewContent = document.getElementById('preview-content');
const previewColorEditor = document.getElementById('preview-color-editor');
const previewColorName = document.getElementById('preview-color-name');
const previewColorApplies = document.getElementById('preview-color-applies');
const previewColorLinkLabel = document.getElementById('preview-color-link-label');
const previewColorOpacity = document.getElementById('preview-color-opacity');
const btnPreviewColorLink = document.getElementById('btn-preview-color-link');
const btnPreviewLastColor = document.getElementById('btn-preview-last-color');
const previewLastColorName = document.getElementById('preview-last-color-name');
const previewMobileHint = document.querySelector('.preview-mobile-hint');
const previewColorField = document.getElementById('preview-color-field');
const previewColorThumb = document.getElementById('preview-color-thumb');
const previewColorHue = document.getElementById('preview-color-hue');
const previewColorHex = document.getElementById('preview-color-hex');
const previewColorHexError = document.getElementById('preview-color-hex-error');
const previewColorSwatch = document.getElementById('preview-color-swatch');
const btnPreviewColorDone = document.getElementById('btn-preview-color-done');
const btnPreviewColorUndo = document.getElementById('btn-preview-color-undo');
const previewColorHistoryKind = document.getElementById('preview-color-history-kind');
const previewColorHistoryList = document.getElementById('preview-color-history-list');
const btnPreviewFavorite = document.getElementById('btn-preview-favorite');
const btnMobileColors = document.getElementById('btn-mobile-colors');
const btnMobilePreview = document.getElementById('btn-mobile-preview');
const mobileLayout = window.matchMedia('(max-width: 700px), (pointer: coarse) and (max-height: 500px)');
const previewEditChrome = Array.from(document.querySelectorAll('.preview-edit-chrome'));
let previewEditorPresented = false;
let previewEditorTransitionId = 0;
let previewEditorTransition = Promise.resolve(true);
let previewEditViewportWidth = window.innerWidth;

let previewVisible = PREVIEW_ENABLED && _savedPrefs?.previewVisible === true;
let mobilePanel = previewVisible && _savedPrefs?.mobilePanel === 'preview' ? 'preview' : 'colors';
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

let exportBaseName = 'themeColors';

const COLOR_HISTORY_KEY = 'theme-editor-color-history';
const colorHistory = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(COLOR_HISTORY_KEY));
    const colors = list => [...new Set((Array.isArray(list) ? list : [])
      .filter(hex => typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex))
      .map(hex => hex.toLowerCase()))];
    return { recent: colors(saved?.recent).slice(0, 16), favorites: colors(saved?.favorites), view: saved?.view === 'favorites' ? 'favorites' : 'recent' };
  } catch {
    return { recent: [], favorites: [], view: 'recent' };
  }
})();

function saveColorHistory() {
  try {
    localStorage.setItem(COLOR_HISTORY_KEY, JSON.stringify(colorHistory));
  } catch {
    // Color editing remains available when the browser cannot persist a palette.
  }
}

function rememberRecentColors(...colors) {
  colors.forEach(hex => {
    hex = hex.toLowerCase();
    colorHistory.recent = [hex, ...colorHistory.recent.filter(color => color !== hex)].slice(0, 16);
  });
  saveColorHistory();
  renderPreviewColorHistory();
}

function rememberPreviewEditedColor(includeCurrent = false) {
  if (!previewEditingKey || !previewEditOriginal) return;
  const original = previewEditOriginal[modeKey()];
  const current = theme?.[previewEditingKey]?.[modeKey()];
  if (original && current && rgbaToHex(original) !== rgbaToHex(current)) {
    rememberRecentColors(rgbaToHex(original), rgbaToHex(current));
  } else if (current && includeCurrent) {
    rememberRecentColors(rgbaToHex(current));
  }
}

function syncPreviewFavorite() {
  const saved = colorHistory.favorites.includes(previewPickerHex);
  btnPreviewFavorite.textContent = saved ? 'Favorited' : 'Favorite';
  btnPreviewFavorite.setAttribute('aria-pressed', String(saved));
  btnPreviewFavorite.setAttribute('aria-label', saved ? `Remove ${previewPickerHex} from Favorites` : `Favorite ${previewPickerHex}`);
  btnPreviewFavorite.title = btnPreviewFavorite.getAttribute('aria-label');
  const previous = previewColorHistoryList.querySelector('.is-current');
  const current = previewPickerHex && previewColorHistoryList.querySelector(`[data-hex="${previewPickerHex}"]`);
  if (previous !== current) {
    previous?.classList.remove('is-current');
    previous?.setAttribute('aria-pressed', 'false');
    current?.classList.add('is-current');
    current?.setAttribute('aria-pressed', 'true');
  }
}

function renderPreviewColorHistory() {
  cancelPreviewHistoryPress();
  const scrollLeft = previewColorHistoryList.scrollLeft;
  const collection = colorHistory.view;
  previewColorHistoryKind.value = colorHistory.view;
  previewColorHistoryList.setAttribute('aria-label', colorHistory.view === 'favorites' ? 'Favorite colors' : 'Recent colors');
  previewColorHistoryList.replaceChildren();
  const colors = colorHistory[collection];
  if (!colors.length) {
    const empty = document.createElement('span');
    empty.className = 'preview-color-history-empty';
    empty.textContent = colorHistory.view === 'favorites' ? 'No favorites yet' : 'No recent colors';
    previewColorHistoryList.appendChild(empty);
  }
  colors.forEach(hex => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preview-history-swatch';
    button.dataset.hex = hex;
    button.style.setProperty('--history-color', hex);
    button.title = `${hex} · Press and hold to remove`;
    button.setAttribute('aria-label', `Use ${hex}`);
    button.setAttribute('aria-pressed', 'false');
    let suppressClick = false;
    const requestRemoval = () => {
      suppressClick = true;
      cancelPreviewHistoryPress();
      showPreviewHistoryRemoval(button, hex, collection);
    };
    button.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || previewHistoryPress) return;
      suppressClick = false;
      const context = { theme, key: previewEditingKey };
      const press = {
        pointerId: event.pointerId,
        button,
        x: event.clientX,
        y: event.clientY,
        suppress: () => { suppressClick = true; },
        timer: setTimeout(() => {
          if (previewHistoryPress !== press) return;
          cancelPreviewHistoryPress();
          if (button.isConnected && isPreviewHistoryContextCurrent(context)) requestRemoval();
        }, 500)
      };
      previewHistoryPress = press;
    });
    button.addEventListener('pointermove', event => {
      const press = previewHistoryPress;
      if (press?.button !== button || press.pointerId !== event.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) cancelPreviewHistoryPress(true);
    });
    button.addEventListener('pointerup', event => {
      if (previewHistoryPress?.button === button && previewHistoryPress.pointerId === event.pointerId) cancelPreviewHistoryPress();
    });
    button.addEventListener('pointercancel', event => {
      if (previewHistoryPress?.button === button && previewHistoryPress.pointerId === event.pointerId) cancelPreviewHistoryPress(true);
    });
    button.addEventListener('pointerleave', () => {
      if (previewHistoryPress?.button === button) cancelPreviewHistoryPress(true);
    });
    button.addEventListener('contextmenu', event => {
      event.preventDefault();
      requestRemoval();
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (!event.repeat) requestRemoval();
      } else if (event.key === 'Enter' || event.key === ' ') {
        suppressClick = false;
      }
    });
    button.addEventListener('click', event => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
        return;
      }
      if (!previewEditingKey) return;
      previewPickerHex = null;
      applyColorChange(previewEditingKey, hex);
      refreshEditor();
    });
    previewColorHistoryList.appendChild(button);
  });
  previewColorHistoryList.scrollLeft = scrollLeft;
  syncPreviewFavorite();
}

let previewHistoryPress = null;
let previewHistoryRemovalDialog = null;

function cancelPreviewHistoryPress(suppressClick = false) {
  const press = previewHistoryPress;
  previewHistoryPress = null;
  if (!press) return;
  clearTimeout(press.timer);
  if (suppressClick) press.suppress();
}

function isPreviewHistoryContextCurrent(context) {
  return Boolean(context.key) && previewEditingKey === context.key
    && theme === context.theme && !previewColorEditor.hidden;
}

function closePreviewHistoryRemoval() {
  cancelPreviewHistoryPress(true);
  if (previewHistoryRemovalDialog?.open) previewHistoryRemovalDialog.close();
}

function showPreviewHistoryRemoval(opener, hex, collection) {
  const context = { theme, key: previewEditingKey };
  if (!isPreviewHistoryContextCurrent(context) || !opener.isConnected
    || previewHistoryRemovalDialog || !colorHistory[collection]?.includes(hex)) return;

  const index = Array.from(previewColorHistoryList.querySelectorAll('button')).indexOf(opener);
  const dialog = document.createElement('dialog');
  dialog.className = 'export-dialog preview-history-remove-dialog';
  dialog.setAttribute('aria-labelledby', 'preview-history-remove-title');
  dialog.setAttribute('aria-describedby', 'preview-history-remove-description');
  const title = document.createElement('h2');
  title.id = 'preview-history-remove-title';
  title.textContent = 'Remove color';
  const description = document.createElement('p');
  description.id = 'preview-history-remove-description';
  description.textContent = `Remove ${hex} from ${collection === 'favorites' ? 'Favorites' : 'Recent'}?`;
  const colorRow = document.createElement('div');
  colorRow.className = 'preview-history-remove-color';
  const swatch = document.createElement('span');
  swatch.className = 'preview-history-remove-swatch';
  swatch.style.backgroundColor = hex;
  swatch.setAttribute('aria-hidden', 'true');
  colorRow.append(swatch, description);
  const actions = document.createElement('div');
  actions.className = 'export-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn';
  cancel.textContent = 'Cancel';
  cancel.autofocus = true;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'btn export-confirm';
  remove.textContent = 'Remove';
  actions.append(cancel, remove);
  dialog.append(title, colorRow, actions);

  let removed = false;
  cancel.addEventListener('click', () => dialog.close());
  remove.addEventListener('click', () => {
    if (isPreviewHistoryContextCurrent(context)) {
      removed = true;
      colorHistory[collection] = colorHistory[collection].filter(color => color !== hex);
      saveColorHistory();
      renderPreviewColorHistory();
    }
    dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') event.stopPropagation();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (previewHistoryRemovalDialog === dialog) previewHistoryRemovalDialog = null;
    if (!isPreviewHistoryContextCurrent(context)) return;
    const buttons = Array.from(previewColorHistoryList.querySelectorAll('button'));
    const target = !removed && opener.isConnected ? opener
      : buttons[Math.min(Math.max(index, 0), buttons.length - 1)] || previewColorHistoryKind;
    target.focus({ preventScroll: true });
  });
  previewHistoryRemovalDialog = dialog;
  previewColorEditor.appendChild(dialog);
  dialog.showModal();
}

previewColorHistoryKind.addEventListener('change', () => {
  colorHistory.view = previewColorHistoryKind.value === 'favorites' ? 'favorites' : 'recent';
  saveColorHistory();
  renderPreviewColorHistory();
});
btnPreviewFavorite.addEventListener('click', () => {
  if (!previewEditingKey || !previewPickerHex) return;
  colorHistory.favorites = colorHistory.favorites.includes(previewPickerHex)
    ? colorHistory.favorites.filter(hex => hex !== previewPickerHex)
    : [previewPickerHex, ...colorHistory.favorites];
  saveColorHistory();
  renderPreviewColorHistory();
});

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

function rgbaToHsv(color, previous = { h: 0, s: 0 }) {
  const [r, g, b] = [color.red, color.green, color.blue].map(channel => Math.max(0, Math.min(1, channel)));
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = previous.h;
  if (delta) {
    h = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  // Gray retains its chosen hue; black also retains its saturation.
  return { h, s: max ? delta / max : previous.s, v: max };
}

function hsvToHex({ h, s, v }) {
  const channel = offset => {
    const k = (offset + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return rgbaToHex({ red: channel(5), green: channel(3), blue: channel(1) });
}

function normalizeRgbHex(value) {
  let hex = value.trim().replace(/^#/, '');
  // Deliberately reject alpha-bearing #RGBA / #RRGGBBAA values.
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  if (hex.length === 3) hex = hex.split('').map(channel => channel + channel).join('');
  return `#${hex.toLowerCase()}`;
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
          <span class="preview-family-badge" data-preview-family-badge>Loading preview</span>
          <h3>Component preview</h3>
          <p data-preview-family-note>Select a theme to preview its colors.</p>
        </div>
        <div class="preview-meta">
          <span class="preview-meta-label">Live preview</span>
          <strong>Editor changes apply instantly</strong>
          <span class="preview-help-desktop">Hover to see linked colors. Click a fill or text to edit its color.</span>
          <span class="preview-help-mobile">Tap a component to edit its color. If colors overlap, choose one.</span>
        </div>
      </div>
      <div class="preview-stage" data-preview-stage></div>
      <section class="preview-token-section">
        <div class="preview-token-header">
          <div>
            <span class="preview-token-label">Loaded keys</span>
            <h3>Color mappings</h3>
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
    if (!color || !['red', 'green', 'blue', 'alpha'].every(channel => Number.isFinite(color[channel]))) return;
    root.style.setProperty(`--theme-${camelToKebab(entry.name)}`, rgbaToCss(color));
  });
}

function buildFallbackPreviewMarkup() {
  const keys = colorEntries.map(entry => entry.name);
  return `
    <section class="preview-showcase preview-fallback"${keyAttr(keys)}>
      <h4>Custom colors</h4>
      <p>These keys have not been mapped to Paperback components yet. Select a color below to edit it.</p>
      <div class="preview-key-list">
        ${keys.map(key => `<span class="preview-key-chip"${keyAttr([key])}>${escapeHtml(key)}</span>`).join('')}
      </div>
    </section>
  `;
}

function buildPreviewTokens(coverage = {}) {
  const tokenGrid = previewContent.querySelector('[data-preview-token-grid]');
  if (!tokenGrid) return;

  tokenGrid.innerHTML = '';

  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    const token = document.createElement('article');
    token.className = 'preview-token';
    token.dataset.linkedKeys = entry.name;
    const mapping = coverage[entry.name];
    token.dataset.coverageStatus = mapping?.status || 'unmapped';

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

    const status = document.createElement('span');
    status.className = 'preview-token-status';
    status.textContent = mapping?.status === 'confirmed'
      ? 'Mapped'
      : 'Not mapped';

    const note = document.createElement('span');
    note.className = 'preview-token-note';
    note.textContent = mapping?.note || 'App location not yet identified.';

    meta.append(name, hex, alpha, status, note);
    token.append(swatch, meta);
    tokenGrid.appendChild(token);
  });
}

async function renderPreview() {
  if (!PREVIEW_ENABLED) return;
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
  let description = 'Color samples from your custom theme.';
  let stageHtml = buildFallbackPreviewMarkup();
  let summaryText = `${colorEntries.length} keys in ${mode} mode`;
  let coverage = {};

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
      coverage = family.coverage || {};
    } catch (err) {
      console.error(`Failed to load preview family "${familyId}":`, err);
    }
  }

  if (renderNonce !== previewRenderNonce) return;

  const previewScroller = mobileLayout.matches ? document.scrollingElement : previewContent;
  const scrollTop = previewScroller.scrollTop;
  badge.textContent = title;
  note.textContent = description;
  stage.innerHTML = stageHtml;
  summary.textContent = summaryText;
  buildPreviewTokens(coverage);
  preparePreviewEditing();
  if (previewEditingKey && previewScroller.scrollTop !== scrollTop) {
    previewScroller.scrollTop = scrollTop;
  }
  restoreSavedPreviewColorEditor();
}

// ── Preview Linking and Editing ────────────────────────────────────────────

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

function preparePreviewEditing() {
  const availableKeys = new Set(colorEntries.map(entry => entry.name));
  previewContent.querySelectorAll('[data-linked-keys]').forEach(block => {
    // This wrapper lists unrelated keys; only its individual chips are editable.
    if (block.matches('.preview-fallback')) return;
    // The first binding is the surface's editable color. Nested text has its own binding.
    const key = getLinkedKeys(block).find(key => availableKeys.has(key));
    if (!key) return;

    block.dataset.previewEditKey = key;
    block.title = `Edit ${key} color`;

    // Keep nested surfaces out of the button semantics; each color is also
    // keyboard-accessible through its standalone token card.
    if (block.matches('button') || !block.querySelector('[data-linked-keys], button, a[href], input, select, textarea')) {
      block.removeAttribute('aria-hidden');
      if (!block.matches('button')) {
        block.tabIndex = 0;
        block.setAttribute('role', 'button');
      }
      block.setAttribute('aria-label', `Edit ${key} color`);
    }
  });
  if (previewEditingKey) getPreviewEditTarget()?.classList.add('preview-edit-target');
  refreshLinkedHighlights();
}

function getEditorRow(key) {
  return Array.from(editorContent.querySelectorAll('.color-row'))
    .find(row => row.dataset.color === key);
}

function updatePreviewEditorHeight() {
  if (!previewColorEditor.hidden && mobileLayout.matches) {
    document.body.style.setProperty('--preview-editor-height', `${previewColorEditor.offsetHeight}px`);
  }
}

function updatePreviewEditChromeOffsets() {
  if (!mobileLayout.matches) return;
  let top = 0;
  previewEditChrome.forEach(chrome => {
    chrome.style.setProperty('--preview-edit-chrome-top', `${top}px`);
    top += chrome.scrollHeight;
  });
}

function measurePreviewEditChrome() {
  if (!mobileLayout.matches) return;
  let top = 0;
  previewEditChrome.forEach(chrome => {
    const height = chrome.scrollHeight;
    chrome.style.setProperty('--preview-edit-chrome-top', `${top}px`);
    chrome.style.setProperty('--preview-edit-chrome-height', `${height}px`);
    top += height;
  });
}

// CSS owns interpolation; the latest transition alone may hide the dock or
// restore interaction. Reversals cancel/re-target CSS transitions without timers.
function syncPreviewEditorPresentation(editing) {
  const collapsed = editing || Boolean(pendingPreviewEditor && mobileLayout.matches && mobilePanel === 'preview');
  if (previewEditorPresented === editing && document.body.classList.contains('preview-editing') === collapsed) {
    return previewEditorTransition;
  }
  const transitionId = ++previewEditorTransitionId;
  previewEditorPresented = editing;
  previewEditChrome.forEach(chrome => { chrome.inert = true; });
  previewColorEditor.inert = true;
  if (editing) previewColorEditor.hidden = false;
  updatePreviewEditorHeight();
  // Give height a concrete endpoint before changing the editing class. This
  // avoids the intrinsic minimum-size behavior of the former 0fr grid trick.
  measurePreviewEditChrome();
  void document.body.offsetHeight;
  document.body.classList.add('preview-editor-transitioning');
  document.body.classList.toggle('preview-editing', collapsed);
  const elements = [...previewEditChrome, previewColorEditor, previewPanel];
  const animations = elements.flatMap(element => element.getAnimations());
  previewEditorTransition = Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
    if (transitionId !== previewEditorTransitionId) return false;
    previewColorEditor.hidden = !editing;
    previewColorEditor.inert = !editing;
    previewEditChrome.forEach(chrome => { chrome.inert = collapsed; });
    if (!collapsed) {
      previewEditChrome.forEach(chrome => chrome.style.removeProperty('--preview-edit-chrome-height'));
    }
    document.body.classList.remove('preview-editor-transitioning');
    return true;
  });
  return previewEditorTransition;
}

new ResizeObserver(updatePreviewEditorHeight).observe(previewColorEditor);
const previewEditChromeObserver = new ResizeObserver(() => {
  if (!document.body.classList.contains('preview-editor-transitioning')) {
    updatePreviewEditChromeOffsets();
  }
});
previewEditChrome.forEach(chrome => previewEditChromeObserver.observe(chrome));

function syncPreviewColorEditor() {
  const color = previewEditingKey && theme?.[previewEditingKey]?.[modeKey()];
  const editing = Boolean(color) && mobileLayout.matches;
  const lastColor = lastPreviewEdit && theme?.[lastPreviewEdit.key]?.[modeKey()];
  // Reveal the last-color shortcut while the chrome is collapsed on close;
  // its taller button must not resize the header just before opening animates.
  if (!editing) {
    btnPreviewLastColor.hidden = !lastColor;
    previewMobileHint.hidden = Boolean(lastColor);
  }
  if (lastColor) {
    previewLastColorName.textContent = lastPreviewEdit.key;
    btnPreviewLastColor.style.setProperty('--last-color', rgbaToCss(lastColor));
    btnPreviewLastColor.setAttribute('aria-label', `Edit ${lastPreviewEdit.key} again`);
  }
  if (!color) {
    previewEditingKey = null;
    previewPickerHex = null;
    previewPickerMode = null;
    delete previewColorEditor.dataset.linkedKeys;
    return syncPreviewEditorPresentation(editing);
  }
  const hex = rgbaToHex(color);
  if (hex !== previewPickerHex || mode !== previewPickerMode) {
    previewPickerHsv = rgbaToHsv(color, previewPickerHsv);
    previewPickerHex = hex;
    previewPickerMode = mode;
  }
  previewColorName.textContent = previewEditingKey;
  const linked = isLinked(previewEditingKey);
  previewColorApplies.textContent = linked ? 'Applies to Light & Dark · ' : `Applies to ${mode === 'dark' ? 'Dark' : 'Light'} · `;
  previewColorLinkLabel.textContent = linked ? 'Linked' : 'Unlinked';
  previewColorOpacity.textContent = color.alpha < 1 ? ` · ${Math.round(color.alpha * 100)}% opacity` : '';
  btnPreviewColorLink.setAttribute('aria-pressed', String(linked));
  btnPreviewColorLink.setAttribute('aria-label', `${previewEditingKey}: ${linked ? 'Unlink' : 'Link'} Light and Dark`);
  previewColorEditor.dataset.linkedKeys = previewEditingKey;
  previewColorField.style.setProperty('--picker-hue', `hsl(${previewPickerHsv.h}, 100%, 50%)`);
  previewColorThumb.style.left = `${previewPickerHsv.s * 100}%`;
  previewColorThumb.style.top = `${(1 - previewPickerHsv.v) * 100}%`;
  previewColorField.setAttribute('aria-label', `Saturation ${Math.round(previewPickerHsv.s * 100)}%, brightness ${Math.round(previewPickerHsv.v * 100)}%`);
  previewColorHue.value = previewPickerHsv.h;
  previewColorHue.setAttribute('aria-valuetext', `${Math.round(previewPickerHsv.h)} degrees`);
  previewColorSwatch.style.backgroundColor = hex;
  // Do not replace a partially typed hex value during a live update.
  if (document.activeElement !== previewColorHex) {
    previewColorHex.value = hex;
    clearPreviewHexError();
  }
  btnPreviewColorUndo.disabled = !previewEditOriginal
    || JSON.stringify(theme[previewEditingKey]) === JSON.stringify(previewEditOriginal);
  syncPreviewFavorite();
  return syncPreviewEditorPresentation(editing);
}

function getPreviewEditTarget() {
  const target = previewContent.querySelectorAll('[data-linked-keys]')[previewEditTargetIndex];
  return target && getLinkedKeys(target).includes(previewEditingKey) ? target : null;
}

function findRememberedPreviewTarget(selection) {
  const targets = Array.from(previewContent.querySelectorAll('[data-linked-keys]'));
  const target = targets[selection.targetIndex];
  return target && !target.matches('.preview-fallback') && getLinkedKeys(target).includes(selection.key) ? target
    : targets.find(element => !element.matches('.preview-fallback') && getLinkedKeys(element).includes(selection.key));
}

function restoreSavedPreviewColorEditor() {
  if (!pendingPreviewEditor || !editorReady) return;
  const selection = pendingPreviewEditor;
  pendingPreviewEditor = null;
  const target = findRememberedPreviewTarget(selection);
  if (mobileLayout.matches && mobilePanel === 'preview' && theme?.[selection.key]?.[modeKey()] && target) {
    editPreviewColor(selection.key, target);
  } else {
    if (lastPreviewEdit) lastPreviewEdit.open = false;
    syncPreviewColorEditor();
    savePrefs();
  }
}

function rememberPreviewEditTarget(host, key) {
  const component = getLayeredPreviewComponent(host) || host;
  let target = component;
  // A background choice can select a color used by a child, such as an accent arrow.
  if (!getLinkedKeys(target).includes(key)) {
    target = Array.from(component.querySelectorAll('[data-linked-keys]'))
      .find(element => getLinkedKeys(element).includes(key));
  }
  if (!target) {
    target = component.parentElement?.closest('[data-linked-keys]');
    while (target && !getLinkedKeys(target).includes(key)) target = target.parentElement?.closest('[data-linked-keys]');
  }
  previewEditTargetIndex = Array.from(previewContent.querySelectorAll('[data-linked-keys]')).indexOf(target);
}

function scrollPreviewEditTargetIntoView(behavior = 'auto', target = getPreviewEditTarget(), center = true) {
  if (!target || !mobileLayout.matches) return;
  const viewportTop = window.visualViewport?.offsetTop || 0;
  const viewportBottom = viewportTop + (window.visualViewport?.height || window.innerHeight);
  const bottom = previewEditingKey && !previewColorEditor.hidden
    ? Math.min(viewportBottom, previewColorEditor.getBoundingClientRect().top) : viewportBottom;
  const availableHeight = bottom - viewportTop;
  const bounds = target.getBoundingClientRect();
  if (!center && bounds.top >= viewportTop + 12 && bounds.bottom <= bottom - 12) return;
  const offset = bounds.height > availableHeight - 24 ? 12 : (availableHeight - bounds.height) / 2;
  window.scrollBy({ top: bounds.top - viewportTop - offset, behavior });
}

function previewEditScrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function updatePreviewEditViewport() {
  const viewport = window.visualViewport;
  document.body.style.setProperty('--preview-edit-viewport-height', `${viewport?.height || window.innerHeight}px`);
  document.body.style.setProperty('--preview-edit-viewport-bottom', `${Math.max(0, window.innerHeight - (viewport?.height || window.innerHeight) - (viewport?.offsetTop || 0))}px`);
}

function resizePreviewColorEditor() {
  const widthChanged = previewEditViewportWidth !== window.innerWidth;
  previewEditViewportWidth = window.innerWidth;
  updatePreviewEditViewport();
  updatePreviewEditorHeight();
  if (!document.body.classList.contains('preview-editor-transitioning')) {
    measurePreviewEditChrome();
    if (!document.body.classList.contains('preview-editing')) {
      previewEditChrome.forEach(chrome => chrome.style.removeProperty('--preview-edit-chrome-height'));
    }
  }
  const editingText = document.activeElement === previewColorHex;
  if (previewEditingKey && mobileLayout.matches && (widthChanged || editingText)) {
    requestAnimationFrame(() => {
      // Accommodate orientation/keyboard changes without fighting document
      // scrolling when Safari's address bar expands or collapses.
      if (!document.body.classList.contains('preview-editor-transitioning')) {
        scrollPreviewEditTargetIntoView('auto', getPreviewEditTarget(), false);
      }
    });
  }
}

function releasePreviewPickerPointer() {
  const pointer = previewPickerPointer;
  previewPickerPointer = null;
  if (pointer !== null && previewColorField.hasPointerCapture(pointer)) previewColorField.releasePointerCapture(pointer);
}

function closePreviewColorEditor(restoreFocus = true, rememberColor = true) {
  closePreviewHistoryRemoval();
  const target = getPreviewEditTarget();
  releasePreviewPickerPointer();
  if (rememberColor) rememberPreviewEditedColor(true);
  previewEditingKey = null;
  if (lastPreviewEdit && !pendingPreviewEditor) lastPreviewEdit.open = false;
  // A reset/import may already have replaced the theme before blur commits text.
  if (previewColorEditor.contains(document.activeElement)) document.activeElement.blur();
  previewEditOriginal = null;
  const transition = syncPreviewColorEditor();
  previewContent.querySelector('.preview-edit-target')?.classList.remove('preview-edit-target');
  transition.then(current => {
    if (!current || previewEditingKey || !restoreFocus || !target?.isConnected) return;
    const focusTarget = target.matches('[tabindex], button') ? target : target.querySelector('[tabindex], button');
    focusTarget?.focus({ preventScroll: true });
    scrollPreviewEditTargetIntoView(previewEditScrollBehavior(), target, false);
    // Preserve focus without making its hover-linked outline look like the
    // persistent selected-key highlight that just closed.
    linkedHighlightsSuppressed = true;
    clearHoverHighlights(null);
  });
  clearHoverHighlights();
  savePrefs();
}

function editPreviewColor(host, sourceHost = host) {
  const key = typeof host === 'string' ? host : host.dataset.previewEditKey;
  if (!key || !theme?.[key]?.[modeKey()]) return;

  if (mobileLayout.matches) {
    releasePreviewPickerPointer();
    rememberPreviewEditedColor();
    previewEditingKey = key;
    previewPickerHex = null;
    previewPickerHsv = { h: 0, s: 0, v: 0 };
    previewEditOriginal = JSON.parse(JSON.stringify(theme[key]));
    rememberPreviewEditTarget(sourceHost, key);
    lastPreviewEdit = { key, targetIndex: previewEditTargetIndex, open: true };
    updatePreviewEditViewport();
    const transition = syncPreviewColorEditor();
    renderPreviewColorHistory();
    previewContent.querySelector('.preview-edit-target')?.classList.remove('preview-edit-target');
    getPreviewEditTarget()?.classList.add('preview-edit-target');
    hoveredLinkedHost = null;
    linkedHighlightsSuppressed = false;
    refreshLinkedHighlights(previewColorField);
    transition.then(current => {
      if (!current || previewEditingKey !== key) return;
      previewColorField.focus({ preventScroll: true });
      scrollPreviewEditTargetIntoView(previewEditScrollBehavior());
    });
    savePrefs();
    return;
  }

  const row = getEditorRow(key);
  const picker = row?.querySelector('.color-picker');
  if (!picker || picker.disabled) return;
  const viewport = editorContent.getBoundingClientRect();
  const top = viewport.top + editorContent.clientTop;
  const bounds = row.getBoundingClientRect();
  if (bounds.top < top || bounds.bottom > top + editorContent.clientHeight) {
    editorContent.scrollTop += bounds.top - top - (editorContent.clientHeight - bounds.height) / 2;
  }

  hoveredLinkedHost = null;
  picker.focus({ preventScroll: true });
  refreshLinkedHighlights(picker);
  try {
    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }
  } catch {
    // Fall back to the input's normal activation in browsers without picker support.
  }
  picker.click();
}

function applyPreviewPickerHsv() {
  if (!previewEditingKey) return;
  previewPickerHex = hsvToHex(previewPickerHsv);
  applyColorChange(previewEditingKey, previewPickerHex);
  refreshEditor();
}

function updatePreviewPickerPointer(event) {
  const bounds = previewColorField.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  previewPickerHsv.s = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  previewPickerHsv.v = 1 - Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  applyPreviewPickerHsv();
}

previewColorField.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || previewPickerPointer !== null) return;
  event.preventDefault();
  previewPickerPointer = event.pointerId;
  previewColorField.setPointerCapture(event.pointerId);
  previewColorField.focus({ preventScroll: true });
  updatePreviewPickerPointer(event);
});
previewColorField.addEventListener('pointermove', event => {
  if (event.pointerId === previewPickerPointer) updatePreviewPickerPointer(event);
});
previewColorField.addEventListener('pointerup', event => {
  if (event.pointerId !== previewPickerPointer) return;
  updatePreviewPickerPointer(event);
  releasePreviewPickerPointer();
});
previewColorField.addEventListener('pointercancel', event => {
  if (event.pointerId === previewPickerPointer) releasePreviewPickerPointer();
});
previewColorField.addEventListener('lostpointercapture', event => {
  if (event.pointerId === previewPickerPointer) previewPickerPointer = null;
});
previewColorField.addEventListener('keydown', event => {
  const step = event.shiftKey ? 0.1 : 0.01;
  const adjustments = { ArrowLeft: ['s', -step], ArrowRight: ['s', step], ArrowDown: ['v', -step], ArrowUp: ['v', step] };
  const adjustment = adjustments[event.key];
  if (!adjustment) return;
  event.preventDefault();
  const [channel, amount] = adjustment;
  previewPickerHsv[channel] = Math.max(0, Math.min(1, previewPickerHsv[channel] + amount));
  applyPreviewPickerHsv();
});
previewColorHue.addEventListener('input', () => {
  previewPickerHsv.h = Number(previewColorHue.value);
  applyPreviewPickerHsv();
});

function clearPreviewHexError() {
  previewColorHex.removeAttribute('aria-invalid');
  previewColorHexError.hidden = true;
  previewColorHexError.textContent = '';
}

function applyPreviewHex() {
  if (!previewEditingKey || !theme?.[previewEditingKey]?.[modeKey()]) return false;
  const hex = normalizeRgbHex(previewColorHex.value);
  if (!hex) {
    previewColorHex.setAttribute('aria-invalid', 'true');
    previewColorHexError.textContent = 'Use 3 or 6 hex digits. Alpha is not supported.';
    previewColorHexError.hidden = false;
    return false;
  }
  clearPreviewHexError();
  if (hex !== rgbaToHex(theme[previewEditingKey][modeKey()])) {
    previewPickerHex = null;
    applyColorChange(previewEditingKey, hex);
    refreshEditor();
  }
  previewColorHex.value = hex;
  return true;
}
let selectPreviewHexOnClick = false;
previewColorHex.addEventListener('pointerdown', () => {
  selectPreviewHexOnClick = document.activeElement !== previewColorHex;
});
previewColorHex.addEventListener('focus', () => {
  const value = previewColorHex.value;
  // Safari can place its caret after the focus event's synchronous selection.
  requestAnimationFrame(() => {
    if (document.activeElement === previewColorHex && previewColorHex.value === value) {
      previewColorHex.setSelectionRange(0, value.length);
    }
  });
});
previewColorHex.addEventListener('click', () => {
  if (selectPreviewHexOnClick) previewColorHex.select();
  selectPreviewHexOnClick = false;
});
previewColorHex.addEventListener('input', () => {
  clearPreviewHexError();
  const hex = normalizeRgbHex(previewColorHex.value);
  if (!hex || !previewEditingKey || !theme?.[previewEditingKey]?.[modeKey()]) return;
  if (hex === rgbaToHex(theme[previewEditingKey][modeKey()])) return;
  // Apply complete RGB values without rewriting the draft or moving its caret.
  previewPickerHex = null;
  applyColorChange(previewEditingKey, hex);
  refreshEditor();
});
previewColorHex.addEventListener('change', applyPreviewHex);
previewColorHex.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (applyPreviewHex()) previewColorHex.blur();
  }
});
btnPreviewColorDone.addEventListener('click', () => {
  // Validate the draft even if iOS already moved focus to Done.
  if (!applyPreviewHex()) {
    previewColorHex.focus({ preventScroll: true });
    return;
  }
  closePreviewColorEditor();
});
btnPreviewColorLink.addEventListener('click', () => {
  if (!previewEditingKey) return;
  toggleLinked(previewEditingKey);
  syncPreviewColorEditor();
});
btnPreviewLastColor.addEventListener('click', () => {
  if (!lastPreviewEdit || !theme?.[lastPreviewEdit.key]?.[modeKey()]) return;
  const target = findRememberedPreviewTarget(lastPreviewEdit);
  if (target) editPreviewColor(lastPreviewEdit.key, target);
});
btnPreviewColorUndo.addEventListener('click', () => {
  if (!previewEditingKey || !previewEditOriginal) return;
  theme[previewEditingKey] = JSON.parse(JSON.stringify(previewEditOriginal));
  colorEntries = detectColors(theme);
  previewPickerHex = null;
  refreshEditor();
  saveState();
  void renderPreview();
});
document.addEventListener('keydown', event => {
  if (linkedHighlightsSuppressed && !previewEditingKey) {
    linkedHighlightsSuppressed = false;
    hoveredLinkedHost = null;
    refreshLinkedHighlights(event.target);
  }
  if (event.key === 'Escape' && previewEditingKey && !document.querySelector('.preview-color-dialog, .preview-history-remove-dialog')) closePreviewColorEditor();
});
mobileLayout.addEventListener('change', () => {
  if (!mobileLayout.matches && previewEditingKey) closePreviewColorEditor(false);
  else syncPreviewColorEditor();
});
window.visualViewport?.addEventListener('resize', resizePreviewColorEditor);
window.visualViewport?.addEventListener('scroll', updatePreviewEditViewport);
window.addEventListener('resize', resizePreviewColorEditor);

function isCompactPreviewComponent(element) {
  // Only these controls combine their nested labels into one editing target.
  // Cards and scene containers may bind their own surface without owning text.
  return element.matches('button, .preview-v09-filter-chip, .preview-v09-continue, .preview-v09-secondary-action, .preview-v09-new, .preview-v09-alpha-layer, .preview-banner, .preview-accent-rail');
}

function getLayeredPreviewComponent(host) {
  if (!getLinkedKeys(host).length || host.matches('.preview-fallback')) return null;
  const scene = host.closest('.preview-showcase, .preview-v09-scene, .preview-token-section');
  let component = host;
  while (component && previewContent.contains(component)) {
    if (component === scene || (scene && !scene.contains(component))) break;
    const keys = getLinkedKeys(component);
    if (!keys.length) break;
    if (isCompactPreviewComponent(component)) return component;
    component = component.parentElement?.closest('[data-linked-keys]');
  }
  return host;
}

function getPreviewColorChoices(component) {
  const keys = new Set();
  const scene = component.closest('.preview-showcase, .preview-v09-scene, .preview-token-section');
  let ancestor = component;
  while (ancestor && previewContent.contains(ancestor)) {
    // A fallback collection lists unrelated keys, unlike a scene's actual canvas.
    if (ancestor.matches('.preview-fallback')) break;
    if (ancestor.hasAttribute('data-linked-keys')) {
      const bindings = getLinkedKeys(ancestor);
      if (!bindings.length) break;
      bindings.forEach(key => keys.add(key));
    }
    if (ancestor === scene) break;
    ancestor = ancestor.parentElement;
  }
  const collect = element => {
    for (const child of element.children) {
      if (child.hasAttribute('data-linked-keys')) {
        const bindings = getLinkedKeys(child);
        // Do not turn illustrative artwork or native parts into color choices.
        if (!bindings.length) continue;
        bindings.forEach(key => keys.add(key));
      }
      collect(child);
    }
  };
  // Tapping a surface also offers the colors of the content it contains.
  // Precise text taps still start at that text, not the surrounding subtree.
  collect(component);

  const bindings = getLinkedKeys(component);
  const role = key => {
    if (component.matches('.preview-button')) {
      if (bindings.includes(key)) {
        if (/BackgroundColor$/i.test(key)) return 'Fill';
        if (/BorderColor$/i.test(key)) return 'Border';
      }
      if (key === 'foregroundColor') return 'Card fill';
      if (key === 'borderColor') return 'Card border';
    }
    if (component.matches('.preview-v09-filter-chip')) {
      if (key === bindings[0]) return 'Fill';
      if (key === 'text') return 'Text';
      if (key === 'background') return 'Background';
    }
    if (component.matches('.preview-v09-continue, .preview-v09-secondary-action, .preview-v09-new')) {
      if (key === bindings[0]) return 'Fill';
      if (key === bindings[1]) return 'Text';
    }
    if (component.matches('.preview-v09-alpha-layer')) {
      if (key === bindings[0]) return 'Overlay';
      if (key === bindings[1]) return 'Background';
    }
    if (/text/i.test(key)) return 'Text';
    if (key === 'border' || key === 'borderColor') return 'Border';
    if (key === 'foreground' || key === 'foregroundColor') return 'Fill';
    if (key === 'background' || key === 'backgroundColor') return 'Background';
    return 'Color';
  };
  const roleOrder = ['Fill', 'Text', 'Border', 'Card fill', 'Card border', 'Overlay', 'Background', 'Color'];
  return [...keys]
    .filter(key => colorEntries.some(entry => entry.name === key))
    .map(key => ({ key, role: role(key) }))
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
}

function showPreviewColorChooser(host, choices) {
  if (previewContent.querySelector('.preview-color-dialog')) return;
  const previousFocus = document.activeElement;
  const returnFocus = host.matches('[tabindex], button') ? host
    : host.querySelector('[tabindex], button') || previousFocus;
  const dialog = document.createElement('dialog');
  dialog.className = 'preview-color-dialog';
  dialog.setAttribute('aria-labelledby', 'preview-color-choice-title');
  dialog.setAttribute('aria-describedby', 'preview-color-choice-description');
  dialog.innerHTML = `
    <h2 id="preview-color-choice-title">Choose a color</h2>
    <p id="preview-color-choice-description">Which part of this component would you like to edit?</p>
    <div class="preview-color-choices"></div>
    <button type="button" class="btn preview-color-cancel">Cancel</button>`;

  let selected = false;
  const list = dialog.querySelector('.preview-color-choices');
  choices.forEach(({ key, role }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preview-color-choice';
    const swatch = document.createElement('span');
    swatch.className = 'preview-color-choice-swatch';
    swatch.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    const entry = colorEntries.find(entry => entry.name === key);
    const color = entry[modeKey()];
    const solid = document.createElement('span');
    solid.style.backgroundColor = rgbaToHex(color);
    fill.style.backgroundColor = rgbaToCss(color);
    swatch.append(solid, fill);
    const label = document.createElement('span');
    label.className = 'preview-color-choice-label';
    const name = document.createElement('strong');
    name.textContent = role;
    const detail = document.createElement('span');
    detail.textContent = color.alpha < 1
      ? `${key} · ${Math.round(color.alpha * 100)}% opacity` : key;
    label.append(name, detail);
    button.append(swatch, label);
    button.addEventListener('click', () => {
      selected = true;
      dialog.close();
      dialog.remove();
      editPreviewColor(key, host);
    });
    list.appendChild(button);
  });
  dialog.querySelector('.preview-color-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (!selected) {
      clearHoverHighlights();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }
  });
  previewContent.appendChild(dialog);
  dialog.showModal();
}

function handlePreviewEdit(event) {
  const host = getLinkedHoverHost(event.target);
  // An empty binding intentionally stops clicks on illustrative artwork/native parts.
  if (!host || !previewContent.contains(host) || !host.dataset.previewEditKey) return;
  event.preventDefault();
  if (mobileLayout.matches) {
    const component = getLayeredPreviewComponent(host);
    const choices = component ? getPreviewColorChoices(component) : [];
    if (choices.length > 1) {
      showPreviewColorChooser(host, choices);
      return;
    }
  }
  editPreviewColor(host);
}

function getContextualLinkedKeys(host) {
  // The fallback lists every loaded key; that collection is not one component.
  if (host.matches('.preview-fallback')) return [];
  const keys = getLinkedKeys(host);
  // Blank bindings are deliberate boundaries around artwork and native parts.
  if (!keys.length || keys.length > 1 || host.matches('.color-row')) return keys;

  const scene = host.closest('.preview-showcase, .preview-v09-scene, .preview-token-section');
  let ancestor = host.parentElement?.closest('[data-linked-keys]');
  while (ancestor && previewContent.contains(ancestor)) {
    if (ancestor === scene || (scene && !scene.contains(ancestor))) break;
    const ancestorKeys = getLinkedKeys(ancestor);
    if (!ancestorKeys.length) break;
    if (ancestorKeys.length > 1) {
      // Include one component's layered bindings, never every key in a scene.
      return [...new Set([...ancestorKeys, ...keys])];
    }
    ancestor = ancestor.parentElement?.closest('[data-linked-keys]');
  }
  return keys;
}

function makeLinkedHighlightColors(keys) {
  const palette = [
    ['#ff7898', 'rgba(255, 120, 152, 0.16)'],
    ['#55d9ed', 'rgba(85, 217, 237, 0.16)'],
    ['#ffc766', 'rgba(255, 199, 102, 0.16)'],
    ['#bca0ff', 'rgba(188, 160, 255, 0.16)'],
    ['#77e4b1', 'rgba(119, 228, 177, 0.16)']
  ];
  return new Map([...new Set(keys)].map((key, index) => [key, palette[index % palette.length]]));
}

function setLinkedHighlight(element, key, colors) {
  const color = colors.get(key);
  element.classList.toggle('linked-hover', Boolean(color));
  if (color) {
    element.style.setProperty('--linked-highlight', color[0]);
    element.style.setProperty('--linked-highlight-soft', color[1]);
  } else {
    element.style.removeProperty('--linked-highlight');
    element.style.removeProperty('--linked-highlight-soft');
  }
}

function updateHoverHighlights(keys) {
  const colors = makeLinkedHighlightColors(keys);

  editorContent.querySelectorAll('.color-row[data-color]').forEach(row => {
    setLinkedHighlight(row, row.dataset.color, colors);
  });

  previewContent.querySelectorAll('[data-linked-keys]').forEach(block => {
    if (block.matches('.preview-fallback')) {
      setLinkedHighlight(block, null, colors);
      return;
    }
    const bindings = getLinkedKeys(block);
    let owner = colors.has(bindings[0]) ? bindings[0] : null;
    if (!owner) {
      // A child with its own binding draws its own outline. Its text color must
      // not also paint the surrounding button's fill outline.
      const childBindings = new Set(Array.from(block.querySelectorAll('[data-linked-keys]'))
        .map(child => getLinkedKeys(child)[0]));
      owner = bindings.find(key => colors.has(key) && !childBindings.has(key));
    }
    setLinkedHighlight(block, owner, colors);
  });
}

function hasEmptyBindingBetween(element, ancestor) {
  let current = element.parentElement;
  while (current && current !== ancestor) {
    if (current.hasAttribute('data-linked-keys') && getLinkedKeys(current).length === 0) return true;
    current = current.parentElement;
  }
  return false;
}

function hasSelectedDescendant(block, key, primaryOnly) {
  return Array.from(block.querySelectorAll('[data-linked-keys]')).some(descendant => {
    if (descendant.matches('.preview-fallback') || hasEmptyBindingBetween(descendant, block)) return false;
    const bindings = getLinkedKeys(descendant);
    return primaryOnly ? bindings[0] === key : bindings.includes(key);
  });
}

function hasSelectedPrimaryAncestor(block, key) {
  let ancestor = block.parentElement?.closest('[data-linked-keys]');
  while (ancestor && previewContent.contains(ancestor)) {
    const bindings = getLinkedKeys(ancestor);
    if (!bindings.length) break;
    if (!ancestor.matches('.preview-fallback') && bindings[0] === key) return true;
    ancestor = ancestor.parentElement?.closest('[data-linked-keys]');
  }
  return false;
}

function ownsSelectedPreviewKey(block, key) {
  if (block.matches('.preview-fallback') || hasEmptyBindingBetween(block, previewContent)) return false;
  const bindings = getLinkedKeys(block);
  if (!bindings.includes(key)) return false;

  // The first binding is the element's own visible color. A deepest primary
  // binding wins; a later binding is only an owner when no ancestor or child
  // provides a more specific element for that color.
  if (bindings[0] === key) return !hasSelectedDescendant(block, key, true);
  return !hasSelectedPrimaryAncestor(block, key) && !hasSelectedDescendant(block, key, false);
}

function updateSelectedKeyHighlights(key) {
  const colors = makeLinkedHighlightColors([key]);
  editorContent.querySelectorAll('.color-row[data-color]').forEach(row => {
    setLinkedHighlight(row, null, colors);
  });
  previewContent.querySelectorAll('[data-linked-keys]').forEach(block => {
    setLinkedHighlight(block, ownsSelectedPreviewKey(block, key) ? key : null, colors);
  });
}

let hoveredLinkedHost = null;
let linkedHighlightsSuppressed = false;

function getLiveLinkedHost(node) {
  const host = getLinkedHoverHost(node);
  return host?.isConnected && (editorContent.contains(host) || previewContent.contains(host) || host === previewColorEditor)
    ? host : null;
}

function refreshLinkedHighlights(focusedNode = document.activeElement) {
  if (mobileLayout.matches && previewEditingKey) {
    updateSelectedKeyHighlights(previewEditingKey);
    return;
  }
  if (linkedHighlightsSuppressed) {
    updateHoverHighlights([]);
    return;
  }
  // Rendering may replace a hovered sample. Never retain its detached bindings.
  hoveredLinkedHost = getLiveLinkedHost(hoveredLinkedHost);
  const host = hoveredLinkedHost || getLiveLinkedHost(focusedNode);
  updateHoverHighlights(host ? getContextualLinkedKeys(host) : []);
}

function clearHoverHighlights(focusedNode = document.activeElement) {
  hoveredLinkedHost = null;
  refreshLinkedHighlights(focusedNode);
}

function handleLinkedHoverStart(event) {
  if (event.type === 'focusin') {
    // A new keyboard or picker focus takes over from any previous pointer target.
    linkedHighlightsSuppressed = false;
    hoveredLinkedHost = null;
    refreshLinkedHighlights(event.target);
    return;
  }
  hoveredLinkedHost = getLiveLinkedHost(event.target);
  refreshLinkedHighlights();
}

function resumeLinkedHighlightsFromPointer(event) {
  if (!linkedHighlightsSuppressed) return;
  linkedHighlightsSuppressed = false;
  hoveredLinkedHost = getLiveLinkedHost(event.target);
  refreshLinkedHighlights();
}

function handleLinkedHoverEnd(event) {
  if (event.type === 'focusout') {
    refreshLinkedHighlights(event.relatedTarget);
    return;
  }
  // An empty binding still counts as a pointer target and suppresses focus
  // highlights while the pointer is over illustrative artwork/native parts.
  hoveredLinkedHost = getLiveLinkedHost(event.relatedTarget);
  refreshLinkedHighlights();
}

editorContent.addEventListener('mouseover', handleLinkedHoverStart);
editorContent.addEventListener('mouseout', handleLinkedHoverEnd);
editorContent.addEventListener('focusin', handleLinkedHoverStart);
editorContent.addEventListener('focusout', handleLinkedHoverEnd);
previewContent.addEventListener('mouseover', handleLinkedHoverStart);
previewContent.addEventListener('mouseout', handleLinkedHoverEnd);
previewContent.addEventListener('focusin', handleLinkedHoverStart);
previewContent.addEventListener('focusout', handleLinkedHoverEnd);
editorContent.addEventListener('pointerdown', resumeLinkedHighlightsFromPointer, { capture: true, passive: true });
editorContent.addEventListener('pointermove', resumeLinkedHighlightsFromPointer, { passive: true });
previewContent.addEventListener('pointerdown', resumeLinkedHighlightsFromPointer, { capture: true, passive: true });
previewContent.addEventListener('pointermove', resumeLinkedHighlightsFromPointer, { passive: true });
previewColorEditor.addEventListener('focusin', handleLinkedHoverStart);
previewColorEditor.addEventListener('focusout', handleLinkedHoverEnd);
previewContent.addEventListener('click', handlePreviewEdit);
previewContent.addEventListener('keydown', event => {
  if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
  // Native buttons already generate one click for keyboard activation.
  if (!event.target.matches('[role="button"]:not(button)')) return;
  handlePreviewEdit(event);
});

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
    previewVisible, mobilePanel, mode, globalLinked, linkedState, selectedDefaultId,
    previewEditor: lastPreviewEdit
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
  exportBaseName = activeThemeMeta?.source === 'import' && activeThemeMeta.name
    ? activeThemeMeta.name : 'themeColors';
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
  btnResetToggle.setAttribute('aria-expanded', 'false');

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
  btnResetToggle.setAttribute('aria-expanded', String(!resetDropdown.classList.contains('hidden')));
});

document.addEventListener('click', () => {
  resetDropdown.classList.add('hidden');
  btnResetToggle.setAttribute('aria-expanded', 'false');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !resetDropdown.classList.contains('hidden')) {
    resetDropdown.classList.add('hidden');
    btnResetToggle.setAttribute('aria-expanded', 'false');
    btnResetToggle.focus();
  }
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
  btnGlobalLink.setAttribute('aria-pressed', String(globalLinked));
  btnGlobalLink.querySelector('.control-label').textContent = globalLinked ? 'Modes linked' : 'Modes unlinked';
  colorEntries.forEach(entry => updateLinkButton(entry.name));
  savePrefs();
}

function updateLinkButton(colorName) {
  const btn = getEditorRow(colorName)?.querySelector('.link-btn');
  if (!btn) return;

  const linked = isLinked(colorName);
  const otherMode = mode === 'dark' ? 'light' : 'dark';
  btn.classList.toggle('linked', linked);
  btn.title = linked ? `Linked to ${otherMode}` : `Not linked to ${otherMode}`;
  btn.setAttribute('aria-pressed', String(linked));
  btn.setAttribute('aria-label', `${colorName}: link Light and Dark`);
  btn.querySelector('.control-label').textContent = linked ? 'Linked' : 'Unlinked';
}

// ── Editor UI ──────────────────────────────────────────────────────────────

function buildEditor(keepPendingPreview = false) {
  if (!keepPendingPreview) {
    pendingPreviewEditor = null;
    lastPreviewEdit = null;
  }
  closePreviewColorEditor(false, false);
  previewEditTargetIndex = -1;
  editorContent.innerHTML = '';

  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    const hex = rgbaToHex(color);

    const row = document.createElement('div');
    row.className = 'color-row';
    row.dataset.color = entry.name;
    let beforeEditHex = hex;
    row.addEventListener('focusin', event => {
      if (!row.contains(event.relatedTarget)) beforeEditHex = rgbaToHex(theme[entry.name][modeKey()]);
    });
    row.addEventListener('focusout', event => {
      if (row.contains(event.relatedTarget) || !theme?.[entry.name]?.[modeKey()]) return;
      const editedHex = rgbaToHex(theme[entry.name][modeKey()]);
      if (editedHex !== beforeEditHex) rememberRecentColors(beforeEditHex, editedHex);
    });

    const label = document.createElement('span');
    label.className = 'color-label';
    label.textContent = entry.name;

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'color-picker';
    picker.value = hex;
    picker.dataset.color = entry.name;
    picker.setAttribute('aria-label', `Edit ${entry.name} color`);

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'color-hex';
    hexInput.value = hex;
    hexInput.dataset.color = entry.name;
    hexInput.spellcheck = false;
    hexInput.setAttribute('aria-label', `${entry.name} hex color`);
    hexInput.autocapitalize = 'off';
    hexInput.autocomplete = 'off';

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
    linkBtn.setAttribute('aria-label', `${entry.name}: link Light and Dark`);
    linkBtn.setAttribute('aria-pressed', String(isLinked(entry.name)));
    const linkLabel = document.createElement('span');
    linkLabel.className = 'control-label';
    linkLabel.textContent = isLinked(entry.name) ? 'Linked' : 'Unlinked';
    linkBtn.appendChild(linkLabel);

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
  editorReady = true;
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
  syncPreviewColorEditor();
  saveState();
  void renderPreview();
}

function refreshEditor() {
  colorEntries.forEach(entry => {
    const row = getEditorRow(entry.name);
    if (!row) return;

    const color = entry[modeKey()];
    const hex = rgbaToHex(color);

    row.querySelector('.color-picker').value = hex;
    row.querySelector('.color-hex').value = hex;
    row.querySelector('.color-alpha').textContent = color.alpha !== 1 ? `${Math.round(color.alpha * 100)}%` : '';

    updateLinkButton(entry.name);
  });
  syncPreviewColorEditor();
}

// ── Controls ───────────────────────────────────────────────────────────────

function setMode(newMode) {
  mode = newMode;
  btnLight.classList.toggle('active', mode === 'light');
  btnDark.classList.toggle('active', mode === 'dark');
  btnLight.setAttribute('aria-pressed', String(mode === 'light'));
  btnDark.setAttribute('aria-pressed', String(mode === 'dark'));

  if (colorEntries.length > 0) {
    refreshEditor();
  }

  void renderPreview();
  savePrefs();
}

function setPreviewVisible(visible) {
  previewVisible = PREVIEW_ENABLED && visible;
  if (!previewVisible) mobilePanel = 'colors';
  previewPanel.classList.toggle('collapsed', !previewVisible);
  workspace.classList.toggle('preview-hidden', !previewVisible);
  btnPreviewToggle.classList.toggle('active', previewVisible);
  btnPreviewToggle.disabled = !PREVIEW_ENABLED;
  btnPreviewToggle.title = PREVIEW_ENABLED
    ? previewVisible ? 'Hide preview panel' : 'Show preview panel'
    : 'Preview coming soon';
  btnPreviewToggle.setAttribute('aria-label', btnPreviewToggle.title);
  btnPreviewToggle.setAttribute('aria-expanded', String(previewVisible));
  btnPreviewToggle.querySelector('.control-label').textContent = previewVisible ? 'Hide preview' : 'Show preview';
  syncMobilePanel();
  savePrefs();
}

function syncMobilePanel() {
  workspace.dataset.mobilePanel = mobilePanel;
  btnMobileColors.setAttribute('aria-pressed', String(mobilePanel === 'colors'));
  btnMobilePreview.setAttribute('aria-pressed', String(mobilePanel === 'preview'));
  btnMobilePreview.disabled = !PREVIEW_ENABLED;
  updatePreviewEditChromeOffsets();
}

const mobilePanelScroll = { colors: 0, preview: 0 };

function setMobilePanel(panel) {
  if (mobileLayout.matches) mobilePanelScroll[mobilePanel] = window.scrollY;
  if (previewEditingKey) closePreviewColorEditor(false);
  mobilePanel = panel === 'preview' && PREVIEW_ENABLED ? 'preview' : 'colors';
  if (mobilePanel === 'preview') {
    setPreviewVisible(true);
  } else {
    syncMobilePanel();
    savePrefs();
  }
  if (mobileLayout.matches) window.scrollTo(0, mobilePanelScroll[mobilePanel]);
}

btnMobileColors.addEventListener('click', () => setMobilePanel('colors'));
btnMobilePreview.addEventListener('click', () => setMobilePanel('preview'));

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

function openExportDialog() {
  if (!theme) return;
  exportNameInput.value = exportBaseName;
  exportNameInput.setCustomValidity('');
  exportDialog.showModal();
  exportNameInput.select();
}

function exportTheme(filename) {
  if (!theme) return;

  const json = JSON.stringify(theme, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

exportForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = exportNameInput.value.trim().replace(/(?:\.pbcolors)+$/i, '').trim();
  let error = '';
  if (!name || /^\.+$/.test(name)) {
    error = 'Enter a file name.';
  } else if (/[<>:"/\\|?*\u0000-\u001f]/.test(name)) {
    error = 'Use a file name without slashes or these characters: < > : " | ? *';
  }
  exportNameInput.setCustomValidity(error);
  if (!exportNameInput.reportValidity()) return;

  exportBaseName = name;
  exportTheme(`${name}.pbcolors`);
  exportDialog.close();
});
exportNameInput.addEventListener('input', () => exportNameInput.setCustomValidity(''));
btnExportCancel.addEventListener('click', () => exportDialog.close());

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
btnExport.addEventListener('click', openExportDialog);

// ── Initialization ─────────────────────────────────────────────────────────

async function init() {
  try {
    if (PREVIEW_ENABLED) await loadPreviewTemplate();

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
    buildEditor(true);
    if (PREVIEW_ENABLED) await renderPreview();
  } catch (err) {
    pendingPreviewEditor = null;
    syncPreviewColorEditor();
    console.error('Failed to initialize editor:', err);
  }
}

init();
