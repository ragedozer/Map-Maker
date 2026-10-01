import { geoArea } from 'd3-geo';
import { feature, merge, mesh } from 'topojson-client';
import { presimplify, simplify, sphericalTriangleArea } from 'topojson-simplify';
import type { Feature, MultiLineString, MultiPolygon, Polygon } from 'geojson';
import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification';
import statesTopo from 'us-atlas/states-10m.json';
import { ALASKA_FIPS, DC_FIPS, FIFTY_STATES, HAWAII_FIPS, MARYLAND_FIPS } from '../data/states';

type StateGeom = GeometryObject<{ name: string }> & { id: string };
type StatesTopology = Topology<{ states: GeometryCollection<{ name: string }> }>;

const raw = statesTopo as unknown as StatesTopology;

/**
 * Presimplify once. Weights are spherical triangle areas (steradians), so the
 * simplification behaves consistently from Florida to Alaska regardless of
 * latitude, which matters because the map is drawn in an equal-area projection.
 */
const pre = presimplify(structuredClone(raw), sphericalTriangleArea) as unknown as StatesTopology;

const ALL_GEOMS = pre.objects.states.geometries as StateGeom[];
const KEEP = new Set([...FIFTY_STATES, DC_FIPS]);
const GEOMS = ALL_GEOMS.filter((g) => KEEP.has(g.id));

if (GEOMS.filter((g) => g.id !== DC_FIPS).length !== 50) {
  throw new Error(`Expected 50 state geometries, found ${GEOMS.length - 1}`);
}

// Measured on states-10m: the smallest non-endpoint weight is ~1.00e-7 sr, so
// anything at or below W_MIN keeps every point. Above ~3e-4 almost only
// topology junctions survive, so further increases change nothing visible.
const W_MIN = 1e-7;
const W_MAX = 3e-4;

/** Slider 0–100 → minimum weight on a log scale (100 = full detail). */
export function detailToWeight(detail: number): number {
  if (detail >= 100) return 0;
  const t = Math.max(0, detail) / 100;
  return Math.exp(Math.log(W_MAX) + (Math.log(W_MIN) - Math.log(W_MAX)) * t);
}

/**
 * Arcs that form the outer ring of a state's largest polygon *on their own*
 * (closed single-arc rings, e.g. Hawaii's Big Island). Plain weight filtering
 * collapses such rings to their two endpoints and the state vanishes at low
 * detail, so these arcs always keep their 3 strongest interior points.
 */
const PROTECTED_ARCS: Set<number> = (() => {
  const out = new Set<number>();
  for (const g of GEOMS) {
    const polys: number[][][] =
      g.type === 'Polygon' ? [g.arcs as number[][]] : g.type === 'MultiPolygon' ? (g.arcs as number[][][]) : [];
    if (!polys.length) continue;
    let best = polys[0];
    let bestArea = -1;
    for (const p of polys) {
      const f = feature(pre, { type: 'Polygon', arcs: p } as GeometryObject) as Feature<Polygon>;
      const a = geoArea(f);
      if (a > bestArea) [best, bestArea] = [p, a];
    }
    const outer = best[0];
    if (outer.length === 1) {
      const i = outer[0];
      out.add(i < 0 ? ~i : i);
    }
  }
  return out;
})();

type WeightedPoint = [number, number, number];

const simplifiedCache = new Map<number, StatesTopology>();

export function simplifiedTopology(detail: number): StatesTopology {
  const key = Math.round(detail);
  const hit = simplifiedCache.get(key);
  if (hit) return hit;
  const weight = detailToWeight(key);
  const topo = simplify(pre, weight) as unknown as StatesTopology;
  for (const i of PROTECTED_ARCS) {
    if (topo.arcs[i].length >= 4) continue;
    const src = pre.arcs[i] as unknown as WeightedPoint[];
    const interior = src
      .slice(1, -1)
      .map((p, idx) => ({ p, idx }))
      .sort((a, b) => b.p[2] - a.p[2])
      .slice(0, 3)
      .sort((a, b) => a.idx - b.idx)
      .map(({ p }) => [p[0], p[1]]);
    topo.arcs[i] = [[src[0][0], src[0][1]], ...interior, [src[src.length - 1][0], src[src.length - 1][1]]];
  }
  simplifiedCache.set(key, topo);
  return topo;
}

