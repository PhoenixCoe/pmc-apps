import { totals, money, type Invoice } from './calc';

/** Draws the invoice with plain PDF text and lines, so the file is small and prints cleanly. */
export async function invoicePdf(inv: Invoice): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = (s: string) => s.replace(/[^\x20-\x7E -ÿ€]/g, '?');
  const W = 595, H = 842, M = 48, ink = rgb(0.09, 0.09, 0.09), grey = rgb(0.4, 0.4, 0.38), green = rgb(0.2, 0.47, 0.34);
  let page = doc.addPage([W, H]), y = H - M;
  const text = (t: string, x: number, yy: number, size = 10, f = font, c = ink, right = false) => { const s = clean(t), w = f.widthOfTextAtSize(s, size); page.drawText(s, { x: right ? x - w : x, y: yy, size, font: f, color: c }); };
  const wrap = (t: string, max: number, size: number, f = font) => { const out: string[] = []; for (const para of clean(t).split('\n')) { let line = ''; for (const w of para.split(' ')) { const tr = line ? line + ' ' + w : w; if (f.widthOfTextAtSize(tr, size) > max && line) { out.push(line); line = w; } else line = tr; } out.push(line); } return out; };

  let logoH = 0;
  if (inv.logo) { try { const bytes = Uint8Array.from(atob(inv.logo.split(',')[1]), (c) => c.charCodeAt(0)), img = inv.logo.startsWith('data:image/png') ? await doc.embedPng(bytes) : await doc.embedJpg(bytes), k = Math.min(140 / img.width, 60 / img.height); page.drawImage(img, { x: M, y: y - img.height * k, width: img.width * k, height: img.height * k }); logoH = img.height * k; } catch { /* the logo is skipped */ } }
  text('INVOICE', W - M, y - 18, 26, bold, green, true); text(`No. ${inv.number}`, W - M, y - 38, 11, font, grey, true);
  y -= Math.max(logoH, 44) + 26;
  const col = (title: string, body: string, x: number, w: number) => { text(title.toUpperCase(), x, y, 8, bold, grey); let yy = y - 14; for (const l of wrap(body, w, 10)) { text(l, x, yy); yy -= 13; } return yy; };
  const a = col('From', inv.from, M, 220), b = col('Bill to', inv.to, M + 250, 200);
  text('ISSUED', W - M - 90, y, 8, bold, grey); text(inv.issued, W - M, y, 10, font, ink, true); text('DUE', W - M - 90, y - 16, 8, bold, grey); text(inv.due, W - M, y - 16, 10, font, ink, true);
  y = Math.min(a, b, y - 40) - 24;

  const head = () => { page.drawRectangle({ x: M, y: y - 6, width: W - M * 2, height: 22, color: rgb(0.09, 0.09, 0.09) }); text('DESCRIPTION', M + 8, y, 8, bold, rgb(0.95, 0.89, 0.81)); text('QTY', W - M - 190, y, 8, bold, rgb(0.95, 0.89, 0.81), true); text('PRICE', W - M - 110, y, 8, bold, rgb(0.95, 0.89, 0.81), true); text('AMOUNT', W - M - 8, y, 8, bold, rgb(0.95, 0.89, 0.81), true); y -= 26; };
  head();
  for (const l of inv.lines) {
    const ls = wrap(l.desc || '-', 270, 10), need = ls.length * 13 + 12;
    if (y - need < M + 140) { page = doc.addPage([W, H]); y = H - M; head(); }
    ls.forEach((t, i) => text(t, M + 8, y - i * 13)); text(String(l.qty), W - M - 190, y, 10, font, ink, true); text(money(l.price, inv.currency), W - M - 110, y, 10, font, ink, true); text(money(l.qty * l.price, inv.currency), W - M - 8, y, 10, font, ink, true);
    y -= need; page.drawLine({ start: { x: M, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 0.5, color: rgb(0.8, 0.78, 0.72) });
  }
  const t = totals(inv); y -= 12;
  const row = (label: string, v: string, f = font, size = 10) => { text(label, W - M - 150, y, size, f, grey, true); text(v, W - M - 8, y, size, f, ink, true); y -= 18; };
  row('Subtotal', money(t.sub, inv.currency)); if (t.disc) row(`Discount${inv.discountKind === 'percent' ? ` (${inv.discount}%)` : ''}`, `-${money(t.disc, inv.currency)}`); if (inv.tax) row(`Tax (${inv.tax}%)`, money(t.tax, inv.currency));
  page.drawRectangle({ x: W - M - 240, y: y - 8, width: 240, height: 28, color: green }); text('TOTAL', W - M - 230, y + 2, 10, bold, rgb(0.95, 0.89, 0.81)); text(money(t.total, inv.currency), W - M - 8, y + 2, 13, bold, rgb(1, 1, 1), true); y -= 44;
  if (inv.notes.trim()) { text('NOTES', M, y, 8, bold, grey); y -= 14; for (const l of wrap(inv.notes, W - M * 2, 10)) { if (y < M) { page = doc.addPage([W, H]); y = H - M; } text(l, M, y); y -= 13; } }
  return new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });
}
