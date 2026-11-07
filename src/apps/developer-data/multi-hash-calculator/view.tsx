'use client';
import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/shared/CopyButton';
import { FileDrop } from '@/components/shared/FileDrop';
import { formatBytes } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';
import { md5 } from './md5';

const ALGOS = [['MD5', ''], ['SHA-1', 'SHA-1'], ['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512']] as const;
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const LIMIT = 700 * 1024 * 1024;

export default function View() {
  const [text, setText] = useLocalState('multi-hash-calculator', 'text', 'Hello, PMC!');
  const [upper, setUpper] = useLocalState('multi-hash-calculator', 'upper', false);
  const [file, setFile] = useState<File | null>(null), [cmp, setCmp] = useState('');
  const [res, setRes] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false), [err, setErr] = useState('');

  useEffect(() => {
    let live = true; setErr('');
    (async () => {
      setBusy(true);
      try {
        if (file && file.size > LIMIT) throw new Error('This file is too big for the browser to hash. Use a command-line tool.');
        const data = file ? new Uint8Array(await file.arrayBuffer()) : new TextEncoder().encode(text), out: Record<string, string> = {};
        out['MD5'] = md5(data); for (const [n, a] of ALGOS) if (a) out[n] = hex(await crypto.subtle.digest(a, data as BufferSource));
        if (live) setRes(out);
      } catch (e) { if (live) { setErr(e instanceof Error ? e.message : 'Could not hash this.'); setRes({}); } }
      if (live) setBusy(false);
    })();
    return () => { live = false; };
  }, [text, file]);

  const c = cmp.trim().toLowerCase().replace(/\s+/g, ''), match = c ? Object.entries(res).find(([, v]) => v === c)?.[0] : undefined;
  return (
    <div className="panel">
      <div className="field"><label htmlFor="mh-t">Text to hash</label><textarea id="mh-t" className="code" style={{ minHeight: 120 }} value={file ? `[${file.name} · ${formatBytes(file.size)}]` : text} readOnly={!!file} onChange={(e) => setText(e.target.value)} spellCheck={false} /></div>
      <FileDrop multiple={false} paste title={file ? 'File loaded. Drop another to swap' : 'Or drop a file to hash'} onFiles={(f) => setFile(f[0])} />
      {file && <div className="tool-actions"><button type="button" className="btn small" onClick={() => setFile(null)}>Use typed text instead</button></div>}
      {err && <p className="bad" role="alert">{err}</p>}
      <div className="mh-list">{ALGOS.map(([n]) => { const v = res[n] ? (upper ? res[n].toUpperCase() : res[n]) : ''; return (
        <div key={n} className={`result${match === n ? ' hit' : ''}`}><div className="result-top"><span>{n}{match === n ? ' · matches' : ''}</span><CopyButton text={v} /></div><pre className="code" tabIndex={0}>{v || (busy ? 'Working…' : '')}</pre></div>); })}</div>
      <div className="row">
        <div className="field" style={{ flex: 1, minWidth: 260 }}><label htmlFor="mh-c">Check against a hash you were given</label><input id="mh-c" type="text" className="code" value={cmp} onChange={(e) => setCmp(e.target.value)} placeholder="Paste a hash here" spellCheck={false} /></div>
        <label className="check"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> CAPITAL letters</label>
      </div>
      {c && <p className={match ? 'ok' : 'bad'} role="status"><strong>{match ? `It matches the ${match} hash.` : 'It does not match any of these.'}</strong></p>}
    </div>
  );
}
