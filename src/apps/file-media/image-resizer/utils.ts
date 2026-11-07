export type Mode = 'fit' | 'width' | 'height' | 'percent' | 'crop' | 'stretch';
export type OutChoice = 'original' | 'jpeg' | 'png' | 'webp' | 'avif';
export type OutMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export interface ResizeOptions {
  mode: Mode;
  /** 0 means "not set" */
  width: number;
  height: number;
  percent: number;
  allowUpscale: boolean;
  /** Focal point for crops, 0 = left/top, 1 = right/bottom */
  anchorX: number;
  anchorY: number;
}

export const defaultResize: ResizeOptions = { mode: 'fit', width: 1600, height: 1600, percent: 50, allowUpscale: false, anchorX: 0.5, anchorY: 0.5 };

/** Where to read from the source (sx, sy, sw, sh) and the size to write (w, h). */
export interface Plan { w: number; h: number; sx: number; sy: number; sw: number; sh: number }

/** Browsers refuse canvases past about this size. */
export const MAX_SIDE = 16384;
const side = (n: number) => Math.max(1, Math.min(MAX_SIDE, Math.round(n)));

export function planResize(srcW: number, srcH: number, o: ResizeOptions): Plan {
  const whole = (w: number, h: number): Plan => ({ w: side(w), h: side(h), sx: 0, sy: 0, sw: srcW, sh: srcH });
  const scaled = (scale: number): Plan => {
    let s = o.mode === 'percent' || o.allowUpscale ? scale : Math.min(scale, 1);
    const longest = Math.max(srcW, srcH) * s;
    if (longest > MAX_SIDE) s *= MAX_SIDE / longest;
    return whole(srcW * s, srcH * s);
  };

  switch (o.mode) {
    case 'percent': return scaled(Math.max(1, Math.min(1000, o.percent || 100)) / 100);
    case 'width': return scaled(o.width ? o.width / srcW : 1);
    case 'height': return scaled(o.height ? o.height / srcH : 1);
    case 'fit': {
      if (!o.width && !o.height) return scaled(1);
      return scaled(Math.min(o.width ? o.width / srcW : Infinity, o.height ? o.height / srcH : Infinity));
    }
    case 'stretch': {
      let w = o.width || srcW, h = o.height || srcH;
      if (!o.allowUpscale) { w = Math.min(w, srcW); h = Math.min(h, srcH); }
      return whole(w, h);
    }
    case 'crop': {
      const W = o.width || o.height || srcW, H = o.height || o.width || srcH;
      const ar = W / H;
      // Largest region of the source with the target's shape.
      let sw: number, sh: number;
      if (srcW / srcH > ar) { sh = srcH; sw = sh * ar; } else { sw = srcW; sh = sw / ar; }
      let w = W, h = H;
      if (!o.allowUpscale && (sw < W || sh < H)) { w = sw; h = sh; } // the source is too small: keep its real pixels
      else if (sw > W) { /* downscale handled by drawing the region into w x h */ }
      return { w: side(w), h: side(h), sx: (srcW - sw) * o.anchorX, sy: (srcH - sh) * o.anchorY, sw, sh };
    }
  }
}

export function pickOutput(sourceMime: string, choice: OutChoice): OutMime {
  if (choice === 'jpeg') return 'image/jpeg';
  if (choice === 'png') return 'image/png';
  if (choice === 'webp') return 'image/webp';
  if (choice === 'avif') return 'image/avif';
  if (sourceMime === 'image/jpeg' || sourceMime === 'image/webp') return sourceMime;
  return 'image/png'; // PNG, GIF, BMP, SVG and anything else: PNG keeps it lossless
}
export const extFor = (m: OutMime) => (m === 'image/jpeg' ? 'jpg' : m.split('/')[1]);
export const isLossy = (m: OutMime) => m !== 'image/png';

export const baseName = (filename: string) => filename.replace(/\.[^./\\]+$/, '');

export function outName(filename: string, w: number, h: number, ext: string, pattern: string): string {
  const stem = (pattern || '{name}')
    .replace(/\{name\}/g, baseName(filename))
    .replace(/\{w\}/g, String(w))
    .replace(/\{h\}/g, String(h))
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .trim();
  return `${stem || 'image'}.${ext}`;
}

export function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) { used.add(name); return name; }
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : '';
  for (let n = 2; ; n++) { const c = `${stem}-${n}${ext}`; if (!used.has(c)) { used.add(c); return c; } }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/* ------------------------------ ZIP (store only) ------------------------------ */
// Images are already compressed, so files are stored as they are. No library needed.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function buildZip(files: { name: string; data: Uint8Array }[], when = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const dosTime = (when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1);
  const dosDate = (Math.max(0, when.getFullYear() - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate();
  if (files.length > 65535) throw new Error('Too many files for one ZIP.');
  const total = files.reduce((n, f) => n + f.data.length, 0);
  if (total > 0xf0000000) throw new Error('These files are too large for one ZIP. Download them in smaller batches.');

  const locals: Uint8Array[] = [], centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    locals.push(new Uint8Array(lh.buffer), name, f.data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    centrals.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = centrals.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);

  const parts = [...locals, ...centrals, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
