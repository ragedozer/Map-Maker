import { useRef, useState } from 'react';
import { Button, Section } from './controls';
import { useAppState, useDispatch } from '../state/store';
import {
  loadPresets,
  makePreset,
  presetFromJson,
  presetToJson,
  savePresets,
  type Preset,
} from '../state/persist';
import { downloadBlob } from '../export/export';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset';

export function PresetsSection({ notify }: { notify: (msg: string, error?: boolean) => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const commit = (next: Preset[]) => {
    setPresets(next);
    if (!savePresets(next)) notify('Could not write to browser storage', true);
  };

  const upsert = (p: Preset) => commit([...presets.filter((x) => x.name !== p.name), p].sort((a, b) => a.name.localeCompare(b.name)));

  const save = () => {
    const n = name.trim();
    if (!n) return;
    const exists = presets.some((p) => p.name === n);
    if (exists && !confirm(`Overwrite preset “${n}”?`)) return;
    upsert(makePreset(n, state));
    setName('');
    notify(`Saved “${n}”`);
  };

  const apply = (p: Preset) => {
    dispatch({ type: 'load', settings: p.settings, selection: p.selection });
    notify(`Loaded “${p.name}”`);
  };

  const importFile = async (file: File) => {
    try {
      const p = presetFromJson(await file.text(), file.name);
      upsert(p);
      apply(p);
    } catch (e) {
      notify(`Import failed: ${e instanceof Error ? e.message : e}`, true);
    }
  };

  return (
    <Section
      title="Presets"
      aside={
        <button type="button" className="icon-btn" onClick={() => fileRef.current?.click()}>
          Import JSON
        </button>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importFile(f);
          e.target.value = '';
        }}
      />
      <div className="btn-row">
        <span className="text-field">
          <input
            placeholder="Preset name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </span>
        <Button onClick={save} disabled={!name.trim()}>
          Save
        </Button>
      </div>
      {presets.length > 0 ? (
        <div className="preset-list">
          {presets.map((p) => (
            <div className="preset" key={p.name}>
              <span className="preset-name" title={p.name}>
                {p.name}
              </span>
              <button type="button" className="icon-btn" onClick={() => apply(p)}>
                Load
              </button>
              <button
                type="button"
                className="icon-btn"
                title="Download as JSON"
                onClick={() =>
                  downloadBlob(new Blob([presetToJson(p)], { type: 'application/json' }), `${slug(p.name)}.mapmaker.json`)
                }
              >
                JSON
              </button>
              <button
                type="button"
                className="icon-btn danger"
                title="Delete preset"
                onClick={() => confirm(`Delete preset “${p.name}”?`) && commit(presets.filter((x) => x !== p))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">Settings and selection autosave. Save a named preset to come back to a look.</p>
      )}
      <Button variant="ghost" onClick={() => dispatch({ type: 'resetSettings' })}>
        Reset style to defaults
      </Button>
    </Section>
  );
}
