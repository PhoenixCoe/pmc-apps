'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { Select } from '@/components/shared/Select';
import { useLocalState } from '@/lib/useLocalState';
import { guess, highlight, LANGS } from '../code-snapshot-studio/highlight';
import { EXPIRY, isLocked, pack, unpack, type Paste } from './paste';

const TONE: Record<string, string> = { kw: '#6fcf97', str: '#e5c07b', com: '#7d7a6e', num: '#e08a6a', fn: '#B49A57', pun: '#a79f8d', type: '#9fd0e6', txt: '#F2E4CE' };
function Code({ body, lang }: { body: string; lang: string }) {
  const lines = useMemo(() => highlight(body.replace(/\t/g, '  '), lang === 'auto' ? guess(body) : lang), [body, lang]);
  return <pre className="tp-code code" tabIndex={0}>{lines.map((l, i) => <div key={i} className="cs-line"><span className="cs-ln" style={{ color: '#5d5a50' }}>{i + 1}</span><span>{l.length ? l.map((t, j) => <span key={j} style={{ color: TONE[t.t] }}>{t.v}</span>) : '​'}</span></div>)}</pre>;
}

export default function View() {
  const [list, setList] = useLocalState<Paste[]>('terminal-pastebin', 'pastes', []);
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [lang, setLang] = useState('auto'), [exp, setExp] = useState('1 day'), [phrase, setPhrase] = useState('');
  const [link, setLink] = useState(''), [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const [shared, setShared] = useState<{ token: string; locked: boolean; paste?: { title: string; lang: string; body: string; expires: number | null }; gone?: boolean } | null>(null), [ask, setAsk] = useState(''), [wrong, setWrong] = useState(false);

  // Remove old pastes, then open a shared link if the address has one.
  useEffect(() => { setList((p) => p.filter((x) => !x.expires || x.expires > Date.now())); }, [setList]);
  const open = useCallback(async (token: string, pw?: string) => {
    const locked = isLocked(token), p = await unpack(token, pw);
    if (!p) { setShared({ token, locked }); setWrong(!!pw); return; }
    setShared({ token, locked, paste: p, gone: !!p.expires && p.expires < Date.now() }); setWrong(false);
  }, []);
  useEffect(() => { const m = /[#&]p=([^&]+)/.exec(location.hash); if (m) open(m[1]); }, [open]);

  const share = async () => {
    if (!body.trim()) return; setBusy(true); setMsg('');
    try {
      const ms = EXPIRY.find(([l]) => l === exp)?.[1] ?? null, expires = ms ? Date.now() + ms : null, token = await pack({ title, lang, body, expires }, phrase || undefined);
      const url = `${location.origin}${location.pathname}#p=${token}`; setLink(url);
      const p: Paste = { id: token.slice(0, 12) + Date.now(), title: title || 'Untitled', lang, body: phrase ? '' : body, made: Date.now(), expires, burn: false, locked: phrase ? { salt: '', iv: '' } : undefined };
      if (!phrase) setList((l) => [p, ...l].slice(0, 50)); else setList((l) => [{ ...p, body: '(locked. Open it with its link.)' }, ...l].slice(0, 50));
      if (url.length > 60000) setMsg('This link is very long. Some apps may cut it off.');
    } catch { setMsg('The paste could not be made.'); }
    setBusy(false);
  };

  if (shared) {
    const p = shared.paste;
    return (
      <div className="panel">
        <div className="tool-actions"><button type="button" className="btn" onClick={() => { setShared(null); history.replaceState(null, '', location.pathname); }}>Make a new paste</button></div>
        {p ? (p.expires && p.expires < Date.now() ? <div className="empty">This paste has expired.</div> : (
          <>
            <div className="tool-actions"><h2 className="d" style={{ fontSize: '1.8rem' }}>{p.title || 'Untitled'}</h2><span className="stat">{LANGS[p.lang === 'auto' ? guess(p.body) : p.lang]?.name}</span>{p.expires && <span className="stat">Expires {new Date(p.expires).toLocaleString()}</span>}<CopyButton text={p.body} small={false} label="Copy text" /><button type="button" className="btn" onClick={() => downloadText(`${p.title || 'paste'}.txt`, p.body)}>Download</button></div>
            <Code body={p.body} lang={p.lang} />
          </>)) : (
          <form className="field" style={{ maxWidth: 420, gap: 12 }} onSubmit={(e) => { e.preventDefault(); open(shared.token, ask); }}>
            <label htmlFor="tp-a">This paste is locked. Type its lock phrase.</label><input id="tp-a" type="password" value={ask} onChange={(e) => setAsk(e.target.value)} autoFocus />
            {wrong && <p className="bad" role="alert">That phrase did not open it.</p>}
            {!shared.locked && <p className="bad">This link is damaged.</p>}
            <div className="tool-actions"><button type="submit" className="btn primary">Open</button></div>
          </form>)}
      </div>
    );
  }
  return (
    <div className="panel">
      <div className="row"><div className="field" style={{ flex: 1, minWidth: 200 }}><label htmlFor="tp-t">Title</label><input id="tp-t" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" /></div>
        <div className="field"><label htmlFor="tp-l">Language</label><Select id="tp-l" value={lang} onChange={setLang} options={[{ value: 'auto', label: 'Detect' }, ...Object.entries(LANGS).map(([k, v]) => ({ value: k, label: v.name }))]} /></div>
        <div className="field"><label htmlFor="tp-e">Gone after</label><Select id="tp-e" value={exp} onChange={setExp} options={EXPIRY.map(([l]) => ({ value: l, label: l }))} /></div></div>
      <div className="field"><label htmlFor="tp-b">Text or code</label><textarea id="tp-b" className="code" style={{ minHeight: 280 }} value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false} /></div>
      <div className="row"><div className="field" style={{ minWidth: 240 }}><label htmlFor="tp-p">Lock phrase (optional)</label><input id="tp-p" type="password" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="new-password" /></div>
        <button type="button" className="btn primary" onClick={share} disabled={busy || !body.trim()}>{busy ? 'Making…' : 'Make a link'}</button></div>
      {msg && <p className="note" role="status">{msg}</p>}
      {link && <div className="result"><div className="result-top"><span>Your link</span><CopyButton text={link} /></div><pre className="code" tabIndex={0} style={{ maxHeight: 90, wordBreak: 'break-all' }}>{link}</pre></div>}
      {list.length > 0 && <div className="field"><span className="label">Your pastes on this device</span>
        <ul className="tp-list">{list.map((p) => <li key={p.id}><b>{p.title}</b><small>{new Date(p.made).toLocaleString()} · {p.expires ? `gone ${new Date(p.expires).toLocaleDateString()}` : 'stays'}</small>{p.body && !p.locked && <button type="button" className="btn small" onClick={() => { setTitle(p.title); setBody(p.body); setLang(p.lang); setLink(''); }}>Edit</button>}<button type="button" className="btn small" aria-label={`Delete ${p.title}`} onClick={() => setList(list.filter((x) => x.id !== p.id))}>✕</button></li>)}</ul></div>}
    </div>
  );
}
