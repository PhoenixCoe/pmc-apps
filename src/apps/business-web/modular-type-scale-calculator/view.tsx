'use client';
import { useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { Select } from '@/components/shared/Select';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';

const RATIOS: [string, number][] = [['Minor second — 1.067', 1.067], ['Major second — 1.125', 1.125], ['Minor third — 1.2', 1.2], ['Major third — 1.25', 1.25], ['Perfect fourth — 1.333', 1.333], ['Augmented fourth — 1.414', 1.414], ['Perfect fifth — 1.5', 1.5], ['Golden ratio — 1.618', 1.618]];
const NAMES = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
type Out = 'css' | 'scss' | 'tailwind';
const r = (n: number) => +n.toFixed(3);

export default function View() {
  const [base, setBase] = useLocalState('modular-type-scale-calculator', 'base', 16), [ratio, setRatio] = useLocalState('modular-type-scale-calculator', 'ratio', 1.25);
  const [down, setDown] = useLocalState('modular-type-scale-calculator', 'down', 2), [up, setUp] = useLocalState('modular-type-scale-calculator', 'up', 6);
  const [text, setText] = useState('The quick brown fox'), [out, setOut] = useState<Out>('css');
  const rows = useMemo(() => { const list = []; for (let i = up; i >= -down; i--) { const px = base * ratio ** i; list.push({ i, name: i === 0 ? 'base' : i > 0 ? (i <= 5 ? NAMES[2 + i] : `${i - 2}xl`) : NAMES[2 + i] ?? `${i}`, px: r(px), rem: r(px / 16), lh: r(Math.max(1.1, 1.7 - (px - base) / 120)) }); } return list; }, [base, ratio, down, up]);
  const nm = (s: string) => s.replace('-', 'm');
  const code = out === 'css' ? `:root {\n${[...rows].reverse().map((x) => `  --text-${nm(x.name)}: ${x.rem}rem; /* ${x.px}px */`).join('\n')}\n}\n` : out === 'scss' ? [...rows].reverse().map((x) => `$text-${nm(x.name)}: ${x.rem}rem; // ${x.px}px`).join('\n') + '\n' : `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      fontSize: {\n${[...rows].reverse().map((x) => `        '${nm(x.name)}': ['${x.rem}rem', { lineHeight: '${x.lh}' }],`).join('\n')}\n      },\n    },\n  },\n};\n`;
  return (
    <div className="split">
      <div className="panel">
        <div className="row">
          <div className="field"><label htmlFor="ts-b">Base size (px)</label><input id="ts-b" type="number" min={8} max={32} value={base} onChange={(e) => setBase(Math.min(32, Math.max(8, +e.target.value || 16)))} /></div>
          <div className="field"><label htmlFor="ts-r">Ratio</label><Select id="ts-r" value={String(ratio)} onChange={(v) => setRatio(+v)} options={RATIOS.map(([l, v]) => ({ value: String(v), label: l }))} /></div>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="ts-d">Steps down: {down}</label><input id="ts-d" type="range" min={0} max={4} value={down} onChange={(e) => setDown(+e.target.value)} /></div>
          <div className="field"><label htmlFor="ts-u">Steps up: {up}</label><input id="ts-u" type="range" min={1} max={9} value={up} onChange={(e) => setUp(+e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="ts-t">Preview text</label><input id="ts-t" type="text" value={text} onChange={(e) => setText(e.target.value)} /></div>
        <ul className="ts-list">{rows.map((x) => <li key={x.i}><span className="ts-meta"><b>{x.name}</b><small>{x.px}px · {x.rem}rem</small></span><span className="ts-sample" style={{ fontSize: Math.min(x.px, 96), lineHeight: x.lh }}>{text || 'Type here'}</span></li>)}</ul>
      </div>
      <div className="panel"><Seg<Out> value={out} onChange={setOut} label="Format" options={[{ value: 'css', label: 'CSS' }, { value: 'scss', label: 'SCSS' }, { value: 'tailwind', label: 'Tailwind' }]} /><CodeBox title="Type scale" text={code} /></div>
    </div>
  );
}
