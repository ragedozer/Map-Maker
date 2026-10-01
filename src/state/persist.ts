import { DEFAULT_SETTINGS, sanitizeSettings, type MapSettings } from './settings';
import { sanitizeSelection, type Selection } from './selection';
import type { AppState } from './store';

const STATE_KEY = 'map-maker:state:v1';
const PRESETS_KEY = 'map-maker:presets:v1';

export interface Preset {
  name: string;
  settings: MapSettings;
  selection: Selection;
  savedAt: string;
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadState(): AppState {
  const raw = read(STATE_KEY) as { settings?: unknown; selection?: unknown } | null;
  return {
    settings: raw ? sanitizeSettings(raw.settings) : DEFAULT_SETTINGS,
    selection: raw ? sanitizeSelection(raw.selection) : {},
  };
}

export function saveState(state: AppState) {
  write(STATE_KEY, { settings: state.settings, selection: state.selection });
}

function sanitizePreset(input: unknown, fallbackName = 'Imported'): Preset | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as Record<string, unknown>;
  if (!p.settings || typeof p.settings !== 'object') return null;
  const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 60) : fallbackName;
  return {
    name,
    settings: sanitizeSettings(p.settings),
    selection: sanitizeSelection(p.selection),
    savedAt: typeof p.savedAt === 'string' ? p.savedAt : new Date().toISOString(),
  };
}

export function loadPresets(): Preset[] {
  const raw = read(PRESETS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => sanitizePreset(p)).filter((p): p is Preset => p !== null);
}

export function savePresets(presets: Preset[]): boolean {
  return write(PRESETS_KEY, presets);
}

export function makePreset(name: string, state: AppState): Preset {
  return { name: name.trim().slice(0, 60), settings: state.settings, selection: state.selection, savedAt: new Date().toISOString() };
}

const FILE_FORMAT = 'map-maker-preset';

export function presetToJson(p: Preset): string {
  return JSON.stringify({ format: FILE_FORMAT, version: 1, ...p }, null, 2);
}

export function presetFromJson(text: string, fileName: string): Preset {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Not valid JSON');
  }
  const obj = parsed as Record<string, unknown> | null;
  if (!obj || (obj.format !== undefined && obj.format !== FILE_FORMAT)) throw new Error('Not a Map Maker preset');
  const preset = sanitizePreset(obj, fileName.replace(/(\.mapmaker)?\.json$/i, ''));
  if (!preset) throw new Error('Preset has no settings');
  return preset;
}
