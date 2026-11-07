export type Keep = 'first' | 'last';
export type Sort = 'none' | 'az' | 'za' | 'length' | 'frequency';
export type Mode = 'dedupe' | 'unique-only' | 'duplicates-only';

export interface CleanOptions {
  trim: boolean;
  collapseSpaces: boolean;
  removeEmpty: boolean;
  caseSensitive: boolean;
  mode: Mode;
  keep: Keep;
  sort: Sort;
}

export const defaultCleanOptions: CleanOptions = { trim: true, collapseSpaces: false, removeEmpty: true, caseSensitive: false, mode: 'dedupe', keep: 'first', sort: 'none' };

export interface FreqRow { item: string; count: number }
export interface CleanResult { output: string; lines: string[]; before: number; after: number; emptyRemoved: number; duplicatesRemoved: number; frequency: FreqRow[] }

export function cleanList(text: string, o: CleanOptions): CleanResult {
  let items = text === '' ? [] : text.split(/\r?\n/);
  const before = items.length;
  items = items.map((l) => {
    let x = l;
    if (o.trim) x = x.trim();
    if (o.collapseSpaces) x = x.replace(/\s+/g, ' ');
    return x;
  });
  let emptyRemoved = 0;
  if (o.removeEmpty) { const n = items.length; items = items.filter((l) => l.trim() !== ''); emptyRemoved = n - items.length; }

  const key = (s: string) => (o.caseSensitive ? s : s.toLowerCase());
  const counts = new Map<string, { item: string; count: number; firstIdx: number; lastIdx: number }>();
  items.forEach((s, i) => {
    const k = key(s);
    const e = counts.get(k);
    if (e) { e.count++; e.lastIdx = i; } else counts.set(k, { item: s, count: 1, firstIdx: i, lastIdx: i });
  });
  const frequency = [...counts.values()].sort((a, b) => b.count - a.count || a.item.localeCompare(b.item)).map(({ item, count }) => ({ item, count }));

  let kept: { item: string; count: number; idx: number }[];
  if (o.mode === 'dedupe') {
    kept = [...counts.values()].map((e) => ({ item: o.keep === 'first' ? e.item : items[e.lastIdx], count: e.count, idx: o.keep === 'first' ? e.firstIdx : e.lastIdx }));
  } else if (o.mode === 'unique-only') {
    kept = [...counts.values()].filter((e) => e.count === 1).map((e) => ({ item: e.item, count: 1, idx: e.firstIdx }));
  } else {
    kept = [...counts.values()].filter((e) => e.count > 1).map((e) => ({ item: e.item, count: e.count, idx: e.firstIdx }));
  }
  kept.sort((a, b) => a.idx - b.idx);
  const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  if (o.sort === 'az') kept.sort((a, b) => cmp(a.item, b.item));
  else if (o.sort === 'za') kept.sort((a, b) => cmp(b.item, a.item));
  else if (o.sort === 'length') kept.sort((a, b) => a.item.length - b.item.length || cmp(a.item, b.item));
  else if (o.sort === 'frequency') kept.sort((a, b) => b.count - a.count || a.idx - b.idx);

  const lines = kept.map((k) => k.item);
  return { output: lines.join('\n'), lines, before, after: lines.length, emptyRemoved, duplicatesRemoved: items.length - counts.size, frequency };
}
