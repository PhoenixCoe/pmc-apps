'use client';
import { useMemo, useRef, useState } from 'react';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Seg, Segmented } from '@/components/shared/Segmented';
import { Select } from '@/components/shared/Select';
import { downloadBlob } from '@/components/shared/CopyButton';
import { useLocalState } from '@/lib/useLocalState';
import { guess, highlight, LANGS, type Tok } from './highlight';

type Theme = { bg: string; fg: string; bar: string; kw: string; str: string; com: string; num: string; fn: string; pun: string; type: string; ln: string };
const THEMES: Record<string, Theme> = {
  'PMC night': { bg: '#171717', fg: '#F2E4CE', bar: '#232323', kw: '#6fcf97', str: '#e5c07b', com: '#7d7a6e', num: '#e08a6a', fn: '#B49A57', pun: '#a79f8d', type: '#9fd0e6', ln: '#5d5a50' },
  'PMC paper': { bg: '#FBF6EC', fg: '#171717', bar: '#EADFC9', kw: '#1A4934', str: '#8a5a00', com: '#8d8777', num: '#A33A2B', fn: '#337957', pun: '#6b665a', type: '#2f5f8a', ln: '#b3ab98' },
  Midnight: { bg: '#0f172a', fg: '#e2e8f0', bar: '#1e293b', kw: '#c084fc', str: '#86efac', com: '#64748b', num: '#fdba74', fn: '#7dd3fc', pun: '#94a3b8', type: '#fcd34d', ln: '#475569' },
  Sand: { bg: '#2b2620', fg: '#eadfca', bar: '#383128', kw: '#e0a458', str: '#a8c686', com: '#8a7f6a', num: '#d98a7a', fn: '#9ec5d6', pun: '#b3a68c', type: '#d7b8e8', ln: '#6b604f' },
  Mono: { bg: '#ffffff', fg: '#111111', bar: '#eeeeee', kw: '#000000', str: '#444444', com: '#999999', num: '#222222', fn: '#000000', pun: '#666666', type: '#222222', ln: '#bbbbbb' },
};
interface S { theme: string; lang: string; title: string; chrome: 'mac' | 'win' | 'none'; lines: boolean; pad: number; size: number; width: number; radius: number; shadow: boolean; bg1: string; bg2: string; bgKind: 'gradient' | 'colour' | 'none' }
const DEF: S = { theme: 'PMC night', lang: 'auto', title: 'example.ts', chrome: 'mac', lines: false, pad: 56, size: 16, width: 720, radius: 12, shadow: true, bg1: '#337957', bg2: '#1A4934', bgKind: 'gradient' };
const SAMPLE = `type Note = { id: number; text: string };\n\n// Add a note and return the new list\nexport function addNote(list: Note[], text: string): Note[] {\n  const id = list.length + 1;\n  return [...list, { id, text }];\n}\n`;

