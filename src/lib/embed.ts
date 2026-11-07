/**
 * Lets another page (Coe, at coe.pmcstudios.uk) open any app inside a frame and work it, the way a person would.
 *
 *   https://apps.pmcstudios.uk/pixel-art-maker?embed=1&host=https://coe.pmcstudios.uk
 *
 * In that mode the page shows only the tool (no bar, footer or questions), and answers messages from the page that opened it.
 * Nothing leaves the browser: the messages go between the two pages on the person's own device.
 * Only a page on the allowed list below is listened to, and only when this page is really inside a frame.
 */
export const EMBED_VERSION = 1;
const ALLOWED = new Set(['https://coe.pmcstudios.uk', ...(process.env.NEXT_PUBLIC_EMBED_HOSTS ?? '').split(',').map((s) => s.trim()).filter(Boolean)]);
const isLocal = (o: string) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);

export const inFrame = () => { try { return window.parent !== window; } catch { return true; } };
export const isEmbed = () => typeof document !== 'undefined' && document.documentElement.dataset.embed === '1' && inFrame();

// ---------------------------------------------------------------- what an app can offer beyond clicking and typing
type Fn = (args: any) => unknown | Promise<unknown>;
const apis = new Map<string, Record<string, Fn>>();
/** An app can register things Coe can call: load(args) to fill in a drawing, read() to hand back its work. */
export function registerApi(slug: string, api: Record<string, Fn>) { apis.set(slug, api); return () => { if (apis.get(slug) === api) apis.delete(slug); }; }

/** Stored settings: useLocalState registers each one here, so a value can be put straight in. */
const states = new Map<string, { set: (v: unknown) => void; get: () => unknown }>();
export function registerState(app: string, key: string, set: (v: unknown) => void, get: () => unknown) {
  if (!isEmbed()) return () => {};
  const id = `${app}:${key}`; const entry = { set, get }; states.set(id, entry);
  return () => { if (states.get(id) === entry) states.delete(id); };
}

// ---------------------------------------------------------------- reading the page
const visible = (el: Element) => { const r = (el as HTMLElement).getClientRects(); if (!r.length) return false; const s = getComputedStyle(el as HTMLElement); return s.visibility !== 'hidden' && s.display !== 'none'; };
const clean = (s: string | null | undefined, n = 80) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const root = (): ParentNode => document.getElementById('tool') ?? document.body;

function labelOf(el: HTMLElement): string {
  const a = el.getAttribute('aria-label'); if (a) return clean(a);
  const lb = (el as HTMLInputElement).labels?.[0]; if (lb) { const c = lb.cloneNode(true) as HTMLElement; c.querySelectorAll('input,select,textarea').forEach((x) => x.remove()); const t = clean(c.textContent); if (t) return t; }
  const by = el.getAttribute('aria-labelledby'); if (by) { const t = clean(document.getElementById(by)?.textContent); if (t) return t; }
  const ph = (el as HTMLInputElement).placeholder; if (ph) return clean(ph);
  const wrap = el.closest('label'); if (wrap) { const c = wrap.cloneNode(true) as HTMLElement; c.querySelectorAll('input,select,textarea').forEach((x) => x.remove()); const t = clean(c.textContent); if (t) return t; }
  const prev = el.previousElementSibling; if (prev && /^(LABEL|SPAN|H\d|P|B|STRONG)$/.test(prev.tagName)) { const t = clean(prev.textContent, 50); if (t) return t; }
  return clean(el.getAttribute('name') || el.id || el.tagName.toLowerCase());
}

interface Field { n: number; label: string; kind: string; value: string; options?: string[] }
interface Snapshot { slug: string; title: string; fields: Field[]; buttons: string[]; outputs: { label: string; text: string }[]; image?: string; imageSize?: [number, number] }
let tagged: HTMLElement[] = [];

function inputs(): HTMLElement[] {
  return [...root().querySelectorAll<HTMLElement>('input, textarea, select')].filter((e) => {
    const t = (e as HTMLInputElement).type;
    if (t === 'hidden') return false;
    if (t === 'file') return true;
    return visible(e);
  });
}

function bigCanvas(): { url: string; w: number; h: number } | null {
  let best: HTMLCanvasElement | null = null, area = 0;
  for (const c of root().querySelectorAll('canvas')) { if (!visible(c) || !c.width || !c.height) continue; const a = c.width * c.height; if (a > area) { area = a; best = c; } }
  if (!best) return null;
  try {
    const k = Math.max(1, Math.min(16, Math.floor(256 / Math.max(best.width, best.height)))), max = 1400;
    const s = Math.min(k, max / Math.max(best.width, best.height)) || 1;
    const out = document.createElement('canvas'); out.width = Math.round(best.width * s); out.height = Math.round(best.height * s);
    const x = out.getContext('2d')!; x.imageSmoothingEnabled = false; x.drawImage(best, 0, 0, out.width, out.height);
    return { url: out.toDataURL('image/png'), w: best.width, h: best.height };
  } catch { return null; }
}