export interface LayoutOptions {
  includeDC: boolean;
  contiguous: boolean;
}

export interface MapGeometry {
  /** One feature per drawable state, keyed by FIPS. With DC off, DC's area is merged into Maryland. */
  states: { fips: string; feature: Feature<Polygon | MultiPolygon> }[];
  /** Everything the projection should fit to (stable regardless of selection). */
  fitTarget: { type: 'FeatureCollection'; features: Feature[] };
  interior: MultiLineString;
  outer: MultiLineString;
}

/**
 * Which drawable state a raw geometry belongs to. DC is enclaved between MD
 * and VA; dropping it outright would leave a hole with a coastline-style ring
 * around it, so when DC is off its area is folded into Maryland instead.
 */
function ownerOf(g: StateGeom, includeDC: boolean): string {
  return !includeDC && g.id === DC_FIPS ? MARYLAND_FIPS : g.id;
}

type Ring = [number, number][];
const samePoint = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];

/**
 * Heavy simplification collapses small islands to their arc endpoints. Those
 * degenerate rings have no area but still render: stroked with round caps
 * they turn into stray dots. Drop anything with fewer than 3 distinct vertices.
 */
function isDegenerateRing(ring: Ring): boolean {
  return ring.length < 4 || new Set(ring.map((p) => `${p[0]},${p[1]}`)).size < 3;
}

function cleanPolygonal(g: Polygon | MultiPolygon): Polygon | MultiPolygon {
  const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as Ring[][];
  const kept = polys
    .filter((p) => p.length && !isDegenerateRing(p[0]))
    .map((p) => [p[0], ...p.slice(1).filter((h) => !isDegenerateRing(h))]);
  return { type: 'MultiPolygon', coordinates: kept };
}

function cleanLines(m: MultiLineString): MultiLineString {
  return {
    type: 'MultiLineString',
    coordinates: m.coordinates.filter((line) => {
      const closed = line.length > 1 && samePoint(line[0], line[line.length - 1]);
      return closed ? !isDegenerateRing(line as Ring) : line.some((p) => !samePoint(p, line[0]));
    }),
  };
}

export function buildGeometry(
  topo: StatesTopology,
  layout: LayoutOptions,
  /** If given, interior/outer meshes are computed for this subset only (hide-unselected mode). */
  meshSubset?: Set<string>,
): MapGeometry {
  const geoms = (topo.objects.states.geometries as StateGeom[]).filter(
    (g) => KEEP.has(g.id) && !(layout.contiguous && (g.id === ALASKA_FIPS || g.id === HAWAII_FIPS)),
  );

  const byOwner = new Map<string, StateGeom[]>();
  for (const g of geoms) {
    const o = ownerOf(g, layout.includeDC);
    byOwner.set(o, [...(byOwner.get(o) ?? []), g]);
  }

  const states = [...byOwner.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fips, parts]) => {
      const geometry =
        parts.length === 1
          ? (feature(topo, parts[0]) as Feature<Polygon | MultiPolygon>).geometry
          : merge(topo, parts as Parameters<typeof merge>[1]);
      return { fips, feature: { type: 'Feature' as const, id: fips, properties: {}, geometry: cleanPolygonal(geometry) } };
    });

  const owner = new Map<GeometryObject, string>(geoms.map((g) => [g, ownerOf(g, layout.includeDC)]));
  const meshGeoms = meshSubset ? geoms.filter((g) => meshSubset.has(owner.get(g)!)) : geoms;
  const collection = { type: 'GeometryCollection', geometries: meshGeoms } as GeometryCollection;

  // An arc shared by two geometries is an interior border unless both belong
  // to the same drawable state (DC folded into MD). An arc used by only one
  // geometry in the collection is on the outside: coastline, national border,
  // or — in subset mode — the edge of the selected area.
  const interior = cleanLines(mesh(topo, collection, (a, b) => a !== b && owner.get(a) !== owner.get(b)));
  const outer = cleanLines(mesh(topo, collection, (a, b) => a === b));

  return {
    states,
    fitTarget: { type: 'FeatureCollection', features: states.map((s) => s.feature) },
    interior,
    outer,
  };
}
