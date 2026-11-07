import Link from 'next/link';
import { AppIcon } from './icons';

/** One app in a group list: its picture, its name and what it does in a few words. */
export function AppCell({ slug, href, title, tagline, g }: { slug: string; href: string; title: string; tagline: string; g?: string }) {
  return (
    <Link href={href} className="cell" data-g={g}>
      <span className="ic"><AppIcon slug={slug} size={48} still /></span>
      <span className="cell-t"><b>{title}</b><small className="tx">{tagline}</small></span>
    </Link>
  );
}
