export type LineJoin = 'round' | 'miter' | 'bevel';
export type ProjectionMode = 'albersUsa' | 'contiguous';

/** All widths are in export pixels, i.e. px at 2160×2160. Opacities are 0–1. */
export interface MapSettings {
  detail: number;

  unselectedFill: string;
  unselectedOpacity: number;
  selectedFill: string;
  selectedOpacity: number;
  hideUnselected: boolean;

  interiorColor: string;
  interiorWidth: number;
  interiorOpacity: number;

  outerColor: string;
  outerWidth: number;
  outerOpacity: number;

  selectedOutline: boolean;
  selectedOutlineColor: string;
  selectedOutlineWidth: number;
  selectedOutlineOpacity: number;

  lineJoin: LineJoin;

  projection: ProjectionMode;
  padding: number;
  includeDC: boolean;

  background: boolean;
  backgroundColor: string;

  exportSize: number;
}

export const EXPORT_SIZE = 2160;

export const DEFAULT_SETTINGS: MapSettings = {
  detail: 100,

  unselectedFill: '#c9c9c9',
  unselectedOpacity: 1,
  selectedFill: '#1f5eff',
  selectedOpacity: 1,
  hideUnselected: false,

  interiorColor: '#ffffff',
  interiorWidth: 3,
  interiorOpacity: 1,

  outerColor: '#ffffff',
  outerWidth: 0,
  outerOpacity: 1,

  selectedOutline: false,
  selectedOutlineColor: '#0a2a80',
  selectedOutlineWidth: 4,
  selectedOutlineOpacity: 1,

  lineJoin: 'round',

  projection: 'albersUsa',
  padding: 5,
  includeDC: false,

  background: false,
  backgroundColor: '#ffffff',

  exportSize: EXPORT_SIZE,
};

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Merge untrusted input (localStorage, imported JSON) over defaults, keeping only well-typed values. */
export function sanitizeSettings(input: unknown): MapSettings {
  const out: MapSettings = { ...DEFAULT_SETTINGS };
  if (!input || typeof input !== 'object') return out;
  const src = input as Record<string, unknown>;
  const target = out as unknown as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof MapSettings)[]) {
    const def = DEFAULT_SETTINGS[key];
    const v = src[key];
    if (typeof def === 'number' && typeof v === 'number' && Number.isFinite(v)) target[key] = v;
    else if (typeof def === 'boolean' && typeof v === 'boolean') target[key] = v;
    else if (typeof def === 'string' && typeof v === 'string') {
      if (def.startsWith('#') ? HEX.test(v) : true) target[key] = def.startsWith('#') ? v.toLowerCase() : v;
    }
  }
  if (!['round', 'miter', 'bevel'].includes(out.lineJoin)) out.lineJoin = DEFAULT_SETTINGS.lineJoin;
  if (!['albersUsa', 'contiguous'].includes(out.projection)) out.projection = DEFAULT_SETTINGS.projection;
  out.detail = clamp(out.detail, 0, 100);
  out.padding = clamp(out.padding, 0, 25);
  out.exportSize = Math.round(clamp(out.exportSize, 256, 4320));
  for (const k of ['interiorWidth', 'outerWidth', 'selectedOutlineWidth'] as const) out[k] = clamp(out[k], 0, 40);
  for (const k of ['unselectedOpacity', 'selectedOpacity', 'interiorOpacity', 'outerOpacity', 'selectedOutlineOpacity'] as const) {
    out[k] = clamp(out[k], 0, 1);
  }
  return out;
}
