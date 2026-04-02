export default {
  id: 'v09',
  keys: [
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
  ],
  title: '.9 semantic keys',
  description: 'Mapped Paperback .9 components are bound directly to the active light/dark color values.',
  render(context) {
    const { colorEntries, mode, keyAttr } = context;

    return {
      summaryText: `${colorEntries.length} keys in ${mode} mode`,
      stageHtml: `
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
      `
    };
  }
};
