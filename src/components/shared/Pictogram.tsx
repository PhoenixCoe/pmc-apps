import type { CSSProperties, ReactNode } from 'react';

/**
 * One flat pictogram per app, drawn on a 48 x 48 square that fills its frame edge to edge.
 * Every drawing is complete as it stands (that is what you see with motion off). The moving parts start somewhere
 * else, often past the edge of the picture, and settle into place; the frame clips them, so nothing shows outside it.
 * Colours follow the app's group: green Text, orange File, blue Productivity, purple Developer, yellow Business.
 * The motion classes live in globals.css (.pg .m-*). Small ones sit still until you point at them.
 */
type Cat = 'text' | 'file' | 'prod' | 'dev' | 'biz';
interface C { bg: string; f: string; a: string; b: string }

const K = '#171717', G1 = '#337957', G2 = '#1A4934', CR = '#F2E4CE', GD = '#B49A57', PP = '#FBF6EC', RD = '#A33A2B';
const PAL: Record<Cat, C> = {
  text: { bg: G1, f: CR, a: GD, b: G2 },
  file: { bg: '#B94A2C', f: CR, a: GD, b: '#6E2A15' },
  prod: { bg: '#2F5D9E', f: CR, a: GD, b: '#1B3760' },
  dev: { bg: '#6B4FA0', f: CR, a: GD, b: '#3F2D66' },
  biz: { bg: '#D9A524', f: CR, a: '#7F5F0E', b: '#85600F' },
};

type V = Record<string, string | number>;
/** Props that make one shape move: its motion kind, the offsets it starts from, a start delay and a loop length. */
const mo = (kind: string, v: V = {}, delay = 0, dur = 4) => ({
  className: `m m-${kind}`,
  style: { ...v, '--dl': `${delay}s`, '--dur': `${dur}s` } as CSSProperties,
});
const ST = { stroke: K, strokeWidth: 3 } as const;
const X = (v: number) => ({ '--x0': `${v}px` });
const Y = (v: number) => ({ '--y0': `${v}px` });
const XY = (x: number, y: number) => ({ '--x0': `${x}px`, '--y0': `${y}px` });
const HAND = (cx: number, cy: number) => ({ '--tb': 'view-box', '--o': `${cx}px ${cy}px` });
const LEFT = { '--o': 'left center' };
const BOTTOM = { '--o': 'center bottom' };
const FONT_D = { fontFamily: 'var(--d)' } as CSSProperties;
const FONT_T = { fontFamily: 'var(--t)' } as CSSProperties;

/** Three-row reel: the words slide up one at a time inside a window. Used by the Case Converter and HTTP reference. */
const reel = (id: string, c: C, items: [string, string][], card: { x: number; y: number; w: number }, font: CSSProperties) => (
  <>
    <clipPath id={id}><rect x={card.x} y={card.y} width={card.w} height="20" /></clipPath>
    <rect x={card.x} y={card.y} width={card.w} height="20" fill={c.f} />
    <g clipPath={`url(#${id})`}>
      <g {...mo('reel')}>
        {items.map(([t, fill], i) => (
          <text key={i} x={card.x + card.w / 2} y={card.y + 15 + i * 20} textAnchor="middle" fontSize="15" fill={fill} style={font}>{t}</text>
        ))}
      </g>
    </g>
    <rect x={card.x} y={card.y} width={card.w} height="20" fill="none" {...ST} />
  </>
);

