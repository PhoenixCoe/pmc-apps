'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppIcon } from './icons';

const KEY = 'pmc:recent';
const read = (): string[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; } };

/** Put on every app page: remembers (on this device only) which apps you opened, newest first. */
export function RecentTracker({ slug }: { slug: string }) {
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify([slug, ...read().filter((s) => s !== slug)].slice(0, 6))); } catch { /* storage blocked */ } }, [slug]);
  return null;
}

/** The home page row of apps you opened lately. It stays out of the way until you have opened one. */
export function RecentList({ apps }: { apps: { slug: string; title: string; href: string }[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => setSlugs(read()), []);
  const list = slugs.map((s) => apps.find((a) => a.slug === s)).filter((a): a is NonNullable<typeof a> => !!a);
  if (!list.length) return null;
  return (
    <section className="sec" aria-labelledby="recent-title">
      <div className="top-row"><h2 id="recent-title" className="d">Pick up where you left off</h2></div>
      <div className="recents">
        {list.map((a) => (
          <Link key={a.slug} href={a.href} className="rtile"><span className="pbox"><AppIcon slug={a.slug} size={44} /></span><span className="d">{a.title}</span></Link>
        ))}
      </div>
    </section>
  );
}
