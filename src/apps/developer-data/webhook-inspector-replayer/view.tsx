'use client';
import { useEffect, useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { Select } from '@/components/shared/Select';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { parseRequest, provider, toCurl, type Req } from './parse';

interface Saved extends Req { id: number; name: string; at: number }
interface Res { status: number; text: string; ms: number; headers: [string, string][]; body: string; size: number }
const SAMPLE = `POST /hooks/deploy HTTP/1.1
Host: example.com
Content-Type: application/json
X-GitHub-Event: push

{"ref":"refs/heads/main","repository":{"name":"demo"},"pusher":{"name":"alex"}}`;
const pretty = (b: string, ct: string) => { if (/json/i.test(ct) || /^\s*[{[]/.test(b)) { try { return JSON.stringify(JSON.parse(b), null, 2); } catch { /* not json */ } } if (/x-www-form-urlencoded/i.test(ct)) { try { return [...new URLSearchParams(b)].map(([k, v]) => `${k} = ${v}`).join('\n'); } catch { /* ignore */ } } return b; };

export default function View() {
  const [raw, setRaw] = useLocalState('webhook-inspector-replayer', 'raw', SAMPLE);
  const [req, setReq] = useState<Req | null>(null), [err, setErr] = useState('');
  const [hist, setHist] = useLocalState<Saved[]>('webhook-inspector-replayer', 'history', []);
  const [tab, setTab] = useState<'look' | 'send'>('look'), [secret, setSecret] = useState(''), [sig, setSig] = useState<string | null>(null);
  const [res, setRes] = useState<Res | null>(null), [busy, setBusy] = useState(false), [fail, setFail] = useState('');
  const read = () => { const r = parseRequest(raw); if (typeof r === 'string') { setErr(r); setReq(null); } else { setErr(''); setReq(r); setRes(null); setFail(''); } };
  useEffect(read, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ct = req?.headers.find(([k]) => k.toLowerCase() === 'content-type')?.[1] ?? '', prov = req ? provider(req.headers) : null;
  const bodyText = useMemo(() => (req ? pretty(req.body, ct) : ''), [req, ct]);
  useEffect(() => {
    let live = true; setSig(null); if (!secret || !req) return;
    (async () => { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), m = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(req.body))), hex = [...m].map((b) => b.toString(16).padStart(2, '0')).join(''), b64 = btoa(String.fromCharCode(...m)); if (!live) return; const got = prov ? req.headers.find(([h]) => h.toLowerCase() === prov.sig)?.[1] ?? '' : ''; setSig(`${prov?.prefix ?? ''}${hex}|${b64}|${got}`); })();
    return () => { live = false; };
  }, [secret, req, prov]);
  const [hex, b64, got] = (sig ?? '||').split('|'), match = !!got && (got === hex || got === b64 || got.endsWith(hex));

  const upd = (p: Partial<Req>) => req && setReq({ ...req, ...p });
  const send = async () => {
    if (!req?.url) return; setBusy(true); setRes(null); setFail(''); const t0 = performance.now();
    try {
      const h = new Headers(); req.headers.forEach(([k, v]) => { try { h.set(k, v); } catch { /* skipped */ } });
      const r = await fetch(req.url, { method: req.method, headers: h, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body }), text = await r.text();
      setRes({ status: r.status, text: r.statusText, ms: Math.round(performance.now() - t0), headers: [...r.headers], body: pretty(text, r.headers.get('content-type') ?? ''), size: text.length });
    } catch { setFail('The request did not get through. The address may be wrong, offline, or the site may not allow requests from a web page (CORS). Try the curl command below instead.'); }
    setBusy(false);
  };
  return (
    <div className="panel">
      <div className="field"><label htmlFor="wh-r">Paste a request (curl command, raw HTTP, or just a JSON body)</label><textarea id="wh-r" className="code" style={{ minHeight: 170 }} value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false} />
        <div className="tool-actions"><button type="button" className="btn primary" onClick={read}>Read it</button></div></div>
      {err && <p className="bad" role="alert">{err}</p>}
      {req && (
        <>
          <Seg<'look' | 'send'> value={tab} onChange={setTab} label="Mode" options={[{ value: 'look', label: 'Look inside' }, { value: 'send', label: 'Edit and send again' }]} />
          {tab === 'look' ? (
            <>
              <div className="tool-actions"><span className="stat">{req.method}</span><b className="code" style={{ wordBreak: 'break-all' }}>{req.url || '(no address)'}</b>{prov && <span className="stat" style={{ background: 'var(--gold)', color: 'var(--ink)' }}>{prov.name}</span>}<span className="stat">{new Blob([req.body]).size} bytes</span></div>
              {prov && <p className="hintx">{prov.note}</p>}
              <div className="result"><div className="result-top"><span>Headers ({req.headers.length})</span></div><ul className="jwt-claims" style={{ padding: '8px 14px' }}>{req.headers.map(([k, v], i) => <li key={i}><span className="d">{k}</span><b className="code">{v}</b></li>)}{!req.headers.length && <li>No headers.</li>}</ul></div>
              <CodeBox title="Body" text={bodyText} empty="No body." />
              <div className="field" style={{ borderTop: '3px solid var(--ink)', paddingTop: 14 }}><label htmlFor="wh-s">Check the signature with your signing secret</label><input id="wh-s" type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret" autoComplete="off" />
                {sig && <><p className={got ? (match ? 'ok' : 'bad') : 'hintx'} role="status"><strong>{got ? (match ? 'The signature matches.' : 'The signature does not match.') : 'No signature header found. Showing what it should be:'}</strong></p><pre className="code" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{`hex:    ${hex}\nbase64: ${b64}`}</pre></>}</div>
            </>
          ) : (
            <>
              <div className="row"><div className="field"><label htmlFor="wh-m">Method</label><Select id="wh-m" value={req.method} onChange={(v) => upd({ method: v })} options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ value: m, label: m }))} /></div>
                <div className="field" style={{ flex: 1, minWidth: 260 }}><label htmlFor="wh-u">Send to</label><input id="wh-u" type="text" value={req.url} onChange={(e) => upd({ url: e.target.value })} placeholder="https://" /></div></div>
              <div className="field"><label htmlFor="wh-h">Headers, one per line</label><textarea id="wh-h" className="code" style={{ minHeight: 90 }} value={req.headers.map(([k, v]) => `${k}: ${v}`).join('\n')} onChange={(e) => upd({ headers: e.target.value.split('\n').filter((l) => l.includes(':')).map((l) => { const k = l.indexOf(':'); return [l.slice(0, k).trim(), l.slice(k + 1).trim()] as [string, string]; }) })} spellCheck={false} /></div>
              <div className="field"><label htmlFor="wh-b">Body</label><textarea id="wh-b" className="code" style={{ minHeight: 140 }} value={req.body} onChange={(e) => upd({ body: e.target.value })} spellCheck={false} /></div>
              <div className="tool-actions"><button type="button" className="btn primary" onClick={send} disabled={busy || !req.url}>{busy ? 'Sending…' : 'Send'}</button><button type="button" className="btn" onClick={() => setHist([{ ...req, id: Date.now(), name: `${req.method} ${req.url || 'request'}`, at: Date.now() }, ...hist].slice(0, 30))}>Save to my list</button></div>
              {fail && <p className="bad" role="alert">{fail}</p>}
              {res && <><div className="tool-actions"><span className="stat" style={{ background: res.status < 300 ? 'var(--g1)' : res.status < 400 ? 'var(--gold)' : 'var(--danger)', color: res.status >= 300 && res.status < 400 ? 'var(--ink)' : undefined }}>{res.status} {res.text}</span><span className="stat">{res.ms} ms</span><span className="stat">{res.size} chars</span></div>
                <CodeBox title="Response" text={res.body} empty="The reply had no body." />
                <details className="pf-log"><summary>Reply headers ({res.headers.length})</summary><ul className="jwt-claims">{res.headers.map(([k, v], i) => <li key={i}><span className="d">{k}</span><b className="code">{v}</b></li>)}</ul></details></>}
              <CodeBox title="The same request as curl" text={toCurl(req)} />
            </>
          )}
        </>
      )}
      {hist.length > 0 && <div className="field"><span className="label">My saved requests</span><ul className="tp-list">{hist.map((h) => <li key={h.id}><b style={{ wordBreak: 'break-all' }}>{h.name}</b><small>{new Date(h.at).toLocaleString()}</small><button type="button" className="btn small" onClick={() => { setReq(h); setRaw(toCurl(h)); setTab('look'); setRes(null); setErr(''); }}>Open</button><button type="button" className="btn small" aria-label="Delete" onClick={() => setHist(hist.filter((x) => x.id !== h.id))}>✕</button></li>)}</ul></div>}
    </div>
  );
}
