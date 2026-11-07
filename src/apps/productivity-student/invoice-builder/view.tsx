'use client';
import { useEffect, useState } from 'react';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { Select } from '@/components/shared/Select';
import { downloadBlob } from '@/components/shared/CopyButton';
import { canvasBlob, imageFromFile, makeCanvas, readDataUrl } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';
import { CURRENCIES, money, totals, type Invoice } from './calc';
import { invoicePdf } from './pdf';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const fresh = (): Invoice => ({ from: '', to: '', number: '0001', issued: iso(new Date()), due: iso(new Date(Date.now() + 14 * 864e5)), currency: 'GBP', tax: 0, discount: 0, discountKind: 'percent', notes: '', lines: [{ id: 1, desc: '', qty: 1, price: 0 }] });
let lid = 100;

export default function View() {
  const [inv, setInv] = useLocalState<Invoice>('invoice-builder', 'invoice', fresh());
  const [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) => setInv((p) => ({ ...p, [k]: v }));
  const line = (id: number, patch: Partial<Invoice['lines'][0]>) => setInv((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const t = totals(inv);
  const logo = async (f: File[]) => { try { const { img, url } = await imageFromFile(f[0]), k = Math.min(1, 400 / img.naturalWidth), c = makeCanvas(img.naturalWidth * k, img.naturalHeight * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); set('logo', await readDataUrl(await canvasBlob(c))); } catch { /* ignore */ } };
  const next = () => setInv((p) => ({ ...fresh(), from: p.from, currency: p.currency, tax: p.tax, notes: p.notes, logo: p.logo, number: String((parseInt(p.number, 10) || 0) + 1).padStart(Math.max(4, p.number.length), '0') }));
  if (!ready) return <div className="panel"><div className="empty">Loading…</div></div>;
  return (
    <div className="panel">
      <div className="split">
        <div className="field" style={{ gap: 16 }}>
          <div className="row">
            <div className="field"><label htmlFor="iv-n">Invoice number</label><input id="iv-n" type="text" value={inv.number} onChange={(e) => set('number', e.target.value)} style={{ width: 130 }} /></div>
            <div className="field"><label htmlFor="iv-c">Currency</label><Select id="iv-c" value={inv.currency} onChange={(v) => set('currency', v)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></div>
          </div>
          <div className="row">
            <div className="field"><label htmlFor="iv-i">Issued</label><input id="iv-i" type="date" value={inv.issued} onChange={(e) => set('issued', e.target.value)} className="datef" /></div>
            <div className="field"><label htmlFor="iv-d">Due</label><input id="iv-d" type="date" value={inv.due} onChange={(e) => set('due', e.target.value)} className="datef" /></div>
          </div>
          <div className="field"><label htmlFor="iv-f">From (your details)</label><textarea id="iv-f" style={{ minHeight: 90 }} value={inv.from} onChange={(e) => set('from', e.target.value)} placeholder={'Your name or business\nAddress\nEmail'} /></div>
          <div className="field"><label htmlFor="iv-t">Bill to</label><textarea id="iv-t" style={{ minHeight: 90 }} value={inv.to} onChange={(e) => set('to', e.target.value)} placeholder={'Client name\nAddress'} /></div>
          {inv.logo ? <div className="tool-actions">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={inv.logo} alt="Your logo" style={{ height: 48 }} /><button type="button" className="btn small" onClick={() => set('logo', undefined)}>Remove logo</button></div> : <FileDrop multiple={false} accept="image/png,image/jpeg" title="Add your logo (optional)" onFiles={logo} />}
        </div>
        <div className="field" style={{ gap: 12 }}>
          <span className="label">Items</span>
          {inv.lines.map((l, i) => (
            <div key={l.id} className="iv-line">
              <input type="text" aria-label={`Item ${i + 1} description`} placeholder="Description" value={l.desc} onChange={(e) => line(l.id, { desc: e.target.value })} />
              <input type="number" aria-label="Quantity" min={0} step="any" value={l.qty} onChange={(e) => line(l.id, { qty: +e.target.value })} />
              <input type="number" aria-label="Price each" min={0} step="any" value={l.price} onChange={(e) => line(l.id, { price: +e.target.value })} />
              <b className="code">{money(l.qty * l.price, inv.currency)}</b>
              <button type="button" className="btn small" aria-label={`Remove item ${i + 1}`} disabled={inv.lines.length < 2} onClick={() => set('lines', inv.lines.filter((x) => x.id !== l.id))}>✕</button>
            </div>
          ))}
          <div className="tool-actions"><button type="button" className="btn" onClick={() => set('lines', [...inv.lines, { id: lid++ + Date.now(), desc: '', qty: 1, price: 0 }])}>Add an item</button></div>
          <div className="row">
            <div className="field"><label htmlFor="iv-x">Tax %</label><input id="iv-x" type="number" min={0} step="any" value={inv.tax} onChange={(e) => set('tax', +e.target.value)} style={{ width: 100 }} /></div>
            <div className="field"><label htmlFor="iv-s">Discount</label><input id="iv-s" type="number" min={0} step="any" value={inv.discount} onChange={(e) => set('discount', +e.target.value)} style={{ width: 110 }} /></div>
            <Segmented<'percent' | 'amount'> label="Discount type" value={inv.discountKind} onChange={(v) => set('discountKind', v)} options={[{ value: 'percent', label: '%' }, { value: 'amount', label: inv.currency }]} />
          </div>
          <div className="field"><label htmlFor="iv-o">Notes and payment details</label><textarea id="iv-o" style={{ minHeight: 90 }} value={inv.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Bank details, thanks, terms" /></div>
        </div>
      </div>
      <div className="iv-sum"><span>Subtotal <b>{money(t.sub, inv.currency)}</b></span>{t.disc > 0 && <span>Discount <b>-{money(t.disc, inv.currency)}</b></span>}{inv.tax > 0 && <span>Tax <b>{money(t.tax, inv.currency)}</b></span>}<span className="iv-total d">Total {money(t.total, inv.currency)}</span></div>
      <div className="tool-actions">
        <button type="button" className="btn primary" disabled={busy} onClick={async () => { setBusy(true); try { downloadBlob(`invoice-${inv.number}.pdf`, await invoicePdf(inv)); } finally { setBusy(false); } }}>{busy ? 'Making the PDF…' : 'Download PDF'}</button>
        <button type="button" className="btn" onClick={next}>Start the next invoice</button>
      </div>
    </div>
  );
}
