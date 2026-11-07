'use client';
import { useEffect, useRef, useState } from 'react';
import { AppLoader } from '@/components/shared/AppLoader';
import { FileDrop } from '@/components/shared/FileDrop';
import { downloadBlob } from '@/components/shared/CopyButton';
import { baseName, formatBytes } from '@/lib/files';

type Pdfjs = typeof import('pdfjs-dist');
type PdfLib = typeof import('pdf-lib');
interface Src { id: number; name: string; bytes: Uint8Array; doc: import('pdfjs-dist').PDFDocumentProxy }
interface Page { id: number; src: number; index: number; rot: number; thumb?: string; w: number; h: number; on: boolean }
let pid = 1, sid = 1;

export default function View() {
  const libs = useRef<{ js: Pdfjs; lib: PdfLib } | null>(null);
  const [ready, setReady] = useState(false);
  const [srcs, setSrcs] = useState<Src[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(''), [msg, setMsg] = useState('');
  const [splitN, setSplitN] = useState(1);
  const dragId = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([import('pdfjs-dist'), import('pdf-lib')]).then(([js, lib]) => {
      js.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
      libs.current = { js, lib }; if (live) setReady(true);
    }).catch(() => { if (live) setMsg('The PDF tools could not be loaded. Check your connection and reload.'); });
    return () => { live = false; };
  }, []);

  const add = async (files: File[]) => {
    const L = libs.current!; setMsg(''); setBusy('Reading…');
    for (const f of files) {
      if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { setMsg(`${f.name} is not a PDF.`); continue; }
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const doc = await L.js.getDocument({ data: bytes.slice() }).promise, id = sid++;
        setSrcs((p) => [...p, { id, name: f.name, bytes, doc }]);
        const fresh: Page[] = [];
        for (let i = 0; i < doc.numPages; i++) { const pg = await doc.getPage(i + 1), vp = pg.getViewport({ scale: 1 }); fresh.push({ id: pid++, src: id, index: i, rot: 0, w: vp.width, h: vp.height, on: false }); }
        setPages((p) => [...p, ...fresh]);
        for (const pg of fresh) {
          const page = await doc.getPage(pg.index + 1), vp = page.getViewport({ scale: 190 / pg.w }), c = document.createElement('canvas');
          c.width = vp.width; c.height = vp.height;
          await page.render({ canvas: c, canvasContext: c.getContext('2d')!, viewport: vp }).promise;
          const thumb = c.toDataURL('image/jpeg', 0.7); setPages((p) => p.map((x) => (x.id === pg.id ? { ...x, thumb } : x)));
        }
      } catch (e) { setMsg(`${f.name} could not be opened. ${/password/i.test(String(e)) ? 'It is locked with a password.' : 'It may be damaged.'}`); }
    }
    setBusy('');
  };

  const build = async (list: Page[]) => {
    const { PDFDocument, degrees } = libs.current!.lib, out = await PDFDocument.create(), cache = new Map<number, import('pdf-lib').PDFDocument>();
    for (const p of list) {
      const s = srcs.find((x) => x.id === p.src)!; let d = cache.get(s.id);
      if (!d) { d = await PDFDocument.load(s.bytes, { ignoreEncryption: true }); cache.set(s.id, d); }
      const [cp] = await out.copyPages(d, [p.index]); cp.setRotation(degrees((cp.getRotation().angle + p.rot) % 360)); out.addPage(cp);
    }
    return new Blob([(await out.save()) as BlobPart], { type: 'application/pdf' });
  };
  const run = async (label: string, fn: () => Promise<void>) => { setBusy(label); setMsg(''); try { await fn(); } catch { setMsg('That did not work. The PDF may be protected.'); } setBusy(''); };

  const on = pages.filter((p) => p.on), target = on.length ? on : pages, first = srcs[0]?.name ?? 'document.pdf';
  const upd = (id: number, f: (p: Page) => Page) => setPages((p) => p.map((x) => (x.id === id ? f(x) : x)));
  const move = (id: number, d: number) => setPages((p) => { const i = p.findIndex((x) => x.id === id), j = i + d; if (i < 0 || j < 0 || j >= p.length) return p; const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const drop = (toId: number) => { const from = dragId.current; dragId.current = null; setOver(null); if (from == null || from === toId) return; setPages((p) => { const a = p.find((x) => x.id === from)!, n = p.filter((x) => x.id !== from), i = n.findIndex((x) => x.id === toId); n.splice(i, 0, a); return n; }); };

  if (!ready) return msg ? <div className="panel"><p className="bad" role="alert">{msg}</p></div> : <AppLoader app="PDF Page Manager" what="the PDF tools" step="Loading the PDF reader" delayed />;
  return (
    <div className="panel">
      <FileDrop accept="application/pdf,.pdf" onFiles={add} title={pages.length ? 'Drop more PDFs here to add their pages' : 'Drop PDFs here, or click to choose'} hint="Adding several PDFs joins them into one" />
      {msg && <p className="bad" role="alert">{msg}</p>}
      {pages.length > 0 && (
        <>
          <div className="tool-actions">
            <span className="stat">{pages.length} page{pages.length > 1 ? 's' : ''}{on.length ? ` · ${on.length} chosen` : ''}</span>
            <button type="button" className="btn small" onClick={() => setPages((p) => p.map((x) => ({ ...x, on: !p.every((y) => y.on) })))}>{pages.every((p) => p.on) ? 'Choose none' : 'Choose all'}</button>
            <button type="button" className="btn small" disabled={!on.length} onClick={() => setPages((p) => p.map((x) => (x.on ? { ...x, rot: (x.rot + 90) % 360 } : x)))}>Turn chosen right</button>
            <button type="button" className="btn small" disabled={!on.length} onClick={() => setPages((p) => p.filter((x) => !x.on))}>Delete chosen</button>
            <button type="button" className="btn small" onClick={() => { setPages([]); setSrcs([]); }}>Start again</button>
          </div>
          <ul className="pdf-grid">
            {pages.map((p, n) => (
              <li key={p.id} draggable onDragStart={() => { dragId.current = p.id; }} onDragOver={(e) => { e.preventDefault(); setOver(p.id); }} onDragLeave={() => setOver(null)} onDrop={() => drop(p.id)} className={`pdf-tile${p.on ? ' on' : ''}${over === p.id ? ' over' : ''}`}>
                <button type="button" className="pdf-thumb" aria-pressed={p.on} aria-label={`Page ${n + 1}, ${p.on ? 'chosen' : 'not chosen'}`} onClick={() => upd(p.id, (x) => ({ ...x, on: !x.on }))}>
                  {p.thumb ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.thumb} alt="" style={{ transform: `rotate(${p.rot}deg)`, maxWidth: p.rot % 180 ? '70%' : '100%' }} draggable={false} /> : <span className="d">…</span>}
                </button>
                <div className="pdf-meta"><b className="d">{n + 1}</b>
                  <span>
                    <button type="button" className="btn small" aria-label={`Move page ${n + 1} earlier`} disabled={n === 0} onClick={() => move(p.id, -1)}>◀</button>
                    <button type="button" className="btn small" aria-label={`Move page ${n + 1} later`} disabled={n === pages.length - 1} onClick={() => move(p.id, 1)}>▶</button>
                    <button type="button" className="btn small" aria-label={`Turn page ${n + 1}`} onClick={() => upd(p.id, (x) => ({ ...x, rot: (x.rot + 90) % 360 }))}>↻</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="tool-actions">
            <button type="button" className="btn primary" disabled={!!busy} onClick={() => run('Saving…', async () => { const b = await build(pages); downloadBlob(`${baseName(first)}-edited.pdf`, b); })}>{busy || 'Save all pages as a PDF'}</button>
            <button type="button" className="btn gold" disabled={!!busy || !on.length} onClick={() => run('Saving…', async () => { downloadBlob(`${baseName(first)}-extract.pdf`, await build(on)); })}>Save chosen pages only</button>
            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <label htmlFor="pd-n">Split every</label><input id="pd-n" type="number" min={1} max={pages.length} value={splitN} onChange={(e) => setSplitN(Math.max(1, +e.target.value || 1))} style={{ width: 80 }} /><span>pages</span>
              <button type="button" className="btn" disabled={!!busy} onClick={() => run('Splitting…', async () => { const { buildZip } = await import('../image-resizer/utils'); const files = []; for (let i = 0, k = 1; i < target.length; i += splitN, k++) { const b = await build(target.slice(i, i + splitN)); files.push({ name: `${baseName(first)}-part-${k}.pdf`, data: new Uint8Array(await b.arrayBuffer()) }); } downloadBlob(`${baseName(first)}-split.zip`, new Blob([buildZip(files) as BlobPart], { type: 'application/zip' })); })}>Split into a .zip</button>
            </div>
            <span className="stat">{srcs.length} file{srcs.length > 1 ? 's' : ''} · {formatBytes(srcs.reduce((n, s) => n + s.bytes.length, 0))}</span>
          </div>
        </>
      )}
    </div>
  );
}
