import { jsonrepair } from 'jsonrepair';

export interface JsonError { message: string; line: number; column: number }
export type ParseResult = { ok: true; value: unknown } | { ok: false; error: JsonError };

const lineCol = (text: string, pos: number) => {
  const before = text.slice(0, Math.max(0, pos));
  const lines = before.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
};

/** Strict JSON scanner that returns the offset of the first error. Browsers word (and place) errors differently, so we find it ourselves. */
function firstErrorIndex(s: string): number | null {
  let i = 0;
  const ws = () => { while (i < s.length && ' \t\n\r'.includes(s[i])) i++; };
  const fail = (): never => { throw i; };
  const str = () => {
    i++;
    for (;;) {
      if (i >= s.length) fail();
      const c = s[i];
      if (c === '"') { i++; return; }
      if (c === '\\') {
        const n = s[i + 1];
        if (n === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6))) { i += 2; fail(); } i += 6; }
        else if (n !== undefined && '"\\/bfnrt'.includes(n)) i += 2;
        else { i += 1; fail(); }
      } else if (c < ' ') fail();
      else i++;
    }
  };
  const num = () => { const re = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y; re.lastIndex = i; const m = re.exec(s); if (!m) fail(); i += m![0].length; };
  const value = (): void => {
    ws();
    const c = s[i];
    if (c === '{') {
      i++; ws();
      if (s[i] === '}') { i++; return; }
      for (;;) {
        ws(); if (s[i] !== '"') fail();
        str(); ws(); if (s[i] !== ':') fail();
        i++; value(); ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === '}') { i++; return; }
        fail();
      }
    } else if (c === '[') {
      i++; ws();
      if (s[i] === ']') { i++; return; }
      for (;;) {
        value(); ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === ']') { i++; return; }
        fail();
      }
    } else if (c === '"') str();
    else if (c !== undefined && /[-\d]/.test(c)) num();
    else if (s.startsWith('true', i)) i += 4;
    else if (s.startsWith('false', i)) i += 5;
    else if (s.startsWith('null', i)) i += 4;
    else fail();
  };
  try { value(); ws(); if (i < s.length) fail(); return null; }
  catch (e) { return typeof e === 'number' ? e : null; }
}

export function parseJson(text: string): ParseResult {
  try { return { ok: true, value: JSON.parse(text) }; }
  catch (e) {
    const raw = e instanceof Error ? e.message : 'Invalid JSON';
    const at = firstErrorIndex(text);
    const { line, column } = lineCol(text, at ?? text.length);
    const message = raw
      .replace(/,? ".*" is not valid JSON$/s, '')
      .replace(/ in JSON at position \d+.*$/s, '')
      .replace(/\s*\(line \d+ column \d+\)/, '')
      .replace(/^JSON\.parse: /, '');
    return { ok: false, error: { message, line, column } };
  }
}

export function repairJson(text: string): { ok: true; text: string } | { ok: false; message: string } {
  try { return { ok: true, text: jsonrepair(text) }; }
  catch (e) { return { ok: false, message: e instanceof Error ? e.message.replace(/ at position \d+/, '') : 'Could not repair this input' }; }
}

export const sortKeys = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a, b) => a.localeCompare(b)).map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]))
  : v;

export type Indent = '2' | '4' | 'tab' | 'min';
export const stringify = (v: unknown, indent: Indent) => JSON.stringify(v, null, indent === 'min' ? 0 : indent === 'tab' ? '\t' : Number(indent));

export function stats(v: unknown): { keys: number; depth: number; values: number } {
  let keys = 0, values = 0, depth = 0;
  const walk = (x: unknown, d: number) => {
    depth = Math.max(depth, d);
    if (Array.isArray(x)) x.forEach((i) => walk(i, d + 1));
    else if (x && typeof x === 'object') for (const [, val] of Object.entries(x)) { keys++; walk(val, d + 1); }
    else values++;
  };
  walk(v, 0);
  return { keys, depth, values };
}
