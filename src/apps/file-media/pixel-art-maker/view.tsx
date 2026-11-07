'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FullscreenViewport, type ViewportApi } from '@/components/shared/FullscreenViewport';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Seg } from '@/components/shared/Segmented';
import { downloadBlob } from '@/components/shared/CopyButton';
import { canvasBlob, fromHex, makeCanvas, toHex } from '@/lib/files';
import { LoadGate, canvasSteps } from '@/components/shared/LoadingTracker';
import { registerApi } from '@/lib/embed';

type Tool = 'pencil' | 'eraser' | 'fill' | 'pick' | 'line' | 'box';
const CELL = 16, KEY = 'pmc:pixel-art-maker:project';
const PALETTES: Record<string, string[]> = {
  PMC: ['#171717', '#1A4934', '#337957', '#B49A57', '#F2E4CE', '#FBF6EC', '#A33A2B', '#5b3a29', '#e0a458', '#4a6fa5', '#9fc2e8', '#7a7a7a', '#bdbdbd', '#ffffff', '#ff8fab', '#6a4c93'],
  'Green screen': ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  Pico: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'],
  Mono: ['#000000', '#555555', '#aaaaaa', '#ffffff'],
};
const pack = (hex: string) => { const [r, g, b] = fromHex(hex); return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; };
const unpackHex = (v: number) => toHex(v & 255, (v >> 8) & 255, (v >> 16) & 255);

