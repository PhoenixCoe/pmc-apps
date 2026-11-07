'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { GROUP_COLOURS } from '@/lib/categories';
import { avatarDataUrl, paintFavicon } from '@/lib/favicon';
import type { GroupKey } from '@/lib/types';
import type { AppsData } from './AppsContext';
import { AppsProvider } from './AppsContext';
import { initialOf, useAccount } from './Account';
import { SiteBar } from './SiteBar';
import { SiteFooter } from './SiteFooter';

/** Pages that stand on their own, without the top bar. */
const BARE = new Set(['/signin', '/signup']);

/**
 * The frame around every page: the top bar, the page, and a slim footer. There is no sidebar.
 * It also keeps the tab icon in the colours of the group you are in, and listens for "/" and Ctrl K to jump to search.
 */
export function Shell({ children, data }: { children: React.ReactNode; data: AppsData }) {
  const path = usePathname().replace(/\/$/, '') || '/';
  const bare = BARE.has(path);
  const home = path === '/';
  const { user } = useAccount();

  const { currentKey, currentSlug } = useMemo(() => {
    const app = data.index.find((a) => a.href === path);
    if (app) return { currentKey: app.key as GroupKey, currentSlug: app.slug };
    const g = data.groups.find((x) => path === `/${x.slug}`);
    return { currentKey: g?.key as GroupKey | undefined, currentSlug: undefined };
  }, [path, data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = /input|textarea|select/i.test(el?.tagName ?? '') || el?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); window.dispatchEvent(new Event('pmc:search')); }
      else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); window.dispatchEvent(new Event('pmc:search')); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The tab icon takes the colours of the group you are in, with your picture in the corner when you are signed in.
  useEffect(() => {
    const c = GROUP_COLOURS[currentKey ?? 'home'];
    if (!user) { paintFavicon(c.bg, c.fg); return; }
    let live = true;
    paintFavicon(c.bg, c.fg, { initial: initialOf(user) });
    if (user.image) avatarDataUrl(user.image).then((img) => { if (live && img) paintFavicon(c.bg, c.fg, { initial: initialOf(user), image: img }); });
    return () => { live = false; };
  }, [currentKey, user]);

  return (
    <AppsProvider value={data}>
      <div className="site">
        <a className="skip d" href="#main">Skip to the content</a>
        {!bare && <SiteBar home={home} path={path} currentKey={currentKey} currentSlug={currentSlug} />}
        <main id="main" className="main" tabIndex={-1}>{children}</main>
        {!bare && <SiteFooter />}
      </div>
    </AppsProvider>
  );
}
