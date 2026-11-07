'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { downloadBlob } from '@/components/shared/CopyButton';
import { baseName, canvasBlob, formatBytes, fromHex, imageFromFile, makeCanvas, toHex } from '@/lib/files';

type Tool = 'pick' | 'erase' | 'restore';
const MAX = 2400;

export default function View() {
  const orig = useRef<ImageData | null>(null), alpha = useRef<Uint8ClampedArray | null>(null), manual = useRef<Int8Array | null>(null);
  const view = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(''), [size, setSize] = useState<[number, number]>([0, 0]);
  const [key, setKey] = useState('#ffffff'), [tol, setTol] = useState(40), [soft, setSoft] = useState(12), [contig, setContig] = useState(true);
  const [seed, setSeed] = useState<[number, number] | null>(null);
  const [tool, setTool] = useState<Tool>('pick'), [brush, setBrush] = useState(24), [bg, setBg] = useState<'check' | 'dark' | 'colour'>('check'), [bgc, setBgc] = useState('#B49A57');
  const [bytes, setBytes] = useState(0), [tick, setTick] = useState(0);
  const painting = useRef(false);

  const load = async (f: File[]) => {
    try {
      const { img, url } = await imageFromFile(f[0]), k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const c = makeCanvas(img.naturalWidth * k, img.naturalHeight * k), x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      orig.current = x.getImageData(0, 0, c.width, c.height); alpha.current = new Uint8ClampedArray(c.width * c.height).fill(255); manual.current = new Int8Array(c.width * c.height);
      const d = orig.current.data, corner = toHex(d[0], d[1], d[2]); setKey(corner); setSeed([0, 0]); setName(f[0].name); setSize([c.width, c.height]); setTool('pick'); setTick((t) => t + 1);
    } catch { /* picture stays as it was */ }
  };

  // Work out which pixels are background from the chosen colour.
  useEffect(() => {
    const im = orig.current, a = alpha.current; if (!im || !a) return;
    const { width: W, height: H, data: d } = im, [kr, kg, kb] = fromHex(key), lim = tol * 4.4, edge = lim + soft * 4.4;
    const dist = (i: number) => Math.hypot(d[i * 4] - kr, d[i * 4 + 1] - kg, d[i * 4 + 2] - kb);
    const out = new Uint8ClampedArray(W * H).fill(255);
    const ramp = (v: number) => (v <= lim ? 0 : v >= edge ? 255 : ((v - lim) / Math.max(1, edge - lim)) * 255);
    if (!contig || !seed) { for (let i = 0; i < W * H; i++) out[i] = ramp(dist(i)); }
    else {
      const seen = new Uint8Array(W * H), stack: number[] = [], start = Math.min(H - 1, seed[1]) * W + Math.min(W - 1, seed[0]);
      // Flood outwards from the clicked spot (and the four corners), so only background that touches it is removed.
      const starts = [start, 0, W - 1, (H - 1) * W, H * W - 1].filter((s) => dist(s) <= edge);
      for (const s of starts) { seen[s] = 1; stack.push(s); }
      while (stack.length) {
        const p = stack.pop()!, v = dist(p); out[p] = ramp(v);
        if (v > lim) continue;
        const x = p % W, y = (p / W) | 0;
        for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) if (q >= 0 && !seen[q] && dist(q) <= edge) { seen[q] = 1; stack.push(q); }
      }
    }
    alpha.current = out; setTick((t) => t + 1);
  }, [key, tol, soft, contig, seed]);

  const paint = useCallback(() => {
    const im = orig.current, a = alpha.current, m = manual.current, c = view.current; if (!im || !a || !m || !c) return;
    c.width = im.width; c.height = im.height; const o = new ImageData(new Uint8ClampedArray(im.data), im.width, im.height);
    for (let i = 0; i < a.length; i++) o.data[i * 4 + 3] = m[i] === 1 ? 0 : m[i] === -1 ? 255 : Math.min(a[i], im.data[i * 4 + 3]);
    c.getContext('2d')!.putImageData(o, 0, 0);
  }, []);
  useEffect(paint, [tick, paint]);

  const at = (e: React.PointerEvent) => { const c = view.current!, r = c.getBoundingClientRect(); return [Math.floor(((e.clientX - r.left) / r.width) * c.width), Math.floor(((e.clientY - r.top) / r.height) * c.height)] as const; };
  const stroke = (e: React.PointerEvent) => {
    const im = orig.current, m = manual.current; if (!im || !m) return; const [cx, cy] = at(e), rad = (brush / 2) * (im.width / view.current!.getBoundingClientRect().width), r2 = rad * rad;
    for (let y = Math.max(0, Math.floor(cy - rad)); y <= Math.min(im.height - 1, Math.ceil(cy + rad)); y++) for (let x = Math.max(0, Math.floor(cx - rad)); x <= Math.min(im.width - 1, Math.ceil(cx + rad)); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) m[y * im.width + x] = tool === 'erase' ? 1 : -1;
    paint();
  };
  const down = (e: React.PointerEvent) => {
    if (!orig.current) return;
    if (tool === 'pick') { const [x, y] = at(e), d = orig.current.data, i = (y * orig.current.width + x) * 4; setKey(toHex(d[i], d[i + 1], d[i + 2])); setSeed([x, y]); return; }
    painting.current = true; e.currentTarget.setPointerCapture(e.pointerId); stroke(e);
  };
  const save = async () => { const b = await canvasBlob(view.current!); setBytes(b.size); downloadBlob(`${baseName(name)}-no-background.png`, b); };
  const reset = () => { manual.current?.fill(0); paint(); };

  const bgStyle: React.CSSProperties = bg === 'check' ? { background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 18px 18px' } : { background: bg === 'dark' ? '#171717' : bgc };
  return (
    <div className="panel">
      <FileDrop multiple={false} accept="image/*" paste title={name ? `Loaded: ${name}. Drop another to swap` : 'Drop a picture here, or click to choose'} hint="Works best on plain backgrounds" onFiles={load} />
      {name && (
        <>
          <div className="row">
            <Segmented<Tool> label="Tool" value={tool} onChange={setTool} options={[{ value: 'pick', label: 'Pick the background' }, { value: 'erase', label: 'Rub out' }, { value: 'restore', label: 'Bring back' }]} />
            {tool === 'pick' ? <>
              <div className="field"><span className="label">Background colour</span><ColorPicker value={key} onChange={setKey} label="Background colour" /></div>
              <div className="field"><label htmlFor="br-t">How close: {tol}</label><input id="br-t" type="range" min={1} max={100} value={tol} onChange={(e) => setTol(+e.target.value)} /></div>
              <div className="field"><label htmlFor="br-s">Soft edge: {soft}</label><input id="br-s" type="range" min={0} max={40} value={soft} onChange={(e) => setSoft(+e.target.value)} /></div>
              <label className="check"><input type="checkbox" checked={contig} onChange={(e) => setContig(e.target.checked)} /> Only the part touching where I click</label>
            </> : <div className="field"><label htmlFor="br-b">Brush: {brush}px</label><input id="br-b" type="range" min={4} max={120} value={brush} onChange={(e) => setBrush(+e.target.value)} /></div>}
          </div>
          <div className="br-stage" style={bgStyle}>
            <canvas ref={view} aria-label={tool === 'pick' ? 'Your picture. Click the background to remove it.' : 'Your picture. Drag to paint.'} style={{ cursor: tool === 'pick' ? 'crosshair' : 'cell', touchAction: 'none' }}
              onPointerDown={down} onPointerMove={(e) => { if (painting.current) stroke(e); }} onPointerUp={() => { painting.current = false; }} />
          </div>
          <div className="tool-actions">
            <Segmented<'check' | 'dark' | 'colour'> label="Show it on" value={bg} onChange={setBg} options={[{ value: 'check', label: 'Checks' }, { value: 'dark', label: 'Black' }, { value: 'colour', label: 'A colour' }]} />
            {bg === 'colour' && <ColorPicker value={bgc} onChange={setBgc} label="Colour behind the picture" />}
          </div>
          <div className="tool-actions">
            <button type="button" className="btn primary" onClick={save}>Download PNG</button>
            <button type="button" className="btn" onClick={reset}>Undo my brush strokes</button>
            <span className="stat">{size[0]} × {size[1]}{bytes ? ` · ${formatBytes(bytes)}` : ''}</span>
          </div>
        </>
      )}
    </div>
  );
}
