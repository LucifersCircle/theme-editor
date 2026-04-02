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
  title: '.8 legacy keys',
  description: 'Detected the Paperback .8 token set. Legacy button and text roles are rendered as temporary building blocks from the loaded keys.',
  render(context) {
    const { colorEntries, mode, keyAttr } = context;

    return {
      summaryText: `${colorEntries.length} keys in ${mode} mode`,
      stageHtml: `
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
      `
    };
  }
};
