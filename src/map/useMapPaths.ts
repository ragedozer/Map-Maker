import { useDeferredValue, useMemo } from 'react';
import { buildGeometry, simplifiedTopology } from './geometry';
import { projectGeometry, type MapPaths } from './project';
import type { MapSettings } from '../state/settings';
import { isSelected, type Selection } from '../state/selection';

/**
 * Memoized pipeline: simplify (cached per slider step) → build features and
 * meshes → project into 2160 space. The detail value is deferred so dragging
 * the slider never blocks input.
 */
export function useMapPaths(settings: MapSettings, selection: Selection): MapPaths {
  const detail = useDeferredValue(settings.detail);
  const { includeDC, projection, padding, hideUnselected } = settings;

  // Meshes only depend on the selection in hide-unselected mode.
  const subsetKey = hideUnselected
    ? Object.keys(selection)
        .filter((f) => isSelected(selection, f))
        .sort()
        .join(',')
    : null;

  const geometry = useMemo(() => {
    const topo = simplifiedTopology(detail);
    const subset = subsetKey === null ? undefined : new Set(subsetKey ? subsetKey.split(',') : []);
    return buildGeometry(topo, { includeDC, contiguous: projection === 'contiguous' }, subset);
  }, [detail, includeDC, projection, subsetKey]);

  return useMemo(() => projectGeometry(geometry, projection, padding), [geometry, projection, padding]);
}
