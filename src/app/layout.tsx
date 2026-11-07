import type { Metadata, Viewport } from 'next';
import './fonts.generated.css';
import './globals.css';
import { EmbedBridge } from '@/components/shared/EmbedBridge';
import { IconMotion } from '@/components/shared/IconMotion';
import { RangeStyler } from '@/components/shared/RangeStyler';
import { Shell } from '@/components/shared/Shell';
import { PREFS_SCRIPT } from '@/lib/prefs';
import { SITE } from '@/lib/seo';
import { groupList, searchIndex } from '@/registry';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'PMC Apps: small tools that just work', template: '%s | PMC Apps' },
  description: `${searchIndex.length} small tools for text, files, study, code and the web. No sign-up, no install.`,
  openGraph: { siteName: 'PMC Apps', type: 'website' },
  icons: { icon: [{ url: '/favicon.ico', sizes: '48x48' }, { url: '/favicon.svg', type: 'image/svg+xml' }], apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor: '#171717', viewportFit: 'cover' };

/** What the menus and search need: no descriptions or questions, so it stays small on every page. */
const data = { index: searchIndex, groups: groupList };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* Applies the saved choices (text size, loading screen, motion) before the first paint so the page never jumps. */}
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
        {/* Opened inside another page (?embed=1): show only the tool, and skip the slow loading screen. */}
        <script dangerouslySetInnerHTML={{ __html: "try{var q=new URLSearchParams(location.search);if(q.get('embed')==='1'&&window.parent!==window){var d=document.documentElement;d.dataset.embed='1';d.dataset.loader='quick';}}catch(e){}" }} />
      </head>
      <body>
        <Shell data={data}>{children}</Shell>
        <RangeStyler />
        <IconMotion />
        <EmbedBridge />
      </body>
    </html>
  );
}
