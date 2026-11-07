import Link from 'next/link';
import { UiIcon } from './icons';

/** One slim black strip at the bottom of every page. */
export function SiteFooter() {
  return (
    <footer className="foot">
      <a href="https://pmcstudios.uk">PMC Studios</a>
      <nav aria-label="More"><Link href="/suggest"><UiIcon name="idea" size={18} />Suggest an app</Link><Link href="/settings"><UiIcon name="gear" size={18} />Settings</Link><Link href="/privacy"><UiIcon name="lock" size={18} />Privacy</Link></nav>
    </footer>
  );
}
