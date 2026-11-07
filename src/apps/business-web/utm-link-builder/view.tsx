'use client';
import { useMemo, useState } from 'react';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';

interface F { url: string; source: string; medium: string; campaign: string; term: string; content: string }
const START: F = { url: 'https://www.example.com/', source: 'newsletter', medium: 'email', campaign: 'spring_sale', term: '', content: '' };
const SOURCES = ['google', 'facebook', 'instagram', 'newsletter', 'linkedin', 'x', 'youtube'];
const MEDIUMS = ['email', 'social', 'cpc', 'banner', 'referral', 'qr'];
const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_');
function make(f: F, over: Partial<F> = {}) {
  const x = { ...f, ...over }; if (!x.url.trim()) return '';
  let u: URL; try { u = new URL(/^https?:\/\//i.test(x.url.trim()) ? x.url.trim() : `https://${x.url.trim()}`); } catch { return ''; }
  ([['utm_source', x.source], ['utm_medium', x.medium], ['utm_campaign', x.campaign], ['utm_term', x.term], ['utm_content', x.content]] as const).forEach(([k, v]) => { if (v.trim()) u.searchParams.set(k, slug(v)); else u.searchParams.delete(k); });
  return u.toString();
}
const field = (id: string, label: string, v: string, set: (s: string) => void, list?: string[], ph?: string) => (
  <div className="field" key={id}><label htmlFor={id}>{label}</label><input id={id} type="text" value={v} onChange={(e) => set(e.target.value)} placeholder={ph} list={list ? `${id}-l` : undefined} />{list && <datalist id={`${id}-l`}>{list.map((o) => <option key={o} value={o} />)}</datalist>}</div>
);

export default function View() {
  const [f, setF] = useLocalState<F>('utm-link-builder', 'fields', START), [mode, setMode] = useState<'one' | 'many'>('one'), [many, setMany] = useState('https://www.example.com/\nhttps://www.example.com/shop');
  const [hist, setHist] = useLocalState<{ url: string; at: number }[]>('utm-link-builder', 'history', []);
  const up = (p: Partial<F>) => setF({ ...f, ...p });
  const link = useMemo(() => make(f), [f]);
  const rows = useMemo(() => many.split('\n').map((l) => l.trim()).filter(Boolean).map((u) => ({ u, out: make(f, { url: u }) })), [many, f]);
  const missing = !f.source.trim() || !f.medium.trim() || !f.campaign.trim();
  return (
    <div className="split">
      <div className="panel">
        <Seg<'one' | 'many'> value={mode} onChange={setMode} label="Links" options={[{ value: 'one', label: 'One link' }, { value: 'many', label: 'Many links' }]} />
        {mode === 'one' ? field('ub-u', 'Page address', f.url, (url) => up({ url }), undefined, 'https://') : <div className="field"><label htmlFor="ub-m">Page addresses, one per line</label><textarea id="ub-m" className="code" style={{ minHeight: 110 }} value={many} onChange={(e) => setMany(e.target.value)} /></div>}
        {field('ub-s', 'Source (where it comes from)', f.source, (source) => up({ source }), SOURCES)}
        {field('ub-d', 'Medium (type of link)', f.medium, (medium) => up({ medium }), MEDIUMS)}
        {field('ub-c', 'Campaign name', f.campaign, (campaign) => up({ campaign }))}
        {field('ub-t', 'Term (optional, for search words)', f.term, (term) => up({ term }))}
        {field('ub-n', 'Content (optional, to tell similar links apart)', f.content, (content) => up({ content }))}
      </div>
      <div className="panel">
        {missing && <p className="note">Source, medium and campaign are needed for the reports to work.</p>}
        {mode === 'one' ? (link ? <>
          <div className="result"><div className="result-top"><span>Your link</span><span className="tool-actions"><CopyButton text={link} /><button type="button" className="btn small" onClick={() => setHist([{ url: link, at: Date.now() }, ...hist.filter((h) => h.url !== link)].slice(0, 20))}>Save</button></span></div><p className="code" style={{ wordBreak: 'break-all', padding: '12px 14px', margin: 0 }}>{link}</p></div>
        </> : <p className="empty">Enter a page address.</p>) : <>
          <div className="tool-actions"><CopyButton text={rows.map((r) => r.out).filter(Boolean).join('\n')} label="Copy all" /><button type="button" className="btn small" onClick={() => downloadText('utm-links.csv', 'page,link\n' + rows.map((r) => `"${r.u}","${r.out}"`).join('\n'), 'text/csv')}>Download CSV</button></div>
          <ul className="tp-list">{rows.map((r, i) => <li key={i}><span className="code" style={{ wordBreak: 'break-all' }}>{r.out || `${r.u} (not a valid address)`}</span>{r.out && <CopyButton text={r.out} />}</li>)}</ul></>}
        {hist.length > 0 && <div className="field"><span className="label">Saved links</span><ul className="tp-list">{hist.map((h) => <li key={h.at}><span className="code" style={{ wordBreak: 'break-all' }}>{h.url}</span><CopyButton text={h.url} /><button type="button" className="btn small" aria-label="Delete" onClick={() => setHist(hist.filter((x) => x.at !== h.at))}>✕</button></li>)}</ul></div>}
      </div>
    </div>
  );
}
