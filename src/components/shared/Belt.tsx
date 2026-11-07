import { AppIcon } from './icons';

type Item = { slug: string; title: string; key: string };

/** One row of app icons drifting past. It moves on the graphics card only, stops under the pointer, and stands still for people who ask for less motion. */
export function Belt({ items }: { items: Item[] }) {
  return (
    <div className="belt" aria-hidden>
      <ul className="belt-t">
        {[...items, ...items].map((a, i) => (
          <li key={`${a.slug}-${i}`} data-g={a.key}><span className="belt-i"><AppIcon slug={a.slug} size={44} still /></span></li>
        ))}
      </ul>
    </div>
  );
}

/** The old comic-book dots, kept: big dots at the corner shrinking to small ones, melting into the page. Three layers of one dot grid, each fading in as the last fades out. */
export function Halftone({ className = '' }: { className?: string }) {
  return <div className={`ht ${className}`} aria-hidden><i /><i /><i /></div>;
}
