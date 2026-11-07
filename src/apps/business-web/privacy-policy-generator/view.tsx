'use client';
import { useMemo, useState } from 'react';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { build, COLLECT, START, type P } from './build';
import { toHtml, toMarkdown, toText } from './doc';

type Fmt = 'preview' | 'html' | 'md' | 'txt';
const TOGGLES: [keyof P, string][] = [['cookies', 'The site uses cookies'], ['analytics', 'Visitor statistics'], ['ads', 'Adverts'], ['payments', 'Takes payments'], ['accounts', 'People can make accounts'], ['newsletter', 'Sends a newsletter'], ['share', 'Shares information with other companies'], ['abroad', 'Uses companies in other countries'], ['children', 'Made for children']];

export default function View() {
  const [p, setP] = useLocalState<P>('privacy-policy-generator', 'form', START), [fmt, setFmt] = useState<Fmt>('preview');
  const set = <K extends keyof P>(k: K, v: P[K]) => setP({ ...p, [k]: v });
  const doc = useMemo(() => build(p), [p]);
  const out = fmt === 'html' ? toHtml(doc.title, doc.s) : fmt === 'md' ? toMarkdown(doc.title, doc.s) : toText(doc.title, doc.s);
  return (
    <div className="split">
      <div className="panel">
        <div className="field"><label htmlFor="pp-n">Your name or business</label><input id="pp-n" type="text" value={p.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="row"><div className="field" style={{ flex: 1, minWidth: 160 }}><label htmlFor="pp-s">Website address</label><input id="pp-s" type="text" value={p.site} onChange={(e) => set('site', e.target.value)} placeholder="www.example.com" /></div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}><label htmlFor="pp-e">Contact email</label><input id="pp-e" type="email" value={p.email} onChange={(e) => set('email', e.target.value)} /></div></div>
        <div className="row"><div className="field"><label htmlFor="pp-p">Where you are based</label><input id="pp-p" type="text" value={p.place} onChange={(e) => set('place', e.target.value)} /></div>
          <div className="field"><label htmlFor="pp-k">Keep information for</label><input id="pp-k" type="text" value={p.keep} onChange={(e) => set('keep', e.target.value)} /></div></div>
        <fieldset className="field" style={{ border: 0, padding: 0 }}><legend className="label">What you collect</legend><div className="tool-actions">{COLLECT.map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={p.collect.includes(k)} onChange={(e) => set('collect', e.target.checked ? [...p.collect, k] : p.collect.filter((x) => x !== k))} /> {l}</label>)}</div></fieldset>
        <fieldset className="field" style={{ border: 0, padding: 0 }}><legend className="label">About your site</legend><div className="tool-actions">{TOGGLES.map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={p[k] as boolean} onChange={(e) => set(k, e.target.checked as P[typeof k])} /> {l}</label>)}</div></fieldset>
      </div>
      <div className="panel">
        <Seg<Fmt> value={fmt} onChange={setFmt} label="View as" options={[{ value: 'preview', label: 'Page' }, { value: 'html', label: 'HTML' }, { value: 'md', label: 'Markdown' }, { value: 'txt', label: 'Plain text' }]} />
        <div className="tool-actions"><CopyButton text={fmt === 'preview' ? toText(doc.title, doc.s) : out} small={false} label="Copy" /><button type="button" className="btn" onClick={() => downloadText(`privacy-policy.${fmt === 'html' ? 'html' : fmt === 'md' ? 'md' : 'txt'}`, fmt === 'preview' ? toText(doc.title, doc.s) : out, fmt === 'html' ? 'text/html' : 'text/plain')}>Download</button></div>
        {fmt === 'preview' ? <article className="doc-prev"><h2>{doc.title}</h2>{doc.s.map((x) => <section key={x.h}><h3>{x.h}</h3>{x.p.map((t, i) => t.split('\n').every((l) => l.startsWith('- ')) ? <ul key={i}>{t.split('\n').map((l) => <li key={l}>{l.slice(2)}</li>)}</ul> : <p key={i}>{t}</p>)}</section>)}</article> : <pre className="code" style={{ whiteSpace: 'pre-wrap', maxHeight: 560, overflow: 'auto' }}>{out}</pre>}
        <p className="hintx">Have a lawyer read it if your site handles sensitive data.</p>
      </div>
    </div>
  );
}
