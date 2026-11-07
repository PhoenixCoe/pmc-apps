'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FileDrop } from '@/components/shared/FileDrop';
import { CompareSlider } from '@/components/shared/CompareSlider';
import { Segmented } from '@/components/shared/Segmented';
import { downloadBlob, downloadText } from '@/components/shared/CopyButton';
import { baseName, formatBytes, readText } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';
import { cleanSvg, defaultSvg } from '../svg-vector-studio/svg';
import { shrinkRaster } from './shrink';

interface Item { id: number; file: File; kind: 'svg' | 'raster'; before: string; after?: string; blob?: Blob; size?: number; name?: string; error?: string }
let nid = 1;

export default function View() {
  const [colours, setColours] = useLocalState('asset-shrinker', 'colours', 128);
  const [scale, setScale] = useLocalState('asset-shrinker', 'scale', 100);
  const [webp, setWebp] = useLocalState('asset-shrinker', 'webp', false);
  const [quality, setQuality] = useLocalState('asset-shrinker', 'quality', 85);
  const [precision, setPrecision] = useLocalState('asset-shrinker', 'precision', 2);
  const [items, setItems] = useState<Item[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);
  const key = JSON.stringify([colours, scale, webp, quality, precision]);

  const add = async (files: File[]) => {
    const fresh: Item[] = files.filter((f) => /^image\//.test(f.type) || /\.(svg|png|jpe?g|webp)$/i.test(f.name)).map((file) => {
      const url = URL.createObjectURL(file); urls.current.push(url);
      return { id: nid++, file, kind: file.type === 'image/svg+xml' || /\.svg$/i.test(file.name) ? 'svg' : 'raster', before: url } as Item;
    });
    setItems((p) => [...p, ...fresh]); if (fresh[0] && sel == null) setSel(fresh[0].id);
  };

  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      const out = await Promise.all(items.map(async (it): Promise<Item> => {
        try {
          if (it.kind === 'svg') {
            const r = cleanSvg(await readText(it.file), { ...defaultSvg, precision });
            if (r.error) return { ...it, error: r.error, after: undefined };
            const blob = new Blob([r.out], { type: 'image/svg+xml' }), url = URL.createObjectURL(blob); urls.current.push(url);
            return { ...it, error: undefined, blob, after: url, size: blob.size, name: `${baseName(it.file.name)}.min.svg` };
          }
          const r = await shrinkRaster(it.file, { colours, scale, webp, quality }), url = URL.createObjectURL(r.blob); urls.current.push(url);
          if (r.blob.size >= it.file.size) return { ...it, error: undefined, blob: it.file, after: it.before, size: it.file.size, name: it.file.name };
          return { ...it, error: undefined, blob: r.blob, after: url, size: r.blob.size, name: `${baseName(it.file.name)}-small.${webp ? 'webp' : 'png'}` };
        } catch (e) { return { ...it, error: e instanceof Error ? e.message : 'Could not shrink this file.' }; }
      }));
      if (live) setItems(out);
    }, 250);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, items.length]);

  const cur = items.find((i) => i.id === sel) ?? items[0];
  const total = useMemo(() => items.reduce((n, i) => n + i.file.size, 0), [items]);
  const after = useMemo(() => items.reduce((n, i) => n + (i.size ?? i.file.size), 0), [items]);
  const hasRaster = items.some((i) => i.kind === 'raster'), hasSvg = items.some((i) => i.kind === 'svg');
  return (
    <div className="panel">
      <FileDrop onFiles={add} accept="image/*,.svg" title="Drop SVG, PNG or sprite sheets here, or click to choose" hint="Several at once is fine" paste />
      {items.length > 0 && (
        <>
          <div className="row">
            {hasRaster && <>
              <Segmented<'png' | 'webp'> label="Save pictures as" value={webp ? 'webp' : 'png'} onChange={(v) => setWebp(v === 'webp')} options={[{ value: 'png', label: 'PNG' }, { value: 'webp', label: 'WebP' }]} />
              {!webp && <div className="field"><label htmlFor="as-c">Colours: {colours}</label><input id="as-c" type="range" min={16} max={256} step={16} value={colours} onChange={(e) => setColours(+e.target.value)} /></div>}
              {webp && <div className="field"><label htmlFor="as-q">Quality: {quality}</label><input id="as-q" type="range" min={30} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} /></div>}
              <div className="field"><label htmlFor="as-s">Size: {scale}%</label><input id="as-s" type="range" min={10} max={100} step={5} value={scale} onChange={(e) => setScale(+e.target.value)} /></div>
            </>}
            {hasSvg && <div className="field"><label htmlFor="as-p">SVG decimals: {precision}</label><input id="as-p" type="range" min={0} max={5} value={precision} onChange={(e) => setPrecision(+e.target.value)} /></div>}
          </div>
          <div className="tool-actions">
            <span className="stat">{formatBytes(total)} → {formatBytes(after)}</span>
            <span className="stat">{total ? `${Math.max(0, Math.round((1 - after / total) * 100))}% smaller` : ''}</span>
          </div>
          {cur?.after && <CompareSlider before={cur.before} after={cur.after} />}
          {cur?.error && <p className="bad">{cur.error}</p>}
          <ul className="img-grid">
            {items.map((i) => (
              <li key={i.id} className="img-card" data-status={i.error ? 'error' : i.after ? 'done' : 'ready'} onClick={() => setSel(i.id)} style={{ cursor: 'pointer', outline: i.id === cur?.id ? '3px solid var(--g1)' : undefined }}>
                <div className="thumb">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={i.before} alt="" /></div>
                <div className="img-info">
                  <strong>{i.file.name}</strong>
                  <span>{formatBytes(i.file.size)}{i.size != null ? ` → ${formatBytes(i.size)}` : ' …'}</span>
                  <div className="img-actions">
                    <button type="button" className="btn small" disabled={!i.blob} onClick={(e) => { e.stopPropagation(); if (i.kind === 'svg' && i.blob) i.blob.text().then((t) => downloadText(i.name!, t, 'image/svg+xml')); else if (i.blob) downloadBlob(i.name!, i.blob); }}>Download</button>
                    <button type="button" className="btn small" onClick={(e) => { e.stopPropagation(); setItems((p) => p.filter((x) => x.id !== i.id)); }}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
