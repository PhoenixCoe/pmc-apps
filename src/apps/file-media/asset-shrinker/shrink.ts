import { canvasBlob, imageFromFile, makeCanvas } from '@/lib/files';

/** Median-cut colour reduction on an RGBA canvas. Transparent pixels stay transparent. */
export function quantise(c: HTMLCanvasElement, colours: number) {
  const x = c.getContext('2d')!, img = x.getImageData(0, 0, c.width, c.height), d = img.data;
  const px: number[] = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8) px.push(i);
  if (!px.length) return;
  const step = Math.max(1, Math.floor(px.length / 60000)), sample = px.filter((_, i) => i % step === 0);
  type Box = number[];
  const range = (b: Box) => { let mn = [255, 255, 255], mx = [0, 0, 0]; for (const i of b) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], d[i + k]); mx[k] = Math.max(mx[k], d[i + k]); } return mx.map((v, k) => v - mn[k]); };
  const boxes: Box[] = [sample];
  while (boxes.length < colours) {
    let bi = -1, bs = 0, ch = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; const r = range(b), m = Math.max(...r); if (m > bs) { bs = m; bi = i; ch = r.indexOf(m); } });
    if (bi < 0) break;
    const b = boxes[bi].sort((a, z) => d[a + ch] - d[z + ch]), h = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, h), b.slice(h));
  }
  const pal = boxes.map((b) => { const s = [0, 0, 0]; for (const i of b) for (let k = 0; k < 3; k++) s[k] += d[i + k]; return s.map((v) => Math.round(v / b.length)); });
  const cache = new Map<number, number>();
  for (const i of px) {
    const key = ((d[i] >> 2) << 12) | ((d[i + 1] >> 2) << 6) | (d[i + 2] >> 2);
    let p = cache.get(key);
    if (p === undefined) { let best = 1e9; p = 0; for (let j = 0; j < pal.length; j++) { const e = (pal[j][0] - d[i]) ** 2 + (pal[j][1] - d[i + 1]) ** 2 + (pal[j][2] - d[i + 2]) ** 2; if (e < best) { best = e; p = j; } } cache.set(key, p); }
    d[i] = pal[p][0]; d[i + 1] = pal[p][1]; d[i + 2] = pal[p][2];
  }
  x.putImageData(img, 0, 0);
}

export interface ShrinkOptions { colours: number; scale: number; webp: boolean; quality: number }
export async function shrinkRaster(f: File, o: ShrinkOptions): Promise<{ blob: Blob; w: number; h: number }> {
  const { img, url } = await imageFromFile(f);
  try {
    const c = makeCanvas(img.naturalWidth * (o.scale / 100), img.naturalHeight * (o.scale / 100)), x = c.getContext('2d')!;
    x.imageSmoothingEnabled = o.scale !== 100; x.drawImage(img, 0, 0, c.width, c.height);
    if (o.webp) return { blob: await canvasBlob(c, 'image/webp', o.quality / 100), w: c.width, h: c.height };
    if (o.colours < 256 || f.type === 'image/png') quantise(c, Math.min(256, o.colours));
    return { blob: await canvasBlob(c, 'image/png'), w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(url); }
}
