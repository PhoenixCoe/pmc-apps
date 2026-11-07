'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { downloadBlob } from '@/components/shared/CopyButton';
import { Segmented } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { useLocalState } from '@/lib/useLocalState';
import { decode, resizeFile, supportsEncoding } from './process';
import { buildZip, defaultResize, extFor, formatBytes, outName, pickOutput, planResize, uniqueName, type Mode, type OutChoice, type ResizeOptions } from './utils';

const APP = 'image-resizer';
const MAX_FILES = 100;

interface Settings extends ResizeOptions { format: OutChoice; quality: number; background: string; pattern: string }
const defaults: Settings = { ...defaultResize, format: 'original', quality: 85, background: '#ffffff', pattern: '{name}-{w}x{h}' };

interface Item {
  id: string; file: File; url: string; srcW: number; srcH: number;
  status: 'reading' | 'ready' | 'working' | 'done' | 'error';
  out?: { blob: Blob; url: string; w: number; h: number; name: string };
  error?: string;
}

const ANCHORS: [number, number, string][] = [
  [0, 0, 'Top left'], [0.5, 0, 'Top'], [1, 0, 'Top right'],
  [0, 0.5, 'Left'], [0.5, 0.5, 'Centre'], [1, 0.5, 'Right'],
  [0, 1, 'Bottom left'], [0.5, 1, 'Bottom'], [1, 1, 'Bottom right'],
];
let nextId = 1;

