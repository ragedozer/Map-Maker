import type { MapPaths } from './project';
import type { MapSettings } from '../state/settings';
import { EXPORT_SIZE } from '../state/settings';
import { isSelected, type Selection } from '../state/selection';
import { stateInfo } from '../data/states';

const num = (n: number) => String(Math.round(n * 1000) / 1000);

function strokeAttrs(color: string, width: number, opacity: number, join: string) {
  return (
    `fill="none" stroke="${color}" stroke-width="${num(width)}"` +
    (opacity < 1 ? ` stroke-opacity="${num(opacity)}"` : '') +
    ` stroke-linejoin="${join}" stroke-linecap="round"` +
    (join === 'miter' ? ' stroke-miterlimit="4"' : '')
  );
}

/**
 * The single render path. The preview injects this exact string; the PNG
 * export rasterizes it; the SVG export saves it. Coordinates and stroke widths
 * are in 2160-px export space (viewBox); `size` only sets the intrinsic
 * width/height, so a different export size scales everything uniformly.
 *
 * Layer order: background → fills (no stroke) → interior mesh → outer mesh →
 * selected outlines. Group/path ids become layer names in Figma/Illustrator.
 */
export function renderMapSvg(
  paths: MapPaths,
  s: MapSettings,
  selection: Selection,
  size: number = EXPORT_SIZE,
): string {
  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${EXPORT_SIZE} ${EXPORT_SIZE}">`,
  );

  if (s.background) {
    out.push(`<rect id="background" width="${EXPORT_SIZE}" height="${EXPORT_SIZE}" fill="${s.backgroundColor}"/>`);
  }

  const fills: string[] = [];
  for (const { fips, d } of paths.states) {
    if (!d) continue;
    const sel = isSelected(selection, fips);
    if (!sel && s.hideUnselected) continue;
    const color = sel ? s.selectedFill : s.unselectedFill;
    const opacity = sel ? s.selectedOpacity : s.unselectedOpacity;
    if (opacity <= 0) continue;
    const id = stateInfo(fips)?.postal ?? fips;
    fills.push(
      `<path id="${id}" data-fips="${fips}" d="${d}" fill="${color}"${opacity < 1 ? ` fill-opacity="${num(opacity)}"` : ''}/>`,
    );
  }
  if (fills.length) out.push(`<g id="states">${fills.join('')}</g>`);

  if (paths.interior && s.interiorWidth > 0 && s.interiorOpacity > 0) {
    out.push(
      `<path id="interior-borders" d="${paths.interior}" ${strokeAttrs(s.interiorColor, s.interiorWidth, s.interiorOpacity, s.lineJoin)}/>`,
    );
  }

  if (paths.outer && s.outerWidth > 0 && s.outerOpacity > 0) {
    out.push(
      `<path id="outer-border" d="${paths.outer}" ${strokeAttrs(s.outerColor, s.outerWidth, s.outerOpacity, s.lineJoin)}/>`,
    );
  }

  if (s.selectedOutline && s.selectedOutlineWidth > 0 && s.selectedOutlineOpacity > 0) {
    const outlines = paths.states
      .filter(({ fips, d }) => d && isSelected(selection, fips))
      .map(({ fips, d }) => `<path id="${stateInfo(fips)?.postal ?? fips}-outline" d="${d}"/>`);
    if (outlines.length) {
      // Group opacity, not stroke-opacity: neighbouring selected states share
      // an edge, and per-path stroke-opacity would visibly double up there.
      const groupOpacity = s.selectedOutlineOpacity < 1 ? ` opacity="${num(s.selectedOutlineOpacity)}"` : '';
      out.push(
        `<g id="selected-outlines"${groupOpacity} ${strokeAttrs(s.selectedOutlineColor, s.selectedOutlineWidth, 1, s.lineJoin)}>${outlines.join('')}</g>`,
      );
    }
  }

  out.push('</svg>');
  return out.join('');
}
