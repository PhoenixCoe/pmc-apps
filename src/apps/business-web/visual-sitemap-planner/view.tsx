'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { FullscreenViewport, type ViewportApi } from '@/components/shared/FullscreenViewport';
import { Select } from '@/components/shared/Select';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { H, START, W, descendants, kids, layout, outline, pathOf, slugify, xml, type Page } from './tree';
import { LoadGate, canvasSteps } from '@/components/shared/LoadingTracker';

const FREQ = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'], PRI = ['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3'];
type Out = 'xml' | 'outline';

function Inner() {
  const [list, setList] = useLocalState<Page[]>('visual-sitemap-planner', 'pages', START), [base, setBase] = useLocalState('visual-sitemap-planner', 'base', 'https://www.example.com');
  const [sel, setSel] = useState<number | null>(list[0]?.id ?? null), [out, setOut] = useState<Out>('xml');
  const api = useRef<ViewportApi | null>(null);
  const { pos, box } = useMemo(() => layout(list), [list]);
  const cur = list.find((p) => p.id === sel) ?? null;
  const refit = () => requestAnimationFrame(() => api.current?.fit(box));
  useEffect(() => { const t = setTimeout(refit, 60); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const upd = (p: Partial<Page>) => cur && setList(list.map((x) => (x.id === cur.id ? { ...x, ...p } : x)));
  const add = (parent: number | null) => { const id = Date.now(); setList([...list, { id, parent, title: 'New page', slug: 'new-page', priority: '0.5', freq: 'monthly' }]); setSel(id); setTimeout(refit, 30); };
  const del = () => { if (!cur) return; const gone = new Set([cur.id, ...descendants(list, cur.id)]); const n = list.filter((p) => !gone.has(p.id)); setList(n); setSel(n[0]?.id ?? null); setTimeout(refit, 30); };
  const move = (d: number) => { if (!cur) return; const sib = kids(list, cur.parent), i = sib.findIndex((p) => p.id === cur.id), j = i + d; if (j < 0 || j >= sib.length) return; const a = list.indexOf(sib[i]), b = list.indexOf(sib[j]), n = [...list]; [n[a], n[b]] = [n[b], n[a]]; setList(n); };
  const text = out === 'xml' ? xml(list, base) : outline(list);
  const side = (
    <div className="side-card">
      {cur ? <>
        <div className="field"><label htmlFor="vs-t">Page name</label><input id="vs-t" type="text" value={cur.title} onChange={(e) => upd({ title: e.target.value, slug: cur.parent === null ? '' : slugify(e.target.value) || cur.slug })} /></div>
        {cur.parent !== null && <div className="field"><label htmlFor="vs-s">Address ending</label><input id="vs-s" type="text" value={cur.slug} onChange={(e) => upd({ slug: slugify(e.target.value) })} /><small className="hintx code">{pathOf(list, cur)}</small></div>}
        <div className="row"><div className="field"><label htmlFor="vs-p">Importance</label><Select id="vs-p" value={cur.priority} onChange={(v) => upd({ priority: v })} options={PRI.map((p) => ({ value: p, label: p }))} /></div>
          <div className="field"><label htmlFor="vs-f">Changes</label><Select id="vs-f" value={cur.freq} onChange={(v) => upd({ freq: v })} options={FREQ.map((p) => ({ value: p, label: p }))} /></div></div>
        <div className="tool-actions"><button type="button" className="btn primary small" onClick={() => add(cur.id)}>+ Page below</button><button type="button" className="btn small" onClick={() => add(cur.parent)}>+ Page beside</button><button type="button" className="btn small" onClick={() => move(-1)} aria-label="Move earlier">←</button><button type="button" className="btn small" onClick={() => move(1)} aria-label="Move later">→</button>{cur.parent !== null && <button type="button" className="btn small" onClick={del}>Delete</button>}</div>
      </> : <div className="tool-actions"><button type="button" className="btn primary" onClick={() => add(null)}>+ Home page</button></div>}
      <div className="field"><label htmlFor="vs-b">Website address</label><input id="vs-b" type="text" value={base} onChange={(e) => setBase(e.target.value)} /></div>
      <Seg<Out> value={out} onChange={setOut} label="Output" options={[{ value: 'xml', label: 'sitemap.xml' }, { value: 'outline', label: 'Outline' }]} />
      <CodeBox title={out === 'xml' ? 'sitemap.xml' : 'Outline'} text={text} />
    </div>
  );
  return (
    <FullscreenViewport name="Visual Sitemap Planner" sideLabel="Pages" side={side} sideWide minZoom={0.2} maxZoom={2} onFullChange={refit} onBackgroundDown={() => setSel(null)}
      toolbar={<><button type="button" className="btn small" onClick={() => add(sel)}>+ Add page</button><button type="button" className="btn small" onClick={refit}>Fit</button></>}>
      {(a) => {
        api.current = a;
        return <>
          <svg className="vs-lines" width={box.x1 + 400} height={box.y1 + 200} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} aria-hidden>
            {list.filter((p) => p.parent !== null && pos.has(p.id) && pos.has(p.parent)).map((p) => { const c = pos.get(p.id)!, q = pos.get(p.parent!)!, x1 = q.x + W / 2, y1 = q.y + H, x2 = c.x + W / 2, y2 = c.y, m = (y1 + y2) / 2; return <path key={p.id} d={`M${x1} ${y1} V${m} H${x2} V${y2}`} fill="none" stroke="currentColor" strokeWidth={3} />; })}
          </svg>
          {list.map((p) => { const o = pos.get(p.id); if (!o) return null; return (
            <button key={p.id} type="button" className={`vs-node${p.id === sel ? ' on' : ''}`} style={{ left: o.x, top: o.y, width: W, height: H }} aria-pressed={p.id === sel} onClick={() => setSel(p.id)}>
              <b>{p.title || 'Untitled'}</b><small>{pathOf(list, p)}</small>
            </button>); })}
        </>;
      }}
    </FullscreenViewport>
  );
}

/** The loading screen fills the whole window first, then the app opens. */
export default function View() {
  return <LoadGate title="Visual Sitemap Planner" what="assets" steps={canvasSteps()}><Inner /></LoadGate>;
}
