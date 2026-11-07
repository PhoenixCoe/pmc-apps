'use client';
import { useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Seg } from '@/components/shared/Segmented';
import { contrast } from '@/lib/files';
import { hexToHsl, hslToHex } from '@/lib/color';
import { useLocalState } from '@/lib/useLocalState';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const LIGHT = [96, 90, 80, 68, 57, 47, 38, 29, 20, 12];
type Out = 'css' | 'tailwind' | 'json';
interface Ramp { name: string; hex: string }

/** Light and dark ends are fixed; the colour you pick sits at the 500 step. */
function ramp(hex: string, sat: number) {
  const { h, s } = hexToHsl(hex);
  return STEPS.map((step, i) => { const l = LIGHT[i], edge = Math.abs(l - 50) / 50; return [step, hslToHex({ h, s: Math.min(100, (s * sat) / 100 * (1 - edge * 0.35)), l })] as [number, string]; });
}

export default function View() {
  const [ramps, setRamps] = useLocalState<Ramp[]>('color-system-generator', 'ramps', [{ name: 'brand', hex: '#337957' }, { name: 'accent', hex: '#b49a57' }]);
  const [sat, setSat] = useLocalState('color-system-generator', 'sat', 100), [neutral, setNeutral] = useLocalState('color-system-generator', 'neutral', true);
  const [out, setOut] = useState<Out>('css');
  const all = useMemo(() => {
    const r = ramps.map((x) => ({ name: x.name || 'color', steps: ramp(x.hex, sat) }));
    if (neutral) r.push({ name: 'gray', steps: ramp(ramps[0] ? hslToHex({ ...hexToHsl(ramps[0].hex), s: 8, l: 50 }) : '#808080', 100) });
    return r;
  }, [ramps, sat, neutral]);
  const code = useMemo(() => {
    if (out === 'css') return `:root {\n${all.map((r) => r.steps.map(([s, c]) => `  --${r.name}-${s}: ${c};`).join('\n')).join('\n\n')}\n}\n`;
    if (out === 'tailwind') return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${all.map((r) => `        ${/^[a-z]+$/i.test(r.name) ? r.name : `'${r.name}'`}: {\n${r.steps.map(([s, c]) => `          ${s}: '${c}',`).join('\n')}\n        },`).join('\n')}\n      },\n    },\n  },\n};\n`;
    return JSON.stringify(Object.fromEntries(all.map((r) => [r.name, Object.fromEntries(r.steps)])), null, 2);
  }, [all, out]);
  const set = (i: number, p: Partial<Ramp>) => setRamps(ramps.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div className="split">
      <div className="panel">
        {ramps.map((r, i) => (
          <div key={i} className="cs-edit">
            <div className="field"><label htmlFor={`cs-n${i}`}>Name</label><input id={`cs-n${i}`} type="text" value={r.name} onChange={(e) => set(i, { name: e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase() })} /></div>
            <ColorPicker id={`cs-c${i}`} label="Main colour" value={r.hex} onChange={(hex) => set(i, { hex })} />
            {ramps.length > 1 && <button type="button" className="btn small" aria-label={`Remove ${r.name}`} onClick={() => setRamps(ramps.filter((_, j) => j !== i))}>✕</button>}
          </div>
        ))}
        {ramps.length < 5 && <div className="tool-actions"><button type="button" className="btn small" onClick={() => setRamps([...ramps, { name: `color${ramps.length + 1}`, hex: '#2f5d9e' }])}>+ Add a colour</button></div>}
        <div className="field"><label htmlFor="cs-sat">Strength: {sat}%</label><input id="cs-sat" type="range" min={40} max={130} value={sat} onChange={(e) => setSat(+e.target.value)} /></div>
        <label className="check"><input type="checkbox" checked={neutral} onChange={(e) => setNeutral(e.target.checked)} /> Add a grey set</label>
        {all.map((r) => (
          <div key={r.name} className="cs-ramp"><b>{r.name}</b><div className="cs-row">{r.steps.map(([s, c]) => <div key={s} className="cs-chip" style={{ background: c, color: contrast(c, '#ffffff') >= 4.5 ? '#fff' : '#171717' }}><span>{s}</span><small>{c}</small></div>)}</div></div>
        ))}
      </div>
      <div className="panel"><Seg<Out> value={out} onChange={setOut} label="Format" options={[{ value: 'css', label: 'CSS' }, { value: 'tailwind', label: 'Tailwind' }, { value: 'json', label: 'JSON' }]} /><CodeBox title={out === 'css' ? 'colors.css' : out === 'tailwind' ? 'tailwind.config.js' : 'colors.json'} text={code} /></div>
    </div>
  );
}
