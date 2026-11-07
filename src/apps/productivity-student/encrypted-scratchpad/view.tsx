'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { downloadText } from '@/components/shared/CopyButton';
import { Seg } from '@/components/shared/Segmented';
import { readText } from '@/lib/files';
import { KEY, deriveKey, newSalt, open, seal, type Note, type Stored } from './vault';

const IDLE = 5 * 60 * 1000;
const read = (): Stored | null => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; } };

export default function View() {
  const [stored, setStored] = useState<Stored | null | undefined>(undefined);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [phrase, setPhrase] = useState(''), [again, setAgain] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<number | null>(null), [q, setQ] = useState(''), [tag, setTag] = useState(''), [view, setView] = useState<'write' | 'read'>('write'), [saved, setSaved] = useState(true), [html, setHtml] = useState('');
  const key = useRef<CryptoKey | null>(null), salt = useRef<Uint8Array | null>(null), idle = useRef<ReturnType<typeof setTimeout>>(undefined), tmr = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => setStored(read()), []);

  const lock = useCallback(() => { key.current = null; salt.current = null; setNotes(null); setSel(null); setPhrase(''); setAgain(''); setErr(''); setStored(read()); }, []);
  const bump = useCallback(() => { clearTimeout(idle.current); idle.current = setTimeout(lock, IDLE); }, [lock]);
  useEffect(() => { if (!notes) return; bump(); const ev = ['keydown', 'pointerdown']; ev.forEach((e) => window.addEventListener(e, bump)); return () => { ev.forEach((e) => window.removeEventListener(e, bump)); clearTimeout(idle.current); }; }, [notes !== null, bump]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((list: Note[]) => {
    setSaved(false); clearTimeout(tmr.current);
    tmr.current = setTimeout(async () => { if (!key.current || !salt.current) return; const s = await seal(list, key.current, salt.current); try { localStorage.setItem(KEY, JSON.stringify(s)); setSaved(true); } catch { setErr('Your browser has no room to save this.'); } }, 500);
  }, []);
  const change = (f: (n: Note[]) => Note[]) => setNotes((p) => { const n = f(p ?? []); persist(n); return n; });

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (phrase.length < 8) return setErr('Use at least 8 characters.'); if (phrase !== again) return setErr('The two phrases do not match.');
    setBusy(true); const s = newSalt(), k = await deriveKey(phrase, s); key.current = k; salt.current = s;
    const first: Note[] = [{ id: Date.now(), title: 'My first note', body: 'Everything here is locked with your phrase and kept on this device.', tags: [], at: Date.now() }];
    localStorage.setItem(KEY, JSON.stringify(await seal(first, k, s))); setNotes(first); setSel(first[0].id); setPhrase(''); setAgain(''); setBusy(false);
  };
  const unlock = async (e: React.FormEvent) => {
    e.preventDefault(); if (!stored) return; setErr(''); setBusy(true); const r = await open(stored, phrase); setBusy(false);
    if (!r) return setErr('That is not the right phrase.'); key.current = r.key; salt.current = r.salt; setNotes(r.notes); setSel(r.notes[0]?.id ?? null); setPhrase('');
  };

  const cur = notes?.find((n) => n.id === sel) ?? null;
  useEffect(() => {
    if (view !== 'read' || !cur) return; let live = true;
    Promise.all([import('marked'), import('dompurify')]).then(([m, p]) => { if (live) setHtml(p.default.sanitize(m.marked.parse(cur.body, { async: false }) as string)); });
    return () => { live = false; };
  }, [view, cur]);
  const tags = useMemo(() => [...new Set((notes ?? []).flatMap((n) => n.tags))].sort(), [notes]);
  const list = useMemo(() => (notes ?? []).filter((n) => (!tag || n.tags.includes(tag)) && (!q || (n.title + n.body + n.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.at - a.at), [notes, q, tag]);
  const upd = (p: Partial<Note>) => cur && change((n) => n.map((x) => (x.id === cur.id ? { ...x, ...p, at: Date.now() } : x)));

  if (stored === undefined) return <div className="panel"><div className="empty">Loading…</div></div>;
  if (!notes) return (
    <div className="panel" style={{ maxWidth: 520 }}>
      <form className="field" style={{ gap: 14 }} onSubmit={stored ? unlock : create}>
        <h2 className="d" style={{ fontSize: '2rem' }}>{stored ? 'Unlock your notes' : 'Make a lock phrase'}</h2>
        <div className="field"><label htmlFor="es-p">{stored ? 'Lock phrase' : 'Choose a lock phrase'}</label><input id="es-p" type="password" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete={stored ? 'current-password' : 'new-password'} autoFocus /></div>
        {!stored && <div className="field"><label htmlFor="es-a">Type it again</label><input id="es-a" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" /></div>}
        {err && <p className="bad" role="alert">{err}</p>}
        <div className="tool-actions"><button type="submit" className="btn primary" disabled={busy}>{busy ? 'Working…' : stored ? 'Unlock' : 'Start'}</button></div>
        {!stored && <p className="hintx">If you forget this phrase, nobody can get the notes back.</p>}
        {stored && <div className="tool-actions"><label className="btn small" style={{ cursor: 'pointer' }}>Restore a backup<input type="file" accept=".json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const s = JSON.parse(await readText(f)); if (s.v !== 1) throw 0; localStorage.setItem(KEY, JSON.stringify(s)); setStored(s); setErr(''); } catch { setErr('That is not a backup file.'); } }} /></label><button type="button" className="btn small" onClick={() => { if (confirm('This deletes every note for good. Carry on?')) { localStorage.removeItem(KEY); setStored(null); setErr(''); } }}>Forgot it? Start again</button></div>}
      </form>
    </div>
  );
  return (
    <div className="panel">
      <div className="tool-actions"><button type="button" className="btn gold" onClick={lock}>Lock now</button><button type="button" className="btn" onClick={() => { const n: Note = { id: Date.now(), title: 'Untitled', body: '', tags: [], at: Date.now() }; change((p) => [n, ...p]); setSel(n.id); setView('write'); }}>New note</button><button type="button" className="btn small" onClick={() => { const s = read(); if (s) downloadText('scratchpad-backup.json', JSON.stringify(s), 'application/json'); }}>Download locked backup</button><span className="stat">{saved ? 'Saved and locked' : 'Saving…'}</span></div>
      {err && <p className="bad" role="alert">{err}</p>}
      <div className="sp">
        <div className="sp-side">
          <input type="search" aria-label="Search notes" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          {tags.length > 0 && <div className="sp-tags"><button type="button" className="chip" aria-pressed={!tag} onClick={() => setTag('')}>All</button>{tags.map((t) => <button type="button" key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>)}</div>}
          <ul>{list.map((n) => <li key={n.id}><button type="button" aria-pressed={n.id === sel} onClick={() => setSel(n.id)}><b>{n.title || 'Untitled'}</b><small>{n.tags.map((t) => `#${t}`).join(' ') || new Date(n.at).toLocaleDateString()}</small></button></li>)}{list.length === 0 && <li className="hintx">No notes found.</li>}</ul>
        </div>
        <div className="sp-main">
          {cur ? (
            <>
              <div className="tool-actions"><input type="text" aria-label="Title" value={cur.title} onChange={(e) => upd({ title: e.target.value })} style={{ flex: 1, minWidth: 160, fontSize: '1.2rem' }} /><Seg<'write' | 'read'> value={view} onChange={setView} label="View" options={[{ value: 'write', label: 'Write' }, { value: 'read', label: 'Read' }]} /></div>
              <input type="text" aria-label="Tags, separated by commas" placeholder="Tags, separated by commas" value={cur.tags.join(', ')} onChange={(e) => upd({ tags: e.target.value.split(',').map((t) => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean) })} />
              {view === 'write' ? <textarea aria-label="Note" className="code" style={{ minHeight: 360 }} value={cur.body} onChange={(e) => upd({ body: e.target.value })} spellCheck /> : <div className="md-preview" style={{ minHeight: 360, padding: 16, border: '3px solid var(--ink)', background: 'var(--paper)' }} dangerouslySetInnerHTML={{ __html: html }} />}
              <div className="tool-actions"><button type="button" className="btn small" onClick={() => { if (confirm('Delete this note?')) { change((p) => p.filter((n) => n.id !== cur.id)); setSel(null); } }}>Delete note</button></div>
            </>
          ) : <div className="empty">Choose a note, or make a new one.</div>}
        </div>
      </div>
    </div>
  );
}
