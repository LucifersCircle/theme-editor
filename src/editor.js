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
const previewColorPicker = document.getElementById('preview-color-picker');
const previewMobileHint = document.querySelector('.preview-mobile-hint');
const btnMobileColors = document.getElementById('btn-mobile-colors');
const btnMobilePreview = document.getElementById('btn-mobile-preview');
const mobileLayout = window.matchMedia('(max-width: 700px)');

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
          <span class="preview-help-desktop">Hover to see linked colors. Click a fill or text to edit its color.</span>
          <span class="preview-help-mobile">Tap a component to edit its color. If colors overlap, choose one.</span>
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
    if (!color || !['red', 'green', 'blue', 'alpha'].every(channel => Number.isFinite(color[channel]))) return;
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
      ? 'Observed in app'
      : mapping?.status === 'unresolved' ? 'App use unresolved' : 'Raw color';

    const note = document.createElement('span');
    note.className = 'preview-token-note';
    note.textContent = mapping?.note || 'No observed app role recorded for this key.';

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
  let description = 'Showing a generic preview shell because the imported theme uses a non-standard key set.';
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

  badge.textContent = title;
  note.textContent = description;
  stage.innerHTML = stageHtml;
  summary.textContent = summaryText;
  buildPreviewTokens(coverage);
  preparePreviewEditing();
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
  refreshLinkedHighlights();
}

function getEditorRow(key) {
  return Array.from(editorContent.querySelectorAll('.color-row'))
    .find(row => row.dataset.color === key);
}

function syncPreviewColorEditor() {
  const color = previewEditingKey && theme?.[previewEditingKey]?.[modeKey()];
  previewColorEditor.hidden = !color;
  previewMobileHint.hidden = Boolean(color);
  if (!color) {
    previewEditingKey = null;
    previewColorName.textContent = '';
    delete previewColorPicker.dataset.linkedKeys;
    return;
  }
  previewColorName.textContent = previewEditingKey;
  previewColorPicker.value = rgbaToHex(color);
  previewColorPicker.dataset.linkedKeys = previewEditingKey;
  previewColorPicker.setAttribute('aria-label', `Edit ${previewEditingKey} color`);
}

function editPreviewColor(host) {
  const key = typeof host === 'string' ? host : host.dataset.previewEditKey;
  if (!key || !theme?.[key]?.[modeKey()]) return;

  let picker;
  if (mobileLayout.matches) {
    // This control lives in the header so live preview updates cannot detach it.
    previewEditingKey = key;
    syncPreviewColorEditor();
    picker = previewColorPicker;
  } else {
    const row = getEditorRow(key);
    picker = row?.querySelector('.color-picker');
    if (!picker || picker.disabled) return;

    const viewport = editorContent.getBoundingClientRect();
    const top = viewport.top + editorContent.clientTop;
    const bounds = row.getBoundingClientRect();
    if (bounds.top < top || bounds.bottom > top + editorContent.clientHeight) {
      // Only move the editor pane. Finish scrolling before opening the native picker.
      editorContent.scrollTop += bounds.top - top - (editorContent.clientHeight - bounds.height) / 2;
    }
  }

  hoveredLinkedHost = null;
  picker.focus({ preventScroll: true });
  refreshLinkedHighlights(picker);
  if (picker === previewColorPicker) {
    // Lay out the newly revealed control before Safari anchors its native picker.
    picker.getBoundingClientRect();
    picker.click();
    return;
  }
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

previewColorPicker.addEventListener('input', event => {
  if (!previewEditingKey || !theme?.[previewEditingKey]?.[modeKey()]) return;
  applyColorChange(previewEditingKey, event.target.value);
  refreshEditor();
});

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
      // Keep picker activation in this user gesture, after the modal is gone.
      editPreviewColor(key);
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

function updateHoverHighlights(keys) {
  const palette = [
    ['#ff7898', 'rgba(255, 120, 152, 0.16)'],
    ['#55d9ed', 'rgba(85, 217, 237, 0.16)'],
    ['#ffc766', 'rgba(255, 199, 102, 0.16)'],
    ['#bca0ff', 'rgba(188, 160, 255, 0.16)'],
    ['#77e4b1', 'rgba(119, 228, 177, 0.16)']
  ];
  const colors = new Map([...new Set(keys)].map((key, index) => [key, palette[index % palette.length]]));
  const highlight = (element, key) => {
    const color = colors.get(key);
    element.classList.toggle('linked-hover', Boolean(color));
    if (color) {
      element.style.setProperty('--linked-highlight', color[0]);
      element.style.setProperty('--linked-highlight-soft', color[1]);
    } else {
      element.style.removeProperty('--linked-highlight');
      element.style.removeProperty('--linked-highlight-soft');
    }
  };

  editorContent.querySelectorAll('.color-row[data-color]').forEach(row => {
    highlight(row, row.dataset.color);
  });

  previewContent.querySelectorAll('[data-linked-keys]').forEach(block => {
    if (block.matches('.preview-fallback')) {
      highlight(block, null);
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
    highlight(block, owner);
  });
}

let hoveredLinkedHost = null;

function getLiveLinkedHost(node) {
  const host = getLinkedHoverHost(node);
  return host?.isConnected && (editorContent.contains(host) || previewContent.contains(host) || host === previewColorPicker)
    ? host : null;
}

function refreshLinkedHighlights(focusedNode = document.activeElement) {
  // Rendering may replace a hovered sample. Never retain its detached bindings.
  hoveredLinkedHost = getLiveLinkedHost(hoveredLinkedHost);
  const host = hoveredLinkedHost || getLiveLinkedHost(focusedNode);
  updateHoverHighlights(host ? getContextualLinkedKeys(host) : []);
}

function clearHoverHighlights() {
  hoveredLinkedHost = null;
  refreshLinkedHighlights();
}

function handleLinkedHoverStart(event) {
  if (event.type === 'focusin') {
    // A new keyboard or picker focus takes over from any previous pointer target.
    hoveredLinkedHost = null;
    refreshLinkedHighlights(event.target);
    return;
  }
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
previewColorPicker.addEventListener('focusin', handleLinkedHoverStart);
previewColorPicker.addEventListener('focusout', handleLinkedHoverEnd);
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
    previewVisible, mobilePanel, mode, globalLinked, linkedState, selectedDefaultId
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
  btnGlobalLink.querySelector('.control-label').textContent = globalLinked ? 'Modes linked' : 'Modes separate';
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
  btn.querySelector('.control-label').textContent = linked ? 'Linked' : 'Separate';
}

// ── Editor UI ──────────────────────────────────────────────────────────────

function buildEditor() {
  previewEditingKey = null;
  syncPreviewColorEditor();
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
    linkLabel.textContent = isLinked(entry.name) ? 'Linked' : 'Separate';
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
}

function setMobilePanel(panel) {
  mobilePanel = panel === 'preview' && PREVIEW_ENABLED ? 'preview' : 'colors';
  if (mobilePanel === 'preview') {
    setPreviewVisible(true);
  } else {
    syncMobilePanel();
    savePrefs();
  }
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
    buildEditor();
    if (PREVIEW_ENABLED) await renderPreview();
  } catch (err) {
    console.error('Failed to initialize editor:', err);
  }
}

init();