export default function View() {
  const [s, setS] = useLocalState<Settings>(APP, 'settings', defaults);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [avif, setAvif] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [pv, setPv] = useState<{ url: string; w: number; h: number; bytes: number } | null>(null);
  const [pvBusy, setPvBusy] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  useEffect(() => { supportsEncoding('image/avif').then(setAvif); }, []);
  useEffect(() => () => itemsRef.current.forEach((i) => { URL.revokeObjectURL(i.url); if (i.out) URL.revokeObjectURL(i.out.url); }), []);

  // Any change to the settings makes finished results out of date, so they go back to "ready".
  const key = JSON.stringify(s);
  const lastKey = useRef(key);
  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    setItems((prev) => prev.map((i) => { if (i.out) URL.revokeObjectURL(i.out.url); return i.status === 'done' ? { ...i, status: 'ready', out: undefined } : i; }));
  }, [key]);

  // The preview window: the chosen image, run through the current settings, a moment after you stop changing them.
  const target = items.find((i) => i.id === sel && i.srcW) ?? items.find((i) => i.srcW && i.status !== 'error');
  const targetId = target?.id;
  useEffect(() => {
    const it = itemsRef.current.find((i) => i.id === targetId);
    if (!it) { setPv(null); return; }
    let live = true;
    setPvBusy(true);
    const t = window.setTimeout(async () => {
      try {
        const r = await resizeFile(it.file, s, { type: pickOutput(it.file.type, s.format), quality: s.quality, background: s.background });
        if (!live) return;
        setPv((old) => { if (old) URL.revokeObjectURL(old.url); return { url: URL.createObjectURL(r.blob), w: r.w, h: r.h, bytes: r.blob.size }; });
      } catch { if (live) setPv(null); }
      if (live) setPvBusy(false);
    }, 280);
    return () => { live = false; window.clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, key]);
  useEffect(() => () => { setPv((old) => { if (old) URL.revokeObjectURL(old.url); return null; }); }, []);

  const addFiles = useCallback(async (list: FileList | File[]) => {
    const files = [...list].filter((f) => f.type.startsWith('image/') || /\.(avif|heic|heif|jpe?g|png|webp|gif|bmp|svg)$/i.test(f.name));
    if (!files.length) { setNotice('No images found in what you dropped.'); return; }
    const room = MAX_FILES - itemsRef.current.length;
    if (files.length > room) setNotice(`Only ${MAX_FILES} images at a time. ${files.length - Math.max(room, 0)} were left out.`); else setNotice(null);
    const fresh: Item[] = files.slice(0, Math.max(room, 0)).map((file) => ({ id: `i${nextId++}`, file, url: URL.createObjectURL(file), srcW: 0, srcH: 0, status: 'reading' as const }));
    setItems((p) => [...p, ...fresh]);
    for (const it of fresh) {
      try { const d = await decode(it.file); const [w, h] = [d.w, d.h]; d.close(); setItems((p) => p.map((x) => (x.id === it.id ? { ...x, srcW: w, srcH: h, status: 'ready' } : x))); }
      catch (e) { setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'error', error: e instanceof Error ? e.message : 'Could not read this file.' } : x))); }
    }
  }, []);

  // Paste screenshots and copied images straight in.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => { const f = [...(e.clipboardData?.files ?? [])]; if (f.length) { e.preventDefault(); addFiles(f); } };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [addFiles]);

  const remove = (id: string) => setItems((p) => { const x = p.find((i) => i.id === id); if (x) { URL.revokeObjectURL(x.url); if (x.out) URL.revokeObjectURL(x.out.url); } return p.filter((i) => i.id !== id); });
  const clear = () => { items.forEach((i) => { URL.revokeObjectURL(i.url); if (i.out) URL.revokeObjectURL(i.out.url); }); setItems([]); setNotice(null); };

  async function run() {
    setBusy(true); setNotice(null);
    const used = new Set<string>();
    for (const it of itemsRef.current) {
      if (it.status !== 'ready' && it.status !== 'done') continue;
      setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'working' } : x)));
      try {
        const type = pickOutput(it.file.type, s.format);
        const r = await resizeFile(it.file, s, { type, quality: s.quality, background: s.background });
        const name = uniqueName(outName(it.file.name, r.w, r.h, extFor(type), s.pattern), used);
        setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'done', out: { blob: r.blob, url: URL.createObjectURL(r.blob), w: r.w, h: r.h, name } } : x)));
      } catch (e) {
        setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'error', error: e instanceof Error ? e.message : 'Something went wrong.' } : x)));
      }
    }
    setBusy(false);
  }

  async function downloadAll() {
    const done = items.filter((i) => i.out);
    const files = await Promise.all(done.map(async (i) => ({ name: i.out!.name, data: new Uint8Array(await i.out!.blob.arrayBuffer()) })));
    try { downloadBlob('resized-images.zip', new Blob([buildZip(files) as BlobPart], { type: 'application/zip' })); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'The ZIP could not be made.'); }
  }

  const ready = items.filter((i) => i.status === 'ready' || i.status === 'done').length;
  const done = items.filter((i) => i.out);
  const before = done.reduce((n, i) => n + i.file.size, 0), after = done.reduce((n, i) => n + i.out!.blob.size, 0);
  const needsW = s.mode === 'fit' || s.mode === 'width' || s.mode === 'crop' || s.mode === 'stretch';
  const needsH = s.mode === 'fit' || s.mode === 'height' || s.mode === 'crop' || s.mode === 'stretch';
  const sample = useMemo(() => planResize(4000, 3000, s), [s]);

  return (
    <div className="panel">
      <label className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
        <input ref={input} type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
        <strong>Drop images here, or click to choose</strong>
        <span>You can also paste. JPEG, PNG, WebP, GIF, AVIF and SVG all work.</span>
      </label>
      {notice && <p className="note" role="status">{notice}</p>}

      <div className="row">
        <Segmented<Mode> label="Resize" value={s.mode} onChange={(v) => set('mode', v)} options={[
          { value: 'fit', label: 'Fit inside' }, { value: 'width', label: 'Width' }, { value: 'height', label: 'Height' },
          { value: 'percent', label: 'Percent' }, { value: 'crop', label: 'Crop to size' }, { value: 'stretch', label: 'Stretch' }]} />
      </div>
      <div className="row">
        {s.mode === 'percent' ? (
          <div className="field" style={{ width: 140 }}><label htmlFor="ir-p">Scale (%)</label><input id="ir-p" type="number" min={1} max={1000} value={s.percent || ''} onChange={(e) => set('percent', Number(e.target.value) || 0)} /></div>
        ) : (
          <>
            {needsW && <div className="field" style={{ width: 140 }}><label htmlFor="ir-w">{s.mode === 'fit' ? 'Max width' : 'Width'} (px)</label><input id="ir-w" type="number" min={1} max={16384} value={s.width || ''} onChange={(e) => set('width', Number(e.target.value) || 0)} /></div>}
            {needsH && <div className="field" style={{ width: 140 }}><label htmlFor="ir-h">{s.mode === 'fit' ? 'Max height' : 'Height'} (px)</label><input id="ir-h" type="number" min={1} max={16384} value={s.height || ''} onChange={(e) => set('height', Number(e.target.value) || 0)} /></div>}
          </>
        )}
        {s.mode === 'crop' && (
          <div className="field"><span className="label" id="ir-anchor">Keep this part</span>
            <div className="anchor" role="group" aria-labelledby="ir-anchor">
              {ANCHORS.map(([x, y, name]) => <button key={name} type="button" aria-label={name} aria-pressed={s.anchorX === x && s.anchorY === y} onClick={() => setS((p) => ({ ...p, anchorX: x, anchorY: y }))} />)}
            </div></div>
        )}
        <label className="check" style={{ marginBottom: 8 }}><input type="checkbox" checked={s.allowUpscale} onChange={(e) => set('allowUpscale', e.target.checked)} disabled={s.mode === 'percent'} /> Allow making images bigger</label>
      </div>
      <p className="note">
        {s.mode === 'fit' && 'Keeps the shape. Each image shrinks until it fits inside the box.'}
        {s.mode === 'width' && 'Sets the width and works out the height so nothing is squashed.'}
        {s.mode === 'height' && 'Sets the height and works out the width so nothing is squashed.'}
        {s.mode === 'percent' && 'Scales every image by the same amount.'}
        {s.mode === 'crop' && 'Fills the exact size and trims the overflow. Pick which part to keep.'}
        {s.mode === 'stretch' && 'Forces the exact size and will distort images that have a different shape.'}
        {' '}Example: a 4000 by 3000 photo becomes {sample.w} by {sample.h}.
      </p>

      <div className="row">
        <Segmented<OutChoice> label="Save as" value={s.format} onChange={(v) => set('format', v)} options={[
          { value: 'original', label: 'Same as original' }, { value: 'jpeg', label: 'JPEG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WebP' },
          ...(avif ? [{ value: 'avif' as OutChoice, label: 'AVIF' }] : [])]} />
        {s.format !== 'png' && (
          <div className="field" style={{ width: 220 }}><label htmlFor="ir-q">Quality: {s.quality}</label><input id="ir-q" type="range" min={30} max={100} value={s.quality} onChange={(e) => set('quality', Number(e.target.value))} /></div>
        )}
        <SettingsDrawer label="More options" title="More options">
          <div className="field"><label htmlFor="ir-n">File names</label><input id="ir-n" type="text" className="code" value={s.pattern} onChange={(e) => set('pattern', e.target.value)} spellCheck={false} /><p>Use {'{name}'}, {'{w}'} and {'{h}'}. Example result: {outName('holiday.jpg', 800, 600, 'jpg', s.pattern)}</p></div>
          <div className="field"><label htmlFor="ir-b">Background for transparent areas (JPEG)</label><ColorPicker id="ir-b" value={s.background} onChange={(v) => set('background', v)} label="Background colour" /></div>
          <p className="note">Saving through the browser removes camera details such as location and camera model. Rotation from the camera is applied first, so photos stay the right way up.</p>
        </SettingsDrawer>
      </div>

      <div className="prev" aria-live="polite">
        <em>Preview</em>
        {target ? (
          <div className="pv">
            <figure><div className="pv-img"><img src={target.url} alt="Your image before resizing" /></div>
              <figcaption><b className="d">Before</b><span>{target.srcW} by {target.srcH} · {formatBytes(target.file.size)}</span></figcaption></figure>
            <span className="pv-arrow d" aria-hidden>&rarr;</span>
            <figure className={pvBusy ? 'busy' : ''}><div className="pv-img">{pv ? <img src={pv.url} alt="Your image after resizing, as it will be saved" /> : <span className="hintx">Working</span>}</div>
              <figcaption><b className="d">After</b><span>{pv ? `${pv.w} by ${pv.h} · ${formatBytes(pv.bytes)} (${pv.bytes <= target.file.size ? '-' : '+'}${Math.abs(Math.round((1 - pv.bytes / target.file.size) * 100))}%)` : 'Working'}</span></figcaption></figure>
          </div>
        ) : <p className="pv-empty">Add an image and you will see here exactly what the settings above do to it, before you save anything.</p>}
        {items.length > 1 && target && <p className="hintx pv-pick">Showing {target.file.name}. Press Preview on another image below to see that one.</p>}
      </div>

      <div className="tool-actions">
        <button type="button" className="btn primary" onClick={run} disabled={!ready || busy}>{busy ? 'Working' : ready ? `Resize ${ready} ${ready === 1 ? 'image' : 'images'}` : 'Resize'}</button>
        {done.length > 1 && <button type="button" className="btn gold" onClick={downloadAll}>Download all as ZIP</button>}
        <button type="button" className="btn" onClick={() => input.current?.click()}>Add more</button>
        <button type="button" className="btn" onClick={clear} disabled={!items.length || busy}>Clear all</button>
        {done.length > 0 && <span className="stat" aria-live="polite">{formatBytes(before)} to {formatBytes(after)}{before > 0 ? ` (${after <= before ? 'saved' : 'larger by'} ${Math.abs(Math.round((1 - after / before) * 100))}%)` : ''}</span>}
      </div>

      {items.length ? (
        <ul className="img-grid" aria-label="Images">
          {items.map((i) => {
            const plan = i.srcW ? planResize(i.srcW, i.srcH, s) : null;
            return (
              <li className="img-card" key={i.id} data-status={i.status}>
                <div className="thumb"><img src={i.out?.url ?? i.url} alt="" /></div>
                <div className="img-info">
                  <strong title={i.file.name}>{i.file.name}</strong>
                  <span>{i.srcW ? `${i.srcW} by ${i.srcH}` : 'Reading'} · {formatBytes(i.file.size)}</span>
                  {i.status === 'error' && <span className="bad">{i.error}</span>}
                  {i.status === 'working' && <span>Resizing</span>}
                  {i.status === 'ready' && plan && <span>Will be {plan.w} by {plan.h}</span>}
                  {i.out && <span className="ok">Now {i.out.w} by {i.out.h} · {formatBytes(i.out.blob.size)} ({i.out.blob.size <= i.file.size ? '-' : '+'}{Math.abs(Math.round((1 - i.out.blob.size / i.file.size) * 100))}%)</span>}
                  <span className="img-actions">
                    {items.length > 1 && i.srcW > 0 && <button type="button" className="btn small" aria-pressed={i.id === targetId} onClick={() => setSel(i.id)}>Preview</button>}
                    {i.out && <a className="btn small" href={i.out.url} download={i.out.name}>Download</a>}
                    <button type="button" className="btn small" onClick={() => remove(i.id)} disabled={i.status === 'working'} aria-label={`Remove ${i.file.name}`}>Remove</button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : <div className="empty">Nothing added yet. Your images stay on this device and are never uploaded.</div>}
    </div>
  );
}
