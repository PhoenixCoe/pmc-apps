'use client';
import { useEffect, useRef, useState } from 'react';
import { FileDrop } from '@/components/shared/FileDrop';
import { downloadBlob } from '@/components/shared/CopyButton';
import { formatBytes, makeCanvas } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';

interface Frame { id: number; url: string; delay: number; img: HTMLImageElement }
let fid = 1;
const load = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });

export default function View() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [width, setWidth] = useLocalState('gif-animation-builder', 'width', 480);
  const [colours, setColours] = useLocalState('gif-animation-builder', 'colours', 128);
  const [delay, setDelay] = useLocalState('gif-animation-builder', 'delay', 100);
  const [loops, setLoops] = useLocalState('gif-animation-builder', 'loops', 0);
  const [fps, setFps] = useLocalState('gif-animation-builder', 'fps', 8);
  const [prog, setProg] = useState<number | null>(null), [msg, setMsg] = useState('');
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);
  const [idx, setIdx] = useState(0), [play, setPlay] = useState(true);
  const video = useRef<HTMLVideoElement>(null), vurl = useRef('');
  const [clip, setClip] = useState<{ dur: number; a: number; b: number } | null>(null);
  const drag = useRef<number | null>(null);

  useEffect(() => () => { frames.forEach((f) => URL.revokeObjectURL(f.url)); if (vurl.current) URL.revokeObjectURL(vurl.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!play || frames.length < 2) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % frames.length), Math.max(20, frames[idx % frames.length]?.delay ?? 100));
    return () => clearTimeout(t);
  }, [idx, play, frames]);

  const addFiles = async (files: File[]) => {
    setMsg('');
    const vid = files.find((f) => f.type.startsWith('video/'));
    if (vid) {
      if (vurl.current) URL.revokeObjectURL(vurl.current);
      vurl.current = URL.createObjectURL(vid);
      const v = video.current!; v.src = vurl.current;
      await new Promise((r) => { v.onloadedmetadata = r; v.onerror = r; });
      if (!isFinite(v.duration)) { setMsg('This video could not be opened.'); return; }
      setClip({ dur: v.duration, a: 0, b: Math.min(v.duration, 5) }); return;
    }
    const imgs = files.filter((f) => f.type.startsWith('image/')).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!imgs.length) { setMsg('Use pictures or one video.'); return; }
    const fresh: Frame[] = [];
    for (const f of imgs) { const url = URL.createObjectURL(f); try { fresh.push({ id: fid++, url, delay, img: await load(url) }); } catch { URL.revokeObjectURL(url); } }
    setFrames((p) => [...p, ...fresh]); setOut(null);
  };

  const grab = async () => {
    if (!clip) return; const v = video.current!, step = 1 / fps, fresh: Frame[] = [];
    const n = Math.min(200, Math.floor((clip.b - clip.a) * fps)), W = Math.min(width, v.videoWidth), H = Math.round((W * v.videoHeight) / v.videoWidth);
    setProg(0);
    for (let i = 0; i < n; i++) {
      v.currentTime = clip.a + i * step; await new Promise((r) => { v.onseeked = r; });
      const c = makeCanvas(W, H); c.getContext('2d')!.drawImage(v, 0, 0, W, H);
      const b: Blob = await new Promise((r) => c.toBlob((x) => r(x!), 'image/png')), url = URL.createObjectURL(b);
      fresh.push({ id: fid++, url, delay: Math.round(1000 / fps), img: await load(url) }); setProg((i + 1) / n);
    }
    setFrames((p) => [...p, ...fresh]); setClip(null); setProg(null); setOut(null);
  };

  const make = async () => {
    if (!frames.length) return; setProg(0); setMsg('');
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const w = Math.min(width, frames[0].img.naturalWidth), h = Math.round((w * frames[0].img.naturalHeight) / frames[0].img.naturalWidth);
      const gif = GIFEncoder(), c = makeCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true })!;
      for (let i = 0; i < frames.length; i++) {
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
        const im = frames[i].img, k = Math.min(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * k, dh = im.naturalHeight * k;
        x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
        const data = x.getImageData(0, 0, w, h).data, pal = quantize(data, colours, { format: 'rgb444' });
        gif.writeFrame(applyPalette(data, pal, 'rgb444'), w, h, { palette: pal, delay: frames[i].delay, repeat: loops === 0 ? 0 : loops - 1 });
        setProg((i + 1) / frames.length); await new Promise((r) => setTimeout(r));
      }
      gif.finish(); const blob = new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
      setOut((o) => { if (o) URL.revokeObjectURL(o.url); return { url: URL.createObjectURL(blob), size: blob.size }; });
    } catch { setMsg('The GIF could not be made. Try fewer or smaller frames.'); }
    setProg(null);
  };

  const move = (a: number, b: number) => setFrames((p) => { const n = [...p]; const [f] = n.splice(a, 1); n.splice(b, 0, f); return n; });
  const cur = frames[idx % Math.max(1, frames.length)];
  return (
    <div className="panel">
      <video ref={video} muted playsInline style={{ display: 'none' }} />
      <FileDrop onFiles={addFiles} accept="image/*,video/*" title="Drop pictures in order, or one video clip" hint="Pictures are sorted by file name. You can reorder them below." />
      {msg && <p className="bad" role="alert">{msg}</p>}
      {clip && (
        <div className="row">
          <div className="field"><label htmlFor="gb-a">From (s)</label><input id="gb-a" type="number" min={0} max={clip.b} step={0.1} value={clip.a} onChange={(e) => setClip({ ...clip, a: Math.max(0, +e.target.value) })} /></div>
          <div className="field"><label htmlFor="gb-b">To (s)</label><input id="gb-b" type="number" min={clip.a} max={clip.dur} step={0.1} value={+clip.b.toFixed(1)} onChange={(e) => setClip({ ...clip, b: Math.min(clip.dur, +e.target.value) })} /></div>
          <div className="field"><label htmlFor="gb-f">Frames per second: {fps}</label><input id="gb-f" type="range" min={2} max={20} value={fps} onChange={(e) => setFps(+e.target.value)} /></div>
          <button type="button" className="btn primary" onClick={grab} disabled={prog !== null}>{prog !== null ? `${Math.round(prog * 100)}%` : 'Cut frames from the video'}</button>
          <button type="button" className="btn" onClick={() => setClip(null)}>Cancel</button>
        </div>
      )}
      {frames.length > 0 && (
        <>
          <div className="split">
            <div className="field"><span className="label">Preview {cur && `(frame ${idx % frames.length + 1} of ${frames.length})`}</span>
              <div className="svg-prev" style={{ minHeight: 240 }}>{cur && /* eslint-disable-next-line @next/next/no-img-element */ <img src={cur.url} alt="" style={{ maxHeight: 240, width: 'auto' }} />}</div>
              <div className="tool-actions"><button type="button" className="btn small" onClick={() => setPlay((p) => !p)}>{play ? 'Pause' : 'Play'}</button></div>
            </div>
            <div className="field">
              <div className="field"><label htmlFor="gb-w">Width: {width}px</label><input id="gb-w" type="range" min={64} max={1000} step={16} value={width} onChange={(e) => setWidth(+e.target.value)} /></div>
              <div className="field"><label htmlFor="gb-c">Colours: {colours}</label><input id="gb-c" type="range" min={8} max={256} step={8} value={colours} onChange={(e) => setColours(+e.target.value)} /></div>
              <div className="field"><label htmlFor="gb-l">Repeat (0 is forever)</label><input id="gb-l" type="number" min={0} max={99} value={loops} onChange={(e) => setLoops(Math.max(0, +e.target.value || 0))} /></div>
              <div className="field"><label htmlFor="gb-d">Time for every frame (ms)</label>
                <div className="tool-actions"><input id="gb-d" type="number" min={20} max={5000} step={10} value={delay} onChange={(e) => setDelay(Math.max(20, +e.target.value || 100))} style={{ width: 110 }} /><button type="button" className="btn small" onClick={() => setFrames((p) => p.map((f) => ({ ...f, delay })))}>Use for all</button></div></div>
            </div>
          </div>
          <ul className="gif-strip">
            {frames.map((f, i) => (
              <li key={f.id} draggable onDragStart={() => { drag.current = i; }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag.current != null) move(drag.current, i); drag.current = null; }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <button type="button" onClick={() => { setIdx(i); setPlay(false); }} aria-label={`Show frame ${i + 1}`}><img src={f.url} alt="" draggable={false} /></button>
                <input type="number" aria-label={`Frame ${i + 1} time in ms`} min={20} step={10} value={f.delay} onChange={(e) => setFrames((p) => p.map((x) => (x.id === f.id ? { ...x, delay: Math.max(20, +e.target.value || 20) } : x)))} />
                <span><button type="button" className="btn small" aria-label={`Move frame ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, i - 1)}>◀</button><button type="button" className="btn small" aria-label={`Move frame ${i + 1} later`} disabled={i === frames.length - 1} onClick={() => move(i, i + 1)}>▶</button><button type="button" className="btn small" aria-label={`Remove frame ${i + 1}`} onClick={() => setFrames((p) => p.filter((x) => x.id !== f.id))}>✕</button></span>
              </li>
            ))}
          </ul>
          <div className="tool-actions">
            <button type="button" className="btn primary" onClick={make} disabled={prog !== null}>{prog !== null && !clip ? `Making… ${Math.round(prog * 100)}%` : 'Make the GIF'}</button>
            <button type="button" className="btn" onClick={() => { frames.forEach((f) => URL.revokeObjectURL(f.url)); setFrames([]); setOut(null); }}>Clear frames</button>
          </div>
        </>
      )}
      {out && (
        <div className="result"><div className="result-top"><span>Your GIF · {formatBytes(out.size)}</span><button type="button" className="btn small" onClick={async () => downloadBlob('animation.gif', await (await fetch(out.url)).blob())}>Download</button></div>
          <div className="svg-prev" style={{ border: 0, minHeight: 0 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={out.url} alt="The finished GIF" style={{ maxHeight: 320, width: 'auto' }} /></div></div>
      )}
    </div>
  );
}
