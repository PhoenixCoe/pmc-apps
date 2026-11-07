import { Pictogram } from './Pictogram';

/** The picture for an app: a flat, hand-set pictogram that fills its frame. Small ones sit still until pointed at. */
export function AppIcon({ slug, size = 48, still, className }: { slug: string; size?: number; still?: boolean; className?: string }) {
  return <Pictogram slug={slug} size={size} still={still} className={className} />;
}

export type Brand = 'google' | 'microsoft' | 'github';

/** The real company marks (Google G in its four colours, Microsoft's four squares, GitHub's mark from Simple Icons, CC0). */
export function BrandIcon({ brand, size = 22, className }: { brand: Brand; size?: number; className?: string }) {
  const common = { className, width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' } as const;
  if (brand === 'google') {
    return (
      <svg {...common}>
        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.15 21.3 7.26 24 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29a11.86 11.86 0 0 0 0 10.76l3.98-3.09z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.26 0 3.15 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
      </svg>
    );
  }
  if (brand === 'microsoft') {
    return (
      <svg {...common}>
        <path fill="#F25022" d="M2 2h9.5v9.5H2z" /><path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
        <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" /><path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const UI: Record<string, string> = {
  search: 'M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM15.5 15.5l5.5 5.5',
  apps: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  user: 'M12 3.5a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4zM4 21c.4-4.4 4-6.2 8-6.2s7.6 1.8 8 6.2',
  left: 'M14.5 5l-7 7 7 7M19 5v14',
  right: 'M9.5 5l7 7-7 7M5 5v14',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M5 5l14 14M19 5L5 19',
  plus: 'M12 4v16M4 12h16',
  out: 'M10 4H4v16h6M14 8l5 4-5 4M19 12H9',
  check: 'M4 12l5 5 11-11',
  arrow: 'M4 12h15M13 6l6 6-6 6',
  home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  soon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  down: 'M5 9l7 7 7-7',
  attach: 'M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.4 17.3a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6',
  send: 'M12 20V5M5.5 11.5L12 5l6.5 6.5',
  stop: 'M7 7h10v10H7z',
  more: 'M5 12h.1M12 12h.1M19 12h.1',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  refresh: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  pin: 'M9 4h6l-1 6 3 3H7l3-3-1-6zM12 13v7',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.1',
  panel: 'M4 5h16v14H4zM10 5v14',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  device: 'M3 5h18v11H3zM9 20h6M12 16v4',
  unseen: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM10 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0M4 4l16 16',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  idea: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.1',
  look: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5zM7.5 11h.1M10 7.5h.1M14.5 7.5h.1',
};
export type UiName = keyof typeof UI;

/** Small interface glyphs (search, menu, arrows) in the same stroke as the app icons. */
export function UiIcon({ name, size = 20, className, strokeWidth = 2.4 }: { name: UiName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="square" strokeLinejoin="miter" aria-hidden focusable="false">
      <path d={UI[name]} />
    </svg>
  );
}
