import { planResize, type OutMime, type ResizeOptions } from './utils';

export interface Decoded { src: CanvasImageSource; w: number; h: number; close: () => void }

/** Decode with EXIF rotation applied, so phone photos come out the right way up. */
export async function decode(file: File): Promise<Decoded> {
  try {
    const b = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { src: b, w: b.width, h: b.height, close: () => b.close() };
  } catch {
    // Older browsers, and some SVGs, go through an <img>.
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { URL.revokeObjectURL(url); throw new Error('This file could not be read as an image.'); }
    if (!img.naturalWidth || !img.naturalHeight) { URL.revokeObjectURL(url); throw new Error('This image has no readable size.'); }
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  }
}

const canvasOf = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export interface OutSpec { type: OutMime; quality: number; background: string }

/**
 * Resize in halving steps while the picture is more than twice the target. One big jump from a 6000px photo
 * to a thumbnail looks jagged; halving first keeps it smooth.
 */
export async function resizeFile(file: File, o: ResizeOptions, out: OutSpec): Promise<{ blob: Blob; w: number; h: number; srcW: number; srcH: number }> {
  const d = await decode(file);
  try {
    const plan = planResize(d.w, d.h, o);
    let src: CanvasImageSource = d.src;
    let rx = plan.sx, ry = plan.sy, rw = plan.sw, rh = plan.sh;
    while (rw / 2 >= plan.w && rh / 2 >= plan.h) {
      const nw = Math.max(plan.w, Math.ceil(rw / 2)), nh = Math.max(plan.h, Math.ceil(rh / 2));
      const step = canvasOf(nw, nh);
      const sctx = step.getContext('2d')!;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(src, rx, ry, rw, rh, 0, 0, nw, nh);
      src = step; rx = 0; ry = 0; rw = nw; rh = nh;
    }
    const c = canvasOf(plan.w, plan.h);
    const ctx = c.getContext('2d')!;
    if (out.type === 'image/jpeg') { ctx.fillStyle = out.background; ctx.fillRect(0, 0, plan.w, plan.h); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, rx, ry, rw, rh, 0, 0, plan.w, plan.h);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, out.type, out.quality / 100));
    if (!blob) throw new Error('The browser could not create this image.');
    if (blob.type !== out.type) throw new Error(`This browser cannot save ${out.type.split('/')[1].toUpperCase()} files. Choose another format.`);
    return { blob, w: plan.w, h: plan.h, srcW: d.w, srcH: d.h };
  } finally { d.close(); }
}

export async function supportsEncoding(type: OutMime): Promise<boolean> {
  const b = await new Promise<Blob | null>((res) => canvasOf(1, 1).toBlob(res, type));
  return b?.type === type;
}
