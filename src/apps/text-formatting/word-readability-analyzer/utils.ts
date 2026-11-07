import { STOP_WORDS } from '../../../lib/stopwords';

export const wordsOf = (t: string) => t.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];

/** English syllable estimate: vowel groups, minus silent trailing e. Good to about 85% of words. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 1;
  if (w.length <= 3) return 1;
  const s = w.replace(/(?:[^laeiouy]es|[^aeiouyt]ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const runs = s.match(/[aeiouy]+/g)?.length ?? 1;
  // Vowel pairs that usually split into two syllables: radio, curious, video, duo, area.
  const splits = (s.match(/ia|io(?!n)|iu|eo|uo|ua(?!y)/g) ?? []).length;
  return Math.max(1, runs + splits);
}

export function sentencesOf(t: string): string[] {
  return t.split(/(?<=[.!?…])["')\]]*\s+|\n{2,}/u).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s));
}

export interface Analysis {
  words: number; characters: number; charactersNoSpaces: number; sentences: number; paragraphs: number; lines: number;
  syllables: number; avgWordsPerSentence: number; avgSyllablesPerWord: number; longWords: number;
  fleschEase: number | null; gradeLevel: number | null; readingMinutes: number; speakingMinutes: number;
}

export function analyse(text: string): Analysis {
  const ws = wordsOf(text);
  const sents = sentencesOf(text);
  const syl = ws.reduce((n, w) => n + syllables(w), 0);
  const words = ws.length;
  const sentences = Math.max(sents.length, words ? 1 : 0);
  const wps = sentences ? words / sentences : 0;
  const spw = words ? syl / words : 0;
  const ok = words >= 5;
  return {
    words, characters: [...text].length, charactersNoSpaces: [...text.replace(/\s/g, '')].length, sentences,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    lines: text ? text.split('\n').length : 0,
    syllables: syl, avgWordsPerSentence: wps, avgSyllablesPerWord: spw, longWords: ws.filter((w) => w.length >= 7).length,
    fleschEase: ok ? 206.835 - 1.015 * wps - 84.6 * spw : null,
    gradeLevel: ok ? 0.39 * wps + 11.8 * spw - 15.59 : null,
    readingMinutes: words / 238, speakingMinutes: words / 150,
  };
}

export function easeLabel(score: number): string {
  if (score >= 90) return 'Very easy. Understood by an average 11-year-old.';
  if (score >= 80) return 'Easy. Conversational English.';
  if (score >= 70) return 'Fairly easy.';
  if (score >= 60) return 'Plain English. Most 13 to 15 year olds follow it.';
  if (score >= 50) return 'Fairly difficult. Sixth-form level.';
  if (score >= 30) return 'Difficult. University level.';
  return 'Very difficult. Specialist or academic writing.';
}

export interface KeywordRow { term: string; count: number; percent: number }

export function keywordTable(text: string, size: 1 | 2 | 3, includeStop: boolean, limit = 15): KeywordRow[] {
  const ws = wordsOf(text).map((w) => w.toLowerCase());
  const counts = new Map<string, number>();
  for (let i = 0; i + size <= ws.length; i++) {
    const gram = ws.slice(i, i + size);
    if (!includeStop && (size === 1 ? STOP_WORDS.has(gram[0]) : STOP_WORDS.has(gram[0]) || STOP_WORDS.has(gram[size - 1]))) continue;
    if (size === 1 && gram[0].length < 2) continue;
    const k = gram.join(' ');
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = Math.max(1, ws.length - size + 1);
  return [...counts.entries()]
    .filter(([, c]) => size === 1 || c > 1 || counts.size < 40)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term, count]) => ({ term, count, percent: (count / total) * 100 }));
}
