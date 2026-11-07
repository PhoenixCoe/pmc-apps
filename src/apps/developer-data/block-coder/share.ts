import { sanitise, type Graph } from './graph';

/** Turns a project into a short piece of text for a link, and back. Compressed where the browser can do it. */
const toB64 = (u: Uint8Array) => {
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (t: string) => {
  const s = atob(t.replace(/-/g, '+').replace(/_/g, '/'));
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
};
async function squash(u: Uint8Array, how: 'compress' | 'decompress') {
  const stream = new Blob([u as BlobPart]).stream().pipeThrough(how === 'compress' ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function pack(g: Graph): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(g));
  if (typeof CompressionStream === 'undefined') return 'p' + toB64(raw);
  try { return 'z' + toB64(await squash(raw, 'compress')); } catch { return 'p' + toB64(raw); }
}

export async function unpack(token: string): Promise<Graph | null> {
  try {
    let u = fromB64(token.slice(1));
    if (token[0] === 'z') u = await squash(u, 'decompress');
    return sanitise(JSON.parse(new TextDecoder().decode(u)));
  } catch { return null; }
}

/** The shared project in this page's address, if there is one. */
export const sharedToken = () => (typeof location === 'undefined' ? null : /^#project=([\w-]+)$/.exec(location.hash)?.[1] ?? null);
export const shareUrl = (token: string) => `${location.origin}${location.pathname}#project=${token}`;
