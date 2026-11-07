'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pop } from './Pop';

type Hsv = { h: number; s: number; v: number };
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const normHex = (s: string): string | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim()); if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return '#' + h.toLowerCase();
};
const toHsv = (hex: string): Hsv => {
  const n = normHex(hex) ?? '#ffffff', r = parseInt(n.slice(1, 3), 16) / 255, g = parseInt(n.slice(3, 5), 16) / 255, b = parseInt(n.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
};
const toHex = ({ h, s, v }: Hsv) => {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
};

/** Colours to start from: the PMC ones first, then plain everyday colours. */
const PRESETS: [string, string][] = [
  ['#171717', 'Black'], ['#ffffff', 'White'], ['#f2e4ce', 'Cream'], ['#b49a57', 'Gold'], ['#337957', 'Green'], ['#1a4934', 'Deep green'],
  ['#a33a2b', 'Red'], ['#d9822b', 'Orange'], ['#e8c547', 'Yellow'], ['#2f5d9e', 'Blue'], ['#6b4fa0', 'Purple'], ['#e58fb0', 'Pink'],
];

function Drag({ className, onMove, children, label, onKey }: { className: string; onMove: (x: number, y: number) => void; children: React.ReactNode; label: string; onKey: (e: React.KeyboardEvent) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const go = (e: React.PointerEvent) => { const r = el.current!.getBoundingClientRect(); onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)); };
  return (
    <div ref={el} className={className} role="slider" tabIndex={0} aria-label={label} onKeyDown={onKey}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus(); go(e); }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) go(e); }}>{children}</div>
  );
}

/** The site's own colour picker: pick from the swatches, drag in the square, or type a code. */
export function ColorPicker({ value, onChange, id, label, compact, onOpen, empty = 'Not set' }: {
  value: string; onChange: (hex: string) => void; id?: string; label?: string; compact?: boolean; onOpen?: () => void; empty?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => toHsv(value || '#ffffff'));
  const [text, setText] = useState(value);
  const btn = useRef<HTMLButtonElement>(null);
  const hex = normHex(value) ?? '';

  const close = useCallback((back: boolean) => { setOpen(false); if (back) requestAnimationFrame(() => btn.current?.focus()); }, []);
  const show = () => { onOpen?.(); setHsv(toHsv(value || '#ffffff')); setText(hex); setOpen(true); };
  const set = (n: Hsv) => { setHsv(n); const h = toHex(n); setText(h); onChange(h); };
  const preset = (h: string) => { setHsv(toHsv(h)); setText(h); onChange(h); };
  useEffect(() => { if (open && hex && hex !== toHex(hsv)) setText(hex); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hex]);

  const svKey = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? 0.1 : 0.02;
    const m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key as 'ArrowLeft'];
    if (m) { e.preventDefault(); set({ ...hsv, s: clamp(hsv.s + m[0]), v: clamp(hsv.v + m[1]) }); }
  };
  const hueKey = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? 30 : 6;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); set({ ...hsv, h: (hsv.h + (e.key === 'ArrowRight' ? d : -d) + 360) % 360 }); }
  };

  return (
    <>
      <button ref={btn} type="button" id={id} className={`ui-col${compact ? ' compact' : ''}${open ? ' open' : ''}`} aria-haspopup="dialog" aria-expanded={open} aria-label={label ? `${label}: ${hex || 'not set'}` : undefined}
        onClick={() => (open ? close(false) : show())}>
        <i className={`ui-sw${hex ? '' : ' off'}`} style={hex ? { background: hex } : undefined} />
        {!compact && <span className="code">{hex ? hex.toUpperCase() : empty}</span>}
      </button>
      {open && (
        <Pop anchor={btn} onClose={close} label={label ?? 'Pick a colour'} className="ui-picker" match={false}>
          <Drag className="ui-sv" label="Shade: left to right is paler to stronger, top to bottom is lighter to darker" onKey={svKey} onMove={(x, y) => set({ ...hsv, s: x, v: 1 - y })}>
            <span className="ui-sv-bg" style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }} />
            <i className="ui-knob" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
          </Drag>
          <Drag className="ui-hue" label="Colour" onKey={hueKey} onMove={(x) => set({ ...hsv, h: x * 360 })}>
            <i className="ui-knob bar" style={{ left: `${(hsv.h / 360) * 100}%` }} />
          </Drag>
          <div className="ui-sws" role="group" aria-label="Quick colours">
            {PRESETS.map(([h, n]) => <button key={h} type="button" className={hex === h ? 'on' : ''} style={{ background: h }} aria-label={n} title={n} onClick={() => preset(h)} />)}
          </div>
          <div className="ui-hex">
            <i className="ui-sw" style={{ background: toHex(hsv) }} />
            <input type="text" className="code" value={text} aria-label="Colour code" spellCheck={false} maxLength={7}
              onChange={(e) => { setText(e.target.value); const n = normHex(e.target.value); if (n) { setHsv(toHsv(n)); onChange(n); } }}
              onKeyDown={(e) => { if (e.key === 'Enter') close(true); }} />
            <button type="button" className="btn small" onClick={() => close(true)}>Done</button>
          </div>
        </Pop>
      )}
    </>
  );
}
