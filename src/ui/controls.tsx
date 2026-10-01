import { useEffect, useId, useState, type ReactNode } from 'react';

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="section">
      <header className="section-head">
        <h2>{title}</h2>
        {aside}
      </header>
      <div className="section-body">{children}</div>
    </section>
  );
}

export function Row({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="row">
      <label className="row-label" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="row-control">{children}</div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant,
  title,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`btn ${variant ?? ''}`} onClick={onClick} title={title} disabled={disabled}>
      {children}
    </button>
  );
}

const round = (v: number, step: number) => {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number(v.toFixed(decimals));
};

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string) => {
    const v = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(v)) return setDraft(String(value));
    onChange(round(Math.min(max, Math.max(min, v)), step));
  };

  return (
    <Row label={label} htmlFor={id}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${((value - min) / (max - min)) * 100}%` }}
      />
      <span className="num">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          aria-label={`${label} value`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.currentTarget.value);
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              const delta = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
              onChange(round(Math.min(max, Math.max(min, value + delta)), step));
            }
          }}
        />
        {unit && <i>{unit}</i>}
      </span>
    </Row>
  );
}

/** Opacity is stored 0–1 but edited as a percentage. */
export function OpacitySlider({ value, onChange, label = 'Opacity' }: { value: number; onChange: (v: number) => void; label?: string }) {
  return <Slider label={label} value={Math.round(value * 100)} min={0} max={100} unit="%" onChange={(v) => onChange(v / 100)} />;
}

function normalizeHex(raw: string): string | null {
  let h = raw.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) h = h.replace(/./g, (c) => c + c);
  return /^[0-9a-f]{6}$/.test(h) ? `#${h}` : null;
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(value.replace('#', '').toUpperCase());
  useEffect(() => setDraft(value.replace('#', '').toUpperCase()), [value]);

  const commit = (raw: string) => {
    const hex = normalizeHex(raw);
    if (hex) onChange(hex);
    else setDraft(value.replace('#', '').toUpperCase());
  };

  return (
    <Row label={label} htmlFor={id}>
      <span className="color">
        <span className="swatch" style={{ background: value }}>
          <input type="color" value={value} aria-label={`${label} picker`} onChange={(e) => onChange(e.target.value)} />
        </span>
        <span className="hash">#</span>
        <input
          id={id}
          type="text"
          spellCheck={false}
          maxLength={7}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = e.target.value.replace(/^#/, '').length === 6 ? normalizeHex(e.target.value) : null;
            if (hex) onChange(hex);
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
        />
      </span>
    </Row>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <Row label={label} htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </Row>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Row label={label}>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={o.value === value ? 'active' : ''}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Row>
  );
}
