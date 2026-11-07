'use client';
import { useMemo } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { CopyButton } from '@/components/shared/CopyButton';
import { useLocalState } from '@/lib/useLocalState';

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const COMMON: [string, number, number][] = [['Square', 1, 1], ['Photo', 4, 3], ['Photo, tall', 3, 4], ['Classic photo', 3, 2], ['Widescreen', 16, 9], ['Phone, tall', 9, 16], ['Phone, long', 19.5, 9], ['Wide monitor', 21, 9], ['Laptop', 16, 10], ['Social post', 4, 5], ['Banner', 3, 1], ['Cinema', 2.39, 1]];
const SIZES: [string, number, number][] = [['Full HD', 1920, 1080], ['Quad HD', 2560, 1440], ['4K', 3840, 2160], ['Laptop', 1440, 900], ['Tablet', 1024, 768], ['Phone', 390, 844]];

export default function View() {
  const [w, setW] = useLocalState('screen-aspect-ratio-matrix', 'w', 1920), [h, setH] = useLocalState('screen-aspect-ratio-matrix', 'h', 1080), [target, setTarget] = useLocalState('screen-aspect-ratio-matrix', 'target', 800);
  const W = Math.max(1, w || 1), H = Math.max(1, h || 1), g = gcd(W, H), rw = W / g, rh = H / g, dec = W / H;
  const rows = useMemo(() => COMMON.map(([name, a, b]) => ({ name, a, b, h: Math.round((target * b) / a), match: Math.abs(a / b - dec) < 0.01 })), [target, dec]);
  const css = `.box {\n  aspect-ratio: ${rw} / ${rh};\n}\n\n/* older browsers */\n.wrap { position: relative; padding-top: ${((H / W) * 100).toFixed(3)}%; }\n.wrap > * { position: absolute; inset: 0; }\n`;
  return (
    <div className="split">
      <div className="panel">
        <div className="row"><div className="field"><label htmlFor="ar-w">Width</label><input id="ar-w" type="number" min={1} value={w} onChange={(e) => setW(+e.target.value)} /></div><div className="field"><label htmlFor="ar-h">Height</label><input id="ar-h" type="number" min={1} value={h} onChange={(e) => setH(+e.target.value)} /></div></div>
        <div className="tool-actions"><span className="stat" style={{ fontSize: 26 }}>{rw > 60 || rh > 60 ? dec.toFixed(2) + ' : 1' : `${rw} : ${rh}`}</span><CopyButton text={`${rw}:${rh}`} /><span className="stat">{((W * H) / 1e6).toFixed(2)} megapixels</span></div>
        <div className="ar-box"><div style={{ aspectRatio: `${W} / ${H}`, maxWidth: '100%', maxHeight: 220 }}>{W} × {H}</div></div>
        <div className="field"><span className="label">Start from a common size</span><div className="tool-actions">{SIZES.map(([n, a, b]) => <button key={n} type="button" className="chip" onClick={() => { setW(a); setH(b); }}>{n} {a}×{b}</button>)}</div></div>
        <CodeBox title="CSS" text={css} />
      </div>
      <div className="panel">
        <div className="field"><label htmlFor="ar-t">Width to scale to: {target}px</label><input id="ar-t" type="range" min={100} max={3840} step={10} value={target} onChange={(e) => setTarget(+e.target.value)} /></div>
        <table className="ar-table"><thead><tr><th>Shape</th><th>Ratio</th><th>Size</th><th /></tr></thead><tbody>{rows.map((r) => <tr key={r.name} className={r.match ? 'on' : ''}><td>{r.name}</td><td>{r.a} : {r.b}</td><td>{target} × {r.h}</td><td><button type="button" className="btn small" onClick={() => { setW(target); setH(r.h); }}>Use</button></td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
