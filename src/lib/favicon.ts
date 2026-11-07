import { LOGO_M } from '@/components/shared/logoPaths';

/** Who is signed in, shown as a small square in the bottom-right of the tab icon. `image` must be a data: URL. */
export interface FaviconBadge { initial: string; image?: string }

const esc = (c: string) => c.replace(/[<>&"]/g, '').slice(0, 1).toUpperCase() || '?';
const badge = (b: FaviconBadge, bg: string, fg: string) => b.image
  ? `<image href="${b.image}" x="34" y="34" width="28" height="28" preserveAspectRatio="xMidYMid slice"/><rect x="34" y="34" width="28" height="28" fill="none" stroke="${fg}" stroke-width="3"/>`
  : `<rect x="34" y="34" width="28" height="28" fill="${fg}"/><text x="48" y="56" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="700" font-size="24" fill="${bg}">${esc(b.initial)}</text>`;

const make = (bg: string, fg: string, b?: FaviconBadge) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="${bg}" width="64" height="64"/><clipPath id="c"><rect x="700" y="0" width="1140" height="1460"/></clipPath><path fill="${fg}" clip-path="url(#c)" transform="translate(-11.493 7.000) scale(0.03425)" d="${LOGO_M}"/>${b ? badge(b, bg, fg) : ''}</svg>`;

/** Turns a profile picture into a small data: URL so the tab icon can carry it. Resolves to undefined when the image can't be read. */
export function avatarDataUrl(src: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 56;
        const x = c.getContext('2d'); if (!x) return resolve(undefined);
        const s = Math.min(img.width, img.height);
        x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 56, 56);
        resolve(c.toDataURL('image/png'));
      } catch { resolve(undefined); }
    };
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

/** The tab icon: the big M in whichever two colours a page asks for (same drawing as the PMC Studios site), plus a badge when signed in. */
export function paintFavicon(bg: string, fg: string, b?: FaviconBadge) {
  let l = document.querySelector<HTMLLinkElement>('link[rel~="icon"][type="image/svg+xml"]');
  if (!l) { l = document.createElement('link'); l.rel = 'icon'; l.type = 'image/svg+xml'; document.head.appendChild(l); }
  l.href = 'data:image/svg+xml,' + encodeURIComponent(make(bg, fg, b));
}

export const FAVICON_COLOURS = {
  home: ['#171717', '#F2E4CE'],
  green: ['#337957', '#F2E4CE'],
  gold: ['#B49A57', '#171717'],
  cream: ['#F2E4CE', '#171717'],
  ink: ['#171717', '#F2E4CE'],
  deep: ['#1A4934', '#F2E4CE'],
} as const;
