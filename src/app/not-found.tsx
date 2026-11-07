import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ShakeOnMount } from '@/components/shared/ShakeOnMount';

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export default function NotFound() {
  return (
    <div className="wrap body"><section className="nf">
      <ShakeOnMount />
      <h1 className="n" aria-label="404">
        <span style={delay(150)} aria-hidden>4</span><span style={delay(450)} aria-hidden>0</span><span style={delay(750)} aria-hidden>4</span>
      </h1>
      <div className="nf-bot">
        <div>
          <p className="msg">That page isn’t here.</p>
          <p className="tx">The link might be old, or it might have been typed wrong. Every tool is still a search away: press / and type.</p>
        </div>
        <Link className="btn primary" href="/">Back to the apps</Link>
      </div>
    </section></div>
  );
}
