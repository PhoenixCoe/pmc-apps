/** Accounts this browser has signed in with, kept only on this device so the sign-in page can offer them with one click. */
export type Via = 'credentials' | 'google' | 'github' | 'microsoft-entra-id' | 'nodemailer';
export interface Saved { email: string; name?: string | null; image?: string | null; via: Via }

const KEY = 'pmc.accounts', VIA = 'pmc.via';
const read = (): Saved[] => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = (l: Saved[]) => { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 5))); } catch { /* blocked */ } };

export const savedAccounts = read;
/** Called just before sending someone off to sign in, so we know how they did it when they come back. */
export const markVia = (v: Via) => { try { localStorage.setItem(VIA, v); } catch { /* blocked */ } };
export const lastVia = (): Via => { try { return (localStorage.getItem(VIA) as Via) || 'credentials'; } catch { return 'credentials'; } };
export function saveAccount(a: Saved) {
  const list = read().filter((x) => x.email.toLowerCase() !== a.email.toLowerCase());
  write([a, ...list]);
}
export function forgetAccount(email: string) { write(read().filter((x) => x.email.toLowerCase() !== email.toLowerCase())); }
