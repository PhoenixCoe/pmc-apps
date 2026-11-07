'use client';
import { useMemo, useState } from 'react';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { FileDrop } from '@/components/shared/FileDrop';
import { readText } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';
import { parseEnv, tidy } from './env';

const SAMPLE = '# App settings\nAPI_URL=https://example.com\nAPI_KEY = abc123\nDEBUG=true\nDEBUG=false\nGREETING=hello world\nbroken line\nSECRET="never closed\n';
export default function View() {
  const [src, setSrc] = useLocalState('env-file-validator', 'env', SAMPLE);
  const [ex, setEx] = useLocalState('env-file-validator', 'example', '');
  const [o, setO] = useLocalState('env-file-validator', 'tidy', { dedupe: true, sort: false, trim: true });
  const [show, setShow] = useState(false);
  const p = useMemo(() => parseEnv(src), [src]), pe = useMemo(() => (ex.trim() ? parseEnv(ex) : null), [ex]);
  const keys = new Set(p.entries.map((e) => e.key)), missing = pe ? [...new Set(pe.entries.map((e) => e.key))].filter((k) => !keys.has(k)) : [], extra = pe ? [...keys].filter((k) => !pe.entries.some((e) => e.key === k)) : [];
  const out = useMemo(() => tidy(src, o), [src, o]);
  const errs = p.issues.filter((i) => i.level === 'error').length, warns = p.issues.length - errs;
  return (
    <div className="panel">
      <div className="split">
        <div className="field"><label htmlFor="ev-s">Your .env file</label><textarea id="ev-s" className="code" style={{ minHeight: 280 }} value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} /><FileDrop multiple={false} title="Or drop a .env file" onFiles={async (f) => setSrc(await readText(f[0]))} /></div>
        <div className="field"><label htmlFor="ev-e">Compare with .env.example (optional)</label><textarea id="ev-e" className="code" style={{ minHeight: 280 }} value={ex} onChange={(e) => setEx(e.target.value)} spellCheck={false} placeholder={'API_URL=\nAPI_KEY=\nDATABASE_URL='} /><FileDrop multiple={false} title="Or drop a .env.example file" onFiles={async (f) => setEx(await readText(f[0]))} /></div>
      </div>
      <div className="tool-actions"><span className="stat">{p.entries.length} keys</span><span className="stat" style={{ background: errs ? 'var(--danger)' : 'var(--g1)' }}>{errs} errors</span><span className="stat" style={{ background: warns ? 'var(--gold)' : 'var(--g1)', color: warns ? 'var(--ink)' : undefined }}>{warns} warnings</span></div>
      {p.issues.length > 0 ? <ul className="ev-issues">{p.issues.map((i, k) => <li key={k} className={i.level}><b className="d">Line {i.line}</b><span>{i.text}</span></li>)}</ul> : src.trim() && <p className="ok"><strong>No problems found.</strong></p>}
      {pe && <div className="result-list"><div className="result"><div className="result-top"><span>Missing from your file ({missing.length})</span></div><pre className="code">{missing.join('\n') || 'Nothing is missing.'}</pre></div><div className="result"><div className="result-top"><span>Not in the example ({extra.length})</span></div><pre className="code">{extra.join('\n') || 'No extra keys.'}</pre></div></div>}
      <div className="tool-actions">
        <label className="check"><input type="checkbox" checked={o.dedupe} onChange={(e) => setO({ ...o, dedupe: e.target.checked })} /> Remove repeated keys (keep the last)</label>
        <label className="check"><input type="checkbox" checked={o.sort} onChange={(e) => setO({ ...o, sort: e.target.checked })} /> Sort A to Z (drops comments)</label>
        <label className="check"><input type="checkbox" checked={o.trim} onChange={(e) => setO({ ...o, trim: e.target.checked })} /> Trim spaces</label>
        <button type="button" className="btn small" onClick={() => setShow(!show)}>{show ? 'Hide values' : 'Show values'}</button>
      </div>
      <div className="result"><div className="result-top"><span>Tidied file</span><span style={{ display: 'flex', gap: 8 }}><button type="button" className="btn small" onClick={() => downloadText('.env', out)}>Download</button><CopyButton text={out} /></span></div>
        <pre className="code" tabIndex={0}>{show ? out : out.replace(/^([^#\n=]+=)(.*)$/gm, (_, k, v) => k + (v ? '••••••••' : ''))}</pre></div>
      {!show && <small>Values are hidden here. Copy and Download use the real values.</small>}
    </div>
  );
}
