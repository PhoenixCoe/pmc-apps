export interface Page { id: number; parent: number | null; title: string; slug: string; priority: string; freq: string }
export const W = 176, H = 60, GX = 28, GY = 70;
export const START: Page[] = [
  { id: 1, parent: null, title: 'Home', slug: '', priority: '1.0', freq: 'weekly' },
  { id: 2, parent: 1, title: 'About', slug: 'about', priority: '0.8', freq: 'monthly' },
  { id: 3, parent: 1, title: 'Shop', slug: 'shop', priority: '0.9', freq: 'daily' },
  { id: 4, parent: 1, title: 'Contact', slug: 'contact', priority: '0.6', freq: 'yearly' },
  { id: 5, parent: 3, title: 'Cakes', slug: 'cakes', priority: '0.7', freq: 'weekly' },
  { id: 6, parent: 3, title: 'Bread', slug: 'bread', priority: '0.7', freq: 'weekly' },
];
export const kids = (list: Page[], id: number | null) => list.filter((p) => p.parent === id);
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function pathOf(list: Page[], p: Page): string { const parts: string[] = []; let c: Page | undefined = p; const seen = new Set<number>(); while (c && !seen.has(c.id)) { seen.add(c.id); if (c.slug) parts.unshift(c.slug); const par: number | null = c.parent; c = list.find((x) => x.id === par); } return '/' + parts.join('/'); }
export function layout(list: Page[]) {
  const pos = new Map<number, { x: number; y: number }>(); let leaf = 0;
  const go = (id: number, d: number): number => { const k = kids(list, id); let x: number; if (!k.length) x = leaf++ * (W + GX); else { const xs = k.map((c) => go(c.id, d + 1)); x = (xs[0] + xs[xs.length - 1]) / 2; } pos.set(id, { x, y: d * (H + GY) }); return x; };
  kids(list, null).forEach((r) => go(r.id, 0));
  const xs = [...pos.values()]; return { pos, box: { x0: -20, y0: -20, x1: Math.max(0, ...xs.map((p) => p.x)) + W + 20, y1: Math.max(0, ...xs.map((p) => p.y)) + H + 20 } };
}
export function descendants(list: Page[], id: number): number[] { return kids(list, id).flatMap((c) => [c.id, ...descendants(list, c.id)]); }
export function xml(list: Page[], base: string) {
  const b = base.replace(/\/+$/, '') || 'https://www.example.com', today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.map((p) => `  <url>\n    <loc>${b}${pathOf(list, p)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
}
export function outline(list: Page[]) { const out: string[] = []; const go = (id: number | null, d: number) => kids(list, id).forEach((p) => { out.push(`${'  '.repeat(d)}- ${p.title} (${pathOf(list, p)})`); go(p.id, d + 1); }); go(null, 0); return out.join('\n') + '\n'; }
