export default {
  id: 'v08',
  keys: [
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
  ],
  title: 'Paperback 0.8',
  description: 'Button, text and surface samples using Paperback 0.8 color keys. App locations have not been mapped yet.',
  render(context) {
    const { colorEntries, mode, keyAttr } = context;

    return {
      summaryText: `${colorEntries.length} keys in ${mode} mode`,
      stageHtml: `
        <section class="preview-showcase preview-v08"${keyAttr(['backgroundColor'])}>
          <div class="preview-legacy-device">
            <span class="preview-banner"${keyAttr(['accentColorLight', 'accentTextColor'])}>Accent label</span>

            <article class="preview-legacy-card"${keyAttr(['foregroundColor', 'borderColor'])}>
              <div class="preview-legacy-top">
                <div class="preview-legacy-copy">
                  <span class="preview-legacy-supertitle"${keyAttr(['supertitleTextColor'])}>Supertitle</span>
                  <h4${keyAttr(['titleTextColor'])}>Theme preview</h4>
                  <p class="preview-legacy-subtitle"${keyAttr(['subtitleTextColor'])}>Titles, descriptions and button states.</p>
                </div>
                <div class="preview-button-row">
                  <button type="button" class="preview-button preview-button-normal"${keyAttr(['buttonNormalBackgroundColor', 'buttonNormalBorderColor', 'buttonNormalTextColor'])}>Normal</button>
                  <button type="button" class="preview-button preview-button-selected"${keyAttr(['buttonSelectedBackgroundColor', 'buttonSelectedBorderColor', 'buttonSelectedTextColor'])}>Selected</button>
                </div>
              </div>

              <div class="preview-legacy-notes"${keyAttr(['separatorColor'])}>
                <p class="preview-legacy-body"${keyAttr(['bodyTextColor'])}>Body text with a section divider.</p>
                <div class="preview-accent-rail"${keyAttr(['accentColor', 'accentColorLight'])}></div>
                <p class="preview-legacy-subtitle"${keyAttr(['subtitleTextColor'])}>Accent colors</p>
              </div>
            </article>

            <div class="preview-overlay"${keyAttr(['overlayColor'])}>
              <span${keyAttr(['accentTextColor'])}>Overlay sample</span>
            </div>
          </div>
        </section>
      `
    };
  }
};
