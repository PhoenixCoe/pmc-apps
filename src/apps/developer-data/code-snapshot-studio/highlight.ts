export type Tok = { t: 'kw' | 'str' | 'com' | 'num' | 'fn' | 'pun' | 'txt' | 'type'; v: string };
const JS = 'abstract async await break case catch class const continue debugger default delete do else enum export extends false finally for from function get if implements import in instanceof interface let new null of private protected public readonly return set static super switch this throw true try type typeof undefined var void while with yield as'.split(' ');
const PY = 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield self print'.split(' ');
const SQL = 'select from where and or not insert into values update set delete create table alter drop index join left right inner outer on group by order having limit offset as distinct union all null is in like between primary key foreign references default count sum avg min max case when then else end'.split(' ');
const SH = 'if then else fi for do done while case esac function in echo cd ls cat grep sudo export return exit npm git curl'.split(' ');
const GO = 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var nil true false'.split(' ');
const RUST = 'as break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while async await dyn'.split(' ');
const C = 'auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while class public private protected namespace using new delete template this true false nullptr include define string bool'.split(' ');
export const LANGS: Record<string, { name: string; kw: string[]; line: string[]; block?: [string, string]; ci?: boolean }> = {
  js: { name: 'JavaScript', kw: JS, line: ['//'], block: ['/*', '*/'] }, ts: { name: 'TypeScript', kw: JS, line: ['//'], block: ['/*', '*/'] },
  python: { name: 'Python', kw: PY, line: ['#'] }, sql: { name: 'SQL', kw: SQL, line: ['--'], block: ['/*', '*/'], ci: true }, bash: { name: 'Shell', kw: SH, line: ['#'] },
  go: { name: 'Go', kw: GO, line: ['//'], block: ['/*', '*/'] }, rust: { name: 'Rust', kw: RUST, line: ['//'], block: ['/*', '*/'] }, c: { name: 'C, C++, Java, C#', kw: C, line: ['//'], block: ['/*', '*/'] },
  css: { name: 'CSS', kw: [], line: [], block: ['/*', '*/'] }, html: { name: 'HTML', kw: [], line: [], block: ['<!--', '-->'] }, json: { name: 'JSON', kw: ['true', 'false', 'null'], line: [] }, text: { name: 'Plain text', kw: [], line: [] },
};

export function highlight(code: string, lang: string): Tok[][] {
  const L = LANGS[lang] ?? LANGS.text, kw = new Set(L.ci ? L.kw : L.kw), lines: Tok[][] = [[]];
  const push = (t: Tok['t'], v: string) => { const parts = v.split('\n'); parts.forEach((p, i) => { if (i) lines.push([]); if (p) lines[lines.length - 1].push({ t, v: p }); }); };
  let i = 0; const s = code;
  while (i < s.length) {
    const rest = s.slice(i);
    if (L.block && rest.startsWith(L.block[0])) { const e = s.indexOf(L.block[1], i + L.block[0].length); const end = e < 0 ? s.length : e + L.block[1].length; push('com', s.slice(i, end)); i = end; continue; }
    const lc = L.line.find((l) => rest.startsWith(l)); if (lc) { let e = s.indexOf('\n', i); if (e < 0) e = s.length; push('com', s.slice(i, e)); i = e; continue; }
    if (lang === 'html' && s[i] === '<') { const m = /^<\/?[A-Za-z][^\s>/]*/.exec(rest); if (m) { push('pun', '<' + (m[0][1] === '/' ? '/' : '')); push('kw', m[0].replace(/^<\/?/, '')); i += m[0].length; continue; } }
    if (s[i] === '"' || s[i] === "'" || (s[i] === '`' && lang !== 'sql' && lang !== 'bash')) { const q = s[i]; let j = i + 1; while (j < s.length && s[j] !== q && !(s[j] === '\n' && q !== '`')) { if (s[j] === '\\') j++; j++; } push('str', s.slice(i, Math.min(s.length, j + 1))); i = j + 1; continue; }
    const num = /^(0x[0-9a-fA-F]+|\d+\.?\d*(e[+-]?\d+)?)/.exec(rest); if (num && !/\w/.test(s[i - 1] ?? '')) { push('num', num[0]); i += num[0].length; continue; }
    const id = /^[A-Za-z_$][\w$-]*/.exec(rest);
    if (id) {
      const w = id[0], key = L.ci ? w.toLowerCase() : w, next = s.slice(i + w.length).match(/^\s*(\()/);
      if (lang === 'css' && /^[a-z-]+$/.test(w) && /^\s*:/.test(s.slice(i + w.length))) push('kw', w);
      else if (kw.has(key)) push('kw', w); else if (next) push('fn', w); else if (/^[A-Z]/.test(w) && lang !== 'json') push('type', w); else push('txt', w);
      i += w.length; continue;
    }
    push(/[{}()[\];:,.<>=+\-*/%!&|?^~]/.test(s[i]) ? 'pun' : 'txt', s[i]); i++;
  }
  return lines;
}
export function guess(code: string): string {
  if (/^\s*[{[]/.test(code) && /":/.test(code)) return 'json'; if (/<\/?[a-z][\s\S]*>/i.test(code) && /<(div|html|body|p|span|head)/i.test(code)) return 'html';
  if (/\bdef \w+\(|^\s*import \w+$|print\(/m.test(code)) return 'python'; if (/\b(SELECT|INSERT|CREATE TABLE)\b/i.test(code)) return 'sql'; if (/^#!/.test(code) || /^\$ /m.test(code)) return 'bash';
  if (/\bfn \w+|let mut |println!/.test(code)) return 'rust'; if (/\bfunc \w+\(|package main/.test(code)) return 'go'; if (/[a-z-]+\s*:\s*[^;]+;/.test(code) && /\{/.test(code) && !/function|=>/.test(code)) return 'css';
  if (/: (string|number|boolean)\b|interface \w+|<\w+>\(/.test(code)) return 'ts'; return 'js';
}
