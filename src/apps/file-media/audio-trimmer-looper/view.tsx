'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FileDrop } from '@/components/shared/FileDrop';
import { downloadBlob } from '@/components/shared/CopyButton';
import { wavBlob } from '@/lib/audio';
import { baseName } from '@/lib/files';

const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;

export default function View() {
  const [buf, setBuf] = useState<AudioBuffer | null>(null);
  const [name, setName] = useState('');
  const [a, setA] = useState(0), [b, setB] = useState(0);
  const [loop, setLoop] = useState(true), [norm, setNorm] = useState(false), [fade, setFade] = useState(false);
  const [playing, setPlaying] = useState(false), [pos, setPos] = useState(0), [err, setErr] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null);
  const ctx = useRef<AudioContext | null>(null), src = useRef<AudioBufferSourceNode | null>(null), t0 = useRef(0), raf = useRef(0), peaks = useRef<Float32Array | null>(null);

  const stop = useCallback(() => { cancelAnimationFrame(raf.current); try { src.current?.stop(); } catch { /* already stopped */ } src.current = null; setPlaying(false); }, []);
  useEffect(() => () => { stop(); ctx.current?.close(); }, [stop]);

  const load = async (f: File) => {
    stop(); setErr('');
    try {
      ctx.current ??= new AudioContext();
      const d = await ctx.current.decodeAudioData(await f.arrayBuffer());
      const w = 1600, p = new Float32Array(w * 2), ch = d.getChannelData(0), step = Math.max(1, Math.floor(d.length / w));
      for (let i = 0; i < w; i++) { let mn = 1, mx = -1; for (let j = i * step; j < Math.min(d.length, (i + 1) * step); j++) { const v = ch[j]; if (v < mn) mn = v; if (v > mx) mx = v; } p[i * 2] = mn; p[i * 2 + 1] = mx; }
      peaks.current = p; setBuf(d); setName(f.name); setA(0); setB(d.duration); setPos(0);
    } catch { setErr('This file could not be read as sound.'); }
  };

  const draw = useCallback(() => {
    const c = canvas.current, d = buf, p = peaks.current; if (!c || !d || !p) return;
    const W = c.clientWidth, H = 180, r = window.devicePixelRatio || 1; c.width = W * r; c.height = H * r;
    const x = c.getContext('2d')!; x.scale(r, r); x.fillStyle = '#FBF6EC'; x.fillRect(0, 0, W, H);
    const sa = (a / d.duration) * W, sb = (b / d.duration) * W;
    x.fillStyle = '#F2E4CE'; x.fillRect(sa, 0, sb - sa, H);
    for (let i = 0; i < W; i++) { const k = Math.floor((i / W) * (p.length / 2)); const inside = i >= sa && i <= sb; x.fillStyle = inside ? '#337957' : '#9a9a8a'; const y1 = H / 2 + p[k * 2] * (H / 2 - 6), y2 = H / 2 + p[k * 2 + 1] * (H / 2 - 6); x.fillRect(i, y1, 1, Math.max(1, y2 - y1)); }
    x.fillStyle = '#171717'; x.fillRect(sa - 2, 0, 4, H); x.fillRect(sb - 2, 0, 4, H);
    x.fillStyle = '#B49A57'; x.fillRect(sa - 8, 0, 14, 22); x.fillRect(sb - 6, H - 22, 14, 22);
    if (pos > 0) { x.fillStyle = '#A33A2B'; x.fillRect((pos / d.duration) * W - 1, 0, 2, H); }
  }, [buf, a, b, pos]);
  useEffect(draw, [draw]);
  useEffect(() => { const el = wrap.current; if (!el) return; const ro = new ResizeObserver(draw); ro.observe(el); return () => ro.disconnect(); }, [draw]);

  const drag = useRef<'a' | 'b' | null>(null);
  const toTime = (cx: number) => { const r = canvas.current!.getBoundingClientRect(); return Math.min(buf!.duration, Math.max(0, ((cx - r.left) / r.width) * buf!.duration)); };
  const down = (e: React.PointerEvent) => { if (!buf) return; const t = toTime(e.clientX); drag.current = Math.abs(t - a) < Math.abs(t - b) ? 'a' : 'b'; (e.target as Element).setPointerCapture(e.pointerId); move(e); };
  const move = (e: React.PointerEvent) => { if (!drag.current || !buf) return; const t = toTime(e.clientX); if (drag.current === 'a') setA(Math.min(t, b - 0.05)); else setB(Math.max(t, a + 0.05)); };

  const play = (from = a) => {
    if (!buf || !ctx.current) return; stop();
    const s = ctx.current.createBufferSource(), g = ctx.current.createGain(); s.buffer = buf; s.connect(g).connect(ctx.current.destination);
    if (norm) g.gain.value = gainFor(buf, a, b);
    s.loop = loop; s.loopStart = a; s.loopEnd = b; s.start(0, from, loop ? undefined : b - from); src.current = s; t0.current = ctx.current.currentTime - from; setPlaying(true);
    s.onended = () => { if (src.current === s) { setPlaying(false); setPos(0); } };
    const tick = () => { const t = ctx.current!.currentTime - t0.current; setPos(loop && t > b ? a + ((t - a) % (b - a)) : t); raf.current = requestAnimationFrame(tick); };
    tick();
  };
  const gainFor = (d: AudioBuffer, s: number, e: number) => { let pk = 0; for (let c = 0; c < d.numberOfChannels; c++) { const ch = d.getChannelData(c); for (let i = Math.floor(s * d.sampleRate); i < Math.min(ch.length, Math.floor(e * d.sampleRate)); i++) pk = Math.max(pk, Math.abs(ch[i])); } return pk > 0 ? 0.98 / pk : 1; };

  const save = () => {
    if (!buf || !ctx.current) return;
    const s = Math.floor(a * buf.sampleRate), e = Math.floor(b * buf.sampleRate), out = ctx.current.createBuffer(buf.numberOfChannels, e - s, buf.sampleRate), g = norm ? gainFor(buf, a, b) : 1;
    for (let c = 0; c < buf.numberOfChannels; c++) { const o = out.getChannelData(c); o.set(buf.getChannelData(c).subarray(s, e)); for (let i = 0; i < o.length; i++) { let v = o[i] * g; if (fade) v *= Math.min(1, i / (0.05 * out.sampleRate), (o.length - i) / (0.05 * out.sampleRate)); o[i] = v; } }
    downloadBlob(`${baseName(name)}-trimmed.wav`, wavBlob(out));
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space' && buf && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement)) { e.preventDefault(); playing ? stop() : play(); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  return (
    <div className="panel">
      <FileDrop multiple={false} accept="audio/*" title={buf ? `Loaded: ${name}. Drop another file to swap` : 'Drop a sound file here, or click to choose'} hint="MP3, WAV, OGG, M4A and more" onFiles={(f) => load(f[0])} />
      {err && <p className="bad" role="alert">{err}</p>}
      {buf && (
        <>
          <div ref={wrap}><canvas ref={canvas} style={{ width: '100%', height: 180, border: '3px solid var(--ink)', touchAction: 'none', cursor: 'ew-resize', display: 'block' }} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} aria-label="Waveform. Drag the handles to choose the part to keep." /></div>
          <div className="row">
            <div className="field"><label htmlFor="at-a">Start (seconds)</label><input id="at-a" type="number" step={0.01} min={0} max={b} value={+a.toFixed(2)} onChange={(e) => setA(Math.max(0, Math.min(b - 0.05, +e.target.value)))} /></div>
            <div className="field"><label htmlFor="at-b">End (seconds)</label><input id="at-b" type="number" step={0.01} min={a} max={buf.duration} value={+b.toFixed(2)} onChange={(e) => setB(Math.min(buf.duration, Math.max(a + 0.05, +e.target.value)))} /></div>
            <span className="stat">{fmt(b - a)} of {fmt(buf.duration)}</span>
          </div>
          <div className="tool-actions">
            <button type="button" className="btn primary" onClick={() => (playing ? stop() : play())}>{playing ? 'Stop' : 'Play'}</button>
            <label className="check"><input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop</label>
            <label className="check"><input type="checkbox" checked={norm} onChange={(e) => setNorm(e.target.checked)} /> Make it louder (normalise)</label>
            <label className="check"><input type="checkbox" checked={fade} onChange={(e) => setFade(e.target.checked)} /> Fade in and out</label>
            <button type="button" className="btn gold" onClick={save}>Save as WAV</button>
          </div>
        </>
      )}
    </div>
  );
}
