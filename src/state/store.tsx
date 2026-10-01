import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type MapSettings } from './settings';
import { SELECTED, isSelected, type Selection } from './selection';

export interface AppState {
  settings: MapSettings;
  selection: Selection;
}

export type Action =
  | { [K in keyof MapSettings]: { type: 'set'; key: K; value: MapSettings[K] } }[keyof MapSettings]
  | { type: 'toggle'; fips: string }
  | { type: 'paint'; fips: string; selected: boolean }
  | { type: 'selectAll'; fips: string[] }
  | { type: 'clear' }
  | { type: 'invert'; fips: string[] }
  | { type: 'load'; settings: MapSettings; selection: Selection }
  | { type: 'resetSettings' };

function withState(sel: Selection, fips: string, on: boolean): Selection {
  if (isSelected(sel, fips) === on) return sel;
  const next = { ...sel };
  if (on) next[fips] = SELECTED;
  else delete next[fips];
  return next;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set':
      if (state.settings[action.key] === action.value) return state;
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'toggle':
      return { ...state, selection: withState(state.selection, action.fips, !isSelected(state.selection, action.fips)) };
    case 'paint': {
      const selection = withState(state.selection, action.fips, action.selected);
      return selection === state.selection ? state : { ...state, selection };
    }
    case 'selectAll':
      return { ...state, selection: Object.fromEntries(action.fips.map((f) => [f, SELECTED])) };
    case 'clear':
      return { ...state, selection: {} };
    case 'invert':
      return {
        ...state,
        selection: Object.fromEntries(
          action.fips.filter((f) => !isSelected(state.selection, f)).map((f) => [f, SELECTED]),
        ),
      };
    case 'load':
      return { settings: action.settings, selection: action.selection };
    case 'resetSettings':
      return { ...state, settings: DEFAULT_SETTINGS };
  }
}

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function StoreProvider({ initial, children }: { initial: AppState; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState(): AppState {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useAppState outside StoreProvider');
  return s;
}

export function useDispatch(): Dispatch<Action> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error('useDispatch outside StoreProvider');
  return d;
}
