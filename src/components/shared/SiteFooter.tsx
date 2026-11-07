import Link from 'next/link';

/** One slim black strip at the bottom of every page. */
export function SiteFooter() {
  return (
    <footer className="foot">
      <a href="https://pmcstudios.uk">PMC Studios</a>
      <nav aria-label="More"><Link href="/suggest">Suggest an app</Link><Link href="/settings">Settings</Link><Link href="/privacy">Privacy</Link></nav>
    </footer>
  );
}
