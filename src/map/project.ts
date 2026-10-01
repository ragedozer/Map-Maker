import { geoAlbers, geoAlbersUsa, geoPath, type GeoProjection } from 'd3-geo';
import type { MapGeometry } from './geometry';
import type { ProjectionMode } from '../state/settings';
import { EXPORT_SIZE } from '../state/settings';

export interface MapPaths {
  states: { fips: string; d: string }[];
  interior: string;
  outer: string;
}

/**
 * Everything is projected straight into the 2160×2160 export coordinate
 * space; the preview only ever scales this down via viewBox. Padding is a
 * percentage of the canvas edge.
 */
export function projectGeometry(geo: MapGeometry, mode: ProjectionMode, paddingPct: number): MapPaths {
  const pad = (EXPORT_SIZE * paddingPct) / 100;
  const projection: GeoProjection = mode === 'contiguous' ? geoAlbers() : geoAlbersUsa();
  projection.fitExtent(
    [
      [pad, pad],
      [EXPORT_SIZE - pad, EXPORT_SIZE - pad],
    ],
    geo.fitTarget,
  );
  // 2 decimals = 1/100 of an export pixel; plenty for crisp edges, keeps markup small.
  const path = geoPath(projection).digits(2);
  return {
    states: geo.states.map((s) => ({ fips: s.fips, d: path(s.feature) ?? '' })),
    interior: path(geo.interior) ?? '',
    outer: path(geo.outer) ?? '',
  };
}
