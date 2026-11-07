import { STOP_WORDS } from '../../../lib/stopwords';

const SPECIAL: Record<string, string> = {
  'ß': 'ss', 'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE', 'ø': 'o', 'Ø': 'O', 'đ': 'd', 'Đ': 'D', 'ð': 'd', 'Ð': 'D',
  'ł': 'l', 'Ł': 'L', 'þ': 'th', 'Þ': 'TH', 'ı': 'i', 'ħ': 'h', 'ŋ': 'ng', '&': ' and ', '@': ' at ', '€': ' euro ', '£': ' pound ', '$': ' dollar ', '%': ' percent ',
};
const GERMAN: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue' };
const GREEK: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
};
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
};

export interface SlugOptions {
  separator: '-' | '_';
  removeStopWords: boolean;
  /** 0 = no limit. Cuts at a word boundary, never mid-word. */
  maxLength: number;
  transliterate: boolean;
  germanUmlauts: boolean;
  extraStopWords: string[];
}

export const defaultSlugOptions: SlugOptions = { separator: '-', removeStopWords: false, maxLength: 60, transliterate: true, germanUmlauts: false, extraStopWords: [] };

/** Transliterate to plain ASCII: Latin accents, ligatures, Greek and Cyrillic. */
export function transliterate(s: string, german = false): string {
  let out = '';
  for (const ch of s) {
    const lower = ch.toLowerCase();
    const isUpper = ch !== lower;
    // Accented Greek/Cyrillic (ή, ά, ї...) fall back to their unaccented base letter.
    const base = lower.normalize('NFD').charAt(0);
    const script = GREEK[lower] ?? CYRILLIC[lower] ?? GREEK[base] ?? CYRILLIC[base];
    const direct = (german && GERMAN[ch]) || SPECIAL[ch];
    if (direct !== undefined) out += direct;
    else if (script !== undefined) out += isUpper ? script.charAt(0).toUpperCase() + script.slice(1) : script;
    else out += ch;
  }
  return out.normalize('NFKD').replace(/\p{M}+/gu, '');
}

export function slugify(input: string, o: SlugOptions): string {
  let s = o.transliterate ? transliterate(input, o.germanUmlauts) : input.normalize('NFC');
  s = s.toLowerCase().replace(/['’`]/g, '');
  let words = s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (o.removeStopWords) {
    const extra = new Set(o.extraStopWords.map((w) => w.toLowerCase()));
    const kept = words.filter((w) => !STOP_WORDS.has(w) && !extra.has(w));
    if (kept.length) words = kept; // never strip a title down to nothing
  }
  if (o.maxLength > 0) {
    const out: string[] = [];
    let len = 0;
    for (const w of words) {
      const add = (out.length ? 1 : 0) + w.length;
      if (len + add > o.maxLength) break;
      out.push(w); len += add;
    }
    if (!out.length && words[0]) out.push(words[0].slice(0, o.maxLength));
    words = out;
  }
  return words.join(o.separator);
}

export interface SeoCheck { label: string; level: 'good' | 'warn' | 'bad'; detail: string }

export function seoChecks(slug: string, sep: string): SeoCheck[] {
  const words = slug ? slug.split(sep).length : 0;
  const checks: SeoCheck[] = [];
  checks.push(
    !slug ? { label: 'Length', level: 'bad', detail: 'The slug is empty. Add some letters or numbers.' }
    : slug.length <= 60 ? { label: 'Length', level: 'good', detail: `${slug.length} characters. Fits comfortably in search results.` }
    : slug.length <= 75 ? { label: 'Length', level: 'warn', detail: `${slug.length} characters. Search engines may cut it off past about 60.` }
    : { label: 'Length', level: 'bad', detail: `${slug.length} characters. Shorten it to 60 or fewer.` },
  );
  checks.push(
    words === 0 ? { label: 'Word count', level: 'bad', detail: 'No words.' }
    : words <= 5 ? { label: 'Word count', level: 'good', detail: `${words} ${words === 1 ? 'word' : 'words'}. Short and readable.` }
    : words <= 8 ? { label: 'Word count', level: 'warn', detail: `${words} words. Aim for five or fewer.` }
    : { label: 'Word count', level: 'bad', detail: `${words} words. Trim it down to the key terms.` },
  );
  if (slug) {
    checks.push(/^\d+$/.test(slug) ? { label: 'Meaning', level: 'warn', detail: 'Only numbers. Add a word so the URL says what the page is.' } : { label: 'Meaning', level: 'good', detail: 'Contains words, not just numbers.' });
    checks.push(sep === '_' ? { label: 'Separator', level: 'warn', detail: 'Search engines read hyphens as word breaks, but not always underscores. Hyphens are safer.' } : { label: 'Separator', level: 'good', detail: 'Hyphens separate the words, which search engines read correctly.' });
  }
  return checks;
}
