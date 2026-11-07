/** Small helpers the file and image apps share. */
export const formatBytes = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1048576).toFixed(1)} MB`;

export const readText = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsText(f); });
export const readBuffer = (f: Blob) => f.arrayBuffer();
export const readDataUrl = (f: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

export const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That image could not be opened.')); i.src = src; });
export async function imageFromFile(f: Blob): Promise<{ img: HTMLImageElement; url: string }> { const url = URL.createObjectURL(f); try { return { img: await loadImage(url), url }; } catch (e) { URL.revokeObjectURL(url); throw e; } }

export const canvasBlob = (c: HTMLCanvasElement, type = 'image/png', q = 0.92) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('The browser could not save that format.'))), type, q));
export const makeCanvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

export const baseName = (n: string) => n.replace(/\.[^.]+$/, '');
export const stamp = () => new Date().toISOString().slice(0, 10);
export const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');
export const toHex = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
export const fromHex = (h: string): [number, number, number] => { const m = h.replace('#', ''); const f = m.length === 3 ? m.split('').map((c) => c + c).join('') : m; return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0]; };
export const lum = (r: number, g: number, b: number) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
export const contrast = (a: string, b: string) => { const x = lum(...fromHex(a)), y = lum(...fromHex(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
