export interface Note { id: number; title: string; body: string; tags: string[]; at: number }
export interface Stored { v: 1; salt: string; iv: string; data: string }
const b64 = (u: Uint8Array) => { let s = ''; u.forEach((x) => (s += String.fromCharCode(x))); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const KEY = 'pmc:encrypted-scratchpad:vault';

export async function deriveKey(phrase: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(phrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function seal(notes: Note[], key: CryptoKey, salt: Uint8Array): Promise<Stored> {
  const iv = crypto.getRandomValues(new Uint8Array(12)), data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(notes)));
  return { v: 1, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) };
}
export async function open(s: Stored, phrase: string): Promise<{ notes: Note[]; key: CryptoKey; salt: Uint8Array } | null> {
  try {
    const salt = unb64(s.salt), key = await deriveKey(phrase, salt), plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(s.iv) as BufferSource }, key, unb64(s.data) as BufferSource);
    return { notes: JSON.parse(new TextDecoder().decode(plain)), key, salt };
  } catch { return null; }
}
export const newSalt = () => crypto.getRandomValues(new Uint8Array(16));
