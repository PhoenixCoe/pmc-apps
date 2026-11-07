'use client';
import { useEffect, useRef, useState } from 'react';
import { AppLoader } from '@/components/shared/AppLoader';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { downloadBlob } from '@/components/shared/CopyButton';
import { buildZip, uniqueName } from '../image-resizer/utils';
import { baseName, canvasBlob, formatBytes, imageFromFile, makeCanvas } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';
import { wavBlob } from '@/lib/audio';

type Kind = 'image' | 'audio';
type Out = 'png' | 'jpeg' | 'webp' | 'avif' | 'wav' | 'mp3' | 'ogg';
interface Item { id: number; file: File; kind: Kind; status: 'ready' | 'working' | 'done' | 'error'; out?: { blob: Blob; name: string }; error?: string }
const IMAGE_OUT: Out[] = ['png', 'jpeg', 'webp', 'avif'];
const MIME: Record<Out, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg' };
const EXT: Record<Out, string> = { png: 'png', jpeg: 'jpg', webp: 'webp', avif: 'avif', wav: 'wav', mp3: 'mp3', ogg: 'ogg' };
let nextId = 1;

const kindOf = (f: File): Kind | null => f.type.startsWith('image/') || /\.(png|jpe?g|webp|avif|gif|bmp|svg)$/i.test(f.name) ? 'image' : f.type.startsWith('audio/') || /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(f.name) ? 'audio' : null;

async function toMp3(buf: AudioBuffer, kbps: number): Promise<Blob> {
  const { Mp3Encoder } = await import('@breezystack/lamejs');
  const ch = Math.min(2, buf.numberOfChannels), enc = new Mp3Encoder(ch, buf.sampleRate, kbps);
  const to16 = (a: Float32Array) => { const o = new Int16Array(a.length); for (let i = 0; i < a.length; i++) { const v = Math.max(-1, Math.min(1, a[i])); o[i] = v < 0 ? v * 0x8000 : v * 0x7fff; } return o; };
  const l = to16(buf.getChannelData(0)), r = ch > 1 ? to16(buf.getChannelData(1)) : undefined, parts: Uint8Array[] = [];
  for (let i = 0; i < l.length; i += 1152) {
    const out = ch > 1 ? enc.encodeBuffer(l.subarray(i, i + 1152), r!.subarray(i, i + 1152)) : enc.encodeBuffer(l.subarray(i, i + 1152));
    if (out.length) parts.push(new Uint8Array(out));
    if (i % (1152 * 200) === 0) await new Promise((x) => setTimeout(x));
  }
  const end = enc.flush(); if (end.length) parts.push(new Uint8Array(end));
  return new Blob(parts as BlobPart[], { type: 'audio/mpeg' });
}

async function toOgg(buf: AudioBuffer): Promise<Blob> {
  const ctx = new AudioContext(), dest = ctx.createMediaStreamDestination(), src = ctx.createBufferSource();
  src.buffer = buf; src.connect(dest);
  const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/ogg;codecs=opus' }), chunks: Blob[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  const done = new Promise<Blob>((res) => { rec.onstop = () => res(new Blob(chunks, { type: 'audio/ogg' })); });
  rec.start(); src.start(); src.onended = () => rec.stop();
  const out = await done; await ctx.close(); return out;
}

