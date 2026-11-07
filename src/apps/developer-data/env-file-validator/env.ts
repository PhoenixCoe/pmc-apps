export interface Entry { line: number; key: string; value: string; raw: string; quoted: '' | '"' | "'"; comment: string; exported: boolean }
export interface Issue { line: number; level: 'error' | 'warn'; text: string }
export interface Parsed { entries: Entry[]; issues: Issue[]; other: { line: number; text: string }[] }

export function parseEnv(src: string): Parsed {
  const lines = src.replace(/\r\n?/g, '\n').split('\n'), entries: Entry[] = [], issues: Issue[] = [], other: Parsed['other'] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], t = raw.trim(), n = i + 1;
    if (!t || t.startsWith('#')) { other.push({ line: n, text: raw }); continue; }
    const m = /^(export\s+)?([^=\s]*)(\s*)=(\s*)(.*)$/.exec(t);
    if (!m) { issues.push({ line: n, level: 'error', text: 'This line has no = sign.' }); continue; }
    const [, ex, key, sp1, sp2, rest] = m;
    if (!key) { issues.push({ line: n, level: 'error', text: 'There is no name before the = sign.' }); continue; }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) issues.push({ line: n, level: /^[0-9]/.test(key) ? 'error' : 'warn', text: `“${key}” is not a usual name. Use letters, numbers and underscores, and do not start with a number.` });
    else if (key !== key.toUpperCase()) issues.push({ line: n, level: 'warn', text: `“${key}” is not in CAPITALS. Most tools expect capitals.` });
    if (sp1 || sp2) issues.push({ line: n, level: 'warn', text: 'There are spaces around the = sign. Some tools read them as part of the name or value.' });
    let value = rest, quoted: Entry['quoted'] = '', comment = '';
    if (rest[0] === '"' || rest[0] === "'") {
      const q = rest[0] as '"' | "'", end = rest.indexOf(q, 1);
      if (end < 0) { issues.push({ line: n, level: 'error', text: `The ${q} quote is never closed.` }); value = rest.slice(1); quoted = q; }
      else { quoted = q; value = rest.slice(1, end); const after = rest.slice(end + 1).trim(); if (after.startsWith('#')) comment = after; else if (after) issues.push({ line: n, level: 'error', text: 'There is extra text after the closing quote.' }); }
    } else { const h = rest.search(/\s#/); if (h >= 0) { comment = rest.slice(h).trim(); value = rest.slice(0, h).trim(); } if (/\s/.test(value)) issues.push({ line: n, level: 'warn', text: 'The value has spaces but no quotes. Put it in quotes.' }); }
    if (value === '') issues.push({ line: n, level: 'warn', text: `${key} has no value.` });
    entries.push({ line: n, key, value, raw, quoted, comment, exported: !!ex });
  }
  const seen = new Map<string, number>();
  for (const e of entries) { const f = seen.get(e.key); if (f) issues.push({ line: e.line, level: 'warn', text: `${e.key} is already set on line ${f}. The later one wins in most tools.` }); else seen.set(e.key, e.line); }
  return { entries, issues: issues.sort((a, b) => a.line - b.line), other };
}

const fmt = (e: Entry) => `${e.exported ? 'export ' : ''}${e.key}=${e.quoted || /[\s#"'$`\\]/.test(e.value) ? `"${e.value.replace(/"/g, '\\"')}"` : e.value}${e.comment ? ` ${e.comment}` : ''}`;
export function tidy(src: string, o: { dedupe: boolean; sort: boolean; trim: boolean }): string {
  const p = parseEnv(src); let list = p.entries;
  if (o.dedupe) { const last = new Map(list.map((e) => [e.key, e])); list = list.filter((e) => last.get(e.key) === e); }
  if (o.sort) list = [...list].sort((a, b) => a.key.localeCompare(b.key));
  const body = list.map(fmt).join('\n');
  return o.sort ? body + '\n' : (() => { const keep = new Set(list), out: string[] = []; const lines = src.replace(/\r\n?/g, '\n').split('\n'); const byLine = new Map(p.entries.map((e) => [e.line, e])); lines.forEach((l, i) => { const e = byLine.get(i + 1); if (e) { if (keep.has(e)) out.push(fmt(e)); } else out.push(o.trim ? l.trimEnd() : l); }); return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n'); })();
}
