import { ALASKA_FIPS, DC_FIPS, FIFTY_STATES, HAWAII_FIPS, STATES } from '../data/states';

/**
 * FIPS → group id. Only group 1 ("selected") exists today; the record shape
 * leaves room for multiple color groups later without changing storage.
 */
export type Selection = Record<string, number>;

export const SELECTED = 1;

export const isSelected = (sel: Selection, fips: string) => sel[fips] === SELECTED;

/** States that are actually drawn with the current layout, i.e. the ones that can be selected. */
export function selectableFips(layout: { includeDC: boolean; projection: string }): string[] {
  const base =
    layout.projection === 'contiguous' ? FIFTY_STATES.filter((f) => f !== ALASKA_FIPS && f !== HAWAII_FIPS) : FIFTY_STATES;
  return layout.includeDC ? [...base, DC_FIPS] : base;
}

export function sanitizeSelection(input: unknown): Selection {
  const out: Selection = {};
  if (!input || typeof input !== 'object') return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (STATES[k] && v === SELECTED) out[k] = SELECTED;
  }
  return out;
}
