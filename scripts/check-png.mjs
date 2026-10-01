// Verify exported PNGs: exact pixel size, RGBA color type, transparent corners.
//
//   npm run check-png                      → newest .png in ./exports and ~/Downloads
//   npm run check-png -- path\to\file.png  → specific file(s)
//   npm run check-png -- --size 4320 file.png
//   npm run check-png -- --allow-background file.png   (skip the corner check)

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
let size = 2160;
let allowBackground = false;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--size') size = Number(args[++i]);
  else if (args[i] === '--allow-background') allowBackground = true;
  else files.push(resolve(args[i]));
}

if (!files.length) {
  const dirs = [resolve('exports'), join(homedir(), 'Downloads')].filter(existsSync);
  const pngs = dirs
    .flatMap((d) => readdirSync(d).filter((f) => /^us-map_.*\.png$/i.test(f)).map((f) => join(d, f)))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (!pngs.length) {
    console.error('No us-map_*.png found in ./exports or ~/Downloads. Pass a file path.');
    process.exit(2);
  }
  files.push(pngs[0]);
}

const COLOR_TYPES = { 0: 'grayscale', 2: 'RGB', 3: 'indexed', 4: 'grayscale+alpha', 6: 'RGBA' };
let failed = false;

for (const file of files) {
  const buf = readFileSync(file);
  const results = [];
  const check = (ok, label) => {
    results.push(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
    if (!ok) failed = true;
  };

  const signature = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  check(signature, 'PNG signature');
  if (!signature) {
    console.log(file + '\n' + results.join('\n'));
    continue;
  }

  // IHDR is always the first chunk: width/height at bytes 16–23, bit depth 24, color type 25.
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  check(width === size && height === size, `dimensions ${width}×${height} (expected ${size}×${size})`);
  check(colorType === 6 || colorType === 4, `color type ${colorType} = ${COLOR_TYPES[colorType] ?? '?'}, ${bitDepth}-bit (needs alpha channel)`);

  const png = PNG.sync.read(buf);
  const a = (x, y) => png.data[(y * png.width + x) * 4 + 3];
  const corners = [a(0, 0), a(png.width - 1, 0), a(0, png.height - 1), a(png.width - 1, png.height - 1)];
  let clear = 0;
  let opaque = 0;
  for (let i = 3; i < png.data.length; i += 4) {
    if (png.data[i] === 0) clear++;
    else if (png.data[i] === 255) opaque++;
  }
  const total = png.width * png.height;
  if (allowBackground) results.push(`  SKIP  corner transparency (--allow-background), corner alpha [${corners}]`);
  else check(corners.every((v) => v === 0), `corner alpha [${corners.join(', ')}] all 0`);
  check(clear + opaque < total || opaque > 0, 'image is not empty');
  results.push(
    `  info  ${((clear / total) * 100).toFixed(1)}% transparent, ${((opaque / total) * 100).toFixed(1)}% opaque, ` +
      `${(((total - clear - opaque) / total) * 100).toFixed(2)}% partial (anti-aliased edges), ${(buf.length / 1024).toFixed(0)} KB`,
  );

  console.log(file + '\n' + results.join('\n'));
}

process.exit(failed ? 1 : 0);
