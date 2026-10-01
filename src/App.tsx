import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StoreProvider, useAppState, useDispatch } from './state/store';
import { loadState, saveState } from './state/persist';
import { useMapPaths } from './map/useMapPaths';
import { renderMapSvg } from './map/render';
import { useExport } from './export/useExport';
import { Preview } from './ui/Preview';
import { SelectionSection } from './ui/SelectionSection';
import { DetailSection, FillsSection, LayoutSection, StrokesSection } from './ui/StyleSections';
import { PresetsSection } from './ui/PresetsSection';
import { ExportSection } from './ui/ExportSection';

function useToast() {
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);
  const timer = useRef<number>(undefined);
  const notify = useCallback((msg: string, error = false) => {
    setToast({ msg, error });
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);
  return { toast, notify };
}

function Shell() {
  const state = useAppState();
  const { settings, selection } = state;
  const dispatch = useDispatch();
  const paths = useMapPaths(settings, selection);
  const svg = useMemo(() => renderMapSvg(paths, settings, selection), [paths, settings, selection]);
  const [hover, setHover] = useState<string | null>(null);
  const exporter = useExport(state, paths);
  const { toast, notify } = useToast();

  useEffect(() => {
    const t = setTimeout(() => saveState(state), 250);
    return () => clearTimeout(t);
  }, [state]);

  const { exportPng } = exporter;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        void exportPng();
      } else if (e.key === 'Escape') {
        setHover(null);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exportPng]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      Object.assign(window, { __mapMaker: { dispatch, state, svg, paths, exportPng } });
    }
  }, [dispatch, state, svg, paths, exportPng]);

  return (
    <div className="app">
      <main className="stage">
        <Preview svg={svg} paths={paths} hover={hover} setHover={setHover} />
      </main>
      <aside className="panel">
        <header className="panel-header">
          Map Maker <small>{settings.exportSize} × {settings.exportSize}</small>
        </header>
        <SelectionSection />
        <DetailSection />
        <FillsSection />
        <StrokesSection />
        <LayoutSection />
        <PresetsSection notify={notify} />
        <ExportSection api={exporter} />
      </aside>
      {toast && <div className={`toast ${toast.error ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}

export function App() {
  const initial = useMemo(loadState, []);
  return (
    <StoreProvider initial={initial}>
      <Shell />
    </StoreProvider>
  );
}
