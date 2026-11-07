import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { GROUP_COLOURS, categoryBySlug } from '@/lib/categories';
import { getApp } from '@/registry';

export const ogSize = { width: 1200, height: 630 };

/** Share-card picture for one app: flat PMC colours, app name and one-line description. */
const font = (f: string) => readFile(join(process.cwd(), 'src/lib/og-fonts', f));

export async function ogImage(category: string, slug: string) {
  const m = getApp(category, slug);
  const colour = GROUP_COLOURS[categoryBySlug(category)?.key ?? 'text'].bg;
  // The PMC fonts, so the share card looks like the site. The symbols fonts fill in & ? " : and similar.
  const [l2, l4, s2, s4] = await Promise.all([font('CaracteresL2.ttf'), font('CaracteresL4.ttf'), font('PMCSymbolsL2.ttf'), font('PMCSymbolsL4.ttf')]);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F2E4CE', color: '#171717', fontFamily: 'PMC Text Symbols, PMC Text', padding: 64, borderLeft: `40px solid ${colour}` }}>
        <div style={{ display: 'flex', fontFamily: 'PMC Display Symbols, PMC Display', fontSize: 48, borderBottom: '8px solid #B49A57', alignSelf: 'flex-start', paddingBottom: 8 }}>PMC Apps</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontFamily: 'PMC Display Symbols, PMC Display', fontSize: 104, lineHeight: 1 }}>{m?.title ?? 'PMC Apps'}</div>
          <div style={{ fontSize: 36, maxWidth: 900 }}>{m?.tagline ?? 'Free apps that work the moment you open them.'}</div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'PMC Display', data: l2, weight: 400, style: 'normal' }, { name: 'PMC Display Symbols', data: s2, weight: 400, style: 'normal' },
        { name: 'PMC Text', data: l4, weight: 400, style: 'normal' }, { name: 'PMC Text Symbols', data: s4, weight: 400, style: 'normal' },
      ],
    },
  );
}
