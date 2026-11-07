export interface MatchInfo { index: number; text: string; groups: (string | undefined)[]; named: Record<string, string | undefined> | null }
export interface RegexResult { error: string | null; matches: MatchInfo[]; truncated: boolean; replaced: string | null }

/**
 * SELF-CONTAINED on purpose: it is serialised into a Web Worker, so it must not touch anything outside itself.
 */
export function matchAll(pattern: string, flags: string, text: string, max: number, replacement: string | null): RegexResult {
  const out: RegexResult = { error: null, matches: [], truncated: false, replaced: null };
  let re: RegExp;
  try { re = new RegExp(pattern, flags); } catch (e) { out.error = (e as Error).message; return out; }
  const push = (m: RegExpExecArray) => {
    out.matches.push({ index: m.index, text: m[0], groups: m.slice(1), named: m.groups ? Object.assign({}, m.groups) : null });
  };
  if (!re.global && !re.sticky) {
    const m = re.exec(text);
    if (m) push(m);
  } else {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      push(m);
      if (m[0] === '') re.lastIndex++;
      if (out.matches.length >= max) { out.truncated = true; break; }
      if (!re.global) break;
    }
  }
  if (replacement !== null) {
    try { out.replaced = text.replace(new RegExp(pattern, flags), replacement); } catch (e) { out.error = (e as Error).message; }
  }
  return out;
}

export type RunArgs = [pattern: string, flags: string, text: string, max: number, replacement: string | null];

/** Runs matchAll in a worker and kills it if it takes too long (catastrophic backtracking). */
export function runInWorker(args: RunArgs, timeoutMs = 1500): { promise: Promise<RegexResult | 'timeout'>; cancel: () => void } {
  const src = `self.onmessage=function(e){var a=e.data;var r=(${matchAll.toString()}).apply(null,a);self.postMessage(r);};`;
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  const worker = new Worker(url);
  let done = false;
  let timer: ReturnType<typeof setTimeout>;
  const finish = () => { done = true; clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); };
  const promise = new Promise<RegexResult | 'timeout'>((resolve) => {
    worker.onmessage = (e) => { if (!done) { finish(); resolve(e.data as RegexResult); } };
    worker.onerror = () => { if (!done) { finish(); resolve({ error: 'The pattern could not be run.', matches: [], truncated: false, replaced: null }); } };
    timer = setTimeout(() => { if (!done) { finish(); resolve('timeout'); } }, timeoutMs);
    worker.postMessage(args);
  });
  return { promise, cancel: () => { if (!done) finish(); } };
}

export interface Explained { token: string; meaning: string; depth: number }

const ESC: Record<string, string> = {
  d: 'any digit, 0 to 9', D: 'any character that is not a digit', w: 'any letter, digit or underscore', W: 'any character that is not a letter, digit or underscore',
  s: 'any whitespace (space, tab, line break)', S: 'any character that is not whitespace', b: 'a word boundary', B: 'a position that is not a word boundary',
  n: 'a line break', r: 'a carriage return', t: 'a tab', f: 'a form feed', v: 'a vertical tab', '0': 'a null character',
};

function describeClassBody(body: string): string {
  const parts: string[] = [];
  for (let i = 0; i < body.length; i++) {
    let c = body[i];
    if (c === '\\' && i + 1 < body.length) {
      const n = body[++i];
      parts.push(ESC[n] && n !== 'b' ? ESC[n] : n === 'b' ? 'a backspace' : `"${n}"`);
      continue;
    }
    if (body[i + 1] === '-' && i + 2 < body.length) { parts.push(`${c} to ${body[i + 2]}`); i += 2; continue; }
    parts.push(`"${c}"`);
  }
  return parts.join(', ');
}

