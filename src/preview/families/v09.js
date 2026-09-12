// Roles are scoped to observed Paperback 0.9-r187 elements. See the evidence ledger.
const coverage = {
  accent: { status: 'confirmed', note: 'Discover/source chevrons, details authors, NEW badge fill, chapter progress and Complete labels, and reader settings track.', evidence: ['E01', 'E02', 'E04', 'E05', 'E06', 'E07', 'E11'] },
  alert: { status: 'unresolved', note: 'No reliable app placement observed. No alert or destructive-action pairing is assumed.', evidence: [] },
  alertText: { status: 'confirmed', note: 'NEW badge text, confirmed by an alertText-only A/B probe; its fill is accent.', evidence: ['E05', 'E10'] },
  background: { status: 'confirmed', note: 'Discover/search canvas, Filters and reader settings backgrounds, and reader gutter.', evidence: ['E01', 'E02', 'E03', 'E06', 'E09'] },
  border: { status: 'confirmed', note: 'Outlines of floating reader controls. Their material fills are separately unresolved.', evidence: ['E06'] },
  error: { status: 'confirmed', note: 'Excluded filter-tag fill. The app adds translucency; the preview uses approximate 50% fill opacity.', evidence: ['E08'] },
  foreground: { status: 'confirmed', note: 'Quick Search source row, neutral filter chips/groups, details description, reader settings groups, sidebar selection, and selected chapter-row fill.', evidence: ['E02', 'E03', 'E04', 'E06', 'E12'] },
  overlay: { status: 'unresolved', note: 'No reliable app placement observed. The alpha study demonstrates raw compositing only.', evidence: ['E09'] },
  primary: { status: 'confirmed', note: 'Details Continue button fill, paired with primaryText.', evidence: ['E04'] },
  primaryText: { status: 'confirmed', note: 'Details Continue button text, paired with primary.', evidence: ['E04'] },
  secondary: { status: 'confirmed', note: 'Details Bookshelf and Track action fills. Theme alpha is preserved over an illustrative backdrop.', evidence: ['E04'] },
  secondaryText: { status: 'confirmed', note: 'Details Bookshelf and Track action foregrounds; distinct from textSecondary.', evidence: ['E04'] },
  separator: { status: 'confirmed', note: 'Details description and chapter-section boundaries, not every chapter-row divider.', evidence: ['E04', 'E05'] },
  success: { status: 'confirmed', note: 'Included filter-tag fill. The app adds translucency; the preview uses approximate 50% fill opacity.', evidence: ['E07'] },
  tertiary: { status: 'unresolved', note: 'No reliable app placement observed. No third surface is assumed.', evidence: [] },
  tertiaryText: { status: 'unresolved', note: 'No reliable app placement observed. This is distinct from textTertiary.', evidence: [] },
  text: { status: 'confirmed', note: 'Observed titles, filter labels, details description, chapter titles, and reader/settings labels.', evidence: ['E01', 'E02', 'E03', 'E04', 'E05', 'E06'] },
  textSecondary: { status: 'confirmed', note: 'Manga types, source version, filter counts, details tags, chapter group/date, and reader subtitle/help.', evidence: ['E01', 'E02', 'E03', 'E04', 'E05', 'E06'] },
  textTertiary: { status: 'confirmed', note: 'Chapter-row language text and the observed Home empty-state icon; no general tertiary-text role assumed.', evidence: ['E05', 'E13'] },
  warning: { status: 'unresolved', note: 'No reliable app placement observed. No warning component is assumed.', evidence: [] }
};

