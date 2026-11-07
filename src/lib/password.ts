import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';

const scrypt = (pw: string, salt: Buffer, len: number) =>
  new Promise<Buffer>((res, rej) => scryptCb(pw, salt, len, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));

/** Stores a password as scrypt$salt$hash (both base64). Nothing reversible is kept. */
export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [kind, s, h] = stored.split('$');
  if (kind !== 'scrypt' || !s || !h) return false;
  const want = Buffer.from(h, 'base64');
  const got = await scrypt(pw, Buffer.from(s, 'base64'), want.length);
  return want.length === got.length && timingSafeEqual(want, got);
}

export const MIN_PASSWORD = 10;
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