export function snapshot(slug: string): Snapshot {
  tagged = inputs();
  const fields: Field[] = tagged.map((e, i) => {
    const t = (e as HTMLInputElement).type || e.tagName.toLowerCase();
    const f: Field = { n: i, label: labelOf(e), kind: e.tagName === 'SELECT' ? 'select' : e.tagName === 'TEXTAREA' ? 'text' : t, value: '' };
    if (t === 'checkbox' || t === 'radio') f.value = (e as HTMLInputElement).checked ? 'on' : 'off';
    else if (t === 'file') f.value = (e as HTMLInputElement).files?.length ? `${(e as HTMLInputElement).files!.length} file(s)` : '';
    else f.value = clean((e as HTMLInputElement).value, 300);
    if (e.tagName === 'SELECT') f.options = [...(e as HTMLSelectElement).options].map((o) => clean(o.textContent, 40)).slice(0, 30);
    return f;
  }).slice(0, 60);
  const seen = new Set<string>(), buttons: string[] = [];
  for (const b of root().querySelectorAll<HTMLElement>('button, [role="button"], a.btn, label.btn, input[type="button"], input[type="submit"], summary')) {
    if (!visible(b) || (b as HTMLButtonElement).disabled) continue;
    const t = clean(b.getAttribute('aria-label') || b.textContent || (b as HTMLInputElement).value, 40); const pressed = b.getAttribute('aria-pressed');
    const text = pressed === 'true' ? `${t} (on)` : t; if (t && !seen.has(text)) { seen.add(text); buttons.push(text); }
  }
  const outputs: { label: string; text: string }[] = [];
  for (const o of root().querySelectorAll<HTMLElement>('pre, output, [role="status"], [aria-live], textarea[readonly], input[readonly], code')) {
    if (!visible(o) || o.closest('button')) continue;
    const text = clean((o as HTMLInputElement).value ?? o.textContent, 1500); if (text.length < 2) continue;
    if (outputs.some((x) => x.text === text)) continue;
    outputs.push({ label: labelOf(o) || o.tagName.toLowerCase(), text }); if (outputs.length >= 12) break;
  }
  const c = bigCanvas();
  return { slug, title: clean(document.querySelector('h1')?.textContent, 60), fields, buttons: buttons.slice(0, 60), outputs, ...(c ? { image: c.url, imageSize: [c.w, c.h] as [number, number] } : {}) };
}

// ---------------------------------------------------------------- acting on it
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

function setValue(el: HTMLElement, value: unknown) {
  const t = (el as HTMLInputElement).type;
  if (t === 'checkbox' || t === 'radio') { const want = value === true || /^(on|true|yes|1)$/i.test(String(value)); if ((el as HTMLInputElement).checked !== want) el.click(); return; }
  if (el.tagName === 'SELECT') {
    const sel = el as HTMLSelectElement, v = String(value).toLowerCase();
    const o = [...sel.options].find((x) => x.value.toLowerCase() === v) ?? [...sel.options].find((x) => clean(x.textContent, 80).toLowerCase() === v) ?? [...sel.options].find((x) => clean(x.textContent, 80).toLowerCase().includes(v));
    if (!o) throw new Error(`No option "${value}"`);
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(sel, o.value);
  } else {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, String(value));
  }
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
}

function findField(key: string): HTMLElement {
  if (!tagged.length) tagged = inputs();
  if (/^\d+$/.test(key) && tagged[+key]) return tagged[+key];
  const k = key.toLowerCase();
  const labels = tagged.map((e) => labelOf(e).toLowerCase());
  let i = labels.findIndex((l) => l === k); if (i < 0) i = labels.findIndex((l) => l.startsWith(k)); if (i < 0) i = labels.findIndex((l) => l.includes(k));
  if (i < 0) throw new Error(`No field called "${key}"`);
  return tagged[i];
}

async function clickText(text: string) {
  const k = text.toLowerCase().replace(/\s*\(on\)$/, '');
  const all = [...root().querySelectorAll<HTMLElement>('button, [role="button"], a.btn, label.btn, input[type="button"], input[type="submit"], summary')].filter((b) => visible(b) && !(b as HTMLButtonElement).disabled);
  const name = (b: HTMLElement) => clean(b.getAttribute('aria-label') || b.textContent || (b as HTMLInputElement).value, 60).toLowerCase();
  const b = all.find((x) => name(x) === k) ?? all.find((x) => name(x).startsWith(k)) ?? all.find((x) => name(x).includes(k));
  if (!b) throw new Error(`No button called "${text}"`);
  b.click(); await wait(220); await nextFrame();
}

