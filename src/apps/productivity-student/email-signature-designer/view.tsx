'use client';
import { useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Segmented } from '@/components/shared/Segmented';
import { Select } from '@/components/shared/Select';
import { useLocalState } from '@/lib/useLocalState';

interface S { name: string; role: string; company: string; phone: string; email: string; web: string; address: string; photo: string; round: boolean; links: { label: string; url: string }[]; accent: string; font: string; size: number; layout: 'side' | 'stack'; divider: boolean }
const DEF: S = { name: 'Alex Morgan', role: 'Designer', company: 'PMC Studios', phone: '+44 1234 567890', email: 'alex@example.com', web: 'pmcstudios.uk', address: '', photo: '', round: false, links: [{ label: 'GitHub', url: 'https://github.com/' }], accent: '#337957', font: 'Arial, Helvetica, sans-serif', size: 14, layout: 'side', divider: true };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const href = (u: string) => (/^(https?:|mailto:|tel:)/.test(u) ? u : `https://${u}`);

function build(s: S): string {
  const f = `font-family:${s.font};font-size:${s.size}px;line-height:1.45;color:#222222;`, a = `color:${s.accent};text-decoration:none;`;
  const line = (t: string) => (t ? `<div style="${f}">${t}</div>` : '');
  const info = [
    s.name && `<div style="${f}font-size:${s.size + 4}px;font-weight:bold;color:${s.accent};">${esc(s.name)}</div>`,
    (s.role || s.company) && line(esc([s.role, s.company].filter(Boolean).join(' · '))),
    s.phone && line(`<a href="tel:${esc(s.phone.replace(/\s/g, ''))}" style="${a}">${esc(s.phone)}</a>`),
    s.email && line(`<a href="mailto:${esc(s.email)}" style="${a}">${esc(s.email)}</a>`),
    s.web && line(`<a href="${esc(href(s.web))}" style="${a}">${esc(s.web)}</a>`),
    s.address && line(esc(s.address)),
    s.links.filter((l) => l.label && l.url).length > 0 && `<div style="${f}padding-top:4px;">${s.links.filter((l) => l.label && l.url).map((l) => `<a href="${esc(href(l.url))}" style="${a}font-weight:bold;">${esc(l.label)}</a>`).join(` <span style="color:#999999;">|</span> `)}</div>`,
  ].filter(Boolean).join('');
  const img = s.photo ? `<img src="${esc(s.photo)}" width="88" height="88" alt="${esc(s.name)}" style="display:block;width:88px;height:88px;object-fit:cover;${s.round ? 'border-radius:44px;' : ''}">` : '';
  if (s.layout === 'stack' || !img) return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:0;">${img ? `<div style="padding-bottom:10px;">${img}</div>` : ''}${info}</td></tr></table>`;
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="padding:0 16px 0 0;vertical-align:top;${s.divider ? `border-right:3px solid ${s.accent};` : ''}">${img}</td><td style="padding:0 0 0 16px;vertical-align:top;">${info}</td></tr></table>`;
}

export default function View() {
  const [s, setS] = useLocalState<S>('email-signature-designer', 'signature', DEF);
  const [done, setDone] = useState('');
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((p) => ({ ...p, [k]: v }));
  const html = useMemo(() => build(s), [s]);
  const copyRich = async () => {
    try { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')], { type: 'text/plain' }) })]); setDone('Copied. Paste it into your email settings.'); }
    catch { try { await navigator.clipboard.writeText(html); setDone('Your browser could only copy the code. Use the HTML box in your email app.'); } catch { setDone('Copy did not work. Select the preview and copy it.'); } }
  };
  const field = (k: 'name' | 'role' | 'company' | 'phone' | 'email' | 'web' | 'address' | 'photo', label: string, ph = '') => <div className="field"><label htmlFor={`es-${k}`}>{label}</label><input id={`es-${k}`} type="text" value={s[k] as string} placeholder={ph} onChange={(e) => set(k, e.target.value)} /></div>;
  return (
    <div className="panel">
      <div className="split">
        <div className="field" style={{ gap: 14 }}>
          <div className="row">{field('name', 'Name')}{field('role', 'Job title')}</div>
          <div className="row">{field('company', 'Company')}{field('phone', 'Phone')}</div>
          <div className="row">{field('email', 'Email')}{field('web', 'Website')}</div>
          {field('address', 'Address')}
          {field('photo', 'Picture web address', 'https://…/photo.jpg')}
          <span className="label">Links</span>
          {s.links.map((l, i) => (
            <div key={i} className="tool-actions">
              <input type="text" aria-label={`Link ${i + 1} name`} placeholder="LinkedIn" value={l.label} onChange={(e) => set('links', s.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} style={{ width: 140 }} />
              <input type="text" aria-label={`Link ${i + 1} address`} placeholder="linkedin.com/in/you" value={l.url} onChange={(e) => set('links', s.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} style={{ flex: 1, minWidth: 160 }} />
              <button type="button" className="btn small" aria-label={`Remove link ${i + 1}`} onClick={() => set('links', s.links.filter((_, j) => j !== i))}>✕</button>
            </div>))}
          <div className="tool-actions"><button type="button" className="btn small" disabled={s.links.length >= 6} onClick={() => set('links', [...s.links, { label: '', url: '' }])}>Add a link</button></div>
          <div className="row">
            <div className="field"><span className="label">Colour</span><ColorPicker value={s.accent} onChange={(v) => set('accent', v)} label="Signature colour" /></div>
            <div className="field"><label htmlFor="es-f">Font</label><Select id="es-f" value={s.font} onChange={(v) => set('font', v)} options={[{ value: 'Arial, Helvetica, sans-serif', label: 'Arial' }, { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' }, { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' }, { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet' }, { value: 'Georgia, serif', label: 'Georgia' }, { value: '"Times New Roman", Times, serif', label: 'Times' }]} /></div>
            <div className="field"><label htmlFor="es-z">Text size: {s.size}px</label><input id="es-z" type="range" min={12} max={18} value={s.size} onChange={(e) => set('size', +e.target.value)} /></div>
          </div>
          <div className="row">
            <Segmented<S['layout']> label="Layout" value={s.layout} onChange={(v) => set('layout', v)} options={[{ value: 'side', label: 'Picture on the left' }, { value: 'stack', label: 'Picture on top' }]} />
            <label className="check"><input type="checkbox" checked={s.round} onChange={(e) => set('round', e.target.checked)} /> Round picture</label>
            <label className="check"><input type="checkbox" checked={s.divider} onChange={(e) => set('divider', e.target.checked)} /> Coloured line</label>
          </div>
        </div>
        <div className="field">
          <span className="label">Preview</span>
          <div className="es-prev" dangerouslySetInnerHTML={{ __html: html }} />
          <div className="tool-actions"><button type="button" className="btn primary" onClick={copyRich}>Copy signature</button></div>
          {done && <p role="status" className="ok">{done}</p>}
        </div>
      </div>
      <CodeBox title="HTML code" text={html} />
    </div>
  );
}
