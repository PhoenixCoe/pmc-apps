export interface Paste { id: string; title: string; lang: string; body: string; made: number; expires: number | null; burn: boolean; locked?: { salt: string; iv: string } }
export const KEY = 'pmc:terminal-pastebin:pastes';
const b64u = (u: Uint8Array) => { let s = ''; u.forEach((x) => (s += String.fromCharCode(x))); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s: string) => { const p = s.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(p + '='.repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0)); };
async function pipe(data: Uint8Array, s: CompressionStream | DecompressionStream) { const w = s.writable.getWriter(); w.write(data as BufferSource); w.close(); return new Uint8Array(await new Response(s.readable).arrayBuffer()); }
const key = async (phrase: string, salt: Uint8Array) => crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 200000, hash: 'SHA-256' }, await crypto.subtle.importKey('raw', new TextEncoder().encode(phrase), 'PBKDF2', false, ['deriveKey']), { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

/** The paste, squeezed and (if asked) locked, as text that fits in a link. */
export async function pack(p: Pick<Paste, 'title' | 'lang' | 'body'> & { expires: number | null }, phrase?: string): Promise<string> {
  let data = await pipe(new TextEncoder().encode(JSON.stringify({ t: p.title, l: p.lang, b: p.body, e: p.expires })), new CompressionStream('deflate-raw'));
  if (phrase) { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), enc = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(phrase, salt), data as BufferSource)); const o = new Uint8Array(29 + enc.length); o[0] = 1; o.set(salt, 1); o.set(iv, 17); o.set(enc, 29); return b64u(o); }
  const o = new Uint8Array(1 + data.length); o[0] = 0; o.set(data, 1); return b64u(o);
}
export const isLocked = (s: string) => { try { return unb64u(s.slice(0, 4))[0] === 1; } catch { return false; } };
export async function unpack(s: string, phrase?: string): Promise<{ title: string; lang: string; body: string; expires: number | null } | null> {
  try {
    const raw = unb64u(s); let data: Uint8Array;
    if (raw[0] === 1) { if (!phrase) return null; data = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(17, 29) }, await key(phrase, raw.slice(1, 17)), raw.slice(29))); } else data = raw.slice(1);
    const j = JSON.parse(new TextDecoder().decode(await pipe(data, new DecompressionStream('deflate-raw')))); return { title: j.t, lang: j.l, body: j.b, expires: j.e };
  } catch { return null; }
}
export const EXPIRY: [string, number | null][] = [['1 hour', 3600e3], ['1 day', 864e5], ['1 week', 6048e5], ['30 days', 2592e6], ['Never', null]];