/** Turns a pattern into plain-English steps. Covers the syntax people actually write. */
export function explainRegex(src: string): Explained[] {
  const out: Explained[] = [];
  let depth = 0, group = 0, i = 0;
  const add = (token: string, meaning: string, d = depth) => out.push({ token, meaning, depth: d });
  const quant = (): boolean => {
    const m = /^(\*|\+|\?|\{\d+(?:,\d*)?\})(\?)?/.exec(src.slice(i));
    if (!m) return false;
    const q = m[1], lazy = !!m[2];
    let what = q === '*' ? 'zero or more times' : q === '+' ? 'one or more times' : q === '?' ? 'optional (zero or one time)' : '';
    if (!what) { const [lo, hi] = q.slice(1, -1).split(','); what = hi === undefined ? `exactly ${lo} times` : hi === '' ? `${lo} or more times` : `between ${lo} and ${hi} times`; }
    add(m[0], `${what}${lazy ? ', as few as possible (lazy)' : ''}`);
    i += m[0].length;
    return true;
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const n = src[i + 1] ?? '';
      if (n === 'p' || n === 'P') {
        const m = /^\\[pP]\{([^}]*)\}/.exec(src.slice(i));
        if (m) { add(m[0], `any character ${n === 'P' ? 'without' : 'with'} the Unicode property ${m[1]}`); i += m[0].length; continue; }
      }
      if (n === 'k') { const m = /^\\k<([^>]*)>/.exec(src.slice(i)); if (m) { add(m[0], `the same text the group named "${m[1]}" matched`); i += m[0].length; continue; } }
      if (/[1-9]/.test(n)) { add(`\\${n}`, `the same text as group ${n}`); i += 2; continue; }
      if (n === 'x') { const m = /^\\x[0-9a-fA-F]{2}/.exec(src.slice(i)); if (m) { add(m[0], `the character with hex code ${m[0].slice(2)}`); i += 4; continue; } }
      if (n === 'u') { const m = /^\\u(?:\{[0-9a-fA-F]+\}|[0-9a-fA-F]{4})/.exec(src.slice(i)); if (m) { add(m[0], `the Unicode character ${m[0].slice(2)}`); i += m[0].length; continue; } }
      add(`\\${n}`, ESC[n] ? ESC[n] : `the literal character "${n}"`);
      i += 2; continue;
    }
    if (c === '[') {
      let j = i + 1;
      const neg = src[j] === '^';
      if (neg) j++;
      const start = j;
      if (src[j] === ']') j++;
      while (j < src.length && src[j] !== ']') { if (src[j] === '\\') j++; j++; }
      const body = src.slice(start, j);
      add(src.slice(i, j + 1), `${neg ? 'any one character except' : 'any one of'}: ${describeClassBody(body)}`);
      i = j + 1; continue;
    }
    if (c === '(') {
      const m = /^\((\?:|\?=|\?!|\?<=|\?<!|\?<([A-Za-z_]\w*)>)?/.exec(src.slice(i))!;
      const kind = m[1];
      let meaning: string;
      if (!kind) { group++; meaning = `start of capture group ${group}`; }
      else if (kind === '?:') meaning = 'start of a group that does not capture';
      else if (kind === '?=') meaning = 'start of a lookahead: what follows must match, without using it up';
      else if (kind === '?!') meaning = 'start of a negative lookahead: what follows must not match';
      else if (kind === '?<=') meaning = 'start of a lookbehind: what comes before must match';
      else if (kind === '?<!') meaning = 'start of a negative lookbehind: what comes before must not match';
      else { group++; meaning = `start of capture group ${group}, named "${m[2]}"`; }
      add(m[0], meaning);
      depth++; i += m[0].length; continue;
    }
    if (c === ')') { depth = Math.max(0, depth - 1); add(')', 'end of group'); i++; if (!quant()) { /* none */ } continue; }
    if (c === '|') { add('|', 'or'); i++; continue; }
    if (c === '^') { add('^', 'the start of the text (or of each line with the m flag)'); i++; continue; }
    if (c === '$') { add('$', 'the end of the text (or of each line with the m flag)'); i++; continue; }
    if (c === '.') { add('.', 'any character except a line break (including line breaks with the s flag)'); i++; quant(); continue; }
    if (quant()) continue;
    // run of plain literal characters
    let j = i; while (j < src.length && !'\\[(|)^$.*+?{'.includes(src[j])) j++;
    if (j === i) j = i + 1;
    // a quantifier binds to the last character only, so split it off
    const lit = src.slice(i, j);
    if (/^[*+?{]/.test(src.slice(j)) && lit.length > 1) { add(lit.slice(0, -1), `the text "${lit.slice(0, -1)}"`); i = j - 1; continue; }
    add(lit, lit === ' ' ? 'a space' : `the text "${lit}"`);
    i = j;
  }
  // the loop above attaches quantifiers to groups and classes through quant() calls placed after them
  return out;
}
