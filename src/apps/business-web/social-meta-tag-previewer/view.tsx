'use client';
import { useRef, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { Seg } from '@/components/shared/Segmented';
import { readDataUrl } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';

interface S { title: string; desc: string; url: string; site: string; image: string; card: 'summary_large_image' | 'summary' }
const START: S = { title: 'Fresh bread, baked every morning', desc: 'Visit our little bakery on the corner of High Street for sourdough, rolls and cakes.', url: 'https://www.example.com/bakery', site: 'Corner Bakery', image: '', card: 'summary_large_image' };
type Tab = 'google' | 'facebook' | 'x' | 'linkedin' | 'chat';
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'example.com'; } };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default function View() {
  const [s, setS] = useLocalState<S>('social-meta-tag-previewer', 'fields', START), [tab, setTab] = useState<Tab>('google'), file = useRef<HTMLInputElement>(null);
  const up = (p: Partial<S>) => setS({ ...s, ...p });
  const pic = async (f?: File) => { if (f) up({ image: await readDataUrl(f) }); };
  const img = s.image && !s.image.startsWith('data:') ? s.image : s.image;
  const Pic = ({ ratio }: { ratio: string }) => <div className="sm-pic" style={{ aspectRatio: ratio }}>{img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" /> : <span>Add a picture</span>}</div>;
  const tags = `<title>${esc(s.title)}</title>\n<meta name="description" content="${esc(s.desc)}">\n<link rel="canonical" href="${esc(s.url)}">\n\n<meta property="og:type" content="website">\n<meta property="og:title" content="${esc(s.title)}">\n<meta property="og:description" content="${esc(s.desc)}">\n<meta property="og:url" content="${esc(s.url)}">\n<meta property="og:site_name" content="${esc(s.site)}">\n<meta property="og:image" content="${s.image.startsWith('data:') ? 'https://www.example.com/your-picture.jpg' : esc(s.image)}">\n\n<meta name="twitter:card" content="${s.card}">\n<meta name="twitter:title" content="${esc(s.title)}">\n<meta name="twitter:description" content="${esc(s.desc)}">\n<meta name="twitter:image" content="${s.image.startsWith('data:') ? 'https://www.example.com/your-picture.jpg' : esc(s.image)}">\n`;
  const count = (n: number, lo: number, hi: number) => <small className={n > hi ? 'bad' : n >= lo ? 'ok' : 'hintx'}>{n} characters (aim for {lo}–{hi})</small>;
  return (
    <div className="split">
      <div className="panel">
        <div className="field"><label htmlFor="sm-t">Title</label><input id="sm-t" type="text" value={s.title} onChange={(e) => up({ title: e.target.value })} />{count(s.title.length, 30, 60)}</div>
        <div className="field"><label htmlFor="sm-d">Description</label><textarea id="sm-d" value={s.desc} onChange={(e) => up({ desc: e.target.value })} style={{ minHeight: 84 }} />{count(s.desc.length, 70, 160)}</div>
        <div className="row"><div className="field" style={{ flex: 1, minWidth: 200 }}><label htmlFor="sm-u">Page address</label><input id="sm-u" type="text" value={s.url} onChange={(e) => up({ url: e.target.value })} /></div>
          <div className="field"><label htmlFor="sm-s">Site name</label><input id="sm-s" type="text" value={s.site} onChange={(e) => up({ site: e.target.value })} /></div></div>
        <div className="field"><label htmlFor="sm-i">Picture address, or choose a file</label><div className="row"><input id="sm-i" type="text" style={{ flex: 1, minWidth: 160 }} value={s.image.startsWith('data:') ? '' : s.image} placeholder={s.image.startsWith('data:') ? 'Using the file you chose' : 'https://…'} onChange={(e) => up({ image: e.target.value })} />
          <button type="button" className="btn small" onClick={() => file.current?.click()}>Choose file</button>{s.image && <button type="button" className="btn small" onClick={() => up({ image: '' })}>Remove</button>}</div>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { pic(e.target.files?.[0]); e.target.value = ''; }} /><small className="hintx">Best size: 1200 × 630 pixels.</small></div>
        <Seg<S['card']> value={s.card} onChange={(card) => up({ card })} label="X card" options={[{ value: 'summary_large_image', label: 'Big picture' }, { value: 'summary', label: 'Small picture' }]} />
        <CodeBox title="Tags to paste in your page head" text={tags} />
      </div>
      <div className="panel">
        <Seg<Tab> value={tab} onChange={setTab} label="Where it shows" options={[{ value: 'google', label: 'Google' }, { value: 'facebook', label: 'Facebook' }, { value: 'x', label: 'X' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'chat', label: 'Chat apps' }]} />
        <div className="sm-stage">
          {tab === 'google' && <div className="sm-google"><small>{s.site} · {host(s.url)}</small><div className="sm-g-url">{cut(s.url, 60)}</div><b>{cut(s.title || 'Page title', 60)}</b><p>{cut(s.desc || 'Description', 160)}</p></div>}
          {tab === 'facebook' && <div className="sm-card"><Pic ratio="1.91/1" /><div className="sm-body"><small>{host(s.url).toUpperCase()}</small><b>{cut(s.title, 70)}</b><p>{cut(s.desc, 110)}</p></div></div>}
          {tab === 'x' && (s.card === 'summary_large_image' ? <div className="sm-card sm-round"><Pic ratio="1.91/1" /><div className="sm-body"><small>{host(s.url)}</small><b>{cut(s.title, 70)}</b><p>{cut(s.desc, 120)}</p></div></div> : <div className="sm-card sm-round sm-row"><div style={{ width: 110 }}><Pic ratio="1/1" /></div><div className="sm-body"><small>{host(s.url)}</small><b>{cut(s.title, 70)}</b><p>{cut(s.desc, 100)}</p></div></div>)}
          {tab === 'linkedin' && <div className="sm-card"><Pic ratio="1.91/1" /><div className="sm-body"><b>{cut(s.title, 70)}</b><small>{host(s.url)}</small></div></div>}
          {tab === 'chat' && <div className="sm-chat"><i /><div className="sm-card sm-bar"><small>{s.site}</small><b>{cut(s.title, 70)}</b><p>{cut(s.desc, 150)}</p><Pic ratio="1.91/1" /></div></div>}
        </div>
      </div>
    </div>
  );
}
