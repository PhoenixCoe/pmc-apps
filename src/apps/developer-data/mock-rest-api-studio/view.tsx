'use client';
import { useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { Select } from '@/components/shared/Select';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { CODE, TOKENS, build, check, match, sampleUrl, type Endpoint } from './mock';

const START: Endpoint[] = [
  { id: 1, method: 'GET', path: '/users', status: 200, delay: 300, count: 5, body: '{\n  "id": {{index}},\n  "name": "{{name}}",\n  "email": "{{email}}",\n  "active": {{bool}}\n}' },
  { id: 2, method: 'GET', path: '/users/{id}', status: 200, delay: 0, count: 1, body: '{\n  "id": {{param id}},\n  "name": "{{name}}",\n  "city": "{{city}}"\n}' },
  { id: 3, method: 'POST', path: '/users', status: 201, delay: 200, count: 1, body: '{\n  "id": "{{uuid}}",\n  "created": "{{date}}"\n}' },
];
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
type Out = 'try' | 'msw' | 'express' | 'openapi';

export default function View() {
  const [list, setList] = useLocalState<Endpoint[]>('mock-rest-api-studio', 'endpoints', START);
  const [sel, setSel] = useState(list[0]?.id ?? 0), [out, setOut] = useState<Out>('try');
  const [url, setUrl] = useState('/users'), [method, setMethod] = useState('GET'), [res, setRes] = useState<{ status: number; ms: number; body: string } | null>(null), [busy, setBusy] = useState(false);
  const cur = list.find((e) => e.id === sel) ?? list[0];
  const err = cur ? check(cur.body) : null;
  const upd = (p: Partial<Endpoint>) => cur && setList(list.map((e) => (e.id === cur.id ? { ...e, ...p } : e)));
  const add = () => { const id = Date.now(); setList([...list, { id, method: 'GET', path: '/things', status: 200, delay: 0, count: 1, body: '{\n  "id": {{index}},\n  "name": "{{word}}"\n}' }]); setSel(id); };
  const del = () => { if (!cur) return; const n = list.filter((e) => e.id !== cur.id); setList(n); setSel(n[0]?.id ?? 0); };
  const run = async () => {
    setBusy(true); setRes(null); const t0 = performance.now(), hit = match(list, method, url);
    if (!hit) { setRes({ status: 404, ms: 0, body: JSON.stringify({ error: 'No endpoint matches that method and path.' }, null, 2) }); setBusy(false); return; }
    await new Promise((r) => setTimeout(r, hit.e.delay));
    try { setRes({ status: hit.e.status, ms: Math.round(performance.now() - t0), body: JSON.stringify(build(hit.e, hit.params), null, 2) }); } catch { setRes({ status: 500, ms: 0, body: JSON.stringify({ error: 'The body is not valid JSON yet.' }, null, 2) }); }
    setBusy(false);
  };
  const code = useMemo(() => (out === 'try' ? '' : CODE[out](list)), [out, list]);
  return (
    <div className="split">
      <div className="panel">
        <div className="tool-actions"><button type="button" className="btn primary small" onClick={add}>+ New endpoint</button>{cur && <button type="button" className="btn small" onClick={del}>Delete</button>}</div>
        <ul className="tp-list" role="listbox" aria-label="Endpoints">{list.map((e) => <li key={e.id}><button type="button" role="option" aria-selected={e.id === sel} className={`btn small${e.id === sel ? ' gold' : ''}`} onClick={() => { setSel(e.id); setMethod(e.method); setUrl(sampleUrl(e.path)); setRes(null); }}><b>{e.method}</b> {e.path}</button></li>)}</ul>
        {cur ? <>
          <div className="row">
            <div className="field"><label htmlFor="mk-m">Method</label><Select id="mk-m" value={cur.method} onChange={(v) => upd({ method: v })} options={METHODS.map((m) => ({ value: m, label: m }))} /></div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}><label htmlFor="mk-p">Path (use {'{id}'} for a changing part)</label><input id="mk-p" type="text" value={cur.path} onChange={(e) => upd({ path: e.target.value.startsWith('/') ? e.target.value : '/' + e.target.value })} /></div>
          </div>
          <div className="row">
            <div className="field"><label htmlFor="mk-s">Status</label><input id="mk-s" type="number" min={100} max={599} value={cur.status} onChange={(e) => upd({ status: +e.target.value || 200 })} /></div>
            <div className="field"><label htmlFor="mk-d">Wait (ms)</label><input id="mk-d" type="number" min={0} max={10000} value={cur.delay} onChange={(e) => upd({ delay: Math.max(0, +e.target.value || 0) })} /></div>
            <div className="field"><label htmlFor="mk-c">How many items</label><input id="mk-c" type="number" min={1} max={100} value={cur.count} onChange={(e) => upd({ count: Math.min(100, Math.max(1, +e.target.value || 1)) })} /></div>
          </div>
          <div className="field"><label htmlFor="mk-b">Reply (JSON)</label><textarea id="mk-b" className="code" style={{ minHeight: 190 }} value={cur.body} onChange={(e) => upd({ body: e.target.value })} spellCheck={false} />
            {err ? <p className="bad" role="alert">{err}</p> : <p className="ok">Looks good.</p>}</div>
          <div className="field"><span className="label">Click to add</span><div className="tool-actions">{TOKENS.map(([t, n]) => <button key={t} type="button" className="chip" title={t} onClick={() => upd({ body: cur.body.replace(/\s*$/, '') + ' ' + t })}>{n}</button>)}</div></div>
        </> : <p className="empty">Add an endpoint to start.</p>}
      </div>
      <div className="panel">
        <Seg<Out> value={out} onChange={setOut} label="View" options={[{ value: 'try', label: 'Try it' }, { value: 'msw', label: 'MSW' }, { value: 'express', label: 'Express' }, { value: 'openapi', label: 'OpenAPI' }]} />
        {out === 'try' ? <>
          <div className="row"><div className="field"><label htmlFor="mk-tm">Method</label><Select id="mk-tm" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: m }))} /></div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}><label htmlFor="mk-tu">Address</label><input id="mk-tu" type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} /></div></div>
          <div className="tool-actions"><button type="button" className="btn primary" onClick={run} disabled={busy}>{busy ? 'Waiting…' : 'Send'}</button></div>
          {res && <><div className="tool-actions"><span className="stat" style={{ background: res.status < 300 ? 'var(--g1)' : res.status < 400 ? 'var(--gold)' : 'var(--danger)' }}>{res.status}</span><span className="stat">{res.ms} ms</span></div><CodeBox title="Reply" text={res.body} /></>}
          {!res && <p className="empty">Press Send to see a reply.</p>}
        </> : <CodeBox title={out === 'openapi' ? 'openapi.json' : out === 'msw' ? 'handlers.js' : 'server.js'} text={code} empty="No endpoints." />}
      </div>
    </div>
  );
}
