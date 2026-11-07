'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { Select } from '@/components/shared/Select';
import { downloadBlob } from '@/components/shared/CopyButton';
import { baseName, canvasBlob, imageFromFile, makeCanvas } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';

interface S { frame: 'browser' | 'window' | 'phone' | 'none'; dark: boolean; bgKind: 'colour' | 'gradient' | 'none'; c1: string; c2: string; pad: number; radius: number; shadow: number; url: string; scale: 1 | 2 }
const DEF: S = { frame: 'browser', dark: false, bgKind: 'gradient', c1: '#337957', c2: '#1A4934', pad: 80, radius: 14, shadow: 40, url: 'pmcstudios.uk', scale: 2 };

function render(img: HTMLImageElement, s: S, k: number): HTMLCanvasElement {
  const iw = img.naturalWidth, ih = img.naturalHeight, bar = s.frame === 'browser' ? 46 : s.frame === 'window' ? 34 : 0, bez = s.frame === 'phone' ? 22 : 0;
  const w = iw + bez * 2, h = ih + bar + bez * 2, pad = s.pad, W = (w + pad * 2) * k, H = (h + pad * 2) * k;
  const c = makeCanvas(W, H), x = c.getContext('2d')!; x.scale(k, k);
  if (s.bgKind === 'colour') { x.fillStyle = s.c1; x.fillRect(0, 0, W, H); }
  else if (s.bgKind === 'gradient') { const g = x.createLinearGradient(0, 0, w + pad * 2, h + pad * 2); g.addColorStop(0, s.c1); g.addColorStop(1, s.c2); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  const r = s.frame === 'phone' ? Math.max(s.radius, 38) : s.radius, X = pad, Y = pad;
  const body = s.frame === 'phone' ? '#171717' : s.dark ? '#232323' : '#f4f1ea', ink = s.dark ? '#d8d2c4' : '#4a4a44';
  x.save(); if (s.shadow) { x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = s.shadow; x.shadowOffsetY = s.shadow * 0.35; }
  x.fillStyle = body; x.beginPath(); x.roundRect(X, Y, w, h, r); x.fill(); x.restore();
  x.save(); x.beginPath(); x.roundRect(X, Y, w, h, r); x.clip();
  if (s.frame === 'browser' || s.frame === 'window') {
    x.fillStyle = s.dark ? '#2d2d2d' : '#e6e1d4'; x.fillRect(X, Y, w, bar);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((cl, i) => { x.fillStyle = cl; x.beginPath(); x.arc(X + 22 + i * 22, Y + bar / 2, 6.5, 0, 7); x.fill(); });
    if (s.frame === 'browser') {
      const bw = Math.min(w - 190, 560), bx = X + (w - bw) / 2; x.fillStyle = s.dark ? '#171717' : '#fbf8f0'; x.beginPath(); x.roundRect(bx, Y + 9, bw, bar - 18, 8); x.fill();
      x.fillStyle = ink; x.font = '15px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s.url, bx + bw / 2, Y + bar / 2 + 1);
    }
  }
  x.drawImage(img, X + bez, Y + bar + bez, iw, ih);
  if (s.frame === 'phone') { x.restore(); x.fillStyle = '#000'; x.beginPath(); x.roundRect(X + w / 2 - 44, Y + 10, 88, 22, 11); x.fill(); } else x.restore();
  return c;
}

export default function View() {
  const [s, setS] = useLocalState<S>('screenshot-framer', 'settings', DEF);
  const [img, setImg] = useState<HTMLImageElement | null>(null), [name, setName] = useState('');
  const view = useRef<HTMLCanvasElement>(null), url = useRef('');
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((p) => ({ ...p, [k]: v }));
  useEffect(() => () => { if (url.current) URL.revokeObjectURL(url.current); }, []);
  const paint = useCallback(() => {
    if (!img || !view.current) return; const full = render(img, s, 1), c = view.current, k = Math.min(1, 900 / full.width);
    c.width = full.width * k; c.height = full.height * k; const x = c.getContext('2d')!; x.imageSmoothingQuality = 'high'; x.drawImage(full, 0, 0, c.width, c.height);
  }, [img, s]);
  useEffect(paint, [paint]);
  const load = async (f: File[]) => { try { const r = await imageFromFile(f[0]); if (url.current) URL.revokeObjectURL(url.current); url.current = r.url; setImg(r.img); setName(f[0].name); } catch { /* leave */ } };
  return (
    <div className="panel">
      <FileDrop multiple={false} accept="image/*" paste title={img ? `Loaded: ${name}. Drop another to swap` : 'Drop a screenshot here, or click to choose'} onFiles={load} />
      <div className="row">
        <div className="field"><label htmlFor="sf-f">Frame</label><Select id="sf-f" value={s.frame} onChange={(v) => set('frame', v)} options={[{ value: 'browser', label: 'Browser window' }, { value: 'window', label: 'App window' }, { value: 'phone', label: 'Phone' }, { value: 'none', label: 'No frame' }]} /></div>
        <Segmented<'light' | 'dark'> label="Frame colour" value={s.dark ? 'dark' : 'light'} onChange={(v) => set('dark', v === 'dark')} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        {s.frame === 'browser' && <div className="field"><label htmlFor="sf-u">Address</label><input id="sf-u" type="text" value={s.url} onChange={(e) => set('url', e.target.value)} /></div>}
      </div>
      <div className="row">
        <Segmented<S['bgKind']> label="Background" value={s.bgKind} onChange={(v) => set('bgKind', v)} options={[{ value: 'colour', label: 'Colour' }, { value: 'gradient', label: 'Gradient' }, { value: 'none', label: 'Clear' }]} />
        {s.bgKind !== 'none' && <div className="field"><span className="label">{s.bgKind === 'gradient' ? 'From' : 'Colour'}</span><ColorPicker value={s.c1} onChange={(v) => set('c1', v)} label="First colour" /></div>}
        {s.bgKind === 'gradient' && <div className="field"><span className="label">To</span><ColorPicker value={s.c2} onChange={(v) => set('c2', v)} label="Second colour" /></div>}
      </div>
      <div className="row">
        <div className="field"><label htmlFor="sf-p">Space around: {s.pad}px</label><input id="sf-p" type="range" min={0} max={200} step={4} value={s.pad} onChange={(e) => set('pad', +e.target.value)} /></div>
        <div className="field"><label htmlFor="sf-r">Corners: {s.radius}px</label><input id="sf-r" type="range" min={0} max={40} value={s.radius} onChange={(e) => set('radius', +e.target.value)} /></div>
        <div className="field"><label htmlFor="sf-s">Shadow: {s.shadow}</label><input id="sf-s" type="range" min={0} max={100} step={5} value={s.shadow} onChange={(e) => set('shadow', +e.target.value)} /></div>
        <Segmented<'1' | '2'> label="Save size" value={String(s.scale) as '1' | '2'} onChange={(v) => set('scale', +v as 1 | 2)} options={[{ value: '1', label: '1×' }, { value: '2', label: '2×' }]} />
      </div>
      {img ? (
        <>
          <div className="br-stage" style={{ background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 18px 18px' }}><canvas ref={view} aria-label="Preview of the framed screenshot" /></div>
          <div className="tool-actions"><button type="button" className="btn primary" onClick={async () => downloadBlob(`${baseName(name)}-framed.png`, await canvasBlob(render(img, s, s.scale)))}>Download PNG</button></div>
        </>
      ) : <div className="empty">Add a screenshot to see it framed.</div>}
    </div>
  );
}
