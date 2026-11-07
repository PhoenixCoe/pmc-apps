export interface PyIssue { line: number; message: string }
export interface PyOptions { useTabs: boolean; tabWidth: number }

const OPEN: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSE = new Set([')', ']', '}']);
// `match` and `case` are left out on purpose: they are ordinary names unless used as soft keywords.
const COMPOUND = /^(?:async\s+)?(?:def|class|if|elif|else|for|while|try|except|finally|with)\b(?!\s*[=.,)\]])/;

const widthOf = (ws: string) => { let w = 0; for (const ch of ws) w = ch === '\t' ? (Math.floor(w / 8) + 1) * 8 : w + 1; return w; };

type Kind = 'blank' | 'comment' | 'code' | 'cont' | 'string';
interface Line { raw: string; kind: Kind; indent: string; body: string; owner: number; endsInTriple: boolean }
interface Logical { first: number; compound: boolean; hasColon: boolean; lastCode: string; level: number }

/**
 * Tidies Python (indentation, trailing spaces, blank lines, end of file) and flags common syntax mistakes.
 * It is not a full parser and does not re-wrap code the way Black does.
 */
export function formatPython(src: string, o: PyOptions): { text: string; issues: PyIssue[] } {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const issues: PyIssue[] = [];
  const info: Line[] = [];
  const logicals: Logical[] = [];
  const brackets: { ch: string; line: number }[] = [];
  let triple: string | null = null, tripleStart = 0, backslash = false;

  lines.forEach((raw, n) => {
    const indent = /^[ \t]*/.exec(raw)![0];
    const body = raw.slice(indent.length);
    const startedInString = triple !== null;
    const continued = brackets.length > 0 || backslash;
    let kind: Kind;
    if (startedInString) kind = 'string';
    else if (continued) kind = 'cont';
    else if (body === '') kind = 'blank';
    else if (body.startsWith('#')) kind = 'comment';
    else {
      kind = 'code';
      logicals.push({ first: n, compound: COMPOUND.test(body), hasColon: false, lastCode: '', level: 0 });
      if (indent.includes(' ') && indent.includes('\t')) issues.push({ line: n + 1, message: 'Tabs and spaces are mixed in this line\u2019s indentation.' });
    }
    backslash = false;
    const lg = logicals[logicals.length - 1];
    let hitComment = false;

    if (kind !== 'blank' && kind !== 'comment' && lg) {
      let i = kind === 'code' ? indent.length : 0;
      if (triple) {
        const end = raw.indexOf(triple, 0);
        if (end === -1) i = raw.length;
        else { i = end + 3; triple = null; lg.lastCode = '"'; }
      }
      while (i < raw.length) {
        const c = raw[i];
        if (c === '#') { hitComment = true; break; }
        if (c === '"' || c === "'") {
          const q3 = c.repeat(3);
          if (raw.startsWith(q3, i)) {
            const end = raw.indexOf(q3, i + 3);
            if (end === -1) { triple = q3; tripleStart = n + 1; i = raw.length; break; }
            i = end + 3; lg.lastCode = c; continue;
          }
          let j = i + 1, closed = false;
          while (j < raw.length) { if (raw[j] === '\\') { j += 2; continue; } if (raw[j] === c) { closed = true; break; } j++; }
          if (!closed) { issues.push({ line: n + 1, message: 'This string is never closed.' }); i = raw.length; break; }
          i = j + 1; lg.lastCode = c; continue;
        }
        if (OPEN[c]) brackets.push({ ch: c, line: n + 1 });
        else if (CLOSE.has(c)) {
          const top = brackets.pop();
          if (!top) issues.push({ line: n + 1, message: `Unexpected "${c}" with no matching opening bracket.` });
          else if (OPEN[top.ch] !== c) issues.push({ line: n + 1, message: `"${c}" does not match the "${top.ch}" opened on line ${top.line}.` });
        } else if (c === ':' && brackets.length === 0 && raw[i + 1] !== '=') lg.hasColon = true;
        if (!/\s/.test(c)) lg.lastCode = c;
        i++;
      }
      if (!triple && !hitComment && /\\\s*$/.test(raw)) backslash = true;
    }
    info.push({ raw, kind, indent, body, owner: kind === 'blank' || kind === 'comment' ? -1 : logicals.length - 1, endsInTriple: triple !== null });
  });

  if (triple) issues.push({ line: tripleStart, message: 'This triple-quoted string is never closed.' });
  for (const b of brackets) issues.push({ line: b.line, message: `The "${b.ch}" opened here is never closed.` });

  // Block structure: indentation stack in the same way Python reads it.
  const stack = [0];
  logicals.forEach((lg, k) => {
    const w = widthOf(info[lg.first].indent);
    const prev = logicals[k - 1];
    const top = () => stack[stack.length - 1];
    if (lg.compound && !lg.hasColon) issues.push({ line: lg.first + 1, message: 'This line needs a ":" at the end.' });
    if (w > top()) {
      // A compound line missing its colon already has an error; don't pile a second one on the block under it.
      const opensBlock = prev && (prev.lastCode === ':' || (prev.compound && !prev.hasColon));
      if (!opensBlock) issues.push({ line: lg.first + 1, message: 'Unexpected indent. Nothing above opens a block.' });
      stack.push(w);
    } else if (w < top()) {
      while (stack.length > 1 && top() > w) stack.pop();
      if (top() !== w) { issues.push({ line: lg.first + 1, message: 'Unindent does not match any outer indentation level.' }); stack.push(w); }
    } else if (prev && prev.lastCode === ':') {
      issues.push({ line: lg.first + 1, message: 'Expected an indented block after the line above.' });
    }
    lg.level = stack.length - 1;
  });

  // Rewrite.
  const unit = o.useTabs ? '\t' : ' '.repeat(o.tabWidth);
  const out: { text: string; kind: Kind; level: number }[] = [];
  info.forEach((l, n) => {
    if (l.kind === 'blank') { out.push({ text: '', kind: 'blank', level: 0 }); return; }
    if (l.kind === 'string') { out.push({ text: l.endsInTriple ? l.raw : l.raw.trimEnd(), kind: 'string', level: 0 }); return; }
    if (l.kind === 'comment') {
      const cw = widthOf(l.indent);
      const prev = [...logicals].reverse().find((g) => g.first < n);
      const next = logicals.find((g) => g.first > n);
      const cands = [prev, next].filter((g): g is Logical => !!g).map((g) => ({ w: widthOf(info[g.first].indent), level: g.level })).filter((c) => c.w <= cw);
      const level = cands.length ? cands.sort((a, b) => b.w - a.w)[0].level : (next ?? prev)?.level ?? 0;
      out.push({ text: unit.repeat(level) + l.body.trimEnd(), kind: 'comment', level });
      return;
    }
    const lg = logicals[l.owner];
    if (l.kind === 'code') {
      out.push({ text: unit.repeat(lg.level) + (l.endsInTriple ? l.body : l.body.trimEnd()), kind: 'code', level: lg.level });
      return;
    }
    const rel = Math.max(0, widthOf(l.indent) - widthOf(info[lg.first].indent));
    const text = l.body === '' ? '' : unit.repeat(lg.level) + ' '.repeat(rel) + (l.endsInTriple ? l.body : l.body.trimEnd());
    out.push({ text, kind: 'cont', level: lg.level });
  });

  // Blank lines: none at the very top, at most two in a row, and at most one before an indented line.
  const final: string[] = [];
  let blanks = 0;
  out.forEach((l, i) => {
    if (l.kind === 'blank') { blanks++; return; }
    if (final.length) {
      const nextIndented = (l.kind === 'code' || l.kind === 'comment') && l.level > 0;
      final.push(...Array(Math.min(blanks, nextIndented ? 1 : 2)).fill(''));
    }
    blanks = 0;
    final.push(l.text);
    void i;
  });
  return { text: final.length ? final.join('\n') + '\n' : '', issues: issues.sort((a, b) => a.line - b.line) };
}
