# Map Maker — CLAUDE.md

A small local web tool for making stylized maps of the 50 US states. Click states to mark them "selected" (different color), style the map, and export a transparent PNG at exactly 2160×2160 px.

The owner is a senior brand/graphic designer. Output quality matters more than feature count: clean geometry, crisp anti-aliased edges, predictable stroke weights, and exports that drop straight into Figma / Photoshop / After Effects.

Full plan and milestones: see `PLAN.md`. Work through it milestone by milestone and keep its checkboxes up to date.

## Stack (decided — don't swap without asking)

- **Vite + React + TypeScript** (single-page app, runs locally with `npm run dev`)
- **d3-geo** for projection + path generation (`geoAlbersUsa` by default)
- **topojson-client** + **topojson-simplify** for loading and live simplification (detail slider)
- **us-atlas** (npm) for state geometry — `us-atlas/states-10m.json` (unprojected lon/lat). Bundled locally, no network calls at runtime.
- Plain CSS (CSS variables) — no UI framework. Keep dependencies minimal.
- No backend. Everything runs in the browser.

## Environment

- Owner is on **Windows**. Use cross-platform npm scripts (no bash-only syntax, no `rm -rf` in scripts). Paths in docs should work in PowerShell.
- Project root: `C:\Users\Ragen\Desktop\Projects\Personal\Map Maker` (note the space in the folder name — quote paths).

## Architecture rules

- **One source of truth for rendering.** The on-screen preview and the PNG export must come from the *same* render function that produces an SVG string (or SVG element) from `(geometry, settings, selection)`. Export = rasterize that SVG onto a 2160×2160 canvas. Never maintain two separate drawing paths.
- **Stroke widths are defined in export pixels** (i.e. "px at 2160×2160"). The preview scales the whole SVG down via `viewBox`, so what you see is proportionally what you get. Use `vector-effect` only if it doesn't break this guarantee.
- **Transparent background** by default: no background rect unless the user turns on a background color. Canvas must not be filled before drawing.
- Strokes: default `stroke-linejoin="round"`, `stroke-linecap="round"`. Shared borders between states should not double up visually — render the interior borders as a single mesh (`topojson.mesh(topo, obj, (a, b) => a !== b)`) and the outer coastline/border as a separate mesh (`(a, b) => a === b`), so each can have its own width/color. Fills are drawn per-state with no stroke.
- Simplification: call `presimplify` once on load, then `simplify(topo, minWeight)` when the detail slider changes. Map the slider (0–100) to a weight on a log scale so the low end is usefully chunky and the high end is full detail. Debounce / memoize — must stay smooth.
- Filter to the **50 states** by FIPS code (exclude DC `11` and territories `60, 66, 69, 72, 78`). Offer DC as an optional toggle, off by default. Verify what `states-10m.json` actually contains before hardcoding.
- State identity: key everything by 2-digit FIPS string; keep a lookup table of FIPS → name + postal abbreviation in `src/data/states.ts`.
- Settings live in one typed object (`MapSettings`) with defaults in one file. Persist settings + selection to `localStorage` (wrapped in try/catch). Support named presets (save / load / delete) and JSON import/export of a preset.

## Code style

- TypeScript strict mode. Small focused modules: `src/map/` (geometry, projection, render-to-svg), `src/export/` (png/svg export), `src/ui/` (controls panel components), `src/state/` (settings, selection, presets).
- Functional React components + hooks. No global state library — `useReducer` + context is enough.
- No comments explaining what obvious code does; do comment the non-obvious geo/export math.

## Verifying work

- After each milestone: `npm run build` must pass with zero TS errors.
- Check exports for real: the PNG must be exactly 2160×2160, have an alpha channel, and have transparent corners. Add a tiny Node check script (`scripts/check-png.mjs`, using `pngjs` as a devDependency) or verify via an in-app debug readout — don't just assume.
- Test the map at both extremes of the detail slider and at stroke widths 0, 1, and 20.

## Commands

- `npm install` — install deps
- `npm run dev` — local dev server
- `npm run build` — type-check + production build
- `npm run preview` — serve the build
