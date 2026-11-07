'use client';
import { useEffect, useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { useLocalState } from '@/lib/useLocalState';

const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggTW9yZ2FuIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjQxMDI0NDQ4MDB9.XMVjZwR6oWyOtYGxnMTBUvOOyKgGJ0V0fMhtq7vXu1c';
const dec = (s: string) => { const p = s.replace(/-/g, '+').replace(/_/g, '/'), b = atob(p + '='.repeat((4 - (p.length % 4)) % 4)); return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0))); };
const bytes = (s: string) => { const p = s.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(p + '='.repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0)); };
const HASH: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
const span = (ms: number) => { const m = Math.round(ms / 60000), h = Math.round(m / 60), d = Math.round(h / 24), y = +(d / 365).toFixed(1); const u = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`; return m < 90 ? u(m, 'minute') : h < 48 ? u(h, 'hour') : d < 730 ? u(d, 'day') : u(y, 'year'); };
const CLAIMS: Record<string, string> = { iss: 'Issuer', sub: 'Subject', aud: 'Audience', exp: 'Expires', nbf: 'Not valid before', iat: 'Issued', jti: 'Token ID' };
const date = (n: number) => `${new Date(n * 1000).toLocaleString()} (${new Date(n * 1000).toISOString()})`;

export default function View() {
  const [token, setToken] = useLocalState('jwt-inspector', 'token', SAMPLE);
  const [secret, setSecret] = useState(''), [b64secret, setB64] = useState(false), [ok, setOk] = useState<null | boolean | 'unsupported'>(null);
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); }, []);
  const t = token.trim().replace(/^Bearer\s+/i, ''), parts = t.split('.');
  const parsed = useMemo(() => {
    if (parts.length < 2) return t ? { error: 'A token has three parts joined by dots.' } : null;
    try { return { header: JSON.parse(dec(parts[0])), payload: JSON.parse(dec(parts[1])), error: '' }; } catch { return { error: 'The header or payload could not be read as JSON.' }; }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
  const alg: string | undefined = parsed && 'header' in parsed ? parsed.header?.alg : undefined;

  useEffect(() => {
    let live = true; setOk(null);
    if (!secret || !alg || parts.length !== 3) return;
    if (!HASH[alg]) { setOk('unsupported'); return; }
    (async () => {
      try { const key = await crypto.subtle.importKey('raw', (b64secret ? bytes(secret) : new TextEncoder().encode(secret)) as BufferSource, { name: 'HMAC', hash: HASH[alg] }, false, ['verify']); const good = await crypto.subtle.verify('HMAC', key, bytes(parts[2]) as BufferSource, new TextEncoder().encode(`${parts[0]}.${parts[1]}`)); if (live) setOk(good); } catch { if (live) setOk(false); }
    })();
    return () => { live = false; };
  }, [secret, b64secret, t, alg]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = parsed && 'payload' in parsed ? parsed.payload : null, exp = typeof p?.exp === 'number' ? p.exp * 1000 : null, nbf = typeof p?.nbf === 'number' ? p.nbf * 1000 : null;
  const status = !p ? null : exp && now > exp ? { text: `Expired ${span(now - exp)} ago`, cls: 'bad' } : nbf && now < nbf ? { text: 'Not valid yet', cls: 'bad' } : exp ? { text: `Valid. Expires in ${span(exp - now)}`, cls: 'ok' } : { text: 'No expiry time in this token', cls: '' };
  return (
    <div className="panel">
      <div className="field"><label htmlFor="jw-t">Token</label><textarea id="jw-t" className="code" style={{ minHeight: 130, wordBreak: 'break-all' }} value={token} onChange={(e) => setToken(e.target.value)} spellCheck={false} />
        {parts.length === 3 && <div className="jwt-colours code" aria-hidden><span className="h">{parts[0]}</span>.<span className="p">{parts[1]}</span>.<span className="s">{parts[2]}</span></div>}</div>
      {parsed && 'error' in parsed && parsed.error ? <p className="bad" role="alert">{parsed.error}</p> : parsed && 'header' in parsed ? (
        <>
          {status && <p className={status.cls} role="status"><strong>{status.text}.</strong></p>}
          <div className="result-list">
            <CodeBox title="Header" text={JSON.stringify(parsed.header, null, 2)} />
            <CodeBox title="Payload" text={JSON.stringify(parsed.payload, null, 2)} />
          </div>
          {Object.keys(CLAIMS).some((k) => p && k in p) && (
            <ul className="jwt-claims">{Object.entries(CLAIMS).filter(([k]) => p && k in p).map(([k, label]) => <li key={k}><span className="d">{label}</span><b className="code">{['exp', 'nbf', 'iat'].includes(k) && typeof p[k] === 'number' ? date(p[k]) : typeof p[k] === 'object' ? JSON.stringify(p[k]) : String(p[k])}</b></li>)}</ul>
          )}
          <div className="field" style={{ borderTop: '3px solid var(--ink)', paddingTop: 16 }}>
            <label htmlFor="jw-s">Check the signature{alg ? ` (${alg})` : ''}</label>
            <input id="jw-s" type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret used to sign the token" autoComplete="off" />
            <label className="check"><input type="checkbox" checked={b64secret} onChange={(e) => setB64(e.target.checked)} /> The secret is Base64</label>
            {secret && ok !== null && <p className={ok === true ? 'ok' : 'bad'} role="status"><strong>{ok === 'unsupported' ? `${alg} tokens need a public key, which this tool does not check.` : ok ? 'The signature matches.' : 'The signature does not match.'}</strong></p>}
            <small>The token and the secret stay on this page.</small>
          </div>
        </>
      ) : <div className="empty">Paste a token above.</div>}
    </div>
  );
}
