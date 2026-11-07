'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { downloadBlob } from '@/components/shared/CopyButton';
import { buildZip } from '../image-resizer/utils';
import { canvasBlob, imageFromFile, makeCanvas } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';

type Mode = 'text' | 'image';
interface S { mode: Mode; text: string; bg: string; fg: string; shape: 'square' | 'round' | 'circle'; pad: number; name: string; theme: string }
const DEF: S = { mode: 'text', text: 'P', bg: '#337957', fg: '#F2E4CE', shape: 'square', pad: 14, name: 'My site', theme: '#337957' };
const SIZES: [string, number][] = [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['favicon-48x48.png', 48], ['apple-touch-icon.png', 180], ['android-chrome-192x192.png', 192], ['android-chrome-512x512.png', 512]];

function paint(size: number, s: S, img: HTMLImageElement | null) {
  const c = makeCanvas(size, size), x = c.getContext('2d')!, r = s.shape === 'circle' ? size / 2 : s.shape === 'round' ? size * 0.2 : 0;
  x.beginPath(); x.roundRect(0, 0, size, size, r); x.clip();
  if (s.mode === 'text' || !img) { x.fillStyle = s.bg; x.fillRect(0, 0, size, size); }
  const p = (s.pad / 100) * size;
  if (s.mode === 'image' && img) {
    const k = Math.min((size - p * 2) / img.naturalWidth, (size - p * 2) / img.naturalHeight);
    if (s.bg !== 'transparent') { x.fillStyle = s.bg; x.fillRect(0, 0, size, size); }
    x.drawImage(img, (size - img.naturalWidth * k) / 2, (size - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
  } else {
    const t = [...s.text.trim()].slice(0, 2).join('') || '?', fs = (size - p * 2) * (t.length > 1 ? 0.62 : 0.88);
    x.fillStyle = s.fg; x.font = `700 ${fs}px "Caracteres L2", "Arial Narrow", Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const m = x.measureText(t), h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    x.fillText(t, size / 2, size / 2 + h / 2 - m.actualBoundingBoxDescent);
  }
  return c;
}

async function buildIco(parts: { size: number; png: Uint8Array }[]) {
  const head = new DataView(new ArrayBuffer(6 + parts.length * 16)); head.setUint16(2, 1, true); head.setUint16(4, parts.length, true);
  let off = head.byteLength;
  parts.forEach((p, i) => { const o = 6 + i * 16; head.setUint8(o, p.size % 256); head.setUint8(o + 1, p.size % 256); head.setUint16(o + 4, 1, true); head.setUint16(o + 6, 32, true); head.setUint32(o + 8, p.png.length, true); head.setUint32(o + 12, off, true); off += p.png.length; });
  return new Blob([head, ...parts.map((p) => p.png as BlobPart)], { type: 'image/x-icon' });
}

export default function View() {
  const [s, setS] = useLocalState<S>('favicon-generator', 'settings', DEF);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const url = useRef<string | null>(null);
  const prev = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((p) => ({ ...p, [k]: v }));
  useEffect(() => () => { if (url.current) URL.revokeObjectURL(url.current); }, []);
  useEffect(() => {
    const draw = () => { const c = prev.current; if (!c) return; const big = paint(192, s, img); c.width = 192; c.height = 192; c.getContext('2d')!.drawImage(big, 0, 0); };
    draw(); document.fonts?.ready.then(draw);
  }, [s, img]);

  const snippet = useMemo(() => `<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">\n<meta name="theme-color" content="${s.theme}">`, [s.theme]);
  const manifest = useMemo(() => JSON.stringify({ name: s.name, short_name: s.name, icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }], theme_color: s.theme, background_color: s.bg, display: 'standalone' }, null, 2), [s.name, s.theme, s.bg]);

  const make = async () => {
    setBusy(true); await document.fonts?.ready;
    const png = async (n: number) => new Uint8Array(await (await canvasBlob(paint(n, s, img))).arrayBuffer()), files: { name: string; data: Uint8Array }[] = [];
    for (const [name, n] of SIZES) files.push({ name, data: await png(n) });
    files.push({ name: 'favicon.ico', data: new Uint8Array(await (await buildIco([{ size: 16, png: await png(16) }, { size: 32, png: await png(32) }, { size: 48, png: await png(48) }])).arrayBuffer()) });
    const enc = new TextEncoder(); files.push({ name: 'site.webmanifest', data: enc.encode(manifest) }, { name: 'head-snippet.html', data: enc.encode(snippet) });
    downloadBlob('favicons.zip', new Blob([buildZip(files) as BlobPart], { type: 'application/zip' })); setBusy(false);
  };

  return (
    <div className="panel">
      <div className="split">
        <div className="field" style={{ gap: 16 }}>
          <Segmented<Mode> label="Make it from" value={s.mode} onChange={(v) => set('mode', v)} options={[{ value: 'text', label: 'Letters or emoji' }, { value: 'image', label: 'A picture' }]} />
          {s.mode === 'text'
            ? <div className="field"><label htmlFor="fg-t">Letters or emoji (up to 2)</label><input id="fg-t" type="text" maxLength={4} value={s.text} onChange={(e) => set('text', e.target.value)} /></div>
            : <FileDrop multiple={false} accept="image/*" title={img ? 'Picture loaded. Drop another to swap' : 'Drop your logo here, or click to choose'} onFiles={async (f) => { try { const r = await imageFromFile(f[0]); if (url.current) URL.revokeObjectURL(url.current); url.current = r.url; setImg(r.img); } catch { /* ignored: the picture stays as it was */ } }} />}
          <div className="row">
            <div className="field"><span className="label">Background</span><ColorPicker value={s.bg} onChange={(v) => set('bg', v)} label="Background colour" /></div>
            {s.mode === 'text' && <div className="field"><span className="label">Letter colour</span><ColorPicker value={s.fg} onChange={(v) => set('fg', v)} label="Letter colour" /></div>}
          </div>
          <Segmented<S['shape']> label="Shape" value={s.shape} onChange={(v) => set('shape', v)} options={[{ value: 'square', label: 'Square' }, { value: 'round', label: 'Rounded' }, { value: 'circle', label: 'Circle' }]} />
          <div className="field"><label htmlFor="fg-p">Space around it: {s.pad}%</label><input id="fg-p" type="range" min={0} max={30} value={s.pad} onChange={(e) => set('pad', +e.target.value)} /></div>
        </div>
        <div className="field">
          <span className="label">Preview</span>
          <div className="fav-prev"><canvas ref={prev} width={192} height={192} aria-label="Large preview" />
            <div className="fav-small">{[48, 32, 16].map((n) => <FavSmall key={n} n={n} s={s} img={img} />)}</div></div>
          <div className="row"><div className="field"><label htmlFor="fg-n">Site name</label><input id="fg-n" type="text" value={s.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="field"><span className="label">Browser bar colour</span><ColorPicker value={s.theme} onChange={(v) => set('theme', v)} label="Browser bar colour" /></div></div>
        </div>
      </div>
      <div className="tool-actions"><button type="button" className="btn primary" onClick={make} disabled={busy}>{busy ? 'Making…' : 'Download the package (.zip)'}</button></div>
      <div className="result-list"><CodeBox title="Add to your page head" text={snippet} /><CodeBox title="site.webmanifest" text={manifest} /></div>
    </div>
  );
}

function FavSmall({ n, s, img }: { n: number; s: S; img: HTMLImageElement | null }) {
  const r = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = r.current!; c.width = n; c.height = n; const d = () => { c.getContext('2d')!.clearRect(0, 0, n, n); c.getContext('2d')!.drawImage(paint(n, s, img), 0, 0); }; d(); document.fonts?.ready.then(d); }, [n, s, img]);
  return <span><canvas ref={r} width={n} height={n} aria-label={`${n} pixels`} /><small className="d">{n}</small></span>;
}