export default {
  id: 'v09',
  keys: Object.keys(coverage),
  coverage,
  title: 'Paperback 0.9',
  description: 'Observed color roles in a compact component sandbox. Native materials and app-added opacity are labeled where their exact rendering remains unresolved.',
  render(context) {
    const { colorEntries, mode, keyAttr } = context;
    const modeKey = mode === 'dark' ? 'darkColor' : 'lightColor';
    const available = new Set(colorEntries.filter(entry => {
      const color = entry[modeKey];
      // Paperback exports can contain extended-range RGB values. Rendering clamps
      // those channels; keep the original floats and validate alpha separately.
      return color && ['red', 'green', 'blue', 'alpha'].every(channel => Number.isFinite(color[channel]))
        && color.alpha >= 0 && color.alpha <= 1;
    }).map(entry => entry.name));

    // Skip incomplete scenes instead of silently substituting a different key or mode.
    const scene = (id, title, note, requiredKeys, html) => {
      const missing = requiredKeys.filter(key => !available.has(key));
      return `
        <section class="preview-v09-scene" aria-labelledby="preview-v09-${id}">
          <header class="preview-v09-caption">
            <h4 id="preview-v09-${id}">${title}</h4>
            <p>${note}</p>
          </header>
          ${missing.length
            ? `<p class="preview-v09-missing">This sample needs valid ${mode}-mode values for: <strong>${missing.join(', ')}</strong>.</p>`
            : html}
        </section>`;
    };

    const discovery = scene('discovery', 'Discover / Search',
      'Continuous canvas, content titles, and a Quick Search source row. Artwork is illustrative.',
      ['background', 'foreground', 'text', 'textSecondary', 'accent'], `
        <div class="preview-v09-sample preview-v09-canvas"${keyAttr(['background'])}>
          <div class="preview-v09-row">
            <strong class="preview-v09-text"${keyAttr(['text'])}>Discover</strong>
            <span class="preview-v09-accent preview-v09-chevron"${keyAttr(['accent'])} aria-hidden="true">›</span>
          </div>
          <div class="preview-v09-results">
            <div class="preview-v09-result">
              <div class="preview-v09-artwork" data-linked-keys="" aria-label="Illustrative cover artwork"><span>01</span></div>
              <strong class="preview-v09-text"${keyAttr(['text'])}>The Paper Garden</strong>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Manga</span>
            </div>
            <div class="preview-v09-result">
              <div class="preview-v09-artwork preview-v09-artwork-alt" data-linked-keys="" aria-label="Illustrative cover artwork"><span>02</span></div>
              <strong class="preview-v09-text"${keyAttr(['text'])}>Across the Bay</strong>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Manhwa</span>
            </div>
          </div>
          <div class="preview-v09-group preview-v09-row"${keyAttr(['foreground'])}>
            <div class="preview-v09-copy">
              <strong class="preview-v09-text"${keyAttr(['text'])}>Extension</strong>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Version 1.0</span>
            </div>
            <span class="preview-v09-accent preview-v09-chevron"${keyAttr(['accent'])} aria-hidden="true">›</span>
          </div>
        </div>`);

    const filters = scene('filters', 'Filters',
      'Neutral, included, and excluded tags. Included/excluded fills use approximate 50% app opacity × theme alpha over background; labels keep their own alpha.',
      ['background', 'foreground', 'text', 'textSecondary', 'success', 'error'], `
        <div class="preview-v09-sample preview-v09-canvas"${keyAttr(['background'])}>
          <div class="preview-v09-group preview-v09-row"${keyAttr(['foreground'])}>
            <strong class="preview-v09-text"${keyAttr(['text'])}>Tags</strong>
            <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>2 items</span>
          </div>
          <div class="preview-v09-tags">
            <span class="preview-v09-filter-chip preview-v09-filter-neutral"${keyAttr(['foreground'])}>
              <span class="preview-v09-text"${keyAttr(['text'])}>Adventure · neutral</span>
            </span>
            <span class="preview-v09-filter-chip preview-v09-filter-include"${keyAttr(['success', 'background'])}>
              <span class="preview-v09-text"${keyAttr(['text'])}>+ Fantasy · included</span>
            </span>
            <span class="preview-v09-filter-chip preview-v09-filter-exclude"${keyAttr(['error', 'background'])}>
              <span class="preview-v09-text"${keyAttr(['text'])}>− Horror · excluded</span>
            </span>
          </div>
          <div class="preview-v09-group"${keyAttr(['foreground'])}>
            <span class="preview-v09-text"${keyAttr(['text'])}>Official Translation</span>
          </div>
        </div>`);

    const details = scene('details', 'Details',
      'Artwork / material is illustrative. The foreground tint and native backdrop are approximated; exact app blend unmeasured. Tint opacity is 50% × theme alpha; text alpha is unchanged.',
      ['text', 'accent', 'primary', 'primaryText', 'secondary', 'secondaryText', 'foreground', 'textSecondary', 'separator'], `
        <div class="preview-v09-sample preview-v09-illustrative-material">
          <div class="preview-v09-details-heading">
            <div class="preview-v09-artwork preview-v09-small-cover" data-linked-keys="" aria-label="Illustrative cover artwork"><span>01</span></div>
            <div class="preview-v09-copy">
              <strong class="preview-v09-text preview-v09-title"${keyAttr(['text'])}>The Paper Garden</strong>
              <span class="preview-v09-accent"${keyAttr(['accent'])}>A. Mori · Author</span>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>SAFE · ONGOING</span>
            </div>
          </div>
          <div class="preview-v09-actions">
            <span class="preview-v09-continue"${keyAttr(['primary', 'primaryText'])}>
              <span class="preview-v09-primary-text"${keyAttr(['primaryText'])}>Continue</span>
            </span>
            <span class="preview-v09-secondary-action"${keyAttr(['secondary', 'secondaryText'])}>
              <span class="preview-v09-secondary-text"${keyAttr(['secondaryText'])}>Bookshelf</span>
            </span>
            <span class="preview-v09-secondary-action"${keyAttr(['secondary', 'secondaryText'])}>
              <span class="preview-v09-secondary-text"${keyAttr(['secondaryText'])}>Track</span>
            </span>
          </div>
          <div class="preview-v09-section-rule"${keyAttr(['separator'])}></div>
          <div class="preview-v09-description-group preview-v09-copy"${keyAttr(['foreground'])}>
            <p class="preview-v09-text"${keyAttr(['text'])}>A young illustrator finds a garden growing between the pages of an unfinished book.</p>
            <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Fantasy · Adventure · Slice of life</span>
          </div>
        </div>`);

    const chapters = scene('chapters', 'Chapters',
      'NEW, in progress, completed, and selected. Completed content, including its accent Complete label, uses approximate 50% app opacity. Selected foreground tint uses approximate 50% × theme alpha with unchanged text alpha; its exact app blend is unmeasured. Backdrop material is illustrative.',
      ['text', 'textSecondary', 'textTertiary', 'accent', 'alertText', 'separator', 'foreground'], `
        <div class="preview-v09-sample preview-v09-illustrative-material">
          <div class="preview-v09-row"><strong class="preview-v09-text"${keyAttr(['text'])}>Chapters</strong></div>
          <div class="preview-v09-section-rule"${keyAttr(['separator'])}></div>
          <div class="preview-v09-chapter">
            <span class="preview-v09-language"${keyAttr(['textTertiary'])}>en</span>
            <div class="preview-v09-copy">
              <strong class="preview-v09-text"${keyAttr(['text'])}>Chapter 15 · A new leaf</strong>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Paper Press · 2 days ago</span>
            </div>
            <span class="preview-v09-new"${keyAttr(['accent', 'alertText'])}><span${keyAttr(['alertText'])}>NEW</span></span>
          </div>
          <div class="preview-v09-chapter">
            <span class="preview-v09-language"${keyAttr(['textTertiary'])}>en</span>
            <div class="preview-v09-copy">
              <strong class="preview-v09-text"${keyAttr(['text'])}>Chapter 14 · The gate</strong>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Paper Press · 1 week ago</span>
              <span class="preview-v09-accent"${keyAttr(['accent'])}>Page: 1</span>
            </div>
          </div>
          <div class="preview-v09-chapter preview-v09-completed" aria-label="Completed chapter; approximate app opacity">
            <span class="preview-v09-language"${keyAttr(['textTertiary'])}>en</span>
            <div class="preview-v09-copy">
              <strong class="preview-v09-text"${keyAttr(['text'])}>Chapter 13 · First steps</strong>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Paper Press · 2 weeks ago</span>
              <span class="preview-v09-accent"${keyAttr(['accent'])}>Complete</span>
            </div>
          </div>
          <div class="preview-v09-chapter preview-v09-chapter-selected"${keyAttr(['foreground'])} aria-label="Selected chapter">
            <span class="preview-v09-language"${keyAttr(['textTertiary'])}>en</span>
            <div class="preview-v09-copy">
              <strong class="preview-v09-text"${keyAttr(['text'])}>Chapter 12 · A discovery</strong>
              <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Paper Press · 3 weeks ago</span>
            </div>
          </div>
        </div>`);

    const reader = scene('reader', 'Reader',
      'The gutter uses background; page artwork stays independent. Floating fills approximate the light/dark system material, chosen by mode, with border outlines. The exact native material formula is unresolved.',
      ['background', 'border', 'text', 'textSecondary'], `
        <div class="preview-v09-reader-sample">
          <div class="preview-v09-reader-gutter"${keyAttr(['background'])}></div>
          <div class="preview-v09-reader-media" aria-label="Illustrative page artwork, independent of theme">
            <div class="preview-v09-media-panel"></div>
            <div class="preview-v09-media-panels"><div></div><div></div></div>
          </div>
          <div class="preview-v09-reader-title preview-v09-native-material"${keyAttr(['border'])}>
            <strong class="preview-v09-text"${keyAttr(['text'])}>Chapter 15</strong>
            <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>The Paper Garden</span>
          </div>
          <div class="preview-v09-reader-progress preview-v09-native-material"${keyAttr(['border'])} aria-label="Illustrative native progress control"></div>
          <div class="preview-v09-reader-settings-control preview-v09-native-material"${keyAttr(['border'])} aria-label="Illustrative native settings control"><span data-linked-keys="" aria-hidden="true">≡</span></div>
        </div>`);

    const settings = scene('settings', 'Reader settings',
      'Grouped rows and help text. The track uses accent; the white thumb is an illustrative native control, with no theme-key assignment.',
      ['background', 'foreground', 'text', 'textSecondary', 'accent'], `
        <div class="preview-v09-sample preview-v09-canvas"${keyAttr(['background'])}>
          <div class="preview-v09-group preview-v09-copy"${keyAttr(['foreground'])}>
            <span class="preview-v09-text"${keyAttr(['text'])}>Maximum page width</span>
            <span class="preview-v09-subtext"${keyAttr(['textSecondary'])}>Limit the width of reader pages</span>
            <div class="preview-v09-slider"${keyAttr(['accent'])}><span data-linked-keys="" aria-label="Illustrative white native thumb"></span></div>
          </div>
          <div class="preview-v09-group preview-v09-row"${keyAttr(['foreground'])}>
            <span class="preview-v09-text"${keyAttr(['text'])}>Reading direction</span>
            <span class="preview-v09-accent"${keyAttr(['accent'])}>Vertical</span>
          </div>
        </div>`);

    const alphaStudy = scene('alpha-study', 'Alpha study — app placement unconfirmed',
      'A raw color-compositing study, not an observed Paperback screen. overlay is drawn at its stored alpha over the named base, without additional opacity.',
      ['overlay', 'background', 'foreground'], `
        <div class="preview-v09-alpha-grid">
          <figure>
            <div class="preview-v09-alpha-background"${keyAttr(['background'])}>
              <div class="preview-v09-alpha-layer"${keyAttr(['overlay', 'background'])}></div>
            </div>
            <figcaption>overlay over background</figcaption>
          </figure>
          <figure>
            <div class="preview-v09-alpha-foreground"${keyAttr(['foreground'])}>
              <div class="preview-v09-alpha-layer"${keyAttr(['overlay', 'foreground'])}></div>
            </div>
            <figcaption>overlay over foreground</figcaption>
          </figure>
        </div>`);

    const confirmedCount = [...available].filter(key => coverage[key]?.status === 'confirmed').length;
    const unresolvedCount = available.size - confirmedCount;
    const unavailableCount = colorEntries.length - available.size;

    return {
      summaryText: `${colorEntries.length} loaded keys · ${mode} mode · ${confirmedCount} observed roles, ${unresolvedCount} unresolved${unavailableCount ? `, ${unavailableCount} unavailable in this mode` : ''}`,
      stageHtml: `<div class="preview-v09" data-preview-mode="${mode === 'dark' ? 'dark' : 'light'}">${discovery}${filters}${details}${chapters}${reader}${settings}${alphaStudy}</div>`
    };
  }
};
