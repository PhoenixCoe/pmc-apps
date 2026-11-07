import { diffArrays, diffChars, diffWordsWithSpace, createTwoFilesPatch } from 'diff';

export interface Seg { t: string; hl?: boolean }
export interface Cell { n: number; segs: Seg[] }
export interface Row { kind: 'same' | 'del' | 'add' | 'mod'; l?: Cell; r?: Cell }
export interface DiffOptions { ignoreWhitespace?: boolean; ignoreCase?: boolean }
export type DiffMode = 'lines' | 'words' | 'chars';

const nl = (s: string) => (s && !s.endsWith('\n') ? s + '\n' : s);

const toLines = (s: string) => { if (!s) return []; const p = s.split(/\r?\n/); if (p[p.length - 1] === '') p.pop(); return p; };

/** Line diff as side-by-side rows. Replaced blocks are paired so edits sit level, with word-level highlights inside. */
export function lineRows(a: string, b: string, opts: DiffOptions = {}): Row[] {
  const A = toLines(a), B = toLines(b);
  const norm = (x: string) => {
    let y = x;
    if (opts.ignoreWhitespace) y = y.replace(/\s+/g, ' ').trim();
    if (opts.ignoreCase) y = y.toLowerCase();
    return y;
  };
  const changes = diffArrays(A, B, { comparator: (l: string, r: string) => norm(l) === norm(r) });
  const rows: Row[] = [];
  let li = 0, ri = 0; // indexes into A and B, so each side always shows its own text
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    if (!c.added && !c.removed) {
      for (let k = 0; k < c.count; k++) {
        rows.push({ kind: 'same', l: { n: li + 1, segs: [{ t: A[li] }] }, r: { n: ri + 1, segs: [{ t: B[ri] }] } });
        li++; ri++;
      }
    } else if (c.removed) {
      const next = changes[i + 1];
      const nDel = c.count;
      const nAdd = next?.added ? next.count : 0;
      if (next?.added) i++;
      for (let k = 0; k < Math.max(nDel, nAdd); k++) {
        if (k < nDel && k < nAdd) {
          const w = diffWordsWithSpace(A[li], B[ri]);
          rows.push({
            kind: 'mod',
            l: { n: li + 1, segs: w.filter((p) => !p.added).map((p) => ({ t: p.value, hl: p.removed })) },
            r: { n: ri + 1, segs: w.filter((p) => !p.removed).map((p) => ({ t: p.value, hl: p.added })) },
          });
          li++; ri++;
        } else if (k < nDel) { rows.push({ kind: 'del', l: { n: li + 1, segs: [{ t: A[li], hl: true }] } }); li++; }
        else { rows.push({ kind: 'add', r: { n: ri + 1, segs: [{ t: B[ri], hl: true }] } }); ri++; }
      }
    } else {
      for (let k = 0; k < c.count; k++) { rows.push({ kind: 'add', r: { n: ri + 1, segs: [{ t: B[ri], hl: true }] } }); ri++; }
    }
  }
  return rows;
}

/** Word or character diff as two inline panes: removals marked on the left, additions on the right. */
export function inlineSegments(a: string, b: string, mode: 'words' | 'chars', opts: DiffOptions = {}) {
  const parts = mode === 'words'
    ? diffWordsWithSpace(a, b, { ignoreCase: opts.ignoreCase })
    : diffChars(a, b, { ignoreCase: opts.ignoreCase });
  return {
    left: parts.filter((p) => !p.added).map((p) => ({ t: p.value, hl: p.removed })) as Seg[],
    right: parts.filter((p) => !p.removed).map((p) => ({ t: p.value, hl: p.added })) as Seg[],
  };
}

export function rowStats(rows: Row[]) {
  let added = 0, removed = 0, changed = 0;
  for (const r of rows) {
    if (r.kind === 'add') added++;
    else if (r.kind === 'del') removed++;
    else if (r.kind === 'mod') changed++;
  }
  return { added, removed, changed, identical: added + removed + changed === 0 };
}

export function makePatch(a: string, b: string, oldName = 'original.txt', newName = 'modified.txt') {
  return createTwoFilesPatch(oldName, newName, nl(a), nl(b), '', '', { context: 3 });
}
