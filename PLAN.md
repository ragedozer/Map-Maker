# Map Maker — Build Plan

## Goal

A local browser tool that renders all 50 US states, lets you click states to toggle them "selected," style everything, and export a **transparent-background PNG at exactly 2160×2160 px**.

## Layout

```
┌──────────────────────────────────────────────┬───────────────────┐
│                                              │  CONTROLS PANEL   │
│                                              │  ─ Selection      │
│          Square map canvas (1:1)             │  ─ Detail         │
│     checkerboard behind = transparency       │  ─ Fills          │
│     hover highlight + state name tooltip     │  ─ Strokes        │
│                                              │  ─ Layout         │
│                                              │  ─ Presets        │
│                                              │  ─ Export         │
└──────────────────────────────────────────────┴───────────────────┘
```

The preview is always square so it matches the 2160×2160 output. A checkerboard pattern sits behind the map (UI only, never exported) so transparency is obvious.

## Features

### Selection
- Click a state to toggle selected / unselected.
- Hover: subtle highlight + tooltip with state name.
- Buttons: Select all · Clear · Invert.
- Selected-state list as clickable chips (postal codes) so you can deselect from the list too.
- Optional: drag-to-paint (hold mouse and sweep across states).

### Detail / complexity
- Slider 0–100 driving live topology simplification (topojson-simplify, log-scaled weight).
- Low = blocky/geometric stylization, high = full 1:10m detail.

### Fills
- Unselected fill color + opacity.
- Selected fill color + opacity.
- Toggle: hide unselected states entirely (export only the selected shapes).

### Strokes
- **Interior borders** (state-to-state lines): color, width (0–40 export px), opacity.
- **Outer border** (coastline / national outline): color, width, opacity — separate so you can do a heavy outline with hairline interiors.
- Toggle: selected states get their own outline color/width (draw selected-state outlines on top).
- Line join: round / miter / bevel.

### Layout
- Projection: Albers USA (AK + HI as insets) — default. Option: contiguous 48 only (Albers, AK/HI hidden).
- Padding (% of canvas) — map auto-fits inside 2160×2160 minus padding using `projection.fitExtent`.
- Toggle: include DC (off by default).
- Optional background color toggle (off = transparent).

### Presets
- Settings + selection autosave to localStorage.
- Save / load / delete named presets.
- Export / import preset as JSON (for sharing or backup).

### Export
- **PNG 2160×2160, transparent** — the core requirement. Render the same SVG used for preview, rasterize onto an offscreen canvas at 2160×2160 with no background fill, `canvas.toBlob('image/png')`, download.
- Filename pattern: `us-map_<n>-selected_<YYYYMMDD-HHmm>.png`.
- Bonus: **SVG export** (same render, vector) — useful for Figma/Illustrator.
- Optional: custom export size field (default and primary = 2160).

## Technical approach

| Concern | Approach |
|---|---|
| Geometry | `us-atlas/states-10m.json` (TopoJSON, lon/lat), bundled |
| Projection | `d3.geoAlbersUsa().fitExtent([[pad,pad],[2160-pad,2160-pad]], features)` — computed in 2160 space always |
| Simplify | `presimplify` once → `simplify(topo, weight)` on slider change, memoized |
| Rendering | Pure function `renderMapSvg(geo, settings, selection) → SVG markup`, viewBox `0 0 2160 2160`. Preview displays it scaled; export rasterizes it. |
| Borders | Fills per state (no stroke) → interior mesh `a !== b` → outer mesh `a === b` → selected outlines on top |
| Interaction | Preview uses the same paths as React elements with `onClick`/`onMouseEnter` keyed by FIPS |
| Export | SVG → Blob URL → `Image` → `canvas` (2160×2160, transparent) → PNG Blob → download |
| Persistence | localStorage (try/catch), preset JSON import/export |

## Milestones

- [x] **M1 — Scaffold.** Vite + React + TS, deps installed, folder structure, `npm run dev` shows an empty app shell with the two-column layout.
- [x] **M2 — Map renders.** Load us-atlas, filter to 50 states, Albers USA projection fit to a 2160 square, render fills + interior mesh + outer mesh. Verify exactly 50 state features.
- [x] **M3 — Selection.** Click toggling, hover tooltip, select all / clear / invert, selected chips.
- [x] **M4 — Style controls.** Detail slider (live simplify), fills, interior + outer strokes, selected outline, line join, hide-unselected, padding, projection mode, DC toggle, background toggle.
- [x] **M5 — Export.** PNG 2160×2160 transparent + SVG export. Verify size and alpha with `scripts/check-png.mjs`.
- [x] **M6 — Presets & persistence.** Autosave, named presets, JSON import/export.
- [x] **M7 — Polish.** Clean designer-friendly UI (dark neutral panel, compact controls, color inputs with hex text fields), keyboard shortcuts (`Ctrl+E` export, `Esc` clear hover), README with run instructions.

## Out of scope (for now)

Counties, labels/text on the map, other countries, animation, multiple color groups beyond selected/unselected. (Multiple color groups would be the natural v2 — keep `selection` as a `Record<fips, groupId>`-friendly shape so it's easy to add later.)
