export type Lang = 'js' | 'css' | 'html' | 'json';
export interface MinifyOptions { jsMode: 'whitespace' | 'full'; jsModule: boolean; keepLicence: boolean; htmlComments: boolean }
export const defaultMinifyOptions: MinifyOptions = { jsMode: 'whitespace', jsModule: false, keepLicence: true, htmlComments: true };
export type MinifyResult = { ok: true; text: string } | { ok: false; message: string; line?: number; column?: number };

export const byteLength = (s: string) => new TextEncoder().encode(s).length;

/** Gzip size where the browser supports it (all current ones do). Returns null if not. */
export async function gzipSize(s: string): Promise<number | null> {
  if (typeof CompressionStream === 'undefined' || !s) return s ? null : 0;
  const stream = new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

/* ---------------------------------- CSS ---------------------------------- */

/**
 * Whitespace and comment stripper for CSS. It never rewrites values, so what you wrote is what the browser reads.
 * Spaces are kept wherever removing them could change meaning (inside calc(), between values, before a pseudo-class).
 */
export function minifyCss(src: string, keepLicence = true): string {
  let out = '', i = 0, depth = 0, space = false;
  const n = src.length;
  const needsSpace = (prev: string, next: string): boolean => {
    if (!prev || out.endsWith('*/')) return false;
    if ('{};,:('.includes(prev) || '{};,)'.includes(next) || next === '}') return false;
    if (depth === 0 && ('>+~'.includes(prev) || '>+~!'.includes(next))) return false;
    return true;
  };
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      if (keepLicence && src[i + 2] === '!') { if (space && out) out += ' '; out += src.slice(i, stop); space = false; } else space = true;
      i = stop; continue;
    }
    if (c === '"' || c === "'") {
      if (space && needsSpace(out[out.length - 1], c)) out += ' ';
      space = false;
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      out += src.slice(i, Math.min(j + 1, n)); i = j + 1; continue;
    }
    if (/\s/.test(c)) { space = true; i++; continue; }
    if (space) { if (needsSpace(out[out.length - 1], c)) out += ' '; space = false; }
    if (c === '(') depth++; else if (c === ')') depth = Math.max(0, depth - 1);
    if (c === '}' && out.endsWith(';')) out = out.slice(0, -1);
    out += c; i++;
  }
  return out;
}

/* ---------------------------------- HTML --------------------------------- */

// Whitespace next to these is never visible, so it can go. Whitespace between inline tags (<b>, <a>, <span>) is kept as one space.
const BLOCKISH = new Set(('html head body title meta link base style script noscript template div p ul ol li dl dt dd table thead tbody tfoot tr td th caption colgroup col section article aside header footer nav main figure figcaption form fieldset legend h1 h2 h3 h4 h5 h6 blockquote hr br address details summary dialog option select optgroup').split(' '));
const RAW = new Set(['pre', 'textarea', 'script', 'style']);
const TAG = /<\/?[a-zA-Z][^\s/>]*(?:[^>"']|"[^"]*"|'[^']*')*>/y;

function tidyTag(tag: string): string {
  let out = '', q: string | null = null, space = false;
  for (const ch of tag) {
    if (q) { out += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { if (space) out += ' '; space = false; q = ch; out += ch; continue; }
    if (/\s/.test(ch)) { space = true; continue; }
    if (space && ch !== '>' && ch !== '/') out += ' ';
    else if (space && ch === '/' ) out += '';
    space = false; out += ch;
  }
  return out;
}

export function minifyHtml(src: string, opts: { comments: boolean; css: boolean }): string {
  let out = '', i = 0, prev: string | null = null, pending: string | null = null;
  const n = src.length;
  const flush = (next: string | null) => {
    if (pending === null) return;
    let t = pending.replace(/\s+/g, ' ');
    if (prev === null || BLOCKISH.has(prev)) t = t.trimStart();
    if (next === null || BLOCKISH.has(next)) t = t.trimEnd();
    out += t; pending = null;
  };
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt === -1) { pending = (pending ?? '') + src.slice(i); break; }
    if (lt > i) pending = (pending ?? '') + src.slice(i, lt);
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      const stop = end === -1 ? n : end + 3;
      const c = src.slice(lt, stop);
      if (!opts.comments || /^<!--(?:\[if|!)/i.test(c)) { flush(null); out += c; }
      i = stop; continue;
    }
    TAG.lastIndex = lt;
    const m = TAG.exec(src);
    if (!m) { pending = (pending ?? '') + '<'; i = lt + 1; continue; }
    const name = /^<\/?([a-zA-Z][^\s/>]*)/.exec(m[0])![1].toLowerCase();
    flush(name);
    out += tidyTag(m[0]).replace(/\s+(\/?>)$/, '$1');
    prev = name;
    i = lt + m[0].length;
    if (RAW.has(name) && !m[0].startsWith('</') && !m[0].endsWith('/>')) {
      const close = new RegExp(`</${name}\\s*>`, 'i');
      const rest = src.slice(i);
      const cm = close.exec(rest);
      const raw = cm ? rest.slice(0, cm.index) : rest;
      out += name === 'style' && opts.css ? minifyCss(raw) : raw;
      i += raw.length;
    }
  }
  flush(null);
  return out.trim();
}

/* ------------------------------ JS and JSON ------------------------------ */

export async function minify(lang: Lang, code: string, o: MinifyOptions): Promise<MinifyResult> {
  if (!code.trim()) return { ok: true, text: '' };
  try {
    if (lang === 'css') return { ok: true, text: minifyCss(code, o.keepLicence) };
    if (lang === 'html') return { ok: true, text: minifyHtml(code, { comments: o.htmlComments, css: true }) };
    if (lang === 'json') return { ok: true, text: JSON.stringify(JSON.parse(code)) };
    const { minify: terser } = await import('terser');
    const full = o.jsMode === 'full';
    const r = await terser(code, { compress: full ? {} : false, mangle: full, module: o.jsModule, format: { comments: o.keepLicence ? /^!|@license|@preserve|@cc_on/i : false } });
    return { ok: true, text: r.code ?? '' };
  } catch (e) {
    const err = e as { message?: string; line?: number; col?: number };
    let message = err.message ?? 'Could not read this code.';
    if (lang === 'js' && !o.jsModule && /\bawait\b/.test(code)) message += ' Top-level await only works in ES modules. Switch on "This is an ES module" in the options.';
    return { ok: false, message, line: err.line, column: err.col };
  }
}
