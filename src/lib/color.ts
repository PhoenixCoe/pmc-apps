import { fromHex, toHex } from '@/lib/files';
export type Hsl = { h: number; s: number; l: number };
export const hexToHsl = (hex: string): Hsl => { const [r, g, b] = fromHex(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2; let h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; } return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 }; };
export const hslToHex = ({ h, s, l }: Hsl) => { const S = Math.min(100, Math.max(0, s)) / 100, L = Math.min(100, Math.max(0, l)) / 100, k = (n: number) => (n + h / 30) % 12, a = S * Math.min(L, 1 - L), f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return toHex(f(0) * 255, f(8) * 255, f(4) * 255); };
export const validHex = (s: string) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
export const fixHex = (s: string) => { const m = s.trim().replace('#', ''); return '#' + (m.length === 3 ? m.split('').map((c) => c + c).join('') : m).toLowerCase(); };
