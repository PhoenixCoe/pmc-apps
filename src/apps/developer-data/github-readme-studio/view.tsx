'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { FullscreenFrame } from '@/components/shared/FullscreenFrame';
import { Seg } from '@/components/shared/Segmented';
import { Select } from '@/components/shared/Select';
import { useLocalState } from '@/lib/useLocalState';
import { KINDS, TECH, toMarkdown, type Block, type Kind } from './blocks';
import { LoadGate, canvasSteps } from '@/components/shared/LoadingTracker';

let bid = Date.now();
const START: Block[] = (['header', 'badges', 'about', 'features', 'install', 'usage', 'license'] as Kind[]).map((k) => ({ id: bid++, kind: k, v: { ...KINDS[k].init } }));

function Inner() {
  const [blocks, setBlocks] = useLocalState<Block[]>('github-readme-studio', 'blocks', START);
  const [sel, setSel] = useState<number | null>(null), [tab, setTab] = useState<'preview' | 'code'>('preview'), [html, setHtml] = useState('');
  const drag = useRef<number | null>(null), [over, setOver] = useState<number | null>(null);
  const md = useMemo(() => toMarkdown(blocks), [blocks]);
  const cur = blocks.find((b) => b.id === sel) ?? null;
  const upd = (id: number, v: Record<string, string>) => setBlocks((p) => p.map((b) => (b.id === id ? { ...b, v: { ...b.v, ...v } } : b)));
  const add = (k: Kind) => { const b = { id: bid++, kind: k, v: { ...KINDS[k].init } }; setBlocks((p) => [...p, b]); setSel(b.id); };
  const move = (id: number, d: number) => setBlocks((p) => { const i = p.findIndex((b) => b.id === id), j = i + d; if (j < 0 || j >= p.length) return p; const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const drop = (to: number | 'new') => {
    const from = drag.current, kind = (window as unknown as { __kind?: Kind }).__kind; drag.current = null; setOver(null);
    if (from != null && to !== 'new') { if (from !== to) setBlocks((p) => { const a = p.find((b) => b.id === from)!, n = p.filter((b) => b.id !== from), i = n.findIndex((b) => b.id === to); n.splice(i, 0, a); return n; }); }
    else if (kind) { const b = { id: bid++, kind, v: { ...KINDS[kind].init } }; setBlocks((p) => { if (to === 'new') return [...p, b]; const n = [...p]; n.splice(n.findIndex((x) => x.id === to), 0, b); return n; }); setSel(b.id); (window as unknown as { __kind?: Kind }).__kind = undefined; }
  };
  useEffect(() => { let live = true; Promise.all([import('marked'), import('dompurify')]).then(([m, p]) => { if (live) setHtml(p.default.sanitize(m.marked.parse(md, { async: false, gfm: true }) as string, { ADD_ATTR: ['align'] })); }); return () => { live = false; }; }, [md]);

  const toolbar = <><button type="button" className="btn small" onClick={() => { if (confirm('Start again with the usual sections?')) setBlocks(START.map((b) => ({ ...b, id: bid++ }))); }}>Start again</button><CopyButton text={md} label="Copy README.md" /><button type="button" className="btn small" onClick={() => downloadText('README.md', md, 'text/markdown')}>Download README.md</button></>;
  const techSel = (cur?.v.list ?? '').split(',').filter(Boolean), stats = (cur?.v.show ?? '').split(',').filter(Boolean);
  return (
    <FullscreenFrame name="GitHub README Studio" toolbar={toolbar}>
      <div className="rs">
        <aside className="rs-lib" aria-label="Add a section">
          <h3 className="d">Add</h3>
          {(Object.keys(KINDS) as Kind[]).map((k) => <button key={k} type="button" className="rs-add" draggable onDragStart={() => { (window as unknown as { __kind?: Kind }).__kind = k; drag.current = null; }} onClick={() => add(k)}>+ {KINDS[k].name}</button>)}
        </aside>
        <section className="rs-list" aria-label="Your sections" onDragOver={(e) => e.preventDefault()} onDrop={() => drop('new')}>
          <h3 className="d">Sections</h3>
          {blocks.map((b, i) => (
            <div key={b.id} className={`rs-block${b.id === sel ? ' on' : ''}${over === b.id ? ' over' : ''}`} draggable onDragStart={() => { drag.current = b.id; (window as unknown as { __kind?: Kind }).__kind = undefined; }} onDragOver={(e) => { e.preventDefault(); setOver(b.id); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.stopPropagation(); drop(b.id); }}>
              <div className="rs-head"><button type="button" className="rs-name" aria-expanded={b.id === sel} onClick={() => setSel(b.id === sel ? null : b.id)}><span aria-hidden>⠿</span> <b className="d">{KINDS[b.kind].name}</b></button>
                <span><button type="button" className="btn small" aria-label={`Move ${KINDS[b.kind].name} up`} disabled={i === 0} onClick={() => move(b.id, -1)}>▲</button><button type="button" className="btn small" aria-label={`Move ${KINDS[b.kind].name} down`} disabled={i === blocks.length - 1} onClick={() => move(b.id, 1)}>▼</button><button type="button" className="btn small" aria-label={`Delete ${KINDS[b.kind].name}`} onClick={() => { setBlocks(blocks.filter((x) => x.id !== b.id)); if (sel === b.id) setSel(null); }}>✕</button></span></div>
              {b.id === sel && (
                <div className="rs-form">
                  {b.kind === 'badges' ? <>
                    <div className="rs-chips">{TECH.map(([n]) => <button key={n} type="button" className="chip" aria-pressed={techSel.includes(n)} onClick={() => upd(b.id, { list: (techSel.includes(n) ? techSel.filter((x) => x !== n) : [...techSel, n]).join(',') })}>{n}</button>)}</div>
                    <div className="field"><label htmlFor={`rs-st-${b.id}`}>Style</label><Select id={`rs-st-${b.id}`} value={b.v.style || 'for-the-badge'} onChange={(v) => upd(b.id, { style: v })} options={['for-the-badge', 'flat', 'flat-square', 'plastic'].map((s) => ({ value: s, label: s }))} /></div></>
                  : b.kind === 'stats' ? <>
                    <div className="field"><label htmlFor={`rs-u-${b.id}`}>GitHub username</label><input id={`rs-u-${b.id}`} type="text" value={b.v.user} onChange={(e) => upd(b.id, { user: e.target.value })} /></div>
                    <div className="tool-actions">{[['stats', 'Stats'], ['langs', 'Top languages'], ['streak', 'Streak']].map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={stats.includes(k)} onChange={(e) => upd(b.id, { show: (e.target.checked ? [...stats, k] : stats.filter((x) => x !== k)).join(',') })} /> {l}</label>)}</div></>
                  : KINDS[b.kind].fields.length === 0 ? <p className="hintx">Builds a list of links to your sections.</p>
                  : KINDS[b.kind].fields.map((f) => <div className="field" key={f.key}><label htmlFor={`rs-${b.id}-${f.key}`}>{f.label}</label>{f.area ? <textarea id={`rs-${b.id}-${f.key}`} style={{ minHeight: 90 }} className={['steps', 'code'].includes(f.key) ? 'code' : undefined} value={b.v[f.key] ?? ''} onChange={(e) => upd(b.id, { [f.key]: e.target.value })} /> : <input id={`rs-${b.id}-${f.key}`} type="text" value={b.v[f.key] ?? ''} onChange={(e) => upd(b.id, { [f.key]: e.target.value })} />}</div>)}
                </div>)}
            </div>))}
          {blocks.length === 0 && <div className="empty">Add a section from the left, or drag one here.</div>}
        </section>
        <section className="rs-out" aria-label="Result">
          <Seg<'preview' | 'code'> value={tab} onChange={setTab} label="Show" options={[{ value: 'preview', label: 'Preview' }, { value: 'code', label: 'README.md' }]} />
          {tab === 'preview' ? <div className="rs-prev md-preview" dangerouslySetInnerHTML={{ __html: html }} /> : <pre className="code rs-code" tabIndex={0}>{md}</pre>}
        </section>
      </div>
    </FullscreenFrame>
  );
}

/** The loading screen fills the whole window first, then the app opens. */
export default function View() {
  return <LoadGate title="GitHub README Studio" what="assets" steps={[...canvasSteps().slice(0, 1), { label: 'Loading the Markdown reader', run: async () => { await Promise.all([import('marked'), import('dompurify')]); } }, ...canvasSteps().slice(1)]}><Inner /></LoadGate>;
}
