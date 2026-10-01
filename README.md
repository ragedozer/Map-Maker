# Map Maker

A local tool for making stylized maps of the 50 US states. Click states to select them, style the map, and export a transparent PNG at exactly 2160 × 2160 px (or SVG for Figma / Illustrator).

Everything runs in your browser. There's no backend and no network calls, and the map data is bundled.

## Run it (Windows)

You need [Node.js](https://nodejs.org) 20 or newer. Open PowerShell in this folder (the path has a space, so keep the quotes):

```powershell
cd "C:\Users\Ragen\Desktop\Projects\Personal\Map Maker"
npm install        # first time only
npm run dev
```

Then open the URL it prints (usually http://localhost:5173). Press `Ctrl+C` in PowerShell to stop it.

## Using it

- **Select states:** click a state, or hold the mouse and drag across several. Use the Selection buttons for select all, clear, and invert. Click a chip to deselect that state.
- **Detail:** lower the slider for chunkier, more geometric shapes. At 100 you get the full 1:10m outline.
- **Strokes:** widths are in **export pixels** (px at 2160). The preview is a scaled-down copy of the export, so a 4 px line in the panel is 4 px in the PNG. Interior borders and the outer coastline are styled separately.
- **Layout:** choose "50 + insets" (Alaska and Hawaii as insets) or "Lower 48". You can also set padding, include DC, or add an optional background color. With no background color, the export is transparent.
- **Presets:** your settings and selection autosave. Save named presets, and use **JSON** / **Import JSON** to back them up or share them.
- **Export:** `Ctrl+E` or **Export PNG**. Files are named `us-map_<n>-selected_<YYYYMMDD-HHmm>.png`. After each export, the panel shows the measured size, RGBA, and whether the corners are transparent. **Export SVG** saves the same drawing as vectors, with named layers (`states/CA`, `interior-borders`, `outer-border`, …).

`Esc` clears the hover highlight.

## Verifying an export

```powershell
npm run check-png                                      # newest us-map_*.png in .\exports or Downloads
npm run check-png -- "$env:USERPROFILE\Downloads\us-map_3-selected_20261001-1200.png"
```

This checks that the file is 2160×2160, RGBA (has an alpha channel), and has fully transparent corners. Add `--size 4320` for a custom export size, or `--allow-background` if you exported with a background color.

## Other commands

- `npm run build`: type-check and build a production bundle into `dist\`
- `npm run preview`: serve that build locally