async function convert(f: File, kind: Kind, out: Out, q: number, kbps: number): Promise<Blob> {
  if (kind === 'image') {
    const { img, url } = await imageFromFile(f);
    try {
      const c = makeCanvas(img.naturalWidth || 300, img.naturalHeight || 150), x = c.getContext('2d')!;
      if (out === 'jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
      x.drawImage(img, 0, 0);
      const b = await canvasBlob(c, MIME[out], q);
      if (b.type !== MIME[out]) throw new Error(`This browser cannot save ${out.toUpperCase()}.`);
      return b;
    } finally { URL.revokeObjectURL(url); }
  }
  const ctx = new AudioContext();
  try {
    const buf = await ctx.decodeAudioData(await f.arrayBuffer());
    return out === 'wav' ? wavBlob(buf) : out === 'mp3' ? await toMp3(buf, kbps) : await toOgg(buf);
  } finally { ctx.close(); }
}

export default function View() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [imgOut, setImgOut] = useLocalState<Out>('media-converter', 'image', 'webp');
  const [audOut, setAudOut] = useLocalState<Out>('media-converter', 'audio', 'mp3');
  const [quality, setQuality] = useLocalState('media-converter', 'quality', 90);
  const [kbps, setKbps] = useLocalState('media-converter', 'kbps', 192);
  const [note, setNote] = useState('');
  const [oggOk, setOggOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    // Load the MP3 encoder now so the first conversion does not wait for it.
    import('@breezystack/lamejs').then(() => { if (live.current) setReady(true); }).catch(() => { if (live.current) setReady(true); });
    setOggOk(typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/ogg;codecs=opus'));
    return () => { live.current = false; };
  }, []);

  const add = (files: File[]) => {
    const ok = files.filter((f) => kindOf(f));
    setNote(ok.length < files.length ? `${files.length - ok.length} file${files.length - ok.length > 1 ? 's' : ''} skipped. Use pictures or sound files.` : '');
    setItems((p) => [...p, ...ok.map((file): Item => ({ id: nextId++, file, kind: kindOf(file)!, status: 'ready' }))]);
  };
  const outFor = (k: Kind) => (k === 'image' ? imgOut : audOut);

  const run = async () => {
    setBusy(true);
    const used = new Set<string>();
    for (const it of items) {
      if (it.status === 'done') continue;
      setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'working' } : x)));
      try {
        const o = outFor(it.kind), blob = await convert(it.file, it.kind, o, quality / 100, kbps);
        const name = uniqueName(`${baseName(it.file.name)}.${EXT[o]}`, used);
        setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'done', out: { blob, name } } : x)));
      } catch (e) { setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'error', error: e instanceof Error ? e.message : 'Could not convert this file.' } : x))); }
    }
    setBusy(false);
  };
  const reset = (k?: Kind) => setItems((p) => p.map((x) => (!k || x.kind === k ? { ...x, status: 'ready', out: undefined, error: undefined } : x)));
  const zip = async () => {
    const files = await Promise.all(items.filter((i) => i.out).map(async (i) => ({ name: i.out!.name, data: new Uint8Array(await i.out!.blob.arrayBuffer()) })));
    downloadBlob('converted.zip', new Blob([buildZip(files) as BlobPart], { type: 'application/zip' }));
  };

  if (!ready) return <AppLoader app="Media Converter" what="the converter" step="Loading the sound encoder" delayed />;
  const hasImg = items.some((i) => i.kind === 'image'), hasAud = items.some((i) => i.kind === 'audio');
  const doneCount = items.filter((i) => i.status === 'done').length;
  return (
    <div className="panel">
      <FileDrop onFiles={add} accept="image/*,audio/*" title="Drop pictures or sound files here, or click to choose" hint="PNG, JPEG, WebP, AVIF, GIF, MP3, WAV, OGG, M4A, FLAC" paste />
      {note && <p className="note" role="status">{note}</p>}
      {items.length > 0 && (
        <>
          <div className="row">
            {hasImg && <Segmented<Out> label="Pictures to" value={imgOut} onChange={(v) => { setImgOut(v); reset('image'); }} options={IMAGE_OUT.map((o) => ({ value: o, label: o.toUpperCase() }))} />}
            {hasAud && <Segmented<Out> label="Sound to" value={audOut} onChange={(v) => { setAudOut(v); reset('audio'); }} options={[{ value: 'mp3', label: 'MP3' }, { value: 'wav', label: 'WAV' }, ...(oggOk ? [{ value: 'ogg' as Out, label: 'OGG' }] : [])]} />}
            {hasImg && imgOut !== 'png' && <div className="field"><label htmlFor="mc-q">Picture quality {quality}</label><input id="mc-q" type="range" min={10} max={100} value={quality} onChange={(e) => { setQuality(+e.target.value); reset('image'); }} /></div>}
            {hasAud && audOut === 'mp3' && <div className="field"><label htmlFor="mc-k">MP3 bitrate {kbps} kbps</label><input id="mc-k" type="range" min={64} max={320} step={32} value={kbps} onChange={(e) => { setKbps(+e.target.value); reset('audio'); }} /></div>}
          </div>
          <div className="tool-actions">
            <button type="button" className="btn primary" onClick={run} disabled={busy || doneCount === items.length}>{busy ? 'Converting…' : 'Convert'}</button>
            {doneCount > 1 && <button type="button" className="btn" onClick={zip}>Download all (.zip)</button>}
            <button type="button" className="btn" onClick={() => setItems([])}>Clear</button>
          </div>
          <ul className="img-grid">
            {items.map((i) => (
              <li key={i.id} className="img-card" data-status={i.status} style={{ gridTemplateColumns: '1fr' }}>
                <div className="img-info">
                  <strong>{i.file.name}</strong>
                  <span>{i.kind === 'image' ? 'Picture' : 'Sound'} · {formatBytes(i.file.size)}{i.out ? ` → ${formatBytes(i.out.blob.size)}` : ''}</span>
                  {i.status === 'working' && <span>Working…</span>}
                  {i.error && <span className="bad">{i.error}</span>}
                </div>
                <div className="img-actions">
                  {i.out && <button type="button" className="btn small" onClick={() => downloadBlob(i.out!.name, i.out!.blob)}>Download {i.out.name.split('.').pop()?.toUpperCase()}</button>}
                  <button type="button" className="btn small" onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
