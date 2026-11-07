'use client';
import { useEffect, useState } from 'react';
import { BlockLoader } from './BlockLoader';

interface Props {
  /** What is being fetched, in the words shown to the person: "assets", "the editor", "the converter". */
  what?: string;
  /** The app's name, for the "Loading ..." line. */
  app?: string;
  /** Steps done and total ("3/8"), or a 0 to 100 percentage. With neither, only the animation and words are shown. */
  done?: number;
  total?: number;
  percent?: number;
  /** The step in progress, if known: "Compiling the formatter". */
  step?: string | null;
  error?: string | null;
  /** Appear only if loading takes longer than about 0.4 seconds, so quick loads never flash. */
  delayed?: boolean;
  /** Seconds after which an apology is shown. */
  sorryAfter?: number;
  /** Fill the whole window from the first moment. For full-window apps and canvas apps, where the loader must always be the whole screen. */
  full?: boolean;
}

/** What people see while an app loads: the block animation, "LOADING ASSETS 3/8", what is happening, and a short apology if it is slow. */
export function AppLoader({ what = 'assets', app, done, total, percent, step, error, delayed, sorryAfter = 8, full = false }: Props) {
  const [slow, setSlow] = useState(false);
  const [cover, setCover] = useState(full);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), sorryAfter * 1000);
    const c = setTimeout(() => setCover(true), 3500);   // still going after a few seconds: the loader takes the whole window
    return () => { clearTimeout(t); clearTimeout(c); };
  }, [sorryAfter]);

  const count = total != null && done != null ? `${Math.min(done, total)}/${total}` : percent != null ? `${Math.round(percent)}%` : null;
  const pct = total ? (Math.min(done ?? 0, total) / total) * 100 : percent;
  return (
    <div className={`loader${delayed ? ' delayed' : ''}${cover ? ' cover' : ''}${full ? ' full' : ''}`} role="status" aria-live="polite">
      <BlockLoader label={`Loading ${app ?? 'the app'}`} />
      <p className="ld-title d">
        <span>Loading {what}</span>
        {count && <span className="ld-count" aria-label={total != null ? `${done} of ${total}` : `${Math.round(percent ?? 0)} percent`}>{count}</span>}
      </p>
      {pct != null && <div className="ld-bar" aria-hidden><i style={{ width: `${pct}%` }} /></div>}
      <p className="ld-line tx">{error ? error : step ? `${step}…` : app ? `Loading ${app}…` : 'Loading the app…'}</p>
      {slow && !error && <p className="ld-sorry tx">Sorry, this is taking longer than usual. It is still going, and it will be quicker next time.</p>}
    </div>
  );
}