export default function View() {
  const [s, setS] = useLocalState<S>('code-snapshot-studio', 'settings', DEF);
  const [code, setCode] = useLocalState('code-snapshot-studio', 'code', SAMPLE);
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const card = useRef<HTMLDivElement>(null);
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((p) => ({ ...p, [k]: v }));
  const lang = s.lang === 'auto' ? guess(code) : s.lang, th = THEMES[s.theme] ?? THEMES['PMC night'];
  const lines: Tok[][] = useMemo(() => highlight(code.replace(/\t/g, '  ').replace(/\n$/, ''), lang), [code, lang]);
  const bg = s.bgKind === 'gradient' ? `linear-gradient(135deg, ${s.bg1}, ${s.bg2})` : s.bgKind === 'colour' ? s.bg1 : 'transparent';
  const render = async () => { const { toBlob } = await import('html-to-image'); await document.fonts?.ready; const b = await toBlob(card.current!, { pixelRatio: 2, cacheBust: true }); if (!b) throw new Error('empty'); return b; };
  const save = async () => { setBusy(true); setMsg(''); try { downloadBlob('code-snapshot.png', await render()); } catch { setMsg('The picture could not be made. Try again.'); } setBusy(false); };
  const copy = async () => { setBusy(true); setMsg(''); try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': await render() })]); setMsg('Picture copied.'); } catch { setMsg('Your browser would not copy the picture. Use Download.'); } setBusy(false); };
  const col = (t: Tok['t']) => (t === 'txt' ? th.fg : th[t]);

  return (
    <div className="panel">
      <div className="split">
        <div className="field"><label htmlFor="cs-c">Your code</label><textarea id="cs-c" className="code" style={{ minHeight: 300 }} value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} /></div>
        <div className="field" style={{ gap: 14 }}>
          <div className="row">
            <div className="field"><label htmlFor="cs-l">Language</label><Select id="cs-l" value={s.lang} onChange={(v) => set('lang', v)} options={[{ value: 'auto', label: `Detect (${LANGS[guess(code)].name})` }, ...Object.entries(LANGS).map(([k, v]) => ({ value: k, label: v.name }))]} /></div>
            <div className="field"><label htmlFor="cs-t">Colours</label><Select id="cs-t" value={s.theme} onChange={(v) => set('theme', v)} options={Object.keys(THEMES).map((k) => ({ value: k, label: k }))} /></div>
          </div>
          <div className="field"><label htmlFor="cs-n">File name in the title bar</label><input id="cs-n" type="text" value={s.title} onChange={(e) => set('title', e.target.value)} /></div>
          <Segmented<S['chrome']> label="Window" value={s.chrome} onChange={(v) => set('chrome', v)} options={[{ value: 'mac', label: 'Mac dots' }, { value: 'win', label: 'Windows' }, { value: 'none', label: 'None' }]} />
          <Seg<S['bgKind']> value={s.bgKind} onChange={(v) => set('bgKind', v)} label="Background" options={[{ value: 'gradient', label: 'Gradient' }, { value: 'colour', label: 'Colour' }, { value: 'none', label: 'Clear' }]} />
          {s.bgKind !== 'none' && <div className="row"><ColorPicker value={s.bg1} onChange={(v) => set('bg1', v)} label="First colour" />{s.bgKind === 'gradient' && <ColorPicker value={s.bg2} onChange={(v) => set('bg2', v)} label="Second colour" />}</div>}
          <div className="row">
            <div className="field"><label htmlFor="cs-w">Width: {s.width}px</label><input id="cs-w" type="range" min={360} max={1100} step={20} value={s.width} onChange={(e) => set('width', +e.target.value)} /></div>
            <div className="field"><label htmlFor="cs-z">Text: {s.size}px</label><input id="cs-z" type="range" min={11} max={26} value={s.size} onChange={(e) => set('size', +e.target.value)} /></div>
            <div className="field"><label htmlFor="cs-p">Space around: {s.pad}px</label><input id="cs-p" type="range" min={0} max={120} step={4} value={s.pad} onChange={(e) => set('pad', +e.target.value)} /></div>
          </div>
          <div className="tool-actions"><label className="check"><input type="checkbox" checked={s.lines} onChange={(e) => set('lines', e.target.checked)} /> Line numbers</label><label className="check"><input type="checkbox" checked={s.shadow} onChange={(e) => set('shadow', e.target.checked)} /> Shadow</label><label className="check"><input type="checkbox" checked={s.radius > 0} onChange={(e) => set('radius', e.target.checked ? 12 : 0)} /> Round corners</label></div>
        </div>
      </div>
      <div className="cs-stage">
        <div ref={card} className="cs-bg" style={{ background: bg, padding: s.pad, width: s.width + s.pad * 2 }}>
          <div className="cs-win" style={{ background: th.bg, color: th.fg, borderRadius: s.radius, boxShadow: s.shadow ? '0 24px 60px rgba(0,0,0,0.45)' : 'none', fontSize: s.size, width: s.width }}>
            {s.chrome !== 'none' && (
              <div className="cs-bar" style={{ background: th.bar, borderTopLeftRadius: s.radius, borderTopRightRadius: s.radius, flexDirection: s.chrome === 'win' ? 'row-reverse' : 'row' }}>
                {s.chrome === 'mac' ? <span className="cs-dots"><i style={{ background: '#ff5f57' }} /><i style={{ background: '#febc2e' }} /><i style={{ background: '#28c840' }} /></span> : <span className="cs-dots win" style={{ color: th.pun }}>–&nbsp;&nbsp;☐&nbsp;&nbsp;✕</span>}
                <span className="cs-title" style={{ color: th.pun, fontSize: Math.max(11, s.size - 3) }}>{s.title}</span><span style={{ width: 54 }} />
              </div>)}
            <pre className="cs-code">{lines.map((ln, i) => <div key={i} className="cs-line">{s.lines && <span className="cs-ln" style={{ color: th.ln }}>{i + 1}</span>}<span>{ln.length ? ln.map((t, j) => <span key={j} style={{ color: col(t.t), fontStyle: t.t === 'com' ? 'italic' : undefined }}>{t.v}</span>) : '​'}</span></div>)}</pre>
          </div>
        </div>
      </div>
      <div className="tool-actions"><button type="button" className="btn primary" onClick={save} disabled={busy}>{busy ? 'Working…' : 'Download PNG'}</button><button type="button" className="btn" onClick={copy} disabled={busy}>Copy picture</button>{msg && <span role="status">{msg}</span>}</div>
    </div>
  );
}
