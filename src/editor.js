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
let globalLinked = _savedPrefs?.globalLinked !== false; // global link default (true)
const linkedState = Object.assign({}, _savedPrefs?.linkedState); // per-color link overrides
let selectedDefaultId = _savedPrefs?.selectedDefaultId || 0; // index into themeManifest
let themeManifest = [];

// ── DOM References ─────────────────────────────────────
const editorContent = document.getElementById('editor-content');
const btnLight = document.getElementById('btn-light');
const btnDark = document.getElementById('btn-dark');
const btnGlobalLink = document.getElementById('btn-global-link');
const btnReset = document.getElementById('btn-reset');
const btnResetToggle = document.getElementById('btn-reset-toggle');
const resetDropdown = document.getElementById('reset-dropdown');
const btnImport = document.getElementById('btn-import');
const fileInput = document.getElementById('file-input');
const previewContent = document.getElementById('preview-content');

let previewTemplateLoaded = false;

const V09_PREVIEW_KEYS = [
  'accent',
  'alert',
  'alertText',
  'background',
  'border',
  'foreground',
  'overlay',
  'primary',
  'primaryText',
  'secondary',
  'secondaryText',
  'separator',
  'tertiary',
  'tertiaryText',
  'text',
  'textSecondary',
  'textTertiary'
];

const V08_PREVIEW_KEYS = [
  'accentColor',
  'accentColorLight',
  'accentTextColor',
  'backgroundColor',
  'bodyTextColor',
  'borderColor',
  'buttonNormalBackgroundColor',
  'buttonNormalBorderColor',
  'buttonNormalTextColor',
  'buttonSelectedBackgroundColor',
  'buttonSelectedBorderColor',
  'buttonSelectedTextColor',
  'foregroundColor',
  'overlayColor',
  'separatorColor',
  'subtitleTextColor',
  'supertitleTextColor',
  'titleTextColor'
];

// Apply saved prefs to DOM immediately (prevents flash)
btnLight.classList.toggle('active', mode === 'light');
btnDark.classList.toggle('active', mode === 'dark');
btnGlobalLink.classList.toggle('linked', globalLinked);
btnGlobalLink.title = globalLinked ? 'All colors linked (light = dark)' : 'Colors independent';

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

// ── Preview Rendering ──────────────────────────────────

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

function scorePreviewFamily(keys, familyKeys) {
  return familyKeys.reduce((count, key) => count + (keys.includes(key) ? 1 : 0), 0);
}

function detectPreviewFamily() {
  const keys = colorEntries.map(entry => entry.name);
  const v09Score = scorePreviewFamily(keys, V09_PREVIEW_KEYS);
  const v08Score = scorePreviewFamily(keys, V08_PREVIEW_KEYS);

  if (v09Score === 0 && v08Score === 0) return 'custom';
  return v09Score >= v08Score ? 'v09' : 'v08';
}

function applyPreviewVariables(root) {
  if (!root) return;

  root.style.cssText = '';
  colorEntries.forEach(entry => {
    const color = entry[modeKey()];
    root.style.setProperty(`--theme-${camelToKebab(entry.name)}`, rgbaToCss(color));
  });
}

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
    const blockKeys = getLinkedKeys(block);
    const matches = blockKeys.some(key => activeKeys.has(key));
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

