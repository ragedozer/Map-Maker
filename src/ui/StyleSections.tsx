import { ColorField, OpacitySlider, Section, Segmented, Slider, Toggle } from './controls';
import { useAppState, useDispatch } from '../state/store';
import type { LineJoin, MapSettings, ProjectionMode } from '../state/settings';

function useSetter() {
  const dispatch = useDispatch();
  return <K extends keyof MapSettings>(key: K) =>
    (value: MapSettings[K]) =>
      dispatch({ type: 'set', key, value } as Parameters<typeof dispatch>[0]);
}

export function DetailSection() {
  const { settings: s } = useAppState();
  const set = useSetter();
  return (
    <Section title="Detail">
      <Slider label="Complexity" value={s.detail} min={0} max={100} onChange={set('detail')} />
    </Section>
  );
}

export function FillsSection() {
  const { settings: s } = useAppState();
  const set = useSetter();
  return (
    <Section title="Fills">
      <h3 className="subhead">Selected</h3>
      <ColorField label="Color" value={s.selectedFill} onChange={set('selectedFill')} />
      <OpacitySlider value={s.selectedOpacity} onChange={set('selectedOpacity')} />
      <h3 className="subhead">Unselected</h3>
      <ColorField label="Color" value={s.unselectedFill} onChange={set('unselectedFill')} />
      <OpacitySlider value={s.unselectedOpacity} onChange={set('unselectedOpacity')} />
      <Toggle label="Hide" checked={s.hideUnselected} onChange={set('hideUnselected')} />
    </Section>
  );
}

export function StrokesSection() {
  const { settings: s } = useAppState();
  const set = useSetter();
  return (
    <Section title="Strokes" aside={<span className="count">px @ 2160</span>}>
      <h3 className="subhead">Interior borders</h3>
      <ColorField label="Color" value={s.interiorColor} onChange={set('interiorColor')} />
      <Slider label="Width" value={s.interiorWidth} min={0} max={40} step={0.5} unit="px" onChange={set('interiorWidth')} />
      <OpacitySlider value={s.interiorOpacity} onChange={set('interiorOpacity')} />

      <h3 className="subhead">Outer border</h3>
      <ColorField label="Color" value={s.outerColor} onChange={set('outerColor')} />
      <Slider label="Width" value={s.outerWidth} min={0} max={40} step={0.5} unit="px" onChange={set('outerWidth')} />
      <OpacitySlider value={s.outerOpacity} onChange={set('outerOpacity')} />

      <h3 className="subhead">Selected outline</h3>
      <Toggle label="Enabled" checked={s.selectedOutline} onChange={set('selectedOutline')} />
      {s.selectedOutline && (
        <>
          <ColorField label="Color" value={s.selectedOutlineColor} onChange={set('selectedOutlineColor')} />
          <Slider
            label="Width"
            value={s.selectedOutlineWidth}
            min={0}
            max={40}
            step={0.5}
            unit="px"
            onChange={set('selectedOutlineWidth')}
          />
          <OpacitySlider value={s.selectedOutlineOpacity} onChange={set('selectedOutlineOpacity')} />
        </>
      )}

      <h3 className="subhead">Corners</h3>
      <Segmented<LineJoin>
        label="Line join"
        value={s.lineJoin}
        options={[
          { value: 'round', label: 'Round' },
          { value: 'miter', label: 'Miter' },
          { value: 'bevel', label: 'Bevel' },
        ]}
        onChange={set('lineJoin')}
      />
    </Section>
  );
}

export function LayoutSection() {
  const { settings: s } = useAppState();
  const set = useSetter();
  return (
    <Section title="Layout">
      <Segmented<ProjectionMode>
        label="Projection"
        value={s.projection}
        options={[
          { value: 'albersUsa', label: '50 + insets' },
          { value: 'contiguous', label: 'Lower 48' },
        ]}
        onChange={set('projection')}
      />
      <Slider label="Padding" value={s.padding} min={0} max={25} step={0.5} unit="%" onChange={set('padding')} />
      <Toggle label="Include DC" checked={s.includeDC} onChange={set('includeDC')} />
      <Toggle label="Background" checked={s.background} onChange={set('background')} />
      {s.background && <ColorField label="Color" value={s.backgroundColor} onChange={set('backgroundColor')} />}
    </Section>
  );
}
