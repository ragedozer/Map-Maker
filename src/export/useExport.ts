import { useCallback, useRef, useState } from 'react';
import type { MapPaths } from '../map/project';
import { renderMapSvg } from '../map/render';
import { isSelected, selectableFips } from '../state/selection';
import type { AppState } from '../state/store';
import { downloadBlob, exportFilename, rasterizePng, svgBlob, type PngReport } from './export';

export interface LastExport {
  filename: string;
  report?: PngReport;
  background: boolean;
}

export function useExport(state: AppState, paths: MapPaths) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<LastExport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef({ state, paths });
  latest.current = { state, paths };

  const build = () => {
    const { state, paths } = latest.current;
    const { settings, selection } = state;
    const count = selectableFips(settings).filter((f) => isSelected(selection, f)).length;
    return { svg: renderMapSvg(paths, settings, selection, settings.exportSize), settings, count };
  };

  const exportPng = useCallback(async () => {
    if (busy) return null;
    setBusy(true);
    setError(null);
    try {
      const { svg, settings, count } = build();
      const { blob, report } = await rasterizePng(svg, settings.exportSize);
      const filename = exportFilename(count, 'png');
      downloadBlob(blob, filename);
      setLast({ filename, report, background: settings.background });
      return { blob, report, filename };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const exportSvg = useCallback(() => {
    const { svg, settings, count } = build();
    const filename = exportFilename(count, 'svg');
    downloadBlob(svgBlob(svg), filename);
    setLast({ filename, background: settings.background });
  }, []);

  return { exportPng, exportSvg, busy, last, error };
}

export type ExportApi = ReturnType<typeof useExport>;
