import { LOGO_C, LOGO_M, LOGO_P } from './logoPaths';
import { LOCK_APPS, LOCK_W } from './lockupPaths';

/**
 * The PMC logo, the word APPS, and the logo's own line carried on underneath both.
 * Big, in the home hero's first-visit sequence, the pieces arrive one after another (see .lk-* in globals.css and INTRO in lib/intro.ts).
 * Small, in the top bar (`plain`), it is simply the finished picture.
 */
export function Lockup({ plain = false }: { plain?: boolean }) {
  const c = (name: string) => (plain ? undefined : name);
  return (
    <svg className="lockup" viewBox={`0 0 ${LOCK_W} 1454`} role="img" aria-label="PMC Apps" fill="currentColor">
      <rect className={c('lk-bar')} x="2520" y="1281.33" width={LOCK_W - 2524} height="172" />
      <path className={c('lk-apps')} d={LOCK_APPS} />
      <g className={c('lk-logo')} style={plain ? undefined : ({ '--dx': `${(LOCK_W - 2582) / 2}px` } as React.CSSProperties)}>
        <path className={c('lk-l')} style={plain ? undefined : ({ '--i': 0 } as React.CSSProperties)} d={LOGO_P} fillRule="evenodd" clipRule="evenodd" />
        <path className={c('lk-l')} style={plain ? undefined : ({ '--i': 1 } as React.CSSProperties)} d={LOGO_M} />
        <path className={c('lk-l')} style={plain ? undefined : ({ '--i': 2 } as React.CSSProperties)} d={LOGO_C} />
      </g>
    </svg>
  );
}
