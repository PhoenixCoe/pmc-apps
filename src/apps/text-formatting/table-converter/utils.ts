export type Delim = 'auto' | 'comma' | 'tab' | 'semicolon' | 'pipe' | 'spaces';
export type Align = 'left' | 'center' | 'right' | 'auto';

const SEP: Record<Exclude<Delim, 'auto' | 'spaces'>, string> = { comma: ',', tab: '\t', semicolon: ';', pipe: '|' };

export function detectDelimiter(text: string): Exclude<Delim, 'auto'> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 8);
  if (!lines.length) return 'comma';
  const score = (re: RegExp) => { const c = lines.map((l) => (l.match(re) ?? []).length); return c[0] > 0 && c.every((n) => n === c[0]) ? c[0] : c.reduce((a, b) => Math.min(a, b), Infinity) > 0 ? 0.5 : 0; };
  const cands: [Exclude<Delim, 'auto'>, number][] = [['tab', score(/\t/g)], ['pipe', score(/\|/g)], ['semicolon', score(/;/g)], ['comma', score(/,/g)]];
  cands.sort((a, b) => b[1] - a[1]);
  if (cands[0][1] > 0) return cands[0][0];
  return lines.some((l) => /\S {2,}\S/.test(l)) ? 'spaces' : 'comma';
}

/** CSV-style parser: quoted fields, escaped quotes and newlines inside quotes. */
function parseDelimited(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"' && cur === '') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export function parseTable(text: string, delim: Delim): { rows: string[][]; used: Exclude<Delim, 'auto'> } {
  const used = delim === 'auto' ? detectDelimiter(text) : delim;
  let rows: string[][];
  if (used === 'spaces') rows = text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.trim().split(/ {2,}|\t/));
  else if (used === 'pipe') rows = text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.trim().replace(/^\||\|$/g, '').split('|')).filter((r) => !r.every((c) => /^\s*:?-{2,}:?\s*$/.test(c)));
  else rows = parseDelimited(text, SEP[used]);
  rows = rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''));
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return { rows: rows.map((r) => [...r, ...Array(w - r.length).fill('')]), used };
}

const isNum = (s: string) => /^[-+]?[$£€]?\s?\d[\d,]*(\.\d+)?%?$/.test(s.trim());
export function columnAligns(rows: string[][], header: boolean, mode: Align): ('left' | 'center' | 'right')[] {
  const w = rows[0]?.length ?? 0;
  return Array.from({ length: w }, (_, c) => {
    if (mode !== 'auto') return mode;
    const body = rows.slice(header ? 1 : 0).map((r) => r[c]).filter((v) => v !== '');
    return body.length && body.every(isNum) ? 'right' : 'left';
  });
}

export function toMarkdown(rows: string[][], header: boolean, mode: Align): string {
  if (!rows.length) return '';
  const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
  const head = header ? rows[0] : rows[0].map((_, i) => `Column ${i + 1}`);
  const body = header ? rows.slice(1) : rows;
  const al = columnAligns(rows, header, mode);
  const all = [head, ...body].map((r) => r.map(esc));
  const widths = head.map((_, c) => Math.max(3, ...all.map((r) => [...r[c]].length)));
  const pad = (s: string, c: number) => {
    const gap = widths[c] - [...s].length;
    return al[c] === 'right' ? ' '.repeat(gap) + s : al[c] === 'center' ? ' '.repeat(Math.floor(gap / 2)) + s + ' '.repeat(Math.ceil(gap / 2)) : s + ' '.repeat(gap);
  };
  const line = (r: string[]) => `| ${r.map((s, c) => pad(s, c)).join(' | ')} |`;
  const rule = `| ${widths.map((w, c) => (al[c] === 'center' ? ':' + '-'.repeat(w - 2) + ':' : al[c] === 'right' ? '-'.repeat(w - 1) + ':' : '-'.repeat(w))).join(' | ')} |`;
  return [line(all[0]), rule, ...all.slice(1).map(line)].join('\n');
}

export function toHtml(rows: string[][], header: boolean, mode: Align, indent = 2): string {
  if (!rows.length) return '';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const al = columnAligns(rows, header, mode);
  const i1 = ' '.repeat(indent), i2 = i1 + i1, i3 = i2 + i1;
  const cell = (tag: string, v: string, c: number) => `${i3}<${tag}${al[c] !== 'left' ? ` style="text-align: ${al[c]}"` : ''}>${esc(v)}</${tag}>`;
  const tr = (r: string[], tag: string) => `${i2}<tr>\n${r.map((v, c) => cell(tag, v, c)).join('\n')}\n${i2}</tr>`;
  const body = header ? rows.slice(1) : rows;
  return ['<table>', header ? `${i1}<thead>\n${tr(rows[0], 'th')}\n${i1}</thead>` : '', `${i1}<tbody>`, body.map((r) => tr(r, 'td')).join('\n'), `${i1}</tbody>`, '</table>'].filter(Boolean).join('\n');
}

export function toLatex(rows: string[][], header: boolean, mode: Align, booktabs: boolean): string {
  if (!rows.length) return '';
  const map: Record<string, string> = { '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', $: '\\$', '#': '\\#', _: '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' };
  const esc = (s: string) => s.replace(/[\\&%$#_{}~^]/g, (m) => map[m]);
  const al = columnAligns(rows, header, mode);
  const spec = al.map((a) => a[0]).join(booktabs ? '' : '|');
  const row = (r: string[]) => `  ${r.map(esc).join(' & ')} \\\\`;
  const [top, mid, bot] = booktabs ? ['\\toprule', '\\midrule', '\\bottomrule'] : ['\\hline', '\\hline', '\\hline'];
  const out = [`\\begin{tabular}{${booktabs ? spec : `|${spec}|`}}`, `  ${top}`];
  if (header) out.push(row(rows[0]), `  ${mid}`);
  (header ? rows.slice(1) : rows).forEach((r) => { out.push(row(r)); if (!booktabs) out.push('  \\hline'); });
  if (booktabs) out.push(`  ${bot}`);
  out.push('\\end{tabular}');
  return out.join('\n');
}
