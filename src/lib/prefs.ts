/**
 * The few choices a person can make on the Settings page. They live in this browser (localStorage) and are
 * applied to the <html> element as data attributes, before the first paint (see the script in layout.tsx),
 * so CSS and the loader can read them without any JavaScript state.
 */
export type TextPref = 'normal' | 'large';
export type LoaderPref = 'full' | 'quick' | 'off';
export type MotionPref = 'device' | 'calm';

export interface Prefs { text: TextPref; loader: LoaderPref; motion: MotionPref }
export const DEFAULTS: Prefs = { text: 'normal', loader: 'full', motion: 'device' };

const KEY = { text: 'pmc.text', loader: 'pmc.loader', motion: 'pmc.motion' } as const;
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* blocked */ } };

export function readPrefs(): Prefs {
  const l = get(KEY.loader), t = get(KEY.text), m = get(KEY.motion);
  return {
    text: t === 'large' ? 'large' : 'normal',
    loader: l === 'quick' || l === 'off' ? l : 'full',
    motion: m === 'calm' ? 'calm' : 'device',
  };
}

/** Put the saved choices on <html>. Safe to call as often as needed. */
export function applyPrefs(p: Prefs = readPrefs()) {
  const d = document.documentElement.dataset;
  if (p.text === 'large') d.text = 'large'; else delete d.text;
  if (p.loader !== 'full') d.loader = p.loader; else delete d.loader;
  if (p.motion === 'calm') d.motion = 'calm'; else delete d.motion;
}

export function savePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  const v = String(value);
  set(KEY[key], v === DEFAULTS[key] ? null : v);
  applyPrefs();
}

/** The same script, as text, for the <head>. Keep the two in step. */
export const PREFS_SCRIPT = "try{var d=document.documentElement.dataset,s=localStorage;if(s.getItem('pmc.text')==='large')d.text='large';var l=s.getItem('pmc.loader');if(l==='quick'||l==='off')d.loader=l;if(s.getItem('pmc.motion')==='calm')d.motion='calm'}catch(e){}";

/** Forget everything this site saved in the browser: settings and what apps remembered. */
export function clearSaved() {
  try {
    const gone: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (k.startsWith('pmc.') || k.startsWith('pmc:'))) gone.push(k); }
    gone.forEach((k) => localStorage.removeItem(k));
    applyPrefs(DEFAULTS);
    return gone.length;
  } catch { return 0; }
}