function buildV09PreviewMarkup() {
  return `
    <section class="preview-showcase preview-v09"${keyAttr(['background'])}>
      <div class="preview-device preview-v09-device">
        <div class="preview-v09-grid">
          <section class="preview-v09-panel preview-v09-library"${keyAttr(['background'])}>
            <div class="preview-v09-panel-head">
              <div class="preview-v09-nav-item">
                <span class="preview-v09-nav-icon"${keyAttr(['accent'])}></span>
                <span${keyAttr(['text'])}>Library</span>
              </div>
              <div class="preview-v09-nav-item">
                <span class="preview-v09-nav-icon"${keyAttr(['accent'])}></span>
                <span${keyAttr(['text'])}>Discover</span>
              </div>
            </div>

            <article class="preview-v09-card preview-v09-chapter-card"${keyAttr(['foreground'])}>
              <span class="preview-v09-badge"${keyAttr(['accent', 'alertText'])}>NEW</span>

              <div class="preview-v09-card-head">
                <div>
                  <h4${keyAttr(['text'])}>Chapter list</h4>
                  <p${keyAttr(['textSecondary'])}>Title, scanlator, upload age, and badges.</p>
                </div>
              </div>

              <div class="preview-v09-chapter-row">
                <span class="preview-v09-language"${keyAttr(['textTertiary'])}>EN</span>
                <div class="preview-v09-copy">
                  <strong${keyAttr(['text'])}>Chapter 15 · A Starting Point</strong>
                  <span${keyAttr(['textSecondary'])}>scanlator • 2 days ago</span>
                </div>
              </div>
            </article>
          </section>

          <section class="preview-v09-panel preview-v09-details"${keyAttr(['background'])}>
            <div class="preview-v09-cover"${keyAttr(['foreground'])}>
              <div class="preview-v09-cover-art"></div>
              <div class="preview-v09-divider"${keyAttr(['separator'])}></div>
            </div>

            <article class="preview-v09-card preview-v09-details-card"${keyAttr(['foreground'])}>
              <div class="preview-v09-card-head">
                <div>
                  <h4${keyAttr(['text'])}>Manga details</h4>
                  <p${keyAttr(['textSecondary'])}>Description surface, tags, and status chips.</p>
                </div>
              </div>

              <p class="preview-v09-description"${keyAttr(['text'])}>
                Description text sits on the foreground card while metadata chips layer on top.
              </p>

              <div class="preview-v09-chip-row">
                <span class="preview-v09-meta-chip"${keyAttr(['foreground', 'textSecondary'])}>Ongoing</span>
                <span class="preview-v09-meta-chip"${keyAttr(['foreground', 'textSecondary'])}>Safe</span>
                <span class="preview-v09-meta-chip"${keyAttr(['foreground', 'textSecondary'])}>Action</span>
              </div>

              <div class="preview-v09-action-row">
                <button type="button" class="preview-button preview-button-primary"${keyAttr(['primary', 'primaryText'])}>Continue</button>
                <button type="button" class="preview-button preview-v09-button-secondary"${keyAttr(['secondary', 'secondaryText'])}>Bookmark</button>
                <button type="button" class="preview-button preview-v09-button-secondary"${keyAttr(['secondary', 'secondaryText'])}>Track</button>
              </div>
            </article>
          </section>

          <section class="preview-v09-panel preview-v09-reader"${keyAttr(['background'])}>
            <article class="preview-v09-reader-stage">
              <div class="preview-v09-reader-media"></div>
              <div class="preview-v09-reader-box"${keyAttr(['border'])}>
                <strong${keyAttr(['text'])}>Chapter 15</strong>
                <span${keyAttr(['textSecondary'])}>Left off at page 11</span>
              </div>
              <div class="preview-v09-reader-controls">
                <button type="button" class="preview-v09-reader-button"${keyAttr(['border'])}></button>
                <button type="button" class="preview-v09-reader-button"${keyAttr(['border'])}></button>
              </div>
              <div class="preview-v09-reader-flash"${keyAttr(['overlay'])}></div>
            </article>
          </section>

          <section class="preview-v09-panel preview-v09-stubs"${keyAttr(['background'])}>
            <div class="preview-v09-card preview-v09-stub-card">
              <div class="preview-v09-card-head">
                <div>
                  <h4${keyAttr(['text'])}>Stub components</h4>
                  <p${keyAttr(['textSecondary'])}>Low-confidence keys parked here until app mapping is confirmed.</p>
                </div>
              </div>

              <div class="preview-v09-stub-grid">
                <article class="preview-v09-stub"${keyAttr(['tertiary'])}>
                  <span class="preview-v09-stub-label">Stub surface</span>
                  <strong>tertiary</strong>
                </article>
                <article class="preview-v09-stub"${keyAttr(['tertiaryText'])}>
                  <span class="preview-v09-stub-label">Stub text</span>
                  <strong>tertiaryText</strong>
                </article>
                <article class="preview-v09-stub preview-v09-stub-alert"${keyAttr(['alert'])}>
                  <span class="preview-v09-stub-label">Stub fill</span>
                  <strong>alert</strong>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function buildV08PreviewMarkup() {
  return `
    <section class="preview-showcase preview-v08"${keyAttr(['backgroundColor'])}>
      <div class="preview-legacy-device">
        <span class="preview-banner"${keyAttr(['accentColorLight', 'accentTextColor'])}>accentColorLight + accentTextColor</span>

        <article class="preview-legacy-card"${keyAttr(['foregroundColor', 'borderColor'])}>
          <div class="preview-legacy-top">
            <div class="preview-legacy-copy">
              <span class="preview-legacy-supertitle"${keyAttr(['supertitleTextColor'])}>supertitleTextColor</span>
              <h4${keyAttr(['titleTextColor'])}>Paperback .8 legacy keys</h4>
              <p class="preview-legacy-subtitle"${keyAttr(['subtitleTextColor'])}>Legacy button, border, and text tokens are rendered from the loaded theme.</p>
            </div>
            <div class="preview-button-row">
              <button type="button" class="preview-button preview-button-normal"${keyAttr(['buttonNormalBackgroundColor', 'buttonNormalBorderColor', 'buttonNormalTextColor'])}>buttonNormal*</button>
              <button type="button" class="preview-button preview-button-selected"${keyAttr(['buttonSelectedBackgroundColor', 'buttonSelectedBorderColor', 'buttonSelectedTextColor'])}>buttonSelected*</button>
            </div>
          </div>

          <div class="preview-legacy-notes"${keyAttr(['separatorColor'])}>
            <p class="preview-legacy-body"${keyAttr(['bodyTextColor'])}>titleTextColor / subtitleTextColor / bodyTextColor define this text stack.</p>
            <div class="preview-accent-rail"${keyAttr(['accentColor', 'accentColorLight'])}></div>
            <p class="preview-legacy-subtitle"${keyAttr(['subtitleTextColor'])}>accentColor and accentColorLight now have dedicated placeholder treatments.</p>
          </div>
        </article>

        <div class="preview-overlay"${keyAttr(['overlayColor'])}>
          <span${keyAttr(['accentTextColor'])}>overlayColor with separatorColor and borderColor around the content shell.</span>
        </div>
      </div>
    </section>
  `;
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

function renderPreview() {
  if (!previewTemplateLoaded || !theme) return;

  const root = previewContent.querySelector('[data-preview-root]');
  const badge = previewContent.querySelector('[data-preview-family-badge]');
  const note = previewContent.querySelector('[data-preview-family-note]');
  const stage = previewContent.querySelector('[data-preview-stage]');
  const summary = previewContent.querySelector('[data-preview-token-summary]');
  const family = detectPreviewFamily();

  if (!root || !badge || !note || !stage || !summary) return;

  applyPreviewVariables(root);

  if (family === 'v09') {
    badge.textContent = '.9 semantic keys';
    note.textContent = 'Detected the Paperback .9 token set. Semantic placeholders are bound directly to the active light/dark color values.';
    stage.innerHTML = buildV09PreviewMarkup();
  } else if (family === 'v08') {
    badge.textContent = '.8 legacy keys';
    note.textContent = 'Detected the Paperback .8 token set. Legacy button and text roles are rendered as temporary building blocks from the loaded keys.';
    stage.innerHTML = buildV08PreviewMarkup();
  } else {
    badge.textContent = 'Custom keys';
    note.textContent = 'Showing a generic preview shell because the imported theme uses a non-standard key set.';
    stage.innerHTML = buildFallbackPreviewMarkup();
  }

  summary.textContent = `${colorEntries.length} keys in ${mode} mode`;
  buildPreviewTokens();
}

editorContent.addEventListener('mouseover', handleLinkedHoverStart);
editorContent.addEventListener('mouseout', handleLinkedHoverEnd);
previewContent.addEventListener('mouseover', handleLinkedHoverStart);
previewContent.addEventListener('mouseout', handleLinkedHoverEnd);

// ── Local Persistence ──────────────────────────────────

const STORAGE_KEY = 'theme-editor-state';
const PREFS_KEY = 'theme-editor-prefs';

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

// ── Reset Dropdown ──────────────────────────────────────

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
  // Update active state in dropdown
  resetDropdown.querySelectorAll('.split-dropdown-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
  // Load the newly selected default theme
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
  savePrefs();
}

function setGlobalLinked(linked) {
  globalLinked = linked;
  // Clear individual overrides so everything follows global
  for (const key in linkedState) delete linkedState[key];
  btnGlobalLink.classList.toggle('linked', globalLinked);
  btnGlobalLink.title = globalLinked ? 'All colors linked (light = dark)' : 'Colors independent';
  // Update all per-row link buttons
  colorEntries.forEach(c => updateLinkButton(c.name));
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
  renderPreview();
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
  renderPreview();
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
  const label = themeManifest[selectedDefaultId]?.label || 'defaults';
  if (!confirm(`Reset all colors to ${label}?`)) return;

  theme = JSON.parse(JSON.stringify(defaultTheme));
  colorEntries = detectColors(theme);
  // Clear link overrides and reset global
  globalLinked = true;
  for (const key in linkedState) delete linkedState[key];
  btnGlobalLink.classList.toggle('linked', globalLinked);
  btnGlobalLink.title = 'All colors linked (light = dark)';
  buildEditor();
  clearSavedState();
  renderPreview();
  savePrefs();
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
  // Reset link state for fresh import
  globalLinked = true;
  for (const key in linkedState) delete linkedState[key];
  btnGlobalLink.classList.toggle('linked', globalLinked);
  btnGlobalLink.title = 'All colors linked (light = dark)';
  buildEditor();
  saveState();
  renderPreview();
  savePrefs();
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
    await loadPreviewTemplate();

    // Load theme manifest and build dropdown
    themeManifest = await loadManifest();
    if (selectedDefaultId >= themeManifest.length) selectedDefaultId = 0;
    buildResetDropdown();
    updateResetLabel();

    // Load selected default theme for the reset feature
    const defaultData = await loadThemeFile(themeManifest[selectedDefaultId].file);
    defaultTheme = JSON.parse(JSON.stringify(defaultData));

    // Use saved state if available, otherwise default
    const saved = loadSavedState();
    theme = saved || JSON.parse(JSON.stringify(defaultData));
    colorEntries = detectColors(theme);
    console.log(`Loaded ${colorEntries.length} colors${saved ? ' (from saved state)' : ' (defaults)'}`);

    // Mode, preview, and link state already restored from _savedPrefs at top level
    setMode(mode);
    buildEditor();
    renderPreview();
  } catch (err) {
    console.error('Failed to initialize editor:', err);
  }
}

init();
