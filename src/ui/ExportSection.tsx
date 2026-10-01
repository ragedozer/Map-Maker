import { Button, Section, Slider } from './controls';
import { useAppState, useDispatch } from '../state/store';
import { EXPORT_SIZE } from '../state/settings';
import type { ExportApi } from '../export/useExport';

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function ExportSection({ api }: { api: ExportApi }) {
  const { settings: s } = useAppState();
  const dispatch = useDispatch();
  const { last, error, busy } = api;
  const r = last?.report;
  const sizeOk = r && r.width === s.exportSize && r.height === s.exportSize;
  const cornersClear = r && r.cornerAlpha.every((a) => a === 0);

  return (
    <Section
      title="Export"
      aside={
        s.exportSize !== EXPORT_SIZE ? (
          <button type="button" className="icon-btn" onClick={() => dispatch({ type: 'set', key: 'exportSize', value: EXPORT_SIZE })}>
            Reset to {EXPORT_SIZE}
          </button>
        ) : undefined
      }
    >
      <Slider
        label="Size"
        value={s.exportSize}
        min={256}
        max={4320}
        step={8}
        unit="px"
        onChange={(v) => dispatch({ type: 'set', key: 'exportSize', value: Math.round(v) })}
      />
      <div className="btn-row">
        <Button variant="primary" onClick={() => void api.exportPng()} disabled={busy} title="Ctrl+E">
          {busy ? 'Rendering…' : 'Export PNG'} <span className="kbd">Ctrl E</span>
        </Button>
        <Button onClick={api.exportSvg}>Export SVG</Button>
      </div>
      {error && <div className="readout"><span className="bad">Export failed: {error}</span></div>}
      {last && (
        <div className="readout" aria-live="polite">
          <span title={last.filename}>{last.filename}</span>
          {r && (
            <>
              <span className={sizeOk ? 'ok' : 'bad'}>
                {r.width}×{r.height} px · RGBA · {kb(r.bytes)}
              </span>
              <span className={cornersClear || last.background ? 'ok' : 'bad'}>
                {last.background
                  ? 'Background on — corners opaque by design'
                  : cornersClear
                    ? `Corners transparent · ${Math.round(r.transparentShare * 100)}% clear`
                    : 'Corners NOT transparent'}
              </span>
            </>
          )}
        </div>
      )}
    </Section>
  );
}
