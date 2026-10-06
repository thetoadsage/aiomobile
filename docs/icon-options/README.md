# AIOMobile icon options

Four vector concepts: Signal A, Flow, Orbit, Pocket. `index.html` is a self-contained interactive preview with all five existing app palettes and 30px header samples. `preview.png` is the overview sheet.

Concept SVG files use `--icon-accent` and `--icon-background`, falling back to Sage. For the actual header, inline the selected geometry in a React SVG component and map its colors to `--accent` and `--background`; CSS properties on the page cannot recolor an external SVG loaded with `<img>`. Regenerate installation PNGs from the same selected geometry, using Sage as the proposed default palette. Preserve app metadata and PWA identity. No runtime icon changes or deployment are included in this concept pass.

Verified all five palette controls and no horizontal overflow at 390px. Desktop concept sheet visually inspected. These are proposed assets, not replacements for `public/icons/`.

## Selected: Flow

The operator chose option 2. Implemented locally as `src/components/BrandMark.tsx`, using shared geometry in `src/assets/brand-mark.json`, `--accent` for the mark and `--background` for its tile. The existing header dimensions are preserved. Installation icons and favicon are rendered in Sage from that same geometry by `scripts/generate-icons.mjs`; `scripts/generate-icons.py` remains a compatibility launcher. Regenerate with `node scripts/generate-icons.mjs` after installing Playwright Chromium; set `PLAYWRIGHT_BROWSERS_PATH` if using a custom browser cache.

Validated theme matching in Chromium/WebKit across all five palettes and narrow320px layout. PNGs: 180/192/512px and maskable512px (80% inner scaling for mask safety). Build/typecheck/lint pass. Deployed by explicit user request on 2026-10-04 as build `560bb30407026451`; included in the current source update authorized for GitHub main. See project memory for deployment and rollback.