async function putFiles(files: { name: string; type: string; data: string }[]) {
  const input = [...root().querySelectorAll<HTMLInputElement>('input[type="file"]')][0];
  if (!input) throw new Error('This app has no place to add files.');
  const dt = new DataTransfer();
  for (const f of files) { const bin = atob(f.data), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); dt.items.add(new File([u], f.name, { type: f.type })); }
  input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(400);
}

// ---------------------------------------------------------------- files the app makes go to the chat, not to the downloads folder
let post: (m: Record<string, unknown>) => void = () => {};
const blobToB64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
async function grab(href: string, name: string) {
  try {
    const b = await (await fetch(href)).blob();
    if (b.size > 40_000_000) { post({ type: 'note', text: 'That file is too big to send to the chat.' }); return; }
    post({ type: 'file', name: name || 'file', mime: b.type || 'application/octet-stream', size: b.size, data: await blobToB64(b) });
  } catch { post({ type: 'note', text: 'That file could not be sent to the chat.' }); }
}

let started = false;
export function startBridge() {
  if (started || !isEmbed()) return; started = true;
  const q = new URLSearchParams(location.search); const host = q.get('host') ?? '';
  const slug = location.pathname.replace(/^\/|\/$/g, '');
  const ok = (o: string) => o === host && (ALLOWED.has(o) || isLocal(o));
  post = (m) => { if (ok(host)) window.parent.postMessage({ pmc: EMBED_VERSION, slug, ...m }, host); };

  // Downloads: a link with a download name, clicked by the app or by the person.
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) { if (this.download && /^(blob:|data:)/.test(this.href)) { void grab(this.href, this.download); return; } return click.call(this); };
  document.addEventListener('click', (e) => { const a = (e.target as Element | null)?.closest?.('a[download]') as HTMLAnchorElement | null; if (a && /^(blob:|data:)/.test(a.href)) { e.preventDefault(); void grab(a.href, a.download); } }, true);

  // Tell the page how tall the tool is, so a frame can fit it.
  let last = 0;
  const size = () => { const h = Math.ceil(document.documentElement.scrollHeight); if (Math.abs(h - last) > 3) { last = h; post({ type: 'height', px: h }); } };
  new ResizeObserver(size).observe(document.documentElement);

  window.addEventListener('message', async (e) => {
    if (e.source !== window.parent || !ok(e.origin)) return;
    const m = e.data; if (!m || m.pmc !== EMBED_VERSION || typeof m.type !== 'string') return;
    const id = m.id;
    const reply = (data: Record<string, unknown>) => post({ type: 'reply', id, ...data });
    try {
      if (m.type === 'hello') { post({ type: 'ready', title: clean(document.querySelector('h1')?.textContent, 60), apis: [...(apis.get(slug) ? Object.keys(apis.get(slug)!) : [])], state: [...states.keys()].filter((k) => k.startsWith(slug + ':')).map((k) => k.slice(slug.length + 1)) }); size(); return; }
      if (m.type === 'read') { reply({ ok: true, ...snapshot(slug), state: Object.fromEntries([...states.entries()].filter(([k]) => k.startsWith(slug + ':')).map(([k, v]) => [k.slice(slug.length + 1), v.get()])), ...(apis.get(slug)?.read ? { api: await apis.get(slug)!.read({}) } : {}) }); return; }
      if (m.type === 'do') {
        const done: string[] = [], notes: string[] = [];
        if (m.state && typeof m.state === 'object') for (const [k, v] of Object.entries(m.state)) { const s = states.get(`${slug}:${k}`); if (s) { s.set(v); done.push(`set ${k}`); } else notes.push(`no stored setting "${k}"`); }
        if (m.call && typeof m.call === 'object') for (const [fn, args] of Object.entries(m.call)) { const f = apis.get(slug)?.[fn]; if (f) { await f(args); done.push(`called ${fn}`); } else notes.push(`no function "${fn}"`); }
        if (Array.isArray(m.files) && m.files.length) { try { await putFiles(m.files); done.push('added files'); } catch (er) { notes.push((er as Error).message); } }
        await wait(120); tagged = inputs();
        if (m.fill && typeof m.fill === 'object') for (const [k, v] of Object.entries(m.fill)) { try { setValue(findField(k), v); done.push(`filled ${k}`); await wait(40); } catch (er) { notes.push((er as Error).message); } }
        const clicks: unknown[] = Array.isArray(m.click) ? m.click : m.click ? [m.click] : [];
        for (const c of clicks) { try { await clickText(String(c)); done.push(`pressed ${c}`); } catch (er) { notes.push((er as Error).message); } }
        await wait(260);
        reply({ ok: true, done, notes, ...snapshot(slug) }); return;
      }
      reply({ ok: false, error: 'Unknown message.' });
    } catch (er) { reply({ ok: false, error: (er as Error).message }); }
  });

  post({ type: 'ready', title: clean(document.querySelector('h1')?.textContent, 60) });
}
