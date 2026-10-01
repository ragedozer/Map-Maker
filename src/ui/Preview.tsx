import { memo, useEffect, useRef, useState } from 'react';
import type { MapPaths } from '../map/project';
import { EXPORT_SIZE } from '../state/settings';
import { isSelected } from '../state/selection';
import { useAppState, useDispatch } from '../state/store';
import { stateInfo } from '../data/states';

/**
 * Invisible hit targets on top of the rendered map. Kept separate from the
 * map SVG so the exported markup stays free of UI concerns, and so states
 * remain clickable when unselected fills are hidden.
 */
const HitLayer = memo(function HitLayer({ paths }: { paths: MapPaths }) {
  return (
    <>
      {paths.states.map(({ fips, d }) => (
        <path key={fips} data-fips={fips} d={d} />
      ))}
    </>
  );
});

function fipsAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el instanceof SVGPathElement && el.closest('.hit') ? el.dataset.fips ?? null : null;
}

export function Preview({ svg, paths, hover, setHover }: {
  svg: string;
  paths: MapPaths;
  hover: string | null;
  setHover: (f: string | null) => void;
}) {
  const { selection } = useAppState();
  const dispatch = useDispatch();
  const paint = useRef<boolean | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const end = () => (paint.current = null);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, []);

  const hoverD = hover ? paths.states.find((s) => s.fips === hover)?.d : undefined;
  const info = hover ? stateInfo(hover) : undefined;
  const rect = stageRef.current?.getBoundingClientRect();

  return (
    <div className="canvas-wrap" ref={stageRef}>
      <div className="canvas checker" dangerouslySetInnerHTML={{ __html: svg }} />
      <svg
        className="hit"
        viewBox={`0 0 ${EXPORT_SIZE} ${EXPORT_SIZE}`}
        onPointerDown={(e) => {
          const f = fipsAt(e.clientX, e.clientY);
          if (!f || e.button !== 0) return;
          e.preventDefault();
          paint.current = !isSelected(selection, f);
          dispatch({ type: 'paint', fips: f, selected: paint.current });
        }}
        onPointerMove={(e) => {
          const f = fipsAt(e.clientX, e.clientY);
          if (f !== hover) setHover(f);
          setPointer({ x: e.clientX, y: e.clientY });
          if (f && paint.current !== null) dispatch({ type: 'paint', fips: f, selected: paint.current });
        }}
        onPointerLeave={() => {
          setHover(null);
          setPointer(null);
        }}
      >
        <HitLayer paths={paths} />
        {hoverD && <path className="hover-outline" d={hoverD} />}
      </svg>
      {info && pointer && rect && (
        <div className="tooltip" style={{ left: pointer.x - rect.left + 14, top: pointer.y - rect.top + 14 }}>
          <b>{info.name}</b>
          <span>{info.postal}</span>
          {isSelected(selection, hover!) && <em>Selected</em>}
        </div>
      )}
    </div>
  );
}
