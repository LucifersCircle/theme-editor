# Paperback Theme Editor

**[theme.pirate.vodka](https://theme.pirate.vodka)**

A browser-based editor for Paperback iOS app `.pbcolors` theme files. No frameworks, no build tools. Just HTML, CSS, and JavaScript.

## Features

- **Load & edit** `.pbcolors` themes with auto-detected color fields
- **Light/dark mode** toggle to edit each variant independently
- **Link colors** globally or per-color so light and dark stay in sync
- **Import** existing `.pbcolors` files
- **Export** edited themes as `.pbcolors` downloads
- **Persistent state** via localStorage (edits survive page reloads)
- **Reset to defaults** with one click

## Usage

1. Open the editor in a browser
2. Colors from the default theme are loaded automatically
3. Use the color pickers or hex inputs to modify colors
4. Toggle between Light/Dark to edit each mode
5. Use the link button to keep light and dark values in sync
6. Export your theme as a `.pbcolors` file when done

## `.pbcolors` Format

`.pbcolors` files are JSON with RGBA float objects (0–1 range) and light/dark variants:

```json
{
  "background": {
    "lightColor": { "red": 0.95, "green": 0.95, "blue": 0.95, "alpha": 1 },
    "darkColor": { "red": 0.094, "green": 0.094, "blue": 0.106, "alpha": 1 }
  }
}
```

## Development

Serve the `src/` directory with any static file server:

```sh
python3 -m http.server 8080 -d src
```

Then open `http://localhost:8080`.

## Project Structure

```
src/
├── index.html              # Main page
├── editor.js               # Core editor logic
├── layout.css              # UI layout and styling
├── preview.css             # Preview panel styles (placeholder)
├── components/preview.html # Preview template (placeholder)
└── themes/default.pbcolors # Default theme (17 colors)
```

## Deployment

Hosted on [GitHub Pages](https://github.com/luciferscircle/theme-editor/deployments) via a GitHub Actions workflow. Pushes to `main` auto-deploy the `src/` directory.

## Roadmap

- [ ] Editable alpha values
- [ ] Live preview (app UI mockup in preview panel)
- [ ] "Revert to Import" button (restore imported theme after edits)
