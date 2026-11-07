const rb = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const hx = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
const fmt = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
export const uuid4 = () => { const b = rb(16); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; return fmt(hx(b)); };
export const uuid7 = (t = Date.now()) => { const b = rb(16); for (let i = 0; i < 6; i++) b[i] = Math.floor(t / 2 ** (8 * (5 - i))) & 0xff; b[6] = (b[6] & 0x0f) | 0x70; b[8] = (b[8] & 0x3f) | 0x80; return fmt(hx(b)); };
const CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ulid = (t = Date.now()) => { let ts = '', x = t; for (let i = 0; i < 10; i++) { ts = CROCK[x % 32] + ts; x = Math.floor(x / 32); } const r = rb(16); return ts + [...r].map((v) => CROCK[v % 32]).join(''); };
export const NIL = '00000000-0000-0000-0000-000000000000';

export type Kind = 'v4' | 'v7' | 'ulid';
export const make = (k: Kind) => (k === 'v4' ? uuid4() : k === 'v7' ? uuid7() : ulid());

export function decode(s: string): { type: string; when?: Date; version?: number; variant?: string; error?: string } {
  const t = s.trim().replace(/^[{(]|[})]$/g, '');
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(t)) { let ms = 0; for (const c of t.slice(0, 10).toUpperCase()) ms = ms * 32 + CROCK.indexOf(c); return { type: 'ULID', when: new Date(ms) }; }
  const h = t.replace(/-/g, '');
  if (/^[0-9a-f]{32}$/i.test(h)) {
    const ver = parseInt(h[12], 16), v = parseInt(h[16], 16), variant = v < 8 ? 'Old (NCS)' : v < 12 ? 'Standard (RFC 4122)' : v < 14 ? 'Microsoft' : 'Reserved';
    const when = ver === 7 ? new Date(parseInt(h.slice(0, 12), 16)) : ver === 1 ? new Date(Number((BigInt('0x' + h.slice(13, 16) + h.slice(8, 12) + h.slice(0, 8)) - 122192928000000000n) / 10000n)) : undefined;
    return { type: h === '0'.repeat(32) ? 'Nil UUID' : `UUID version ${ver}`, version: ver, variant, when };
  }
  return { type: '', error: 'This is not a UUID or a ULID.' };
}