interface Proj { w: number; h: number; frames: string[]; fps: number }
const enc = (a: Uint32Array) => { let s = ''; const u = new Uint8Array(a.buffer); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
const dec = (s: string, n: number) => { const b = atob(s), u = new Uint8Array(n * 4); for (let i = 0; i < Math.min(b.length, u.length); i++) u[i] = b.charCodeAt(i); return new Uint32Array(u.buffer); };

function Inner() {
  const [size, setSize] = useState(32);
  const [frames, setFrames] = useState<Uint32Array[]>(() => [new Uint32Array(32 * 32)]);
  const [cur, setCur] = useState(0), [tool, setTool] = useState<Tool>('pencil'), [colour, setColour] = useState('#337957'), [pal, setPal] = useState('PMC');
  const [mirror, setMirror] = useState(false), [onion, setOnion] = useState(true), [grid, setGrid] = useState(true), [fps, setFps] = useState(6), [play, setPlay] = useState(false), [pf, setPf] = useState(0);
  const [tick, setTick] = useState(0), [custom, setCustom] = useState<string[]>([]);
  const main = useRef<HTMLCanvasElement>(null), prev = useRef<HTMLCanvasElement>(null), anim = useRef<HTMLCanvasElement>(null), api = useRef<ViewportApi | null>(null);
  const undo = useRef<{ f: number; d: Uint32Array }[]>([]), redo = useRef<{ f: number; d: Uint32Array }[]>([]);
  const stroke = useRef<{ start: [number, number]; base: Uint32Array } | null>(null);
  const hover = useRef<[number, number] | null>(null);

  // Restore the last project, and keep saving it.
  useEffect(() => {
    try { const p: Proj = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (p?.frames?.length) { setSize(p.w); setFrames(p.frames.map((f) => dec(f, p.w * p.h))); setFps(p.fps || 6); } } catch { /* start fresh */ }
  }, []);
  const save = useCallback(() => { try { localStorage.setItem(KEY, JSON.stringify({ w: size, h: size, fps, frames: frames.map(enc) } satisfies Proj)); } catch { /* storage full */ } }, [frames, size, fps]);
  useEffect(() => { const t = setTimeout(save, 500); return () => clearTimeout(t); }, [save]);

  const draw = useCallback((c: HTMLCanvasElement | null, d: Uint32Array) => { if (!c) return; c.width = size; c.height = size; c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(d.buffer.slice(0) as ArrayBuffer), size, size), 0, 0); }, [size]);
  useEffect(() => { draw(main.current, frames[cur] ?? frames[0]); draw(prev.current, cur > 0 ? frames[cur - 1] : new Uint32Array(size * size)); }, [frames, cur, tick, draw, size]);
  useEffect(() => { if (!play) return; const t = setInterval(() => setPf((p) => (p + 1) % frames.length), 1000 / fps); return () => clearInterval(t); }, [play, fps, frames.length]);
  useEffect(() => { draw(anim.current, frames[play ? pf % frames.length : cur] ?? frames[0]); }, [pf, play, frames, cur, draw, tick]);
  useEffect(() => { if (cur >= frames.length) setCur(frames.length - 1); }, [frames.length, cur]);

  const edit = (fn: (d: Uint32Array) => void, snapshot = true) => setFrames((fs) => { const n = fs.slice(), d = n[cur].slice(); if (snapshot) { undo.current.push({ f: cur, d: fs[cur] }); if (undo.current.length > 80) undo.current.shift(); redo.current = []; } fn(d); n[cur] = d; return n; });
  const put = (d: Uint32Array, x: number, y: number, v: number) => { if (x < 0 || y < 0 || x >= size || y >= size) return; d[y * size + x] = v; if (mirror) d[y * size + (size - 1 - x)] = v; };
  const fillAt = (d: Uint32Array, x: number, y: number, v: number) => { const t = d[y * size + x]; if (t === v) return; const st = [[x, y]]; while (st.length) { const [px, py] = st.pop()!; if (px < 0 || py < 0 || px >= size || py >= size || d[py * size + px] !== t) continue; put(d, px, py, v); d[py * size + px] = v; st.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]); } };
  const line = (d: Uint32Array, a: [number, number], b: [number, number], v: number) => { let [x0, y0] = a; const [x1, y1] = b, dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { put(d, x0, y0, v); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
  const box = (d: Uint32Array, a: [number, number], b: [number, number], v: number) => { for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) { put(d, x, a[1], v); put(d, x, b[1], v); } for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) { put(d, a[0], y, v); put(d, b[0], y, v); } };

  const cellAt = (e: React.PointerEvent): [number, number] => { const w = api.current!.toWorld(e.clientX, e.clientY); return [Math.floor(w.x / CELL), Math.floor(w.y / CELL)]; };
  const apply = (p: [number, number], first: boolean) => {
    const v = tool === 'eraser' ? 0 : pack(colour);
    if (tool === 'pick') { if (p[0] >= 0 && p[1] >= 0 && p[0] < size && p[1] < size) { const c = frames[cur][p[1] * size + p[0]]; if (c >>> 24) setColour(unpackHex(c)); } return; }
    if (tool === 'fill') { if (first && p[0] >= 0 && p[1] >= 0 && p[0] < size && p[1] < size) edit((d) => fillAt(d, p[0], p[1], v)); return; }
    if (tool === 'pencil' || tool === 'eraser') {
      if (first) { undo.current.push({ f: cur, d: frames[cur] }); redo.current = []; stroke.current = { start: p, base: frames[cur] }; }
      const s = stroke.current!, last = (s as unknown as { last?: [number, number] }).last ?? p;
      edit((d) => line(d, last, p, v), false); (s as unknown as { last: [number, number] }).last = p; return;
    }
    if (first) { stroke.current = { start: p, base: frames[cur] }; undo.current.push({ f: cur, d: frames[cur] }); redo.current = []; }
    const s = stroke.current!; setFrames((fs) => { const n = fs.slice(), d = s.base.slice(); (tool === 'line' ? line : box)(d, s.start, p, v); n[cur] = d; return n; });
  };
  const down = (e: React.PointerEvent) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); apply(cellAt(e), true); stroke.current ??= null; };
  const move = (e: React.PointerEvent) => { hover.current = cellAt(e); if (e.buttons && stroke.current) apply(cellAt(e), false); else if (e.buttons && tool === 'pick') apply(cellAt(e), false); };
  const up = () => { stroke.current = null; };

  const doUndo = () => { const u = undo.current.pop(); if (!u) return; setFrames((fs) => { const n = fs.slice(); redo.current.push({ f: u.f, d: n[u.f] }); n[u.f] = u.d; return n; }); setCur(u.f); };
  const doRedo = () => { const u = redo.current.pop(); if (!u) return; setFrames((fs) => { const n = fs.slice(); undo.current.push({ f: u.f, d: n[u.f] }); n[u.f] = u.d; return n; }); setCur(u.f); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
      const m: Record<string, Tool> = { b: 'pencil', e: 'eraser', g: 'fill', i: 'pick', l: 'line', r: 'box' }; if (m[e.key.toLowerCase()] && !e.metaKey && !e.ctrlKey) setTool(m[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const resize = (n: number) => { if (n === size) return; if (frames.some((f) => f.some(Boolean)) && !confirm('Changing the size clears your drawing. Carry on?')) return; setSize(n); setFrames([new Uint32Array(n * n)]); setCur(0); undo.current = []; redo.current = []; setTimeout(() => api.current?.fit({ x0: 0, y0: 0, x1: n * CELL, y1: n * CELL }), 30); };
  // Another page (Coe) can hand over a finished drawing: rows of letters, each letter a colour from "palette"; "." is empty.
  useEffect(() => registerApi('pixel-art-maker', {
    load: (a: { palette?: Record<string, string>; frames?: string[][]; fps?: number }) => {
      const list = (a.frames ?? []).filter((f) => Array.isArray(f) && f.length).slice(0, 48); if (!list.length) throw new Error('No frames to draw.');
      const n = Math.max(8, Math.min(64, ...list.map((f) => Math.max(f.length, ...f.map((r) => String(r).length)))));
      const pal = a.palette ?? {};
      const made = list.map((rows) => { const d = new Uint32Array(n * n); rows.slice(0, n).forEach((row, y) => { [...String(row)].slice(0, n).forEach((ch, x) => { const hex = pal[ch]; if (hex && /^#[0-9a-f]{6}$/i.test(hex)) d[y * n + x] = pack(hex); }); }); return d; });
      setSize(n); setFrames(made); setCur(0); setFps(Math.max(1, Math.min(24, Math.round(a.fps ?? 6)))); undo.current = []; redo.current = []; setTick((t) => t + 1);
      setTimeout(() => api.current?.fit({ x0: 0, y0: 0, x1: n * CELL, y1: n * CELL }), 120);
    },
  }), []);
  const addFrame = (copy: boolean) => { setFrames((fs) => { const n = fs.slice(); n.splice(cur + 1, 0, copy ? fs[cur].slice() : new Uint32Array(size * size)); return n; }); setCur(cur + 1); };
  const delFrame = () => { if (frames.length < 2) { edit((d) => d.fill(0)); return; } setFrames((fs) => fs.filter((_, i) => i !== cur)); setCur(Math.max(0, cur - 1)); };

  const render = (list: Uint32Array[], scale: number, sheet = false) => { const W = sheet ? size * list.length : size, c = makeCanvas(W * scale, size * scale), x = c.getContext('2d')!; x.imageSmoothingEnabled = false; list.forEach((f, i) => { const t = makeCanvas(size, size); t.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(f.buffer.slice(0) as ArrayBuffer), size, size), 0, 0); x.drawImage(t, sheet ? i * size * scale : 0, 0, size * scale, size * scale); }); return c; };
  const exportGif = async () => {
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc'), g = GIFEncoder(), sc = Math.max(1, Math.floor(256 / size));
    for (const f of frames) { const c = render([f], sc), d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data, p = quantize(d, 256, { format: 'rgba4444' }); g.writeFrame(applyPalette(d, p, 'rgba4444'), c.width, c.height, { palette: p, delay: 1000 / fps, repeat: 0, transparent: true, transparentIndex: p.findIndex((q) => q[3] === 0) }); }
    g.finish(); downloadBlob('sprite.gif', new Blob([g.bytes() as BlobPart], { type: 'image/gif' }));
  };
  const saveFile = () => downloadBlob('sprite.pmcpixel.json', new Blob([JSON.stringify({ w: size, h: size, fps, frames: frames.map(enc) })], { type: 'application/json' }));
  const openFile = async (f: File) => { try { const p: Proj = JSON.parse(await f.text()); setSize(p.w); setFrames(p.frames.map((x) => dec(x, p.w * p.h))); setFps(p.fps || 6); setCur(0); setTimeout(() => api.current?.fit({ x0: 0, y0: 0, x1: p.w * CELL, y1: p.w * CELL }), 30); } catch { alert('That file could not be opened.'); } };

  const side = (
    <div className="px-side">
      <h3 className="d">Colours</h3>
      <Seg value={pal} onChange={(v) => setPal(v)} options={Object.keys(PALETTES).map((k) => ({ value: k, label: k }))} label="Palette" />
      <div className="px-pal">{[...PALETTES[pal], ...custom].map((c) => <button key={c} type="button" aria-label={c} aria-pressed={c === colour} style={{ background: c }} onClick={() => { setColour(c); if (tool === 'eraser' || tool === 'pick') setTool('pencil'); }} />)}</div>
      <div className="px-row"><ColorPicker value={colour} onChange={(v) => { setColour(v); if (!PALETTES[pal].includes(v) && !custom.includes(v)) setCustom((c) => [...c.slice(-15), v]); }} label="Pick any colour" compact /></div>
      <h3 className="d">Frames</h3>
      <div className="px-frames">{frames.map((f, i) => <FrameThumb key={i} d={f} size={size} on={i === cur} n={i + 1} onClick={() => setCur(i)} tick={tick} />)}</div>
      <div className="px-row"><button type="button" className="btn small" onClick={() => addFrame(false)}>New frame</button><button type="button" className="btn small" onClick={() => addFrame(true)}>Copy frame</button><button type="button" className="btn small" onClick={delFrame}>Delete</button></div>
      <h3 className="d">Play</h3>
      <canvas ref={anim} className="px-anim" aria-label="Animation preview" />
      <div className="px-row"><button type="button" className="btn small" onClick={() => setPlay((p) => !p)}>{play ? 'Stop' : 'Play'}</button><label className="px-fps">Speed {fps}/s <input type="range" min={1} max={24} value={fps} onChange={(e) => setFps(+e.target.value)} /></label></div>
      <h3 className="d">Save</h3>
      <div className="px-row">
        <button type="button" className="btn small" onClick={async () => downloadBlob('sprite.png', await canvasBlob(render([frames[cur]], Math.max(1, Math.floor(512 / size)))))}>PNG</button>
        <button type="button" className="btn small" onClick={async () => downloadBlob('sprite-1x.png', await canvasBlob(render([frames[cur]], 1)))}>PNG 1×</button>
        <button type="button" className="btn small" disabled={frames.length < 2} onClick={async () => downloadBlob('spritesheet.png', await canvasBlob(render(frames, 1, true)))}>Sheet</button>
        <button type="button" className="btn small" disabled={frames.length < 2} onClick={exportGif}>GIF</button>
        <button type="button" className="btn small" onClick={saveFile}>Project</button>
        <label className="btn small" style={{ cursor: 'pointer' }}>Open<input type="file" accept=".json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = ''; }} /></label>
      </div>
    </div>
  );

  const tools: [Tool, string][] = [['pencil', 'Pencil (B)'], ['eraser', 'Rub out (E)'], ['fill', 'Fill (G)'], ['pick', 'Pick colour (I)'], ['line', 'Line (L)'], ['box', 'Box (R)']];
  const toolbar = (
    <>
      <Seg<Tool> value={tool} onChange={setTool} options={tools.map(([v, l]) => ({ value: v, label: l.split(' (')[0] }))} label="Tool" />
      <button type="button" className="btn small" onClick={doUndo} aria-label="Undo">Undo</button><button type="button" className="btn small" onClick={doRedo} aria-label="Redo">Redo</button>
      <button type="button" className="btn small" aria-pressed={mirror} onClick={() => setMirror((m) => !m)}>Mirror {mirror ? 'on' : 'off'}</button>
      <button type="button" className="btn small" aria-pressed={onion} onClick={() => setOnion((m) => !m)}>Onion {onion ? 'on' : 'off'}</button>
      <button type="button" className="btn small" aria-pressed={grid} onClick={() => setGrid((m) => !m)}>Grid {grid ? 'on' : 'off'}</button>
      <span className="swatch" style={{ background: colour, width: 26, height: 26 }} title={colour} aria-label={`Colour ${colour}`} />
    </>
  );
  return (
    <div className="px-wrap">
      <div className="tool-actions px-size"><span className="label">Canvas size</span><Seg value={String(size)} onChange={(v) => resize(+v)} options={['16', '32', '48', '64'].map((v) => ({ value: v, label: `${v}×${v}` }))} label="Canvas size" /></div>
      <FullscreenViewport name="Pixel Art Maker" sideLabel="Tools" toolbar={toolbar} side={side} minZoom={0.1} maxZoom={4} onFullChange={() => setTimeout(() => api.current?.fit({ x0: 0, y0: 0, x1: size * CELL, y1: size * CELL }), 60)}>
        {(a) => {
          api.current = a;
          return (
            <div className={`px-board${grid && a.view.k > 0.7 ? ' grid' : ''}`} style={{ width: size * CELL, height: size * CELL, ['--cell' as string]: `${CELL}px` }}
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <canvas ref={prev} className="px-layer" style={{ opacity: onion && cur > 0 ? 0.28 : 0 }} />
              <canvas ref={main} className="px-layer" aria-label="Drawing area" />
            </div>
          );
        }}
      </FullscreenViewport>
    </div>
  );
}

function FrameThumb({ d, size, on, n, onClick, tick }: { d: Uint32Array; size: number; on: boolean; n: number; onClick: () => void; tick: number }) {
  const r = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = r.current; if (!c) return; c.width = size; c.height = size; c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(d.buffer.slice(0) as ArrayBuffer), size, size), 0, 0); }, [d, size, tick]);
  return <button type="button" className={`px-frame${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on} aria-label={`Frame ${n}`}><canvas ref={r} /><b className="d">{n}</b></button>;
}

/** The loading screen fills the whole window first, then the app opens. */
export default function View() {
  return <LoadGate title="Pixel Art Maker" what="assets" steps={canvasSteps()}><Inner /></LoadGate>;
}
