import { Button, Section } from './controls';
import { useAppState, useDispatch } from '../state/store';
import { isSelected, selectableFips } from '../state/selection';
import { stateInfo } from '../data/states';

export function SelectionSection() {
  const { settings, selection } = useAppState();
  const dispatch = useDispatch();
  const all = selectableFips(settings);
  const selected = all
    .filter((f) => isSelected(selection, f))
    .sort((a, b) => (stateInfo(a)!.postal < stateInfo(b)!.postal ? -1 : 1));

  return (
    <Section title="Selection" aside={<span className="count">{selected.length} / {all.length}</span>}>
      <div className="btn-row">
        <Button onClick={() => dispatch({ type: 'selectAll', fips: all })}>Select all</Button>
        <Button onClick={() => dispatch({ type: 'clear' })} disabled={!selected.length}>
          Clear
        </Button>
        <Button onClick={() => dispatch({ type: 'invert', fips: all })}>Invert</Button>
      </div>
      {selected.length ? (
        <div className="chips">
          {selected.map((f) => (
            <button
              key={f}
              type="button"
              className="chip"
              title={`Deselect ${stateInfo(f)!.name}`}
              onClick={() => dispatch({ type: 'toggle', fips: f })}
            >
              {stateInfo(f)!.postal}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="hint">Click or drag across states to select.</p>
      )}
    </Section>
  );
}
