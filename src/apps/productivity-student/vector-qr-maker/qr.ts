import qrcode from 'qrcode-generator';

export type Ec = 'L' | 'M' | 'Q' | 'H';
export interface QrOptions { ec: Ec; dots: 'square' | 'rounded' | 'dots'; eyeOuter: 'square' | 'rounded' | 'circle'; eyeInner: 'square' | 'rounded' | 'circle'; fg: string; bg: string; eye: string; margin: number; logoSize: number; transparent: boolean }
export const defaultQr: QrOptions = { ec: 'M', dots: 'square', eyeOuter: 'square', eyeInner: 'square', fg: '#171717', bg: '#ffffff', eye: '#337957', margin: 3, logoSize: 22, transparent: false };

export function matrix(text: string, ec: Ec): boolean[][] | null {
  try { const q = qrcode(0, ec); q.addData(text || ' ', 'Byte'); q.make(); const n = q.getModuleCount(); return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c))); } catch { return null; }
}

const f = (n: number) => +n.toFixed(2);
export function buildSvg(m: boolean[][], o: QrOptions, logo?: string): string {
  const n = m.length, S = n + o.margin * 2, off = o.margin;
  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hole = logo ? (o.logoSize / 100) * n : 0, lo = (n - hole) / 2, hi = (n + hole) / 2;
  const inLogo = (r: number, c: number) => !!logo && r + 1 > lo - 0.5 && r < hi + 0.5 && c + 1 > lo - 0.5 && c < hi + 0.5;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!m[r][c] || inEye(r, c) || inLogo(r, c)) continue;
    const x = c + off, y = r + off;
    if (o.dots === 'square') d += `M${x} ${y}h1v1h-1z`;
    else if (o.dots === 'dots') d += `M${f(x + 0.5)} ${f(y + 0.04)}a0.46 0.46 0 1 1 0 0.92a0.46 0.46 0 1 1 0 -0.92z`;
    else { const k = 0.3, s = 1; d += `M${f(x + k)} ${y}h${f(s - 2 * k)}a${k} ${k} 0 0 1 ${k} ${k}v${f(s - 2 * k)}a${k} ${k} 0 0 1 -${k} ${k}h-${f(s - 2 * k)}a${k} ${k} 0 0 1 -${k} -${k}v-${f(s - 2 * k)}a${k} ${k} 0 0 1 ${k} -${k}z`; }
  }
  const shape = (x: number, y: number, w: number, kind: 'square' | 'rounded' | 'circle', fill: string, evenodd?: { x: number; y: number; w: number; kind: 'square' | 'rounded' | 'circle' }) => {
    const path = (X: number, Y: number, W: number, k: typeof kind) => k === 'circle' ? `M${f(X + W / 2)} ${Y}a${W / 2} ${W / 2} 0 1 1 0 ${W}a${W / 2} ${W / 2} 0 1 1 0 -${W}z` : k === 'rounded' ? `M${f(X + W * 0.28)} ${Y}h${f(W * 0.44)}a${f(W * 0.28)} ${f(W * 0.28)} 0 0 1 ${f(W * 0.28)} ${f(W * 0.28)}v${f(W * 0.44)}a${f(W * 0.28)} ${f(W * 0.28)} 0 0 1 -${f(W * 0.28)} ${f(W * 0.28)}h-${f(W * 0.44)}a${f(W * 0.28)} ${f(W * 0.28)} 0 0 1 -${f(W * 0.28)} -${f(W * 0.28)}v-${f(W * 0.44)}a${f(W * 0.28)} ${f(W * 0.28)} 0 0 1 ${f(W * 0.28)} -${f(W * 0.28)}z` : `M${X} ${Y}h${W}v${W}h-${W}z`;
    return `<path fill="${fill}" fill-rule="evenodd" d="${path(x, y, w, kind)}${evenodd ? path(evenodd.x, evenodd.y, evenodd.w, evenodd.kind) : ''}"/>`;
  };
  const eyes = [[0, 0], [n - 7, 0], [0, n - 7]].map(([c, r]) => shape(c + off, r + off, 7, o.eyeOuter, o.eye, { x: c + off + 1, y: r + off + 1, w: 5, kind: o.eyeOuter }) + shape(c + off + 2, r + off + 2, 3, o.eyeInner, o.eye)).join('');
  const bg = o.transparent ? '' : `<rect width="${S}" height="${S}" fill="${o.bg}"/>`;
  const img = logo ? `<rect x="${f(lo + off - 0.3)}" y="${f(lo + off - 0.3)}" width="${f(hole + 0.6)}" height="${f(hole + 0.6)}" fill="${o.transparent ? '#ffffff' : o.bg}"/><image href="${logo}" x="${f(lo + off)}" y="${f(lo + off)}" width="${f(hole)}" height="${f(hole)}" preserveAspectRatio="xMidYMid meet"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" shape-rendering="crispEdges">${bg}<path fill="${o.fg}" d="${d}"/>${eyes}${img}</svg>`;
}
