export type CaseId =
  | 'upper' | 'lower' | 'sentence' | 'title-ap' | 'title-chicago'
  | 'camel' | 'pascal' | 'snake' | 'constant' | 'kebab' | 'dot';

export const CASES: { id: CaseId; label: string; code?: boolean }[] = [
  { id: 'upper', label: 'UPPER CASE' },
  { id: 'lower', label: 'lower case' },
  { id: 'sentence', label: 'Sentence case' },
  { id: 'title-ap', label: 'Title Case (AP)' },
  { id: 'title-chicago', label: 'Title Case (Chicago)' },
  { id: 'camel', label: 'camelCase', code: true },
  { id: 'pascal', label: 'PascalCase', code: true },
  { id: 'snake', label: 'snake_case', code: true },
  { id: 'constant', label: 'CONSTANT_CASE', code: true },
  { id: 'kebab', label: 'kebab-case', code: true },
  { id: 'dot', label: 'dot.case', code: true },
];

const ARTICLES = new Set(['a', 'an', 'the']);
const CONJUNCTIONS = new Set(['and', 'but', 'for', 'nor', 'or', 'so', 'yet']);
// Prepositions of three letters or fewer: lowercase in both styles.
const SHORT_PREPS = new Set(['as', 'at', 'by', 'in', 'of', 'off', 'on', 'out', 'per', 'to', 'up', 'via']);
// Longer prepositions: AP capitalises them (4+ letters); Chicago keeps them lowercase.
const LONG_PREPS = new Set([
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'before', 'behind', 'below', 'beneath',
  'beside', 'between', 'beyond', 'during', 'except', 'from', 'inside', 'into', 'like', 'near', 'onto', 'over', 'past',
  'since', 'through', 'throughout', 'toward', 'under', 'until', 'upon', 'with', 'within', 'without',
]);

const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w);

/** Words for code-style cases. A custom delimiter regex replaces the default splitting entirely. */
export function splitWords(s: string, delimiter?: RegExp | null): string[] {
  if (delimiter) return s.split(delimiter).map((w) => w.trim()).filter(Boolean);
  return s
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function titleCase(s: string, style: 'ap' | 'chicago'): string {
  const hasLower = /\p{Ll}/u.test(s);
  const parts = s.split(/(\s+)/);
  const wordIdx = parts.map((p, i) => (/\S/.test(p) ? i : -1)).filter((i) => i >= 0);
  const first = wordIdx[0];
  const last = wordIdx[wordIdx.length - 1];
  let afterColon = false;

  return parts
    .map((part, i) => {
      if (!/\S/.test(part)) return part;
      const bare = part.toLowerCase().replace(/[^\p{L}']/gu, '');
      const isAcronym = hasLower && part.length > 1 && part === part.toUpperCase() && /\p{Lu}/u.test(part);
      const forceCap = i === first || i === last || afterColon;
      afterColon = /[:?!.]["')\]]*$/.test(part);

      const small =
        ARTICLES.has(bare) || CONJUNCTIONS.has(bare) || SHORT_PREPS.has(bare) || (style === 'chicago' && LONG_PREPS.has(bare));
      if (isAcronym) return part;
      if (small && !forceCap) return part.toLowerCase();
      // Capitalise each hyphenated piece: "well-known" -> "Well-Known"
      return part.split('-').map(cap).join('-');
    })
    .join('');
}

export function convertLine(line: string, id: CaseId, delimiter?: RegExp | null): string {
  switch (id) {
    case 'upper': return line.toUpperCase();
    case 'lower': return line.toLowerCase();
    case 'sentence':
      return line.toLowerCase().replace(/(^\s*\p{L})|([.!?]\s+\p{L})/gu, (m) => m.toUpperCase());
    case 'title-ap': return titleCase(line, 'ap');
    case 'title-chicago': return titleCase(line, 'chicago');
  }
  const w = splitWords(line, delimiter);
  switch (id) {
    case 'camel': return w.map((x, i) => (i === 0 ? x.toLowerCase() : cap(x))).join('');
    case 'pascal': return w.map(cap).join('');
    case 'snake': return w.map((x) => x.toLowerCase()).join('_');
    case 'constant': return w.map((x) => x.toUpperCase()).join('_');
    case 'kebab': return w.map((x) => x.toLowerCase()).join('-');
    case 'dot': return w.map((x) => x.toLowerCase()).join('.');
  }
}

/** Convert text. With perLine, every line is its own string, so a pasted list converts in one go. */
export function convert(text: string, id: CaseId, opts: { perLine: boolean; delimiter?: RegExp | null }): string {
  if (!opts.perLine) return convertLine(text, id, opts.delimiter);
  return text.split('\n').map((l) => convertLine(l, id, opts.delimiter)).join('\n');
}

export function parseDelimiter(src: string): { re: RegExp | null; error: string | null } {
  if (!src.trim()) return { re: null, error: null };
  try { return { re: new RegExp(src, 'g'), error: null }; }
  catch (e) { return { re: null, error: e instanceof Error ? e.message : 'Invalid expression' }; }
}
