'use client';
import { useMemo } from 'react';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { CopyButton } from '@/components/shared/CopyButton';
import { contrast } from '@/lib/files';
import { hexToHsl, hslToHex } from '@/lib/color';
import { useLocalState } from '@/lib/useLocalState';

const TESTS: [string, number][] = [['Normal text, level AA', 4.5], ['Large text, level AA', 3], ['Buttons and icons, level AA', 3], ['Normal text, level AAA', 7], ['Large text, level AAA', 4.5]];
/** Move the text colour lighter or darker, a little at a time, until it reaches the target. */
function nearest(fg: string, bg: string, target: number) {
  const { h, s, l } = hexToHsl(fg), dir = contrast('#ffffff', bg) >= contrast('#000000', bg) ? 1 : -1;
  for (let i = 0; i <= 100; i++) for (const d of [dir, -dir]) { const c = hslToHex({ h, s, l: l + d * i }); if (contrast(c, bg) >= target) return c; }
  return dir > 0 ? '#ffffff' : '#000000';
}

export default function View() {
  const [fg, setFg] = useLocalState('wcag-contrast-studio', 'fg', '#171717');
  const [bg, setBg] = useLocalState('wcag-contrast-studio', 'bg', '#f2e4ce');
  const ratio = useMemo(() => contrast(fg, bg), [fg, bg]);
  const fixes = useMemo(() => [4.5, 7].filter((t) => ratio < t).map((t) => ({ t, c: nearest(fg, bg, t) })), [fg, bg, ratio]);
  return (
    <div className="split">
      <div className="panel">
        <div className="row"><ColorPicker id="wc-fg" label="Text colour" value={fg} onChange={setFg} /><ColorPicker id="wc-bg" label="Background colour" value={bg} onChange={setBg} /></div>
        <div className="tool-actions"><button type="button" className="btn small" onClick={() => { setFg(bg); setBg(fg); }}>Swap colours</button></div>
        <div className="result" style={{ background: bg, color: fg, padding: 22 }} aria-label="Preview">
          <p style={{ fontSize: 34, fontWeight: 700, margin: 0 }}>Large heading</p>
          <p style={{ fontSize: 18, margin: '8px 0 0' }}>Everyday text looks like this, and it has to be easy to read.</p>
          <p style={{ fontSize: 13, margin: '8px 0 0' }}>Small print looks like this.</p>
          <p style={{ margin: '14px 0 0' }}><span style={{ border: `3px solid ${fg}`, padding: '6px 14px', display: 'inline-block', fontWeight: 700 }}>A button</span></p>
        </div>
      </div>
      <div className="panel">
        <div className="tool-actions"><span className="stat" style={{ fontSize: 28 }}>{ratio.toFixed(2)} : 1</span><CopyButton text={`${ratio.toFixed(2)}:1`} /></div>
        <ul className="wc-tests">{TESTS.map(([n, t]) => { const ok = ratio >= t; return <li key={n} className={ok ? 'ok' : 'bad'}><b>{ok ? 'Pass' : 'Fail'}</b> {n}<small>needs {t} : 1</small></li>; })}</ul>
        {fixes.length > 0 && <div className="field"><span className="label">Closest text colour that passes</span>{fixes.map(({ t, c }) => <div key={t} className="tool-actions"><span className="swatch" style={{ background: c }} aria-hidden /><b className="code">{c}</b><small>{t === 4.5 ? 'Level AA' : 'Level AAA'}</small><button type="button" className="btn small" onClick={() => setFg(c)}>Use it</button></div>)}</div>}
      </div>
    </div>
  );
}