const ICONS: Record<string, [Cat, (c: C) => ReactNode]> = {
  /* ---------------- Text and formatting (green) ---------------- */
  'case-converter': ['text', (c) => (
    <>
      {reel('pgc-case', c, [['abc', K], ['Abc', K], ['ABC', K], ['abc', K]], { x: 6, y: 12, w: 36 }, FONT_T)}
      <rect x="6" y="38" width="22" height="3" fill={c.a} />
      <rect x="6" y="5" width="10" height="3" fill={c.f} />
    </>
  )],
  'code-formatter': ['text', (c) => (
    <>
      <path d="M13 11H8V21L4 24L8 27V37H13" fill="none" stroke={c.f} strokeWidth="3" />
      <rect x="17" y="11" width="24" height="5" fill={c.f} {...mo('m', X(-52), 0)} />
      <rect x="23" y="19" width="18" height="5" fill={c.a} {...mo('m', X(-52), 0.15)} />
      <rect x="23" y="27" width="14" height="5" fill={c.f} {...mo('m', X(-52), 0.3)} />
      <rect x="17" y="35" width="18" height="5" fill={c.a} {...mo('m', X(-52), 0.45)} />
    </>
  )],
  'code-minifier-diff': ['text', (c) => (
    <>
      <g {...mo('xy', { '--a0': 2.4, '--b0': 1 })}>
        <rect x="18" y="12" width="12" height="24" fill={c.f} {...ST} />
        <rect x="21" y="18" width="6" height="3" fill={c.a} /><rect x="21" y="25" width="6" height="3" fill={K} />
      </g>
      <path d="M6 15L12 24L6 33" fill="none" stroke={c.f} strokeWidth="3" {...mo('m', X(-9))} />
      <path d="M42 15L36 24L42 33" fill="none" stroke={c.f} strokeWidth="3" {...mo('m', X(9))} />
    </>
  )],
  'slug-generator': ['text', (c) => (
    <>
      <rect x="3" y="8" width="12" height="9" fill={c.f} /><rect x="20" y="8" width="14" height="9" fill={c.f} /><rect x="39" y="8" width="6" height="9" fill={c.f} />
      <path d="M24 20V26M20 24L24 28L28 24" fill="none" stroke={c.f} strokeWidth="3" />
      <rect x="3" y="31" width="13" height="9" fill={c.f} /><rect x="19" y="31" width="14" height="9" fill={c.f} /><rect x="36" y="31" width="9" height="9" fill={c.f} />
      <rect x="16" y="34" width="3" height="3" fill={c.a} {...mo('p', {}, 0)} /><rect x="33" y="34" width="3" height="3" fill={c.a} {...mo('p', {}, 0.2)} />
    </>
  )],
  'word-readability-analyzer': ['text', (c) => (
    <>
      <rect x="6" y="5" width="36" height="28" fill={c.f} {...ST} />
      <rect x="10" y="10" width="28" height="3" fill={K} /><rect x="10" y="16" width="22" height="3" fill={K} />
      <rect x="10" y="22" width="28" height="3" fill={K} /><rect x="10" y="28" width="14" height="3" fill={K} />
      <rect x="22" y="15" width="8" height="5" fill={c.a} {...mo('p', {}, 0.3)} opacity=".9" />
      <rect x="6" y="37" width="36" height="6" fill={c.f} {...ST} />
      <rect x="8" y="39" width="26" height="2" fill={c.a} {...mo('w', LEFT)} />
    </>
  )],
  'markdown-studio': ['text', (c) => (
    <>
      <rect x="5" y="6" width="38" height="36" fill={c.f} {...ST} />
      <path d="M11 12V24M17 12V24M8 15.5H20M8 20.5H20" fill="none" stroke={K} strokeWidth="3" />
      <rect x="24" y="14" width="15" height="5" fill={c.a} {...mo('w', LEFT)} />
      <rect x="9" y="30" width="26" height="3" fill={K} {...mo('w', LEFT, 0.2)} /><rect x="9" y="36" width="16" height="3" fill={K} {...mo('w', LEFT, 0.4)} />
      <rect x="29" y="34" width="4" height="7" fill={c.a} {...mo('c')} />
    </>
  )],
  'text-diff-inspector': ['text', (c) => (
    <>
      <rect x="4" y="6" width="40" height="36" fill={c.f} {...ST} /><path d="M24 6V42" stroke={K} strokeWidth="3" />
      <rect x="8" y="12" width="12" height="4" fill={K} /><rect x="28" y="12" width="12" height="4" fill={K} />
      <rect x="8" y="22" width="12" height="5" fill={RD} {...mo('b')} /><rect x="28" y="22" width="14" height="5" fill={G1} {...mo('b', {}, 0.5)} />
      <rect x="8" y="33" width="9" height="4" fill={K} /><rect x="28" y="33" width="9" height="4" fill={K} />
    </>
  )],
  'regex-sandbox': ['text', (c) => (
    <>
      <rect x="4" y="6" width="40" height="30" fill={c.f} {...ST} />
      <rect x="8" y="17" width="13" height="9" fill={c.a} {...mo('m', X(-3), 0)} />
      <rect x="8" y="11" width="28" height="3" fill={K} /><rect x="8" y="19" width="30" height="3" fill={K} /><rect x="8" y="28" width="20" height="3" fill={K} />
      </>
  )],
  'lorem-generator': ['text', (c) => (
    <>
      <rect x="5" y="5" width="38" height="38" fill={c.f} {...ST} />
      <rect x="9" y="9" width="11" height="11" fill={c.a} {...ST} {...mo('p')} />
      <rect x="23" y="10" width="15" height="3" fill={K} {...mo('w', LEFT)} /><rect x="23" y="16" width="12" height="3" fill={K} {...mo('w', LEFT, 0.15)} />
      <rect x="9" y="25" width="29" height="3" fill={K} {...mo('w', LEFT, 0.3)} /><rect x="9" y="31" width="25" height="3" fill={K} {...mo('w', LEFT, 0.45)} />
      <rect x="9" y="37" width="16" height="3" fill={K} {...mo('w', LEFT, 0.6)} />
    </>
  )],
  'list-cleaner-deduplicator': ['text', (c) => (
    <>
      <rect x="5" y="5" width="30" height="38" fill={c.f} {...ST} />
      <rect x="9" y="11" width="22" height="5" fill={K} /><rect x="9" y="19" width="16" height="5" fill={K} />
      <rect x="9" y="27" width="20" height="5" fill={K} {...mo('m', Y(8))} />
      <rect x="69" y="27" width="16" height="5" fill={RD} {...mo('m', X(-60))} />
      <path d="M38 14L44 20M44 14L38 20" stroke={c.f} strokeWidth="3" fill="none" />
    </>
  )],
  'json-formatter-repair': ['text', (c) => (
    <>
      <path d="M19 9H13V20L8 24L13 28V39H19" fill="none" stroke={c.f} strokeWidth="4" {...mo('m', X(-6))} />
      <path d="M29 9H35V20L40 24L35 28V39H29" fill="none" stroke={c.f} strokeWidth="4" {...mo('m', X(6))} />
      <rect x="21" y="21" width="6" height="6" fill={c.a} {...ST} {...mo('p')} />
    </>
  )],
  'table-converter': ['text', (c) => (
    <>
      <rect x="5" y="7" width="38" height="34" fill={c.f} {...ST} />
      <rect x="5" y="7" width="38" height="8" fill={c.a} {...ST} />
      <path d="M17.5 7V41M30.5 7V41M5 23H43M5 32H43" stroke={K} strokeWidth="3" />
      <rect x="20" y="25" width="8" height="5" fill={c.b} {...mo('b')} /><rect x="7.5" y="34" width="8" height="5" fill={c.b} {...mo('b', {}, 0.4)} /><rect x="33" y="17" width="8" height="4" fill={c.b} {...mo('b', {}, 0.8)} />
    </>
  )],

  /* ---------------- File and media (gold) ---------------- */
  'media-converter': ['file', (c) => (
    <>
      <path d="M3 24H8M40 24H45" stroke={K} strokeWidth="3" />
      <rect x="18" y="16" width="12" height="16" fill={c.f} {...ST} {...mo('conv', { '--c0': CR, '--c1': G1 }, 0, 3)} />
      <rect x="12" y="9" width="24" height="30" fill="none" {...ST} />
      <rect x="9" y="19" width="3" height="10" fill={K} /><rect x="36" y="19" width="3" height="10" fill={K} />
    </>
  )],
  'image-resizer': ['file', (c) => (
    <g {...mo('s', { '--s0': 1.8 })}>
      <rect x="10" y="10" width="28" height="28" fill={c.a} {...ST} />
      <path d="M10 38L19 24L25 31L30 25L38 38Z" fill={c.f} stroke={K} strokeWidth="3" />
      <rect x="28" y="14" width="6" height="6" fill={c.f} {...ST} />
      <rect x="6" y="6" width="7" height="7" fill={PP} {...ST} /><rect x="35" y="35" width="7" height="7" fill={PP} {...ST} />
    </g>
  )],
  'asset-shrinker': ['file', (c) => (
    <>
      <rect x="14" y="14" width="20" height="20" fill={c.f} {...ST} {...mo('s', { '--s0': 1.5 })} />
      <rect x="20" y="20" width="8" height="8" fill={c.a} />
      <g {...mo('m', XY(-5, -5))}><path d="M4 12V4H12M4 4L13 13" fill="none" stroke={K} strokeWidth="3" /></g>
      <g {...mo('m', XY(5, -5))}><path d="M44 12V4H36M44 4L35 13" fill="none" stroke={K} strokeWidth="3" /></g>
      <g {...mo('m', XY(-5, 5))}><path d="M4 36V44H12M4 44L13 35" fill="none" stroke={K} strokeWidth="3" /></g>
      <g {...mo('m', XY(5, 5))}><path d="M44 36V44H36M44 44L35 35" fill="none" stroke={K} strokeWidth="3" /></g>
    </>
  )],
  'svg-vector-studio': ['file', (c) => (
    <>
      <path d="M8 36C12 6 36 6 40 36" fill="none" stroke={K} strokeWidth="3" {...mo('d', { '--len': 80 })} strokeDasharray="80" />
      <path d="M8 36L13 14M40 36L35 14" stroke={c.a} strokeWidth="2" />
      <rect x="11" y="11" width="5" height="5" fill={c.f} {...ST} {...mo('p', {}, 0.2)} /><rect x="32" y="11" width="5" height="5" fill={c.f} {...ST} {...mo('p', {}, 0.2)} />
      <rect x="4" y="32" width="8" height="8" fill={c.f} {...ST} /><rect x="36" y="32" width="8" height="8" fill={c.f} {...ST} />
    </>
  )],
  'audio-trimmer-looper': ['file', (c) => (
    <>
      {[10, 20, 30, 16, 36, 24, 30, 14, 20].map((h, i) => (
        <rect key={i} x={7 + i * 4.4} y={24 - h / 2} width="3" height={h} fill={K} {...mo('h', { '--s0': 0.25, '--o': 'center' }, i * 0.1)} />
      ))}
      <rect x="3" y="6" width="3" height="36" fill={c.a} /><rect x="42" y="6" width="3" height="36" fill={c.a} />
      <rect x="35" y="6" width="3" height="36" fill={c.f} {...ST} {...mo('m', X(-28))} />
    </>
  )],
  'pdf-page-manager': ['file', (c) => {
    const page = (x: number, tab: string, k: string) => (
      <g {...mo(k)}>
        <rect x={x} y="12" width="12" height="22" fill={c.f} {...ST} />
        <rect x={x} y="12" width="12" height="5" fill={tab} stroke={K} strokeWidth="3" />
        <rect x={x + 3} y="22" width="6" height="2" fill={K} /><rect x={x + 3} y="27" width="6" height="2" fill={K} />
      </g>
    );
    return (
      <>
        {page(4, c.a, 'swa')}
        <g><rect x="18" y="12" width="12" height="22" fill={c.f} {...ST} /><rect x="18" y="12" width="12" height="5" fill={K} /><rect x="21" y="22" width="6" height="2" fill={K} /><rect x="21" y="27" width="6" height="2" fill={K} /></g>
        {page(32, c.b, 'swb')}
        <path d="M6 41H42" stroke={K} strokeWidth="3" /><rect x="6" y="39" width="8" height="4" fill={c.a} {...ST} {...mo('m', X(28))} />
      </>
    );
  }],
  'gif-animation-builder': ['file', (c) => (
    <>
      {[3, 17, 31].map((x, i) => (
        <g key={x}><rect x={x} y="9" width="14" height="22" fill={c.f} {...ST} /><rect x={x + 4} y={13 + i * 5} width="6" height="6" fill={K} /></g>
      ))}
      <rect x="1.5" y="7.5" width="17" height="25" fill="none" stroke={c.a} strokeWidth="4" {...mo('step', {}, 0, 3)} />
      <rect x="3" y="37" width="42" height="6" fill={c.f} {...ST} /><rect x="5" y="39" width="12" height="2" fill={K} />
    </>
  )],
  'favicon-generator': ['file', (c) => (
    <>
      <rect x="4" y="6" width="40" height="14" fill={c.f} {...ST} />
      <rect x="8" y="10" width="6" height="6" fill={c.a} {...mo('s', { '--s0': 1.7 })} />
      <rect x="18" y="11" width="22" height="4" fill={K} />
      <rect x="5" y="25" width="17" height="17" fill={c.f} {...ST} {...mo('p')} /><rect x="9" y="29" width="9" height="9" fill={c.a} />
      <rect x="26" y="29" width="11" height="11" fill={c.f} {...ST} {...mo('p', {}, 0.2)} />
      <rect x="40" y="33" width="5" height="5" fill={c.f} {...ST} {...mo('p', {}, 0.4)} />
    </>
  )],
  'color-palette-extractor': ['file', (c) => (
    <>
      {[K, G1, RD, CR].map((f, i) => <rect key={i} x={5 + i * 10} y="32" width="9" height="11" fill={f} {...ST} {...mo('m', Y(-14), i * 0.12)} />)}
      <rect x="5" y="5" width="38" height="25" fill={c.a} {...ST} />
      <path d="M5 30V25L20 18L43 26V30Z" fill={c.f} stroke={K} strokeWidth="3" />
      <rect x="31" y="9" width="6" height="6" fill={c.f} {...ST} />
    </>
  )],
  'background-remover': ['file', (c) => (
    <>
      <rect width="48" height="48" fill={c.f} />
      {Array.from({ length: 18 }, (_, i) => { const x = (i % 3) * 2 + ((Math.floor(i / 3)) % 2); return <rect key={i} x={(x % 6) * 8} y={Math.floor(i / 3) * 8} width="8" height="8" fill="#DCCBAE" />; })}
      <rect x="48" width="48" height="48" fill={c.a} {...mo('m', X(-48), 0, 3.6)} />
      <rect x="19" y="8" width="10" height="10" fill={K} /><path d="M11 43L16 24H32L37 43Z" fill={K} />
    </>
  )],
  'pixel-art-maker': ['file', (c) => {
    const cols = [c.f, c.a, K, c.b, c.f, c.a, c.f, K, c.a, c.b, c.f, c.a, K, c.f, c.a, c.b];
    return (
      <>
        {cols.map((f, i) => <rect key={i} x={6 + (i % 4) * 9} y={6 + Math.floor(i / 4) * 9} width="9" height="9" fill={f} stroke={K} strokeWidth="2" {...mo('b', {}, ((i % 4) + Math.floor(i / 4)) * 0.2)} />)}
        <rect x="3" y="3" width="42" height="42" fill="none" {...ST} />
      </>
    );
  }],
  'screenshot-framer': ['file', (c) => (
    <>
      <rect x="3" y="5" width="42" height="38" fill={c.a} {...ST} />
      <rect x="7" y="8" width="3" height="3" fill={c.f} /><rect x="12" y="8" width="3" height="3" fill={c.f} />
      <rect x="9" y="15" width="30" height="23" fill={c.f} {...ST} {...mo('s', { '--s0': 1.3 })} />
      <rect x="13" y="20" width="14" height="3" fill={K} /><rect x="13" y="26" width="20" height="8" fill={c.b} />
    </>
  )],

  /* ---------------- Productivity and student (black) ---------------- */
  'vector-qr-maker': ['prod', (c) => {
    const finder = (x: number, y: number) => (<g key={`${x}${y}`}><rect x={x} y={y} width="14" height="14" fill={c.f} /><rect x={x + 3} y={y + 3} width="8" height="8" fill={K} /><rect x={x + 5} y={y + 5} width="4" height="4" fill={c.f} /></g>);
    return (
      <>
        {finder(5, 5)}{finder(29, 5)}{finder(5, 29)}
        {[[29, 29], [37, 29], [33, 33], [29, 37], [41, 37], [37, 41]].map(([x, y], i) => <rect key={i} x={x} y={y} width="4" height="4" fill={c.f} {...mo('b', {}, i * 0.25)} />)}
        <rect x="3" y="40" width="42" height="3" fill={c.a} {...mo('m', Y(-30))} />
      </>
    );
  }],
  'unit-currency-matrix': ['prod', (c) => (
    <>
      <rect x="4" y="6" width="40" height="12" fill={c.f} {...ST} />
      {[8, 13, 18, 23, 28, 33, 38].map((x, i) => <rect key={x} x={x} y="6" width="2" height={i % 2 ? 5 : 8} fill={K} />)}
      <rect x="8" y="26" width="14" height="14" fill={c.a} {...ST} {...mo('m', X(18))} /><rect x="26" y="26" width="14" height="14" fill={c.b} stroke={c.f} strokeWidth="3" {...mo('m', X(-18))} />
    </>
  )],
  'global-time-zone-sync': ['prod', (c) => (
    <>
      <rect x="3" y="13" width="18" height="18" fill={c.f} {...ST} /><rect x="27" y="13" width="18" height="18" fill={c.f} {...ST} />
      <path d="M12 22V16" stroke={K} strokeWidth="3" {...mo('t', HAND(12, 22), 0, 6)} /><path d="M36 22V16" stroke={K} strokeWidth="3" {...mo('t', HAND(36, 22), 1.5, 6)} />
      <rect x="10" y="20" width="4" height="4" fill={c.a} /><rect x="34" y="20" width="4" height="4" fill={c.a} />
      <path d="M21 22H27" stroke={c.a} strokeWidth="3" />
      <rect x="6" y="36" width="12" height="5" fill={c.a} /><rect x="30" y="36" width="12" height="5" fill={c.b} {...mo('m', X(-24))} />
    </>
  )],
  'pomodoro-focus-studio': ['prod', (c) => (
    <>
      <rect x="20" y="4" width="8" height="5" fill={c.a} />
      <rect x="8" y="9" width="32" height="32" fill={c.f} {...ST} />
      <path d="M24 24V15" stroke={K} strokeWidth="3" {...mo('t', HAND(24, 24), 0, 8)} /><rect x="22" y="22" width="4" height="4" fill={c.a} />
      <rect x="12" y="33" width="24" height="4" fill={c.f} stroke={K} strokeWidth="2" /><rect x="13" y="34" width="22" height="2" fill={c.b} {...mo('w', LEFT)} />
    </>
  )],
  'invoice-builder': ['prod', (c) => (
    <>
      <path d="M9 4H39V44L35 40.5L31 44L27 40.5L23 44L19 40.5L15 44L9 40Z" fill={c.f} {...ST} />
      <rect x="14" y="10" width="20" height="3" fill={K} /><rect x="14" y="16" width="14" height="3" fill={K} /><rect x="14" y="22" width="20" height="3" fill={K} />
      <rect x="14" y="30" width="12" height="4" fill={c.a} {...mo('w', LEFT)} />
      <rect x="28" y="28" width="9" height="9" fill={G1} {...ST} {...mo('p', {}, 0.3)} /><path d="M30 33L32.5 35.5L36 30" fill="none" stroke="#fff" strokeWidth="2.5" {...mo('p', {}, 0.3)} />
    </>
  )],
  'habit-heatmap-tracker': ['prod', (c) => {
    const lv = [0, 1, 2, 0, 3, 1, 2, 3, 1, 0, 3, 2, 1, 3, 3, 0, 2, 3, 3, 2];
    const fill = [c.f, c.a, c.b, '#2F8F66'];
    return (
      <>
        {lv.map((v, i) => <rect key={i} x={6 + (i % 5) * 7.6} y={8 + Math.floor(i / 5) * 8.5} width="6.4" height="7" fill={v === 0 ? '#3a3a3a' : fill[v]} {...mo('b', { '--o1': 0.1 }, ((i % 5) + Math.floor(i / 5)) * 0.18)} />)}
        <rect x="6" y="40" width="36" height="3" fill={c.f} opacity=".5" />
      </>
    );
  }],
  'password-engine': ['prod', (c) => (
    <>
      <path d="M17 22V14H31V22" fill="none" stroke={c.f} strokeWidth="4" {...mo('m', Y(-7))} />
      <rect x="11" y="22" width="26" height="19" fill={c.a} {...ST} />
      <rect x="22" y="28" width="4" height="8" fill={K} />
      <rect x="6" y="44" width="4" height="2" fill={c.f} /><rect x="14" y="44" width="4" height="2" fill={c.f} /><rect x="22" y="44" width="4" height="2" fill={c.f} />
    </>
  )],
  'multi-tally-counter': ['prod', (c) => (
    <>
      {[9, 17, 25, 33].map((x, i) => <rect key={x} x={x} y="9" width="4" height="30" fill={c.f} {...mo('h', { '--s0': 0.05, '--o': 'center bottom' }, i * 0.18)} />)}
      <path d="M5 33L43 14" stroke={c.a} strokeWidth="4" strokeDasharray="44" {...mo('d', { '--len': 44 }, 0.7)} />
    </>
  )],
  'email-signature-designer': ['prod', (c) => (
    <>
      <rect x="4" y="9" width="40" height="30" fill={c.f} {...ST} /><path d="M4 9L24 25L44 9" fill="none" stroke={K} strokeWidth="3" />
      <path d="M10 34Q14 26 16 33T22 31T28 33H36" fill="none" stroke={G1} strokeWidth="3" strokeDasharray="44" {...mo('d', { '--len': 44 })} />
      <rect x="34" y="28" width="6" height="3" fill={c.a} />
    </>
  )],
  'flashcard-revision-studio': ['prod', (c) => (
    <>
      <g {...mo('flipB')}>
        <rect x="8" y="9" width="32" height="30" fill={c.a} {...ST} />
        <path d="M17 24L22 29L31 18" fill="none" stroke={K} strokeWidth="4" />
      </g>
      <g {...mo('flipA')}>
        <rect x="8" y="9" width="32" height="30" fill={c.f} {...ST} />
        <text x="24" y="31" textAnchor="middle" fontSize="20" fill={K} style={FONT_D}>?</text>
      </g>
      <rect x="12" y="42" width="24" height="3" fill={c.f} opacity=".6" />
    </>
  )],
  'student-deadline-grade-planner': ['prod', (c) => (
    <>
      <rect x="5" y="7" width="38" height="36" fill={c.f} {...ST} />
      <rect x="5" y="7" width="38" height="9" fill={c.a} {...ST} /><rect x="12" y="4" width="3" height="7" fill={K} /><rect x="33" y="4" width="3" height="7" fill={K} />
      {[0, 1, 2, 3].map((i) => [0, 1].map((j) => <rect key={`${i}${j}`} x={9 + i * 9} y={21 + j * 9} width="6" height="6" fill="#DCCBAE" />))}
      <rect x="27" y="30" width="6" height="6" fill={c.b} {...mo('p')} /><path d="M28 33L30 35L33 30" fill="none" stroke="#fff" strokeWidth="2" {...mo('p')} />
    </>
  )],
  'encrypted-scratchpad': ['prod', (c) => (
    <>
      <rect x="7" y="5" width="28" height="38" fill={c.f} {...ST} />
      <rect x="11" y="11" width="20" height="3" fill={K} {...mo('b', { '--o1': 0.15 })} /><rect x="11" y="18" width="16" height="3" fill={K} {...mo('b', { '--o1': 0.15 }, 0.3)} /><rect x="11" y="25" width="20" height="3" fill={K} {...mo('b', { '--o1': 0.15 }, 0.6)} />
      <rect x="25" y="30" width="19" height="14" fill={c.a} {...ST} {...mo('p')} /><path d="M29 30V26H40V30" fill="none" stroke={c.f} strokeWidth="3" /><rect x="33" y="35" width="3" height="5" fill={K} />
    </>
  )],

  /* ---------------- Developer and data (cream) ---------------- */
  'github-readme-studio': ['dev', (c) => (
    <>
      <path d="M10 4H30L38 12V44H10Z" fill={c.f} {...ST} /><path d="M30 4V12H38" fill="none" stroke={K} strokeWidth="3" />
      <rect x="14" y="16" width="18" height="6" fill={c.a} {...mo('w', LEFT)} />
      <rect x="14" y="26" width="20" height="3" fill={K} {...mo('w', LEFT, 0.2)} /><rect x="14" y="32" width="15" height="3" fill={K} {...mo('w', LEFT, 0.4)} /><rect x="14" y="38" width="10" height="3" fill={K} {...mo('w', LEFT, 0.6)} />
      <rect x="14" y="8" width="6" height="4" fill={c.b} />
    </>
  )],
  'terminal-pastebin': ['dev', (c) => (
    <>
      <rect x="4" y="7" width="40" height="34" fill={K} {...ST} />
      <rect x="8" y="10" width="3" height="3" fill={c.b} /><rect x="13" y="10" width="3" height="3" fill={c.a} /><rect x="18" y="10" width="3" height="3" fill={PP} />
      <path d="M9 21L15 26L9 31" fill="none" stroke={c.b} strokeWidth="3" />
      <rect x="19" y="24" width="14" height="3" fill={PP} {...mo('w', LEFT)} /><rect x="35" y="22" width="4" height="8" fill={c.b} {...mo('c')} />
      <rect x="9" y="35" width="22" height="2" fill={PP} opacity=".55" {...mo('w', LEFT, 0.5)} />
    </>
  )],
  'base64-studio': ['dev', (c) => (
    <>
      {[0, 1, 2].map((r) => [0, 1].map((q) => <rect key={`${r}${q}`} x={5 + q * 8} y={11 + r * 9} width="7" height="7" fill={(r + q) % 2 ? K : c.f} {...ST} strokeWidth="2" {...mo('b', { '--o1': 0.25 }, (r * 2 + q) * 0.25)} />))}
      <path d="M21 24H31M27 19L32 24L27 29" fill="none" stroke={K} strokeWidth="3" {...mo('m', X(-4))} />
      {[0, 1, 2].map((r) => <rect key={r} x="34" y={11 + r * 9} width="10" height="7" fill={r === 1 ? c.b : c.a} {...ST} strokeWidth="2" />)}
    </>
  )],
  'jwt-inspector': ['dev', (c) => (
    <>
      <rect x="5" y="7" width="38" height="10" fill={RD} {...ST} /><rect x="5" y="19" width="38" height="10" fill={c.b} {...ST} /><rect x="5" y="31" width="38" height="10" fill={c.a} {...ST} />
      <rect x="9" y="11" width="14" height="2" fill={PP} /><rect x="9" y="23" width="22" height="2" fill={K} /><rect x="9" y="35" width="18" height="2" fill={PP} />
      <g {...mo('m', X(-20))}>
        <rect x="24" y="14" width="14" height="14" fill="#fff" fillOpacity=".35" {...ST} /><path d="M36 27L42 33" stroke={K} strokeWidth="4" />
      </g>
    </>
  )],
  'env-file-validator': ['dev', (c) => (
    <>
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x="5" y={9 + r * 12} width="12" height="5" fill={K} /><rect x="19" y={9 + r * 12} width="4" height="2" fill={K} /><rect x="19" y={12 + r * 12} width="4" height="2" fill={K} />
          <rect x="25" y={9 + r * 12} width="10" height="5" fill={c.b} />
          <rect x="37" y={7 + r * 12} width="8" height="9" fill={r === 2 ? RD : G1} {...ST} strokeWidth="2" {...mo('p', {}, r * 0.35)} />
        </g>
      ))}
      <path d="M39 12L41 14L43.5 9.5M39.5 20L43 24M43 20L39.5 24M39 34L41 36L43.5 31.5" fill="none" stroke="#fff" strokeWidth="2" />
    </>
  )],
  'multi-hash-calculator': ['dev', (c) => (
    <>
      <path d="M19 6L15 34M33 6L29 34M9 16H41M7 26H39" fill="none" stroke={K} strokeWidth="4" {...mo('s', { '--s0': 0.7 })} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={5 + i * 7} y="40" width="5" height="5" fill={i % 2 ? c.b : c.a} {...ST} strokeWidth="2" {...mo('b', {}, i * 0.18)} />)}
    </>
  )],
  'uuid-ulid-generator': ['dev', (c) => {
    const row = (y: number, ws: number[]) => { let x = 4; return ws.map((w, i) => { const el = <g key={i}><rect x={x} y={y} width={w} height="9" fill={[c.a, K, c.b][i % 3]} {...ST} strokeWidth="2" {...mo('b', { '--o1': 0.2 }, (y + i) * 0.07)} />{i < ws.length - 1 && <rect x={x + w + 1} y={y + 4} width="2" height="2" fill={K} />}</g>; x += w + 4; return el; }); };
    return <>{row(10, [14, 8, 8, 6])}{row(26, [6, 8, 8, 14])}<rect x="4" y="40" width="40" height="3" fill={K} /></>;
  }],
  'code-snapshot-studio': ['dev', (c) => (
    <>
      <rect x="8" y="11" width="32" height="27" fill={K} {...ST} />
      <rect x="11" y="14" width="3" height="3" fill={c.b} /><rect x="16" y="14" width="3" height="3" fill={c.a} /><rect x="21" y="14" width="3" height="3" fill={PP} />
      <rect x="11" y="21" width="12" height="3" fill={c.b} /><rect x="25" y="21" width="9" height="3" fill={PP} /><rect x="15" y="27" width="16" height="3" fill={c.a} /><rect x="11" y="32" width="8" height="3" fill={PP} />
      <rect x="8" y="11" width="32" height="27" fill="#fff" {...mo('flash')} />
      <g {...mo('s', { '--s0': 1.18 })} fill="none" stroke={K} strokeWidth="3"><path d="M3 15V5H13M35 5H45V15M45 33V43H35M13 43H3V33" /></g>
    </>
  )],
  'webhook-inspector-replayer': ['dev', (c) => (
    <>
      <path d="M3 22H45" stroke={K} strokeWidth="3" />
      <rect x="32" y="10" width="13" height="24" fill={c.b} {...ST} /><rect x="35" y="15" width="7" height="3" fill={K} /><rect x="35" y="21" width="7" height="3" fill={K} />
      <rect x="4" y="16" width="11" height="11" fill={c.a} {...ST} {...mo('f', { '--x0': '-18px', '--x1': '15px' }, 0, 2.4)} />
      <path d="M36 41H14M18 37L14 41L18 45" fill="none" stroke={K} strokeWidth="3" /><rect x="22" y="39" width="6" height="4" fill={c.a} {...mo('m', X(14))} />
    </>
  )],
  'mock-rest-api-studio': ['dev', (c) => (
    <>
      {[7, 28].map((y, i) => (
        <g key={y}>
          <rect x="5" y={y} width="38" height="14" fill={c.f} {...ST} />
          <rect x="9" y={y + 5} width="4" height="4" fill={i ? c.b : c.a} {...mo('b', {}, i * 0.8)} /><rect x="16" y={y + 5} width="4" height="4" fill={i ? c.a : c.b} {...mo('b', {}, 0.4 + i * 0.8)} />
          <rect x="26" y={y + 5} width="13" height="4" fill={K} />
        </g>
      ))}
      <rect x="18" y="22" width="12" height="5" fill={c.a} {...ST} strokeWidth="2" {...mo('m', X(26))} />
    </>
  )],
  'cron-schedule-helper': ['dev', (c) => (
    <>
      <rect x="9" y="4" width="30" height="28" fill={c.f} {...ST} />
      <path d="M24 8V11M24 25V28M12 18H15M33 18H36" stroke={K} strokeWidth="2" /><path d="M24 18V11" stroke={K} strokeWidth="3" {...mo('t', HAND(24, 18), 0, 6)} /><rect x="22" y="16" width="4" height="4" fill={c.a} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={7 + i * 7.6} y="37" width="5.6" height="7" fill={c.a} {...ST} strokeWidth="2" {...mo('b', {}, i * 0.3)} />)}
    </>
  )],
  'block-coder': ['dev', (c) => (
    <>
      <path d="M13 9Q7 9 7 15V19Q7 24 3 24Q7 24 7 29V33Q7 39 13 39" fill="none" stroke={K} strokeWidth="3" {...mo('m', X(-22))} />
      <path d="M35 9Q41 9 41 15V19Q41 24 45 24Q41 24 41 29V33Q41 39 35 39" fill="none" stroke={K} strokeWidth="3" {...mo('m', X(22))} />
      <g {...mo('p', {}, 0.1)}>
        <rect x="16" y="23" width="16" height="12" fill={c.b} {...ST} />
        <rect x="18.5" y="19.5" width="5" height="4" fill={c.b} {...ST} strokeWidth="2" /><rect x="25.5" y="19.5" width="5" height="4" fill={c.b} {...ST} strokeWidth="2" />
      </g>
    </>
  )],

  /* ---------------- Business and web (deep green) ---------------- */
  'social-meta-tag-previewer': ['biz', (c) => (
    <>
      <clipPath id="pgc-social"><rect x="6" y="6" width="36" height="36" /></clipPath>
      <rect x="6" y="6" width="36" height="36" fill={c.f} />
      <g clipPath="url(#pgc-social)"><g {...mo('m', X(-42))}><rect x="6" y="6" width="36" height="19" fill={c.a} /><path d="M6 25L17 13L25 21L31 15L42 25Z" fill={c.b} stroke={K} strokeWidth="3" /></g></g>
      <rect x="10" y="29" width="26" height="3" fill={K} {...mo('w', LEFT)} /><rect x="10" y="35" width="18" height="3" fill={K} opacity=".6" {...mo('w', LEFT, 0.2)} />
      <rect x="6" y="6" width="36" height="36" fill="none" {...ST} />
    </>
  )],
  'wcag-contrast-studio': ['biz', (c) => (
    <>
      <rect x="5" y="7" width="24" height="24" fill={c.f} {...ST} />
      <rect x="17" y="17" width="26" height="25" fill={K} stroke={c.f} strokeWidth="3" {...mo('m', X(-9))} />
      <text x="17" y="27" textAnchor="middle" fontSize="15" fill={K} style={FONT_D}>A</text>
      <text x="32" y="36" textAnchor="middle" fontSize="15" fill={c.f} {...mo('m', X(-9))}>A</text>
      <rect x="34" y="4" width="10" height="10" fill={G1} {...ST} strokeWidth="2" {...mo('p')} /><path d="M36 9L38.5 11.5L42 6.5" fill="none" stroke="#fff" strokeWidth="2" {...mo('p')} />
    </>
  )],
  'visual-sitemap-planner': ['biz', (c) => (
    <>
      <path d="M24 14V23M10 23H38M10 23V32M24 23V32M38 23V32" fill="none" stroke={c.f} strokeWidth="3" />
      <rect x="17" y="5" width="14" height="9" fill={c.a} {...ST} />
      <rect x="4" y="32" width="13" height="10" fill={c.f} {...ST} /><rect x="18" y="32" width="13" height="10" fill={c.f} {...ST} />
      <rect x="32" y="32" width="13" height="10" fill={c.b} stroke={c.f} strokeWidth="3" {...mo('m', X(40))} />
    </>
  )],
  'screen-aspect-ratio-matrix': ['biz', (c) => (
    <>
      <rect x="4" y="8" width="40" height="32" fill={c.f} {...ST} />
      <rect x="10" y="16" width="28" height="16" fill={c.a} {...ST} {...mo('xy', { '--a0': 0.65, '--b0': 1.5 })} />
      <rect x="21" y="40" width="6" height="4" fill={c.f} /><rect x="14" y="43" width="20" height="2" fill={c.f} />
    </>
  )],
  'utm-link-builder': ['biz', (c) => (
    <>
      <rect x="4" y="8" width="40" height="13" fill={c.f} {...ST} /><rect x="8" y="13" width="20" height="3" fill={K} />
      <text x="36" y="19" textAnchor="middle" fontSize="12" fill={K} style={FONT_D}>?</text>
      <rect x="5" y="27" width="16" height="7" fill={c.a} {...ST} {...mo('m', X(48))} /><rect x="24" y="27" width="12" height="7" fill={c.f} {...ST} {...mo('m', X(48), 0.15)} />
      <rect x="5" y="37" width="12" height="7" fill={c.b} stroke={c.f} strokeWidth="3" {...mo('m', X(48), 0.3)} /><rect x="20" y="37" width="18" height="7" fill={c.a} {...ST} {...mo('m', X(48), 0.45)} />
    </>
  )],
  'privacy-policy-generator': ['biz', (c) => (
    <>
      <path d="M24 4L41 10V25L24 44L7 25V10Z" fill={c.f} {...ST} />
      <path d="M15 24L22 31L34 16" fill="none" stroke={G1} strokeWidth="5" strokeDasharray="40" {...mo('d', { '--len': 40 })} />
    </>
  )],
  'terms-of-service-builder': ['biz', (c) => (
    <>
      <rect x="8" y="4" width="28" height="40" fill={c.f} {...ST} />
      <rect x="12" y="10" width="20" height="3" fill={K} /><rect x="12" y="16" width="20" height="3" fill={K} /><rect x="12" y="22" width="13" height="3" fill={K} />
      <path d="M12 37L16 30L19 38L23 31L26 36H31" fill="none" stroke={G1} strokeWidth="3" strokeDasharray="40" {...mo('d', { '--len': 40 })} />
      <rect x="31" y="28" width="12" height="12" fill={c.a} {...ST} {...mo('p', {}, 0.3)} />
    </>
  )],
  'git-license-generator': ['biz', (c) => (
    <>
      <path d="M12 5V43M12 13L30 20V28L12 36" fill="none" stroke={c.f} strokeWidth="3" />
      {[[12, 6], [12, 24], [12, 41], [30, 24]].map(([x, y], i) => <rect key={i} x={x - 4} y={y - 4} width="8" height="8" fill={i === 3 ? c.a : c.f} {...ST} {...mo('b', { '--o1': 0.4 }, i * 0.3)} />)}
      <rect x="25" y="33" width="20" height="11" fill={c.a} {...ST} {...mo('p')} />
      <text x="35" y="42" textAnchor="middle" fontSize="9" fill={K} style={FONT_D}>MIT</text>
    </>
  )],
  'http-protocol-reference': ['biz', (c) => (
    <>
      {reel('pgc-http', c, [['404', RD], ['500', GD], ['200', G1], ['404', RD]], { x: 6, y: 14, w: 36 }, FONT_D)}
      <rect x="6" y="38" width="36" height="3" fill={c.f} opacity=".6" /><rect x="6" y="6" width="14" height="3" fill={c.a} />
    </>
  )],
  'color-system-generator': ['biz', (c) => (
    <>
      {[PP, CR, GD, G1, K].map((f, i) => <rect key={i} x={5 + i * 8.6} y="8" width="7.6" height="30" fill={f} {...ST} strokeWidth="2.5" {...mo('m', Y(7), i * 0.14)} />)}
      <rect x="5" y="42" width="38" height="2" fill={c.f} opacity=".6" />
    </>
  )],
  'modular-type-scale-calculator': ['biz', (c) => (
    <>
      <text x="4" y="38" fontSize="14" fill={c.f} {...mo('s', { '--s0': 0.6, '--o': 'left bottom' })}>A</text>
      <text x="15" y="38" fontSize="22" fill={c.f} {...mo('s', { '--s0': 0.6, '--o': 'left bottom' }, 0.15)}>A</text>
      <text x="29" y="38" fontSize="34" fill={c.a} {...mo('s', { '--s0': 0.6, '--o': 'left bottom' }, 0.3)}>A</text>
      <rect x="4" y="41" width="40" height="3" fill={c.a} />
    </>
  )],
  'faq-schema-builder': ['biz', (c) => (
    <>
      <g {...mo('m', X(-40))}><path d="M4 6H30V24H14L8 30V24H4Z" fill={c.f} {...ST} /><text x="17" y="21" textAnchor="middle" fontSize="16" fill={K} style={FONT_D}>?</text></g>
      <g {...mo('m', X(40), 0.3)}><path d="M18 27H44V43H40V48L34 43H18Z" fill={c.a} {...ST} /><rect x="22" y="32" width="18" height="3" fill={K} /><rect x="22" y="38" width="11" height="3" fill={K} /></g>
    </>
  )],
};

export function Pictogram({ slug, size = 48, still, className }: { slug: string; size?: number; still?: boolean; className?: string }) {
  const e = ICONS[slug];
  const c = PAL[e?.[0] ?? 'dev'];
  const quiet = still ?? size < 64;
  return (
    <svg className={`pg${quiet ? ' still' : ''}${className ? ' ' + className : ''}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden focusable="false">
      <rect width="48" height="48" fill={c.bg} />
      {e ? e[1](c) : <rect x="12" y="12" width="24" height="24" fill={c.f} {...ST} />}
    </svg>
  );
}

export const pictogramSlugs = Object.keys(ICONS);
