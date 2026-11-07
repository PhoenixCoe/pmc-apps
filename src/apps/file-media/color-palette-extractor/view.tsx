'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { CopyButton } from '@/components/shared/CopyButton';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { contrast, fromHex, imageFromFile, makeCanvas, toHex } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';

type Fmt = 'hex' | 'rgb' | 'css' | 'json';

/** Median-cut on a small sample of the picture. Returns colours with the share of the picture each one covers. */
function extract(data: Uint8ClampedArray, n: number) {
  const px: number[][] = [];
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) px.push([data[i], data[i + 1], data[i + 2]]);
  if (!px.length) return [];
  let boxes = [px];
  while (boxes.length < n) {
    let bi = -1, best = 0, ch = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; for (let k = 0; k < 3; k++) { let mn = 255, mx = 0; for (const p of b) { mn = Math.min(mn, p[k]); mx = Math.max(mx, p[k]); } const sc = (mx - mn) * Math.sqrt(b.length); if (sc > best) { best = sc; bi = i; ch = k; } } });
    if (bi < 0) break;
    const b = boxes[bi].sort((a, z) => a[ch] - z[ch]), h = b.length >> 1; boxes.splice(bi, 1, b.slice(0, h), b.slice(h));
  }
  const all = boxes.map((b) => { const s = [0, 0, 0]; for (const p of b) for (let k = 0; k < 3; k++) s[k] += p[k] / b.length; return { rgb: s, share: b.length / px.length }; }).sort((a, z) => z.share - a.share);
  // Boxes that came out as almost the same colour are joined, so the list has no repeats.
  const out: { rgb: number[]; share: number }[] = [];
  for (const c of all) { const near = out.find((o) => Math.hypot(o.rgb[0] - c.rgb[0], o.rgb[1] - c.rgb[1], o.rgb[2] - c.rgb[2]) < 28); if (near) near.share += c.share; else out.push({ ...c }); }
  return out.sort((a, z) => z.share - a.share).map((o) => ({ hex: toHex(o.rgb[0], o.rgb[1], o.rgb[2]), share: o.share }));
}

const badge = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Fail');

export default function View() {
  const [count, setCount] = useLocalState('color-palette-extractor', 'count', 6);
  const [fmt, setFmt] = useLocalState<Fmt>('color-palette-extractor', 'format', 'hex');
  const [pal, setPal] = useState<{ hex: string; share: number }[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [src, setSrc] = useState<string>('');
  const full = useRef<HTMLCanvasElement | null>(null), url = useRef('');
  useEffect(() => () => { if (url.current) URL.revokeObjectURL(url.current); }, []);

  const redo = (n: number) => { const c = full.current; if (!c) return; const s = makeCanvas(160, (160 * c.height) / c.width); s.getContext('2d')!.drawImage(c, 0, 0, s.width, s.height); setPal(extract(s.getContext('2d')!.getImageData(0, 0, s.width, s.height).data, n)); };
  const load = async (f: File[]) => {
    try {
      const { img, url: u } = await imageFromFile(f[0]); if (url.current) URL.revokeObjectURL(url.current); url.current = u; setSrc(u);
      const c = makeCanvas(img.naturalWidth, img.naturalHeight); c.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0); full.current = c; setPick(null); redo(count);
    } catch { /* leave what was there */ }
  };
  useEffect(() => { redo(count); }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  const click = (e: React.MouseEvent<HTMLImageElement>) => {
    const c = full.current; if (!c) return; const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * c.width), y = Math.floor(((e.clientY - r.top) / r.height) * c.height), d = c.getContext('2d')!.getImageData(x, y, 1, 1).data;
    setPick(toHex(d[0], d[1], d[2]));
  };

  const text = useMemo(() => {
    const L = pal.map((p) => p.hex);
    if (fmt === 'hex') return L.join('\n');
    if (fmt === 'rgb') return L.map((h) => `rgb(${fromHex(h).join(', ')})`).join('\n');
    if (fmt === 'css') return `:root {\n${L.map((h, i) => `  --colour-${i + 1}: ${h};`).join('\n')}\n}`;
    return JSON.stringify(L, null, 2);
  }, [pal, fmt]);

  return (
    <div className="panel">
      <FileDrop multiple={false} accept="image/*" paste title={src ? 'Drop another picture to swap' : 'Drop a picture here, or click to choose'} onFiles={load} />
      {src && (
        <div className="split">
          <div className="field">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Your picture. Click it to pick a colour." onClick={click} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', border: '3px solid var(--ink)', cursor: 'crosshair', background: '#fff' }} />
            {pick && <div className="tool-actions"><span className="swatch" style={{ background: pick }} aria-hidden /><b className="code">{pick}</b><CopyButton text={pick} /></div>}
          </div>
          <div className="field">
            <div className="field"><label htmlFor="cp-n">Colours: {count}</label><input id="cp-n" type="range" min={2} max={12} value={count} onChange={(e) => setCount(+e.target.value)} /></div>
            <ul className="pal">
              {pal.map((p) => { const w = contrast(p.hex, '#ffffff'), k = contrast(p.hex, '#000000'); return (
                <li key={p.hex} style={{ background: p.hex, color: w >= k ? '#fff' : '#000' }}>
                  <b className="code">{p.hex}</b><span>{Math.round(p.share * 100)}%</span>
                  <span title="Contrast with white and black">{w >= k ? `White ${w.toFixed(1)} ${badge(w)}` : `Black ${k.toFixed(1)} ${badge(k)}`}</span>
                  <CopyButton text={p.hex} />
                </li>); })}
            </ul>
          </div>
        </div>
      )}
      {pal.length > 0 && (<><Segmented<Fmt> label="Copy all as" value={fmt} onChange={setFmt} options={[{ value: 'hex', label: 'HEX' }, { value: 'rgb', label: 'RGB' }, { value: 'css', label: 'CSS variables' }, { value: 'json', label: 'JSON' }]} /><CodeBox title="Palette" text={text} /></>)}
    </div>
  );
}
