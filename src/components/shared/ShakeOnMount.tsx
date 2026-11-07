'use client';
import { useEffect } from 'react';

/** The little shake the PMC 404 page does as each digit lands. Skipped if the visitor prefers reduced motion. */
export function ShakeOnMount({ target = '.content', times = [570, 870, 1170] }: { target?: string; times?: number[] }) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(target);
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const keys = [[0, 0], [-1, 1], [1, -1], [-0.6, 0.8], [0.4, -0.4], [0, 0]];
    const ids = times.map((t, i) => setTimeout(() => {
      const m = i === 1 ? 14 : 9;
      el.animate(keys.map(([x, y]) => ({ transform: `translate(${x * m}px,${y * m}px)` })), { duration: 280, easing: 'steps(5, end)' });
    }, t));
    return () => ids.forEach(clearTimeout);
  }, [target, times]);
  return null;
}
