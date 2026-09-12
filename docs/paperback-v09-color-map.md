# Paperback 0.9 color mapping research

This is an observation record for the Paperback 0.9 preview. It is intentionally narrower than a complete theme specification. A color key's name, the old browser preview, and a visual match between default colors do not establish its role in Paperback.

## Environment and method

- App: **Paperback v0.9-r187**, running in its native iPad-on-Mac window.
- Baseline: the theme exported from the app to `/private/tmp/paperback-v09-original.pbcolors` was compared with `src/themes/default.pbcolors` and matched. The temporary export is not a committed research artifact.
- Probe: a temporary diagnostic theme derived from `src/themes/default.pbcolors`. Its palette and alpha values are recorded in the [twenty-key map](#twenty-key-map); individual probe changes and findings are recorded in the [screen evidence ledger](#screen-evidence-ledger). The diagnostic and probe files were removed after research; their definitions and findings are preserved here as text.
- Import path: Finder **Open With → Paperback**. The required import filename is `themeColors.pbcolors`.
- The diagnostic light and dark variants are deliberately identical. A match in this probe identifies a candidate key; it does **not** independently establish which mode the app selected or prove light/dark switching behavior.
- The original system appearance was **Dark** during E01–E11. E12 temporarily changed system appearance to **Light**; E13 repeated major views in Light after a verified full app restart. E14 then restored the real default theme, checked actual Light/Dark relationships, and restored original **Dark** appearance. Identical diagnostic variants establish key roles across appearances; E14 supplies separate evidence for distinct default values and baseline translucency.
- Some already mounted views initially retained old text colors after import. Navigate away from the target view and back; fully quit and restart Paperback if values remain stale. E13/E14 explicitly repeat checks after restart. A partially refreshed view must not be used to infer mixed bindings.
- Screenshots currently exist as captures in the research conversation. Evidence IDs below identify screen and state; no saved screenshot file paths are claimed.

## Confidence labels

- **Confirmed**: the refreshed app visibly uses the unique diagnostic value on the specified element, or a controlled single-key A/B change establishes that element's dependency despite blending. Confirmation applies to that exact observed element and state, not every similarly named component. A confirmed key dependency does not establish an exact opacity or material formula.
- **Probable**: an observation suggests the key, but material blending, state, retained UI, or another cause remains plausible. A targeted A/B probe is needed before the preview treats it as established.
- **Unresolved**: no reliable use has been observed yet. Key names and old preview assignments are not evidence.

Changing one key at a time while holding the others fixed is the preferred follow-up where colors are blended or the responsible layer is unclear. Default alpha values must be restored in follow-up probes before reproducing translucent surfaces.

## Twenty-key map

The diagnostic alpha is 1 except for `overlay` (0.5). The `secondary` and `separator` probes deliberately override their much lower default alpha for identification. RGB values in this table describe the diagnostic fixture, not suggested theme colors.

As of E14, **15 of 20 keys have at least one confirmed component dependency; five remain unresolved**. `alert`, `warning`, `tertiary`, `tertiaryText`, and `overlay` should be shown only as raw color coverage, without invented app roles. Major diagnostic bindings have been observed across original Dark and temporary Light system appearance, and E14 separately checks real default light/dark color relationships and stored secondary/separator translucency. Exact app-added material/opacity treatments for the description, filter states, selections, and completed rows remain unmeasured. The research does not establish that the unresolved keys have no uses elsewhere.

| Key | Diagnostic RGB | Probe α | Default α, light / dark | Observed app element or pending role | Status | Evidence and limits |
| --- | --- | --- | --- | --- | --- | --- |
| `accent` | `#FF00A8` | 1 | 1 / 1 | Discover/source chevrons; filter Done circle; details authors and state icons; NEW badge fill and inline “Page: 1” / “Complete” labels; reader settings switch-on, slider track, and dropdown values; Theme/General Reload, Export, and Reset action labels. | Confirmed | E01–E11; preserve each exact use. Complete has a magenta label, not a success-colored fill. The filter checkmark and native navigation materials remain unresolved. |
| `alert` | `#8A00FF` | 1 | 1 / 1 | No reliable component use recorded across inspected views. | Unresolved | Candidate selection fill was resolved to `foreground` by E12; NEW uses `accent` + `alertText`. No inspected, safely reached component isolated `alert`. This is not a claim that the app never uses it. |
| `alertText` | `#B7FF00` | 1 | 1 / 1 | NEW badge text on `accent` fill. | Confirmed | E10 controlled A/B: changing only alertText RGB to black changed NEW text from lime to black while its magenta fill remained. No general `alert` fill/text pairing established. |
| `background` | `#10233F` | 1 | 1 / 1 | Continuous Discover/search content canvas; Filters, reader settings, and Manage Title sheet backgrounds; reader top gutter and chapter-end bar. | Confirmed | E01–E03, E06, E09, E13. E04 details has an unresolved cover-derived backdrop. The reader's swipe-up Chapter List sheet in Light (E13) had a native white background, not this navy key. |
| `border` | `#00FFFF` | 1 | 1 / 1 | Thin outlines around floating reader top strip, side progress, and settings button. | Confirmed | E06 Dark and E13 Light. Fills change with native appearance and are not confirmed `foreground`. No cyan border was visible in E03 filters. |
| `error` | `#FF003C` | 1 | 1 / 1 | Excluded filter-tag fill. | Confirmed | E08 controlled A/B: changing only error RGB to yellow changed the excluded tag from muted red to translucent yellow; labels stayed `text`. App-added translucency is evident, but the exact multiplier is unmeasured. |
| `foreground` | `#5A189A` | 1 | 1 / 1 | Active sidebar selection and selected chapter-row fill; Quick Search source row; filter navigation rows, neutral tag chips, and Official Translation group; details description group; reader settings and Manage Title groups; Theme/General action rows. | Confirmed | E12 single-key A/B confirms selection fills; E14 default description tint appears translucent/material-like despite theme alpha 1. Exact added composition is unmeasured. No per-cover Discover card fill observed. |
| `overlay` | `#00C2FF` | 0.5 | ≈0.15 / ≈0.15 | No reliable component use recorded. Tested details, reader controls, and inspected sheets showed no red response to the overlay A/B. | Unresolved | E09: overlay-only red at alpha 0.5 did not tint the reopened details backdrop, shown/hidden reader controls, or inspected sheets/settings. Do not assign these surfaces or modal dimming to `overlay`; this is not proof the key is unused elsewhere. |
| `primary` | `#FF5A00` | 1 | 1 / 1 | Details Continue button fill. | Confirmed | E04; paired with `primaryText` in this button. |
| `primaryText` | `#00FF85` | 1 | 1 / 1 | Details Continue button text. | Confirmed | E04; mint text over orange `primary` fill. |
| `secondary` | `#0077FF` | 1 | ≈0.15 / ≈0.15 | Details Bookshelf and Track circular action fills. | Confirmed | E04 identifies fill; E14 real Light/Dark default shows translucent pale/pink fills with backdrop visible, consistent with stored alpha ≈0.15. Exact underlying cover/material stack remains unmeasured. |
| `secondaryText` | `#FF9DE2` | 1 | 1 / 1 | Details Bookshelf and Track circular action foregrounds. | Confirmed | E04 isolated diagnostic pair; E14 default pink-red foreground in Light and brighter pink foreground in Dark, over translucent `secondary`. Keep distinct from metadata key `textSecondary`. |
| `separator` | `#FFD60A` | 1 | ≈0.0980392 / ≈0.0980392 | Details description/header boundary and sticky chapter-section header boundary lines. | Confirmed | E04/E05 identify section boundaries; E14 default shows subtle/subdued lines consistent with stored alpha ≈0.098. Native per-chapter dividers were gray, not diagnostic yellow. |
| `success` | `#00FF3C` | 1 | 1 / 1 | Included filter-tag fill. | Confirmed | E07 controlled A/B: changing only success RGB to white changed the included tag from muted green to translucent light gray. App-added opacity/material affects the fill despite theme alpha 1; exact multiplier unmeasured. |
| `tertiary` | `#00A86B` | 1 | 1 / 1 | No reliable component use recorded across inspected views. | Unresolved | No dependable diagnostic green surface was observed across navigation, details, filters, reader, and settings, including restart. Do not assume a third card fill; unvisited/state-specific uses remain possible. |
| `tertiaryText` | `#D9B3FF` | 1 | 1 / 1 | No reliable component use recorded across inspected views. | Unresolved | No isolated lavender text role was observed; language and Home icon instead use distinct `textTertiary`. Other contexts may still use this key. |
| `text` | `#FFFFFF` | 1 | 1 / 1 | Discover/search titles, source row title, filter labels, details title/description, unread chapter titles, reader title, reader settings row labels, and Home empty-state title. | Confirmed | E01–E06 and E13 Light. Reader swipe-up Chapter List labels remain white over a native white sheet, producing low contrast. Native checkmarks/thumbs and search-field text are not automatically assigned to this key. |
| `textSecondary` | `#FFB000` | 1 | 1 / 1 | Discover/search manga types; source version; filter counts; details tags and SAFE/ONGOING labels; chapter scanlator/age; reader manga subtitle and the amber current-page index observed in E06; reader settings help; Home empty-state explanation. | Confirmed | E01–E06 and E13 Light. E09 separately observed a white reader page counter whose binding is unresolved; do not generalize to all counters. System gray section headings remain separate. |
| `textTertiary` | `#7DF9FF` | 1 | 1 / 1 | Chapter-row language label `en`; Home empty-state icon. | Confirmed | E05 language; E13 Light language and Home icon. No general tertiary text usage implied. |
| `warning` | `#FFF000` | 1 | 1 / 1 | No reliable component use recorded across inspected views. | Unresolved | No inspected, safely reached warning/status state yielded the diagnostic yellow role. Filter inclusion/exclusion isolated `success`/`error` instead. Other warning contexts remain possible. |

## Per-screen layer stacks

Arrows run from the underlying surface to the foreground content. Theme alpha remains part of each key. App-added opacity and native materials are separate, unmeasured contributions.

| Screen/component | Observed stack or pairing | Boundary of the claim |
| --- | --- | --- |
| Discover and search results | `background → text / textSecondary / accent`; independent cover artwork sits on the canvas. | No separate per-result `foreground` card established. |
| Quick Search source | `background → foreground → text / textSecondary / accent` | Applies to the source row. Native search field and navigation glass are separate. |
| Neutral filters and settings groups | `background → foreground → text / textSecondary`; reader setting controls add `accent`. | White native slider thumbs have no confirmed theme assignment. |
| Included/excluded filter tags | `background → success or error, with app-added translucency → text` | Fill translucency does not fade the label. Exact extra multiplier is unmeasured. |
| Details title/metadata | `cover-derived backdrop/material → text / accent / textSecondary` | Complete cover/material formula is unresolved. |
| Details actions | `cover-derived backdrop/material → primary → primaryText`; `cover-derived backdrop/material → secondary → secondaryText` | Original secondary alpha is about 0.15; neither action pair implies a tertiary pair. |
| Details description | `cover-derived backdrop/material → foreground tint → text / textSecondary` | Additional tint/material treatment is evident; exact blend is unmeasured. |
| Chapter section and rows | `cover-derived backdrop/material → separator at section boundary`; row content is `text / textSecondary / textTertiary`. | Native per-row dividers are not attributed to `separator`. |
| Chapter status/selection | `accent → alertText` for NEW; inline Page/Complete uses `accent`; completed content dims together. Selection adds a `foreground` tint below labels. | Completion and selected-fill opacity are approximations in the preview. |
| Reader | `background` gutter beside independent media; `media/gutter → native translucent material with border outline → text / textSecondary`. | Neither floating material nor reader dimming is confirmed `overlay` or `foreground`. |
| Reader swipe-up chapter sheet | `native white sheet → themed chapter labels/metadata/badge` in recorded Light appearance. | Explicit exception to the themed-background sheets; not represented by a guessed theme fill. |
| Overlay study in preview | Chosen `background` or `foreground → overlay` using stored alpha. | Mathematical compositing example only; no observed app placement is claimed. |

## Screen evidence ledger

### E01 — Extension Discover, refreshed after diagnostic import

**State:** Paperback v0.9-r187 native iPad-on-Mac window, Extension Discover populated with sections and cover cards. Navigate away and back after applying the diagnostic fixture; observations from the initially stale mounted view were rejected. Original system appearance was later confirmed as Dark; both fixture variants have identical colors.

**Evidence:** screenshot capture in the research conversation, identified by this screen and state. There is no committed screenshot asset for E01.

| Visible element | Observed appearance | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Content canvas behind cover cards and sections | Continuous navy `#10233F`. | `background` | Confirmed | Main content base layer. There is no visibly separate purple card background beneath each cover. |
| Manga titles | White `#FFFFFF`. | `text` | Confirmed | Text layer after remounting the view. No extra opacity established. |
| Section headings | White `#FFFFFF`. | `text` | Confirmed | Heading text in this Discover view only. |
| Manga-type subtitles | Amber `#FFB000`. | `textSecondary` | Confirmed | Secondary text beneath manga titles. |
| Section chevrons | Magenta `#FF00A8`. | `accent` | Confirmed | Navigation affordance at the section level. |
| Active sidebar selection | Purple resembling `#5A189A`. | At E01, candidate `foreground` | Initially probable; E12 confirms dependency | Native material may still alter the final appearance, but the E12 single-key A/B establishes the foreground dependency. |

**Unresolved in this screen:** sidebar base and selection compositing, native navigation chrome, and any additional opacity applied to text. E12 confirms the selection's `foreground` dependency; it does not measure the material formula. Cover artwork is content and is not evidence of theme-key use.

### E02 — Search, Quick Search source row and advanced results

**State:** Quick Search source listing, followed by a real advanced search through Extension for **Witch Hat Atelier** that returned two results. Diagnostic fixture active. Evidence is the screen capture/state recorded in the research conversation; no screenshot file path is claimed.

| Visible element | Observed appearance | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Quick Search source row | Purple `#5A189A` surface over navy canvas. | `foreground` over `background` | Confirmed | Source row group, not every search result card. |
| Source name (Extension) | White. | `text` | Confirmed | Row title. |
| Source version | Amber. | `textSecondary` | Confirmed | Source metadata. |
| Source chevron | Magenta. | `accent` | Confirmed | Source navigation affordance. |
| Advanced search result titles and type subtitles | White titles and amber subtitles directly on navy. | `text`, `textSecondary`, `background` | Confirmed | Two returned results; no purple surface beneath each result established. |
| Search placeholder, entered query, and navigation material | System-like white/gray text and derived blue glass. | None established | Unresolved | Does not reliably match the diagnostic palette; native rendering is a candidate explanation pending A/B. |

### E03 — Extension Filters and tag selection cycle

**State:** Filters sheet, including parent navigation groups, tags, and Official Translation. Action tag was cycled through neutral purple, green, and red states; a return to neutral was expected but not recorded as a confirmed state transition. No destructive operation was performed. Evidence is the conversation screen/state record.

| Visible element | Observed appearance | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Sheet canvas | Navy. | `background` | Confirmed | Base surface of this Filters sheet. |
| Parent navigation rows and neutral tag chips | Purple with white labels. | `foreground`, `text` | Confirmed | Neutral tags only; included/excluded states are separate. |
| Parent row values such as “0 items” | Amber. | `textSecondary` | Confirmed | Selection count metadata. |
| Done circular fill | Magenta. | `accent` | Confirmed | Checkmark is white, but its key is unresolved (`text` versus fixed system foreground). |
| Action tag include/exclude states | Muted green, then muted red. | At E03, no attribution established | Initially unresolved | Later E07 A/B confirms `success` for the included fill; E08 independently confirms `error` for the excluded fill. |
| Official Translation group and labels | Purple group, white labels. | `foreground`, `text` | Confirmed | Active check is cyan-ish and unresolved. |
| Potential lines/outlines | No diagnostic cyan border or yellow separator visible. | No use established here | Unresolved | This negative observation is limited to the inspected sheet, not all filter states. |

### E04 — Witch Hat Atelier details, freshly opened

**State:** Fresh manga details view under the diagnostic fixture. Evidence is the conversation screen/state record. The background is a **cover-derived blurred multicolor backdrop**, so this screen must not be represented as proof of a simple `foreground`-over-`background` layer pair.

| Visible element | Observed appearance | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Manga title | White. | `text` | Confirmed | Title foreground. |
| Authors | Magenta. | `accent` | Confirmed | Author names; no broader link style claim. |
| Continue button | Orange fill, mint text. | `primary`, `primaryText` | Confirmed | This action pair was observed together. |
| Bookshelf and Track circular actions | Blue fills and pink foregrounds. | `secondary`, `secondaryText` | Confirmed | Probe secondary is opaque; baseline is approximately 15% alpha and needs compositing validation. |
| Description group and paragraph | Purple surface, white paragraph. | `foreground`, `text` | Confirmed | Surface lies in front of cover-derived blurred content. Exact underlying theme/image/material composition remains unresolved. |
| Tags and SAFE / ONGOING labels | Amber. | `textSecondary` | Confirmed | State icons are separately magenta `accent`. |
| Description/header boundary and sticky chapter-header boundary | Yellow lines. | `separator` | Confirmed | Section boundaries. Probe is opaque; baseline alpha is approximately 9.8%. |
| Main backdrop | Blurred multicolor cover-derived appearance. | No complete theme-layer attribution | Unresolved | Do not collapse this into a solid `background` surface or invent an overlay contribution. |

### E05 — Witch Hat Atelier chapters and temporary row selection

**State:** Chapter list showing unread rows and NEW badges. A row's right-click **Select** action entered selection mode; **Done** exits that mode. No destructive operation was performed. Evidence is the conversation screen/state record. A native sort menu was inspected through accessibility text, but no screenshot was available and **no theme mapping is claimed for that menu**.

| Visible element | Observed appearance | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Unread chapter titles | White. | `text` | Confirmed | Read-row title styling has not yet been established. |
| Scanlator and upload age | Amber. | `textSecondary` | Confirmed | Chapter secondary metadata. |
| Language label `en` | Pale cyan. | `textTertiary` | Confirmed | Language text, not a whole chip fill. |
| NEW badge | Magenta fill, lime text. | `accent` fill; at E05, candidate `alertText` text | Confirmed fill; text later confirmed in E10 | E10 black-text A/B isolates the text dependency. No `alert` fill observed. |
| Section divider | Yellow. | `separator` | Confirmed | Keep separate from native per-row dividers. |
| Native per-row dividers | Gray rather than diagnostic yellow. | None established | Unresolved | Do not bind all chapter row rules to `separator`. |
| Selected chapter-row fill | Purple. | At E05, candidate `foreground` or `alert` | Initially unresolved; E12 confirms `foreground` | Bright-green foreground A/B resolves the dependency; blended selected-fill composition remains unmeasured. |

### E06 — Chapter 95 Gamma reader, controls and settings

**State:** Actual **Chapter 95 Gamma**, 12 pages, opened in the reader. Controls were inspected both hidden and visible, then reader settings were opened. Page artwork was unchanged by the diagnostic theme. Evidence is the conversation screen/state record.

| Visible element | Observed appearance | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Reader top gutter | Navy. | `background` | Confirmed | The gutter is distinct from the actual page image. |
| Page artwork | Original artwork, unaffected by fixture. | Content, no theme-key attribution | Confirmed distinction | Do not tint or replace the image to demonstrate a theme key. |
| Floating top strip, side progress, settings button | Thin cyan outlines around gray translucent/material fills. | `border` outlines | Confirmed outlines; unresolved fills | Gray fill does not match diagnostic `foreground`; material and underlying content need separate treatment. |
| Reader title | White. | `text` | Confirmed | Text in floating controls. |
| Manga subtitle and current page index | Amber. | `textSecondary` | Confirmed | Subtitle and progress foreground. |
| Settings sheet canvas and grouped rows | Navy canvas, purple grouped rows. | `background`, `foreground` | Confirmed | Sheet background and grouped surface are distinct layers. |
| Settings labels and help copy | White labels, amber help. | `text`, `textSecondary` | Confirmed | Section headings are separately system gray and unresolved. |
| Settings switch-on, slider track, dropdown values | Magenta. | `accent` | Confirmed | White switch/slider thumbs remain unresolved; no claim of `primaryText` or `text` on those native parts. |

**Unresolved in the reader:** floating material-fill composition, the role of `overlay`, system gray section headings, white native thumbs, and any selection-mode or transient error states not observed here.

### E07 — Single-key success A/B and in-progress chapter label

**Probe:** A temporary `success`-only theme, derived from the diagnostic fixture with **only `success` RGB changed from `#00FF3C` to `#FFFFFF`**, in both modes. Alpha remains 1. The Tags view was reopened after import, then Action was included. Evidence is the conversation screen/state record.

| Visible element | Controlled before / after | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Included Action tag fill | Muted green with diagnostic success; translucent light gray with white success. | `success` | Confirmed by A/B | Dependency established while the theme alpha stayed 1. Fill is composited over the background with additional app opacity/material; it looks translucent, but the exact formula or multiplier was not measured. |
| Neutral tags and labels | Neutral chips stayed purple; labels stayed white. | Existing `foreground` and `text` observations unchanged | Control observation | Supports isolation of the included-state fill change. |
| Chapter progress after returning from page 1 | NEW badge replaced by magenta “Page: 1” inline progress label; chapter title remained white. | `accent` progress label, `text` title | Confirmed observed colors | This is an in-progress chapter, not a completed/read state. No completed-title styling is inferred. |

The E03 uncertainty for the **included** tag fill is resolved by this probe. E08 separately tests the **excluded** fill; the `success` result alone does not establish the excluded key by analogy.

### E08 — Single-key error A/B on excluded tags

**Probe:** A temporary `error`-only theme, changing only `error` RGB to **`#FFFF00`** relative to the diagnostic fixture. The Tags screen was reopened after import. Clicking Action a second time entered the excluded state. Evidence is the conversation screen/state record.

| Visible element | Controlled before / after | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Excluded Action tag fill | Baseline muted red changed to translucent yellow. | `error` | Confirmed by A/B | Like the included `success` fill, the app adds translucency beyond the fixture's alpha 1. The exact opacity/material formula is not measured. |
| Tag label | Stayed white. | `text` | Confirmed unchanged foreground | The excluded fill and label use separate roles. No `alertText` use is inferred. |

Both included and excluded filter fills now have independent single-key evidence. This establishes their dependencies, not a shared exact opacity multiplier or every success/error component in the app.

### E09 — Single-key overlay A/B, reader end, and additional sheets

**Probe:** A temporary `overlay`-only theme, changing only `overlay` RGB to **`#FF0000`**, retaining probe alpha **0.5**. Witch Hat Atelier details and Chapter 95 were reopened after import. Reader controls were shown and hidden, tap-to-advance was exercised, and the chapter was scrolled to its end. Manage Title, Theme settings, and General settings were also inspected. Evidence is the conversation screen/state record.

| Screen or element | Observed result | Attribution | Confidence and limits |
| --- | --- | --- | --- |
| Reopened details backdrop | No red tint; cover-derived multicolor backdrop persists. | No demonstrated `overlay` contribution. | Negative evidence for this tested state, not a global unused-key conclusion. |
| Floating reader controls, shown and hidden | No red tint; floating fills remain gray/material-like. | No demonstrated `overlay` contribution. | Do not reproduce these fills using `overlay` based on the old preview. |
| Tap advance and chapter-end transition | No recorded red overlay effect. | None established for `overlay`. | Tested triggers do not establish an overlay role. |
| Chapter-end bar | Navy background and white label. | `background` for bar; white-label binding not isolated. | Background matches diagnostic; do not automatically attribute every white native label to `text`. |
| Reader page counter | Stayed white. | No key confirmed. | E06 recorded an amber current-page index. Keep the observations specific to their respective controls/states until that distinction is resolved. |
| Manage Title sheet | Navy sheet background, purple groups, white text, and magenta accents; no red scrim. | Observed `background`, `foreground`, `text`, `accent` roles. | No `overlay` assignment for modal dimming. Exact native materials remain separate. |
| Theme / General settings | No red scrim; Reload, Export, and Reset labels are magenta on purple rows. | `accent` actions on `foreground` groups. | System section headings remain gray and unmapped. |

**Read-state side effect and follow-up at E09:** The reader reached page 12 while inspecting chapter-end behavior. On returning, Continue pointed to Chapter 96. At this point Chapter 95's completed-row appearance had not yet been recorded and restoring its unread test state was pending. **E11 subsequently records the completed appearance and the Mark as unread restoration**, including the retained visit-history limitation.

**Conclusion limited to the probe:** `overlay` remains unresolved. None of the observed details backdrop, floating reader control fills, sheet dimming, or settings surfaces can be positively assigned to it from this test.

### E10 — Single-key alertText A/B on NEW badges

**Probe:** A temporary `alertText`-only theme, changing only `alertText` RGB to **`#000000`** relative to the diagnostic fixture. The details view was reentered after import. Evidence is the conversation screen/state record.

| Visible element | Controlled before / after | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| NEW text | Lime became black. | `alertText` | Confirmed by A/B | Text dependency isolated without changing the badge's fill. |
| NEW fill | Stayed magenta. | `accent` | Confirmed unchanged fill | The observed pair is `accent` + `alertText`; the key `alert` remains unresolved. |

### E11 — Completed chapter appearance and unread restoration

**State:** Chapter 95 Gamma was completed through the actual reader's page 12, then its chapter row was inspected. After recording the completed state, right-click **Mark as unread** restored the unread flag. Evidence is the conversation screen/state record.

| Visible element or action | Observed result | Attribution | Confidence and limits |
| --- | --- | --- | --- |
| Completed row title, group/scanlator, date/age, language, and Complete label | All visibly dimmer than an unread row; underlying hues appear retained. | Existing text/accent roles with a probable shared opacity reduction. | Dimming is observed; an opacity implementation is probable, and its exact alpha is unmeasured. Do not assert 0.5 as a measured value. |
| Inline Complete label | Magenta, dimmed with the row; no success-colored fill. | `accent` label. | Confirmed observed role; completion is not represented by the filter-state `success` fill. |
| Mark as unread | White title returned and Complete label disappeared. | Unread styling restored. | The unread flag was restored through the app's explicit action. |
| NEW after Mark as unread | NEW did not return. | Visit/history state is distinct from unread flag. | Visit history remains after this research read. Do not claim a complete restoration of the original NEW state. |

The completed row should be compared with the unread row as a **state treatment**, not as evidence that the app switches all its text to a different theme key. The probable shared-opacity explanation needs measurement before its multiplier can be claimed exact. This observation also does not establish an alternate light/dark treatment.

### E12 — Foreground A/B in Light appearance, sidebar and row selection

**Probe:** A temporary `foreground`-only theme, changing only `foreground` RGB to **`#A0FF00`** in both variants. System appearance was temporarily switched from its original Dark setting to **Light**. A chapter row was selected through right-click **Select**, then **Done** exited selection mode. Evidence is the conversation screen/state record.

| Visible element | Controlled before / after | Key attribution | Confidence | Layer and scope notes |
| --- | --- | --- | --- | --- |
| Active sidebar selection | Purple changed to bright green. | `foreground` | Confirmed by A/B | Resolves E01 candidate dependency. It does not establish the sidebar base or an exact native selection-material formula. |
| Selected chapter row | Selected fill changed to green with visible blending. | `foreground` | Confirmed by A/B | Resolves E05 ambiguity with `alert`. Additional opacity/material is unmeasured; do not show an arbitrary exact multiplier as established. |
| Exit selection | Done exited selection mode. | State cleanup | Recorded action | No destructive chapter operation was used in this probe. |

The app's original system appearance was Dark. At E12 the switch to Light was a temporary research change; **E14 later records verified restoration to Dark**.

### E13 — Full restart and Light-appearance diagnostic recheck

**State and restart control:** Restored the **baseline diagnostic fixture**, then fully quit Paperback. App inventory explicitly reported **`isRunning: false`** before launching it again into Home under Light system appearance. Revisited Search/source row, fresh Witch Hat Atelier details, chapter list, and the actual **Chapter 99 Alpha** reader. All reader settings were scrolled and inspected. This removes an already-mounted-view explanation for these recorded results. Both fixture variants still have identical values. Evidence is the conversation screen/state record.

| Screen or element | Observed appearance / behavior in Light | Key attribution | Confidence and limits |
| --- | --- | --- | --- |
| Home empty state | Pale-cyan icon, white title, amber explanation. | `textTertiary` icon, `text` title, `textSecondary` explanation. | Confirmed in Light; this exact empty state was not separately recorded in original Dark. |
| Search/source row and fresh details | Same theme semantic bindings as original Dark inspections. | Source `foreground` / `text` / `textSecondary` / `accent`; previously recorded details roles retained. | Confirms bindings across system appearances with identical diagnostic variants, not actual lightColor/darkColor selection. |
| Search field, navigation chrome, floating reader materials | Native surfaces are now light gray/white instead of the darker original-appearance materials despite the same palette. | Native/material appearance contribution established; no complete key formula. | Keep these surfaces separate from opaque theme groups. Search-field foreground attribution remains unresolved. |
| Reader outlines, title, and amber metadata | Cyan borders, white text, amber secondary text retained. | `border`, `text`, `textSecondary`. | Confirmed after restart in Light. No cyan overlay fill appeared. Counter-specific E06/E09 ambiguity is not resolved by this general observation. |
| Details chapter list | Title/group/date/language/badge bindings retained. | `text`, `textSecondary`, `textTertiary`, `accent`, `alertText`. | Confirmed Light semantic roles. Completed-row opacity multiplier remains unmeasured. |
| Full reader settings | Groups, labels, help, and accents retain previously observed roles across all inspected options. | `foreground`, `text`, `textSecondary`, `accent`. | More settings coverage, with no new mapping for the unresolved keys. Native headings/thumbs remain separate. |
| Reader Chapter List sheet, opened by swipe-up gesture | **Native white sheet background**; white chapter labels with low contrast; badges and metadata retain theme colors. | Theme text/metadata/badge roles retained; sheet base is not observed `background`. | This sheet must not be generalized from the navy reader-settings or Filters sheets. Its base did not match diagnostic navy. |
| Previously unresolved palette roles after full restart | No dependable `overlay`, `alert`, `warning`, `tertiary`, or `tertiaryText` use located. | Remain unresolved. | Restart and broader navigation do not justify guesses or a global unused-key claim. |

No Paperback 0.8 app behavior was researched or inferred in these observations.

### E14 — Real default Light/Dark validation and cleanup

**Theme and refresh control:** Imported `/private/tmp/paperback-v09-default/themeColors.pbcolors`, an exact copy of the original repository/default theme ([source default](../src/themes/default.pbcolors)). Some tag/text values initially stayed stale, so Paperback was **quit and relaunched again** before recording the restored-default observations. This is a real-default test with distinct light/dark values and original stored alpha, separate from the identical-variant diagnostic probes. Evidence is the conversation screen/state record.

| Screen / layer | Restored default in Light | Restored default in original Dark | What this establishes |
| --- | --- | --- | --- |
| Fresh Discover canvas and foregrounds | Light-gray background, dark title text, gray secondary text, red accents. | Not separately logged for Discover in this final pass; earlier Dark diagnostic roles remain recorded. | Actual Light default base/text/secondary/accent relationships after restart. Do not invent a same-screen Dark screenshot. |
| Fresh Witch Hat Atelier title and metadata | Light appearance checked alongside the details surfaces below. | White titles, gray metadata, red accents after returning to Dark and reopening details to refresh tags. | Default details relationships update with system appearance; stale tag/text observations are excluded. |
| Details secondary actions | Translucent pale fills show the backdrop; pink-red `secondaryText`. | Translucent pink fills with brighter `secondaryText`. | Stored `secondary.alpha` ≈0.15 produces visible translucency in both appearances; foreground remains a separate key. |
| Details section boundaries | Subtle lines with original stored alpha ≈0.098. | Subdued separators. | Default `separator` is far less opaque than the identification probe. Exact perceived color depends on the background layer. |
| Details description group | Light foreground tint over cover-derived backdrop. | Dark foreground tint over cover-derived backdrop. | `foreground` role persists, but apparent app-added translucency/material remains probable even with theme alpha 1; no exact formula is measured. |

**Cleanup recorded at E14:**

- Restored the **original default theme** in Paperback and restarted to clear stale colors.
- Restored System Appearance to **original Dark**, and verified Dark was selected.
- Restored Chapter 99 Alpha with **Mark as unread** after the reader research and closed its mini-reader. Chapter 95 Gamma had already been marked unread again in E11.
- Visit history remains for the chapters opened during research; Mark as unread does not recreate their former NEW state. Do not claim the visit history was erased.
- Paperback is left at the details view with the original default theme and original Dark appearance.

Browser preview implementation checks are recorded separately under [Implementation and browser validation](#implementation-and-browser-validation).

## Appearance validation matrix

This matrix separates **the same diagnostic key binding across system appearances** from **real default variant rendering**. E14 adds the default observations below; entries without a separately logged default observation are not silently promoted.

| Component or behavior | Original Dark diagnostic evidence | Light diagnostic evidence | Real default check (E14) | Result established / remaining limits |
| --- | --- | --- | --- | --- |
| Discover / Quick Search source row | E01/E02: navy base, purple source group, white title, amber metadata, magenta chevron. | E13: same source roles after restart. | Fresh Light Discover: light-gray base, dark title, gray metadata, red accent. | Diagnostic semantic roles persist; real Light default relationships confirmed in Discover. Exact native search-field foreground/material unresolved. |
| Details actions, description, metadata, section boundaries | E04: diagnostic pairs, purple description, amber labels, yellow section lines. | E13: same details bindings on fresh view. | Both appearances: translucent secondary fills with distinct secondaryText, subtle separators, appearance-dependent foreground tint; Dark white titles/gray metadata/red accent. | Default secondary/separator translucency observed. Cover/material formula and description's apparent added translucency remain unmeasured. |
| Chapter list titles, metadata, language, NEW | E05/E10: white/amber/cyan; accent fill + isolated alertText. | E13: bindings retained. | Details reopened in Dark to refresh tags; exact default chapter state series not separately logged. | Same diagnostic roles across appearances; exact completed-row opacity remains unmeasured. |
| Active sidebar and selected chapter fill | E01/E05: purple candidates. | E12: foreground-only green A/B changes both. | Isolated default-selection recheck not separately logged. | `foreground` dependency confirmed; exact selection blending/native composition unmeasured. |
| Reader floating outlines and labels | E06: cyan border, white title, amber metadata; darker materials. | E13: same key colors, lighter gray/white materials. | Chapter 99 research/cleanup recorded; no separate default floating-color ledger claimed. | Native materials respond independently to appearance. Full material formula and counter-specific attribution remain unresolved. |
| Reader settings groups and controls | E06: purple/white/amber/magenta roles. | E13: same roles, all options scrolled. | Not separately logged after default restoration. | Same diagnostic bindings; native section-heading/thumb colors remain unresolved. |
| Home empty state | Not separately recorded. | E13: cyan icon, white title, amber explanation. | Not separately logged. | Light diagnostic `textTertiary`/`text`/`textSecondary` roles only. |
| Swipe-up reader Chapter List sheet base | Not recorded. | E13: native white base and white themed labels. | Not separately logged. | Explicit exception to theme-background sheets; Dark/native/default comparison remains unrecorded. |
| Filter include / exclude translucency | E07/E08 independent success/error A/B. | Not separately retested. | Default state series not separately logged. | Dependencies confirmed with app-added translucency; exact multiplier and Light comparison remain unmeasured. |
| Unresolved keys | Broad navigation and overlay negative test. | Full restart did not locate use. | No new assignment supported by restored defaults. | Five remain unresolved; targeted evidence only, no guessed roles or global unused-key claim. |

**Research state:** Original default theme and original Dark appearance are restored and verified; both research chapters are marked unread again, with visit history retained. Real default appearance relationships and baseline translucency are checked as listed. Exact app-added opacity/material formulas remain unmeasured.

## Why five keys remain unresolved

The reviewed areas include Discover, source/search results, Filters/tags, details/chapter states, reader controls/settings/chapter-end and swipe-up chapter list, Manage Title, and Theme/General settings, plus a full restart under the baseline diagnostic fixture. The following are limits of these inspected states, **not assertions that the keys are unused throughout Paperback**.

| Key | Why no supported component mapping is recorded | Preview treatment |
| --- | --- | --- |
| `alert` | No safely reached inspected component isolated its diagnostic purple. Selection candidates were resolved to `foreground`; NEW uses `accent` + `alertText`. A key name does not establish a destructive/alert role. | Raw swatch only. |
| `warning` | No observed warning/status state matched its diagnostic yellow; the accessible filter status states instead isolated `success` and `error`. No artificial failure or destructive action was needed to force a role. | Raw swatch only. |
| `tertiary` | No dependable diagnostic green surface was located in the reviewed screens or after restart. A third card surface would be an invention. | Raw swatch only. |
| `tertiaryText` | No isolated lavender text role was located. The separately named `textTertiary` explains the confirmed language/icon uses and must not be substituted for this key. | Raw swatch only. |
| `overlay` | Its red-only alpha-0.5 A/B caused no corresponding tint in the tested backdrop, reader controls/transitions, and sheets; baseline diagnostic after restart also showed no cyan overlay role. Other triggers may exist. | Raw swatch only; no reader tint or modal scrim assignment. |

## Layer and mode cautions

1. A visible final color may combine the key's own alpha, a translucent parent, native material, an image, and an underlying theme surface. Record those layers separately instead of assigning the final mixed color to a single key.
2. The opaque `secondary` and `separator` diagnostics are for locating usage. They must not become the preview's default opacity.
3. The `overlay` diagnostic uses alpha 0.5, while the baseline uses approximately 0.15. No additional reader dimming or global opacity should be assumed until observed.
4. E12/E13 establish diagnostic bindings across appearances but cannot distinguish variant selection by themselves. E14 separately validates actual default Light/Dark relationships and original secondary/separator translucency on the recorded views. Do not extrapolate unrecorded component/state combinations from that check.
5. OS-provided sidebar, toolbar, popover, and window materials may not map directly to `.pbcolors` entries. Leave unsupported material assignments unresolved.
6. E04 details has cover-derived blur; E06 reader floats use translucent gray material. These are different layer stacks. Neither should be replaced by a generic opaque theme card based only on a similar layout.
7. E04/E05 section separators match `separator`, while E05 per-row rules do not. Attribute lines at the observed element level.
8. E07 proves included filter tags add transparency/material beyond `success.alpha`. Preserve that distinction; do not claim a measured 50% multiplier from visual appearance alone.
9. E08 independently establishes the excluded fill's `error` dependency with added translucency, also without a measured multiplier. E09 supplies negative evidence against assigning `overlay` to the tested details/reader/sheet surfaces.
10. E11 shows completed-row dimming across multiple foreground roles. Retained hues suggest a shared opacity treatment, but the exact mechanism/multiplier remains probable and unmeasured. NEW status and unread status are separate: Mark as unread did not clear the visit history.
11. E12 confirms `foreground` for selections, while E13 demonstrates independent system-driven material changes. Confirming a theme dependency does not make a native/material layer a simple opaque CSS fill.
12. E13's native white swipe-up reader Chapter List sheet is an explicit exception to the navy `background` sheets seen elsewhere. Keep sheet-specific evidence and do not map every modal or chapter list to `background`.
13. E14 default secondary and separator transparency is observed at the file's original alpha; apparent extra description tint/material, included/excluded-state translucency, and completed-row dimming remain separate unmeasured app treatments.

## Pending targeted checks

- Selection `foreground` dependencies are confirmed by E12; measure blending if an exact selected-row/material treatment is required.
- `alertText` is confirmed on NEW badges (E10); `alert` remains unresolved after the selection probe.
- Included/excluded filter dependencies are confirmed (E07/E08); their app-added compositing remains unmeasured.
- Identify `overlay` through targeted probes and record its layer, trigger, underlying image/surface, and effective alpha.
- Resolve details cover-blur composition and reader floating material independently.
- Distinguish the amber reader current-page index observed in E06 from the white page counter observed in E09 before applying a broad counter mapping.
- Measure completed-row dimming if an exact treatment is needed. Chapter 95 is marked unread again (E11), but its prior NEW status was not restored because visit history remains.
- Observe available alert, warning, error, and success states without manufacturing semantic pairings from key names.
- Default Light/Dark relationships and original secondary/separator alpha are checked in E14, and original Dark/default state is restored. Use further probes only for remaining specific opacity/material or unrecorded-state questions.

Only direct app observations should promote entries in this document. Until then, unresolved keys may be displayed as labeled raw swatches in the editor preview, without claiming an app component role.

## Implementation and browser validation

The rebuilt [0.9 preview family](../src/preview/families/v09.js) uses the existing active-theme CSS variables and granular `data-linked-keys` hover mechanism. It includes Discover/Search, Filters, Details, Chapters, Reader, Reader settings, and a separately labeled overlay compositing study. All 20 keys appear in coverage metadata with observed/unresolved status. No app role is invented for the five unresolved keys.

The preview keeps stored alpha in the RGBA color. Included/excluded tags, the description tint, and the selected chapter tint each use a separate approximate 0.5 fill-opacity layer so labels retain their own alpha. Completed chapter content uses approximate 0.5 group opacity and includes the observed accent Complete label. These coefficients are illustrative, not measured Paperback constants. Native material and artwork placeholders are neutral and explicitly labeled; light/dark material changes follow the selected preview mode.

Editor changes are limited to coverage metadata, live-variable guarding, accessible preview-toggle state, and exporting the required `themeColors.pbcolors` filename. Existing family loading, stale-render protection, preference bootstrap, local persistence, theme float data, and hover event delegation are preserved. The 0.8 family was not changed or researched. No dependencies, build step, backend, or runtime API were added. The preview is enabled in the local source; this task did not publish it.

**Result: 16 browser checks passed, 0 failed in Safari**, served from the repository root. A temporary dependency-free harness exercised the real editor in a same-origin iframe and restored the original theme-editor storage afterward. The harness was removed after validation at the user's request.

Validated behavior:

- Default 0.9 theme and all 20 values in both modes; a custom import with dramatically different light/dark RGB and alpha values.
- Actual computed fill/text colors and translucent pseudo-layers; NEW pairing and completed-row opacity; independent text alpha.
- Import, exact JSON/filename export through the download handler, reset preserving original floats, live RGB edits, global and per-key linking.
- Preview visibility, mode/link/theme persistence through reload, editor-to-preview and preview-to-editor hover, and missing-key reporting for partial imports.
- No captured initialization exceptions, resource errors, unhandled promise rejections, console errors, or unexpected alerts.
- Manual default-theme Light/Dark visual review, including the narrow preview panel, readable coverage labels, neutral materials, and retained hover behavior.

JavaScript syntax and whitespace checks passed. The temporary baseline fixture contained exactly the default's 20 keys with identical diagnostic mode variants; each of the five A/B fixtures changed only its named key's RGB and preserved alpha. The browser export check captured the generated Blob and download filename; it did not automate an OS download dialog. Research imports into Paperback were separately exercised through Finder.

Remaining limits are the five unobserved app roles, exact native material/cover-blur formulas, unmeasured extra opacity, and the unrecorded per-screen/default-mode combinations in the appearance matrix. The research was conducted in Paperback's iPad-on-Mac window, not on separate iPhone hardware. Screenshots remain in the conversation evidence, while the palette, probe definitions, and map are recorded in this document.
