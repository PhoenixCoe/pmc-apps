import { LOGO_C, LOGO_M, LOGO_P, LOGO_VIEWBOX } from './logoPaths';

/** The PMC wordmark, drawn from the same paths as the PMC Studios site. Takes its colour from the text colour around it. */
export function Logo({ className, label = 'PMC' }: { className?: string; label?: string }) {
  return (
    <svg className={className} viewBox={LOGO_VIEWBOX} fill="currentColor" role="img" aria-label={label}>
      <path d={LOGO_P} fillRule="evenodd" clipRule="evenodd" />
      <path d={LOGO_M} />
      <path d={LOGO_C} />
    </svg>
  );
}
