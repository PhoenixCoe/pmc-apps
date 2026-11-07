'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { GroupKey } from '@/lib/types';
import { AppSearch } from './AppSearch';
import { UiIcon } from './icons';
import { Lockup } from './Lockup';
import { AUTH_ENABLED } from './Providers';
import { Avatar, useAccount } from './Account';

// The two menus hold every app icon, so they load when first needed, not with the page.
const AppsMenu = dynamic(() => import('./AppsMenu').then((m) => m.AppsMenu), { ssr: false });
const MobileMenu = dynamic(() => import('./MobileMenu').then((m) => m.MobileMenu), { ssr: false });

/**
 * The black bar across the top of every page: the logo, an Apps menu, search (not on the home page, where the big box is),
 * and the account end. On a phone it folds to the logo, a search button and one Menu button.
 */
export function SiteBar({ home, path, currentKey, currentSlug }: { home: boolean; path: string; currentKey?: GroupKey; currentSlug?: string }) {
  const { user, signOut } = useAccount();
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [sheet, setSheet] = useState(false);
  const root = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  // Moving to another page closes everything.
  useEffect(() => { setMenu(false); setMobile(false); setSheet(false); }, [path]);

  useEffect(() => {
    if (!menu && !mobile && !sheet) return;
    const away = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) { setMenu(false); setMobile(false); setSheet(false); } };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (menu) menuBtn.current?.focus(); setMenu(false); setMobile(false); setSheet(false); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key); };
  }, [menu, mobile, sheet]);

  // "/" and Ctrl K: focus the search you can see; on a phone with the bar search folded away, open it.
  useEffect(() => {
    const jump = () => {
      const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-appsearch]'));
      const seen = boxes.find((b) => b.offsetParent !== null);
      if (seen) { seen.focus(); seen.select(); } else { setMenu(false); setMobile(false); setSheet(true); }
    };
    window.addEventListener('pmc:search', jump);
    return () => window.removeEventListener('pmc:search', jump);
  }, []);

  const signIn = `/signin?from=${encodeURIComponent(path)}`;
  const accountLink = AUTH_ENABLED && user
    ? <button type="button" onClick={signOut}>Sign out ({user.name || user.email})</button>
    : <Link href={signIn}>Sign in</Link>;

  return (
    <header className="topbar" ref={root}>
      <div className="bar-in">
        <Link className="bar-logo" href="/" aria-label="PMC Apps, home"><Lockup plain /></Link>
        <button ref={menuBtn} type="button" className={`bar-nav bar-apps${menu ? ' on' : ''}`} aria-expanded={menu} aria-controls="apps-menu" onClick={() => { setMenu((v) => !v); setMobile(false); setSheet(false); }}>
          Apps <i className="chev" aria-hidden />
        </button>
        {home ? <span className="bar-sp" /> : <div className="bar-search"><AppSearch variant="bar" /></div>}
        {AUTH_ENABLED && user ? (
          <>
            <span className="bar-who"><Avatar user={user} size={34} /><b className="d">{user.name || 'Signed in'}</b></span>
            <button type="button" className="bar-nav bar-acct" onClick={signOut}>Sign out</button>
          </>
        ) : (
          <Link className="bar-nav bar-acct" href={signIn}>Sign in</Link>
        )}

        <button type="button" className="bar-nav bar-sm" aria-label="Search apps" aria-expanded={sheet} onClick={() => { setSheet((v) => !v); setMobile(false); }}><UiIcon name="search" size={22} /></button>
        <button type="button" className={`bar-nav bar-sm bar-burger${mobile ? ' on' : ''}`} aria-expanded={mobile} aria-controls="mobile-menu" onClick={() => { setMobile((v) => !v); setSheet(false); }}>
          Menu <UiIcon name={mobile ? 'close' : 'menu'} size={20} />
        </button>
      </div>
      {menu && <AppsMenu currentKey={currentKey} currentSlug={currentSlug} onClose={() => setMenu(false)} />}
      {mobile && <MobileMenu currentKey={currentKey} currentSlug={currentSlug} onClose={() => setMobile(false)} accountLink={accountLink} />}
      {sheet && <div className="bar-sheet"><AppSearch variant="bar" autoFocus onDone={() => setSheet(false)} /></div>}
    </header>
  );
}
