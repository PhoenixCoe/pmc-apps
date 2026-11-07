const SKIP = new Set(['and', '&', 'the', 'a', 'of', 'to', 'for']);

/** Two capital letters for an app, like the "MM" square for Mini Mayhem on the PMC site. */
export function mono(title: string): string {
  const words = title.split(/[\s/-]+/).filter((w) => w && !SKIP.has(w.toLowerCase()));
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
