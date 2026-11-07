'use client';
import { useMemo, useState } from 'react';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { Seg } from '@/components/shared/Segmented';
import { Select } from '@/components/shared/Select';
import { toHtml, toMarkdown, toText } from '../privacy-policy-generator/doc';
import { useLocalState } from '@/lib/useLocalState';
import { build, START, type T } from './build';

type Fmt = 'preview' | 'html' | 'md' | 'txt';
const TOGGLES: [keyof T, string][] = [['accounts', 'People can make accounts'], ['content', 'People can post their own content'], ['payments', 'Takes payments'], ['links', 'Links to other sites'], ['ip', 'Protects your own words and pictures'], ['changes', 'You may update the terms']];

export default function View() {
  const [t, setT] = useLocalState<T>('terms-of-service-builder', 'form', START), [fmt, setFmt] = useState<Fmt>('preview');
  const set = <K extends keyof T>(k: K, v: T[K]) => setT({ ...t, [k]: v });
  const doc = useMemo(() => build(t), [t]);
  const out = fmt === 'html' ? toHtml(doc.title, doc.s) : fmt === 'md' ? toMarkdown(doc.title, doc.s) : toText(doc.title, doc.s);
  return (
    <div className="split">
      <div className="panel">
        <div className="field"><label htmlFor="tb-n">Your name or business</label><input id="tb-n" type="text" value={t.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="row"><div className="field" style={{ flex: 1, minWidth: 160 }}><label htmlFor="tb-s">Website address</label><input id="tb-s" type="text" value={t.site} onChange={(e) => set('site', e.target.value)} placeholder="www.example.com" /></div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}><label htmlFor="tb-e">Contact email</label><input id="tb-e" type="email" value={t.email} onChange={(e) => set('email', e.target.value)} /></div></div>
        <div className="row"><div className="field"><label htmlFor="tb-k">It is a</label><Select id="tb-k" value={t.kind} onChange={(v) => set('kind', v)} options={[{ value: 'website', label: 'Website' }, { value: 'shop', label: 'Online shop' }, { value: 'app', label: 'App' }, { value: 'service', label: 'Service' }]} /></div>
          <div className="field"><label htmlFor="tb-p">Law that applies</label><input id="tb-p" type="text" value={t.place} onChange={(e) => set('place', e.target.value)} /></div></div>
        <div className="row"><div className="field"><label htmlFor="tb-a">Youngest age</label><input id="tb-a" type="text" inputMode="numeric" value={t.age} onChange={(e) => set('age', e.target.value.replace(/\D/g, ''))} style={{ width: 90 }} /></div>
          {t.payments && <div className="field"><label htmlFor="tb-r">Money back within</label><input id="tb-r" type="text" value={t.refunds} onChange={(e) => set('refunds', e.target.value)} style={{ width: 140 }} /></div>}</div>
        <fieldset className="field" style={{ border: 0, padding: 0 }}><legend className="label">Include</legend><div className="tool-actions">{TOGGLES.map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={t[k] as boolean} onChange={(e) => set(k, e.target.checked as T[typeof k])} /> {l}</label>)}</div></fieldset>
      </div>
      <div className="panel">
        <Seg<Fmt> value={fmt} onChange={setFmt} label="View as" options={[{ value: 'preview', label: 'Page' }, { value: 'html', label: 'HTML' }, { value: 'md', label: 'Markdown' }, { value: 'txt', label: 'Plain text' }]} />
        <div className="tool-actions"><CopyButton text={fmt === 'preview' ? toText(doc.title, doc.s) : out} small={false} label="Copy" /><button type="button" className="btn" onClick={() => downloadText(`terms.${fmt === 'html' ? 'html' : fmt === 'md' ? 'md' : 'txt'}`, fmt === 'preview' ? toText(doc.title, doc.s) : out, fmt === 'html' ? 'text/html' : 'text/plain')}>Download</button></div>
        {fmt === 'preview' ? <article className="doc-prev"><h2>{doc.title}</h2>{doc.s.map((x) => <section key={x.h}><h3>{x.h}</h3>{x.p.map((p, i) => p.split('\n').every((l) => l.startsWith('- ')) ? <ul key={i}>{p.split('\n').map((l) => <li key={l}>{l.slice(2)}</li>)}</ul> : <p key={i}>{p}</p>)}</section>)}</article> : <pre className="code" style={{ whiteSpace: 'pre-wrap', maxHeight: 560, overflow: 'auto' }}>{out}</pre>}
        <p className="hintx">Have a lawyer read it before you rely on it.</p>
      </div>
    </div>
  );
}
