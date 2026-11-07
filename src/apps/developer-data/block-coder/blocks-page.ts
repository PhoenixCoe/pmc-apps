/**
 * More web page blocks for the Block Coder: boxes (card, grid, nav bar, drop-down, scroll box), more things to touch
 * (big text box, date and time pickers), more page items (quote, code, badge, table, video, sound) and more fun
 * (counter, clock, stopwatch, countdown, typewriter, mouse follower, emoji rain), plus the colour palette block.
 * Like the rest of the Block Coder this file only builds text: HTML, CSS and JavaScript as strings.
 */
import type { Def, ParamDef, PortDef, Params, Val } from './graph';

const INSIDE: PortDef = { key: 'inside', label: 'put inside', as: 'any', accepts: 'box', empty: 'the page' };
const LOOK: PortDef = { key: 'look', label: 'look', as: 'any', accepts: 'style', empty: 'plain' };
const noEmit = () => '';
const SEL = (key: string, label: string, options: string[], def?: string): ParamDef => ({ key, label, type: 'select', options, def: def ?? options[0] });
const TXT = (key: string, label: string, def: string, placeholder?: string): ParamDef => ({ key, label, type: 'text', def, ...(placeholder ? { placeholder } : {}) });
const NUM = (key: string, label: string, def: number): ParamDef => ({ key, label, type: 'number', def });
const LABEL: ParamDef = { key: 'label', label: 'Label', type: 'text', def: '', placeholder: 'optional' };
const s = (v: Val | undefined) => String(v ?? '');
const q = JSON.stringify;

export const GAPS: Record<string, string> = { small: '6px', medium: '12px', large: '24px' };

/** The page items that hold other things, and the HTML tag each one becomes. */
export const BOX_TAGS: Record<string, string> = { box: 'div', card: 'article', grid: 'div', navbar: 'nav', details: 'details', scrollbox: 'div' };
/** Page items that get a class of their own (card1, clock2...) so their CSS has somewhere to go. */
export const CLASSED = new Set([...Object.keys(BOX_TAGS), 'canvas', 'player', 'bouncer', 'follower', 'badge', 'counter', 'clock', 'stopwatch', 'countdown', 'typewriter', 'rain']);
/** Page items the JavaScript has to find by name because they have a script of their own. */
export const SCRIPTED = new Set(['counter', 'clock', 'stopwatch', 'countdown', 'typewriter', 'follower', 'rain']);
/** Things people touch that hand on a value. */
export const VALUE_ELEMENTS = new Set(['textarea', 'datepick', 'timepick']);
export const EXTRA_ELEMENTS = ['textarea', 'datepick', 'timepick', 'quote', 'code', 'badge', 'spacer', 'table', 'video', 'audio', 'counter', 'clock', 'stopwatch', 'countdown', 'typewriter', 'follower', 'rain',
  'card', 'grid', 'navbar', 'details', 'scrollbox'];

export const PALETTES: Record<string, { back: string; text: string; accent: string; on: string; soft: string }> = {
  PMC: { back: '#f2e4ce', text: '#171717', accent: '#337957', on: '#f2e4ce', soft: '#fbf6ec' },
  Sunset: { back: '#fff1e6', text: '#3b1f2b', accent: '#e4572e', on: '#ffffff', soft: '#ffe0cc' },
  Ocean: { back: '#e8f4fb', text: '#0b2540', accent: '#1c7ed6', on: '#ffffff', soft: '#cfe8f7' },
  Forest: { back: '#eef5ea', text: '#17301d', accent: '#2f7d3a', on: '#ffffff', soft: '#d9ebd2' },
  Candy: { back: '#fff0f7', text: '#4a1d3d', accent: '#e0338f', on: '#ffffff', soft: '#ffd9ec' },
  Night: { back: '#10131f', text: '#eef0f8', accent: '#7c9cff', on: '#10131f', soft: '#1b2033' },
  Paper: { back: '#ffffff', text: '#1a1a1a', accent: '#1a1a1a', on: '#ffffff', soft: '#f1f1f1' },
  Mono: { back: '#f4f4f4', text: '#111111', accent: '#555555', on: '#ffffff', soft: '#e6e6e6' },
};

const hex = (v: Val | undefined) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v : '');
/** Black or white, whichever reads on a colour. */
const onColour = (c: string) => {
  const h = c.replace('#', ''), f = h.length === 3 ? [...h].map((x) => x + x).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 2.55 > 55 ? '#171717' : '#ffffff';
};

export const pageExtraDefs: Def[] = [
  // ---- things to touch
  { kind: 'textarea', name: 'Big text box', group: 'widget', blurb: 'A box to type a lot of text in', out: 'el',
    inputs: [{ key: 'text', label: 'hint', as: 'text', def: 'Write here', bind: 'placeholder' }, INSIDE, LOOK], params: [NUM('rows', 'Rows', 4)], emit: noEmit },
  { kind: 'datepick', name: 'Date picker', group: 'widget', blurb: 'Let people pick a date', out: 'el', inputs: [INSIDE, LOOK], params: [LABEL, TXT('start', 'Start', '', '2026-12-25')], emit: noEmit },
  { kind: 'timepick', name: 'Time picker', group: 'widget', blurb: 'Let people pick a time', out: 'el', inputs: [INSIDE, LOOK], params: [LABEL, TXT('start', 'Start', '', '09:30')], emit: noEmit },

  // ---- page items
  { kind: 'quote', name: 'Quote', group: 'page', blurb: 'A quote with a line down the side and who said it', out: 'el',
    inputs: [{ key: 'text', label: 'words', as: 'text', def: 'Make it work, then make it good.', bind: 'textContent' }, INSIDE, LOOK], params: [TXT('by', 'Said by', 'Someone wise')], emit: noEmit },
  { kind: 'code', name: 'Code box', group: 'page', blurb: 'Show some code or text exactly as typed', out: 'el',
    inputs: [{ key: 'text', label: 'code', as: 'text', def: 'const hello = "world";', bind: 'textContent' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'badge', name: 'Badge', group: 'page', blurb: 'A small label in a pill, like NEW or 3 left', out: 'el',
    inputs: [{ key: 'text', label: 'text', as: 'text', def: 'NEW', bind: 'textContent' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'spacer', name: 'Space', group: 'page', blurb: 'An empty gap between things', out: 'el', inputs: [INSIDE], params: [SEL('size', 'Size', ['small', 'medium', 'large', 'huge'], 'medium')], emit: noEmit },
  { kind: 'table', name: 'Table', group: 'page', blurb: 'Rows and columns. Rows split with ; and cells with ,', out: 'el', inputs: [INSIDE, LOOK],
    params: [TXT('rows', 'Rows', 'Name, Score; Sam, 12; Ada, 15; Lin, 9', 'a, b; c, d'), SEL('head', 'First row is', ['a header', 'ordinary'])], emit: noEmit },
  { kind: 'video', name: 'Video', group: 'page', blurb: 'A video player (paste the web address of a video file)', out: 'el',
    inputs: [{ key: 'address', label: 'address', as: 'text', def: '', bind: 'src' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'audio', name: 'Sound player', group: 'page', blurb: 'A sound player (paste the web address of a sound file)', out: 'el',
    inputs: [{ key: 'address', label: 'address', as: 'text', def: '', bind: 'src' }, INSIDE, LOOK], params: [], emit: noEmit },

  // ---- boxes
  { kind: 'card', name: 'Card', group: 'page', blurb: 'A box with a border and room inside, for grouping things', out: 'box', inputs: [INSIDE, LOOK], params: [SEL('gap', 'Gap', Object.keys(GAPS), 'medium')], emit: noEmit },
  { kind: 'grid', name: 'Grid', group: 'page', blurb: 'Lays things out in columns', out: 'box', inputs: [INSIDE, LOOK],
    params: [SEL('cols', 'Columns', ['2', '3', '4', 'as many as fit'], '3'), SEL('gap', 'Gap', Object.keys(GAPS), 'medium')], emit: noEmit },
  { kind: 'navbar', name: 'Nav bar', group: 'page', blurb: 'A row across the top for links and buttons', out: 'box', inputs: [INSIDE, LOOK], params: [SEL('spread', 'Spread', ['together', 'apart'])], emit: noEmit },
  { kind: 'details', name: 'Drop-down panel', group: 'page', blurb: 'A title that opens to show what is inside it', out: 'box', inputs: [INSIDE, LOOK],
    params: [TXT('title', 'Title', 'Click to open'), SEL('open', 'Starts', ['closed', 'open'])], emit: noEmit },
  { kind: 'scrollbox', name: 'Scroll box', group: 'page', blurb: 'A box that scrolls when it has too much in it', out: 'box', inputs: [INSIDE, LOOK], params: [SEL('height', 'Height', ['small', 'medium', 'large'], 'medium')], emit: noEmit },

  // ---- fun
  { kind: 'counter', name: 'Counter', group: 'fun', blurb: 'A number with − and + buttons', out: 'el', inputs: [INSIDE, LOOK],
    params: [NUM('start', 'Start at', 0), NUM('step', 'Step', 1)], emit: noEmit },
  { kind: 'clock', name: 'Clock', group: 'fun', blurb: 'The time or date, kept up to date', out: 'el', inputs: [INSIDE, LOOK],
    params: [SEL('show', 'Show', ['time', 'time without seconds', '12-hour time', 'date', 'date and time'])], emit: noEmit },
  { kind: 'stopwatch', name: 'Stopwatch', group: 'fun', blurb: 'Start, stop and reset buttons with a running time', out: 'el', inputs: [INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'countdown', name: 'Countdown', group: 'fun', blurb: 'Days, hours, minutes and seconds left until a date', out: 'el', inputs: [INSIDE, LOOK], params: [TXT('date', 'Date', '2026-12-25', '2026-12-25')], emit: noEmit },
  { kind: 'typewriter', name: 'Typewriter', group: 'fun', blurb: 'Words that type themselves out', out: 'el', inputs: [INSIDE, LOOK],
    params: [TXT('text', 'Words', 'Hello! I was made with blocks.'), SEL('speed', 'Speed', ['slow', 'normal', 'fast'], 'normal')], emit: noEmit },
  { kind: 'follower', name: 'Mouse follower', group: 'fun', blurb: 'Something that follows the mouse or your finger', out: 'el',
    inputs: [{ key: 'text', label: 'face', as: 'text', def: '✨', bind: 'textContent' }, LOOK], params: [SEL('size', 'Size', ['medium', 'big', 'huge'], 'medium')], emit: noEmit },
  { kind: 'rain', name: 'Falling things', group: 'fun', blurb: 'Emoji falling (or rising) behind the page', out: 'el', inputs: [],
    params: [TXT('things', 'Things', '💧 🌧️ ✨', '🍕 🎉'), SEL('amount', 'Amount', ['a few', 'some', 'lots'], 'some'), SEL('way', 'Move', ['fall', 'rise'])], emit: noEmit },

  // ---- look
  { kind: 'palette', name: 'Colour palette', group: 'look', blurb: 'One set of colours for the whole page: back, text, buttons, links and headings', out: 'none', inputs: [],
    params: [SEL('theme', 'Theme', Object.keys(PALETTES), 'Ocean'), { key: 'accent', label: 'Accent', type: 'color', def: '' }, SEL('page', 'Page back', ['colour the page', 'leave it alone'])], emit: noEmit },
];

// ------------------------------------------------------------------ HTML
export interface HtmlCtx {
  pad: string; nm: string; body: string[]; esc: (s: string) => string;
  /** The attributes every item gets: its id (when the script needs it) and its classes. Pass extra attributes starting with a space. */
  at: (more?: string) => string;
  /** The text typed into a field, or null when a wire fills it in. */
  val: (key: string) => string | null;
  labelled: (control: string) => void;
}
const csvCells = (x: string, sep: string) => x.split(sep).map((c) => c.trim());

/** Writes the HTML for the page items in this file. Returns false when the item is not one of theirs. */
export function extraHtml(kind: string, v: Params, c: HtmlCtx): boolean {
  const { pad, body, at, val, esc } = c;
  const text = () => val('text') ?? '';
  switch (kind) {
    case 'textarea': body.push(`${pad}<textarea rows="${Math.max(1, Number(v.rows) || 4)}"${at(val('text') !== null ? ` placeholder="${val('text')}"` : '')}></textarea>`); return true;
    case 'datepick': c.labelled(`<input type="date"${at(/^\d{4}-\d{2}-\d{2}$/.test(s(v.start)) ? ` value="${s(v.start)}"` : '')}>`); return true;
    case 'timepick': c.labelled(`<input type="time"${at(/^\d{2}:\d{2}$/.test(s(v.start)) ? ` value="${s(v.start)}"` : '')}>`); return true;
    case 'quote': body.push(`${pad}<blockquote${at(s(v.by).trim() ? ` data-by="${esc(s(v.by).trim())}"` : '')}>${text()}</blockquote>`); return true;
    case 'code': body.push(`${pad}<pre${at()}>${text()}</pre>`); return true;
    case 'badge': body.push(`${pad}<span${at()}>${text()}</span>`); return true;
    case 'spacer': body.push(`${pad}<div${at(` aria-hidden="true" style="height: ${({ small: 8, medium: 24, large: 48, huge: 96 } as Record<string, number>)[s(v.size)] ?? 24}px"`)}></div>`); return true;
    case 'table': {
      const rows = s(v.rows).split(';').map((r) => csvCells(r, ',')).filter((r) => r.some(Boolean));
      if (!rows.length) { body.push(`${pad}<table${at()}></table>`); return true; }
      const head = v.head === 'a header' ? rows[0] : null, rest = head ? rows.slice(1) : rows;
      body.push(`${pad}<table${at()}>`);
      if (head) body.push(`${pad}  <thead><tr>${head.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead>`);
      body.push(`${pad}  <tbody>`);
      rest.forEach((r) => body.push(`${pad}    <tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`));
      body.push(`${pad}  </tbody>`, `${pad}</table>`);
      return true;
    }
    case 'video': body.push(`${pad}<video controls${at(val('address') ? ` src="${val('address')}"` : '')}></video>`); return true;
    case 'audio': body.push(`${pad}<audio controls${at(val('address') ? ` src="${val('address')}"` : '')}></audio>`); return true;
    case 'counter': body.push(`${pad}<div${at()}><button type="button" class="minus" aria-label="One less">−</button><output>${Number(v.start) || 0}</output><button type="button" class="plus" aria-label="One more">+</button></div>`); return true;
    case 'clock': body.push(`${pad}<time${at()}></time>`); return true;
    case 'stopwatch': body.push(`${pad}<div${at()}><output>0:00.0</output> <button type="button">Start</button> <button type="button">Reset</button></div>`); return true;
    case 'countdown': body.push(`${pad}<div${at()}></div>`); return true;
    case 'typewriter': body.push(`${pad}<p${at()}></p>`); return true;
    case 'follower': body.push(`${pad}<div${at()}>${text()}</div>`); return true;
    case 'rain': body.push(`${pad}<div${at(' aria-hidden="true"')}></div>`); return true;
    default: return false;
  }
}

// ------------------------------------------------------------------ the JavaScript each scripted item needs
const SPEED: Record<string, number> = { slow: 120, normal: 70, fast: 30 };
export const SCRIPTS: Record<string, (nm: string, v: Params) => string[]> = {
  counter: (nm, v) => {
    const step = Number(v.step) || 1;
    return [`// ${nm}: a number with − and + buttons`, `let ${nm}Count = ${Number(v.start) || 0};`, `const ${nm}Show = ${nm}.querySelector("output");`,
      `${nm}.querySelector(".minus").addEventListener("click", () => {`, `  ${nm}Count -= ${step};`, `  ${nm}Show.textContent = ${nm}Count;`, '});',
      `${nm}.querySelector(".plus").addEventListener("click", () => {`, `  ${nm}Count += ${step};`, `  ${nm}Show.textContent = ${nm}Count;`, '});'];
  },
  clock: (nm, v) => {
    const f: Record<string, string> = {
      time: 'toLocaleTimeString("en-GB")', 'time without seconds': 'toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })', '12-hour time': 'toLocaleTimeString("en-US")',
      date: 'toLocaleDateString("en-GB", { dateStyle: "full" })', 'date and time': 'toLocaleString("en-GB")',
    };
    return [`// ${nm} shows the ${s(v.show)} and keeps it up to date`, `const ${nm}Tick = () => { ${nm}.textContent = new Date().${f[s(v.show)] ?? f.time}; };`, `${nm}Tick();`, `setInterval(${nm}Tick, 1000);`];
  },
  stopwatch: (nm) => [`// ${nm}: Start, Stop and Reset`, `let ${nm}Began = 0, ${nm}Before = 0, ${nm}Timer = null;`, `const ${nm}Show = ${nm}.querySelector("output");`,
    `const ${nm}Draw = () => {`, `  const ms = ${nm}Before + (${nm}Timer ? Date.now() - ${nm}Began : 0);`,
    `  ${nm}Show.textContent = Math.floor(ms / 60000) + ":" + String(Math.floor(ms / 1000) % 60).padStart(2, "0") + "." + Math.floor(ms / 100) % 10;`, '};',
    `const [${nm}Go, ${nm}Reset] = ${nm}.querySelectorAll("button");`, `${nm}Go.addEventListener("click", () => {`,
    `  if (${nm}Timer) {`, `    ${nm}Before += Date.now() - ${nm}Began;`, `    clearInterval(${nm}Timer);`, `    ${nm}Timer = null;`, `    ${nm}Go.textContent = "Start";`, '  } else {',
    `    ${nm}Began = Date.now();`, `    ${nm}Timer = setInterval(${nm}Draw, 50);`, `    ${nm}Go.textContent = "Stop";`, '  }', `  ${nm}Draw();`, '});',
    `${nm}Reset.addEventListener("click", () => {`, `  ${nm}Before = 0;`, `  ${nm}Began = Date.now();`, `  ${nm}Draw();`, '});'],
  countdown: (nm, v) => [`// ${nm} counts down to a date`, `const ${nm}End = new Date(${q(s(v.date))});`, `const ${nm}Tick = () => {`,
    `  if (isNaN(${nm}End)) { ${nm}.textContent = "Pick a date"; return; }`, `  const seconds = Math.floor(Math.max(0, ${nm}End - Date.now()) / 1000);`,
    `  ${nm}.textContent = Math.floor(seconds / 86400) + "d " + String(Math.floor(seconds % 86400 / 3600)).padStart(2, "0") + "h " + String(Math.floor(seconds % 3600 / 60)).padStart(2, "0") + "m " + String(seconds % 60).padStart(2, "0") + "s";`,
    '};', `${nm}Tick();`, `setInterval(${nm}Tick, 1000);`],
  typewriter: (nm, v) => [`// ${nm} types its words out one letter at a time`, `const ${nm}Words = ${q(s(v.text))};`, `let ${nm}Shown = 0;`,
    `const ${nm}Type = setInterval(() => {`, `  ${nm}.textContent = ${nm}Words.slice(0, ++${nm}Shown);`, `  if (${nm}Shown >= ${nm}Words.length) clearInterval(${nm}Type);`, `}, ${SPEED[s(v.speed)] ?? 70});`],
  follower: (nm) => [`// ${nm} follows the mouse or your finger`, 'addEventListener("pointermove", (event) => {', `  ${nm}.style.left = event.clientX - ${nm}.offsetWidth / 2 + "px";`, `  ${nm}.style.top = event.clientY - ${nm}.offsetHeight / 2 + "px";`, '});'],
  rain: (nm, v) => {
    const things = Array.from(s(v.things).replace(/[\s,]+/g, ' ').trim().split(' ').filter(Boolean)), n = ({ 'a few': 12, some: 28, lots: 70 } as Record<string, number>)[s(v.amount)] ?? 28, up = v.way === 'rise';
    return [`// ${nm} makes things ${up ? 'rise' : 'fall'} behind the page`, `const ${nm}Things = ${JSON.stringify(things.length ? things : ['✨']).replace(/","/g, '", "')};`, `for (let i = 0; i < ${n}; i++) {`, '  const bit = document.createElement("span");',
      `  bit.textContent = ${nm}Things[i % ${nm}Things.length];`, `  bit.style.cssText = "position: absolute; ${up ? 'top: 100vh' : 'top: -3rem'}; font-size: " + (1 + Math.random() * 1.5) + "rem; left: " + Math.random() * 100 + "%";`,
      `  bit.animate([{ transform: "translateY(0)" }, { transform: "translateY(${up ? '-' : ''}115vh)" }], { duration: 3000 + Math.random() * 4000, delay: -Math.random() * 6000, iterations: Infinity });`, `  ${nm}.append(bit);`, '}'];
  },
};

// ------------------------------------------------------------------ CSS
/** Rules every page of this kind needs once, however many items there are. */
export const BASE_CSS: Record<string, string> = {
  textarea: 'textarea { font: inherit; padding: 0.5rem 1rem; width: 100%; max-width: 30rem; }',
  datepick: 'input[type="date"], input[type="time"] { font: inherit; padding: 0.5rem 1rem; }',
  timepick: 'input[type="date"], input[type="time"] { font: inherit; padding: 0.5rem 1rem; }',
  quote: 'blockquote { margin: 0; padding: 0.25rem 1rem; border-left: 4px solid currentColor; font-style: italic; }\nblockquote[data-by]::after { content: "— " attr(data-by); display: block; margin-top: 0.5rem; font-size: 0.9em; font-style: normal; opacity: 0.7; }',
  code: 'pre { margin: 0; padding: 1rem; background: rgba(0, 0, 0, 0.08); border-radius: 8px; font: 0.9rem/1.5 ui-monospace, Menlo, Consolas, monospace; white-space: pre-wrap; overflow: auto; }',
  table: 'table { border-collapse: collapse; }\nth, td { padding: 0.5rem 0.9rem; border: 1px solid currentColor; text-align: left; }\nth { background: rgba(0, 0, 0, 0.08); }',
  video: 'video, audio { max-width: 100%; }', audio: 'video, audio { max-width: 100%; }',
  details: 'details summary { cursor: pointer; font-weight: 700; }',
};

export function boxCss(kind: string, nm: string, v: Params): string {
  const gap = GAPS[s(v.gap)] ?? '12px';
  if (kind === 'box') return `.${nm} {\n  display: flex;\n  flex-direction: ${v.flow === 'across' ? 'row' : 'column'};\n${v.flow === 'across' ? '  flex-wrap: wrap;\n  align-items: center;\n' : ''}  gap: ${gap};\n}`;
  if (kind === 'card') return `.${nm} {\n  display: flex;\n  flex-direction: column;\n  gap: ${gap};\n  padding: 1.25rem;\n  border: 2px solid currentColor;\n  border-radius: 12px;\n  background: rgba(0, 0, 0, 0.04);\n}`;
  if (kind === 'grid') return `.${nm} {\n  display: grid;\n  grid-template-columns: ${v.cols === 'as many as fit' ? 'repeat(auto-fit, minmax(12rem, 1fr))' : `repeat(${Number(v.cols) || 3}, minmax(0, 1fr))`};\n  gap: ${gap};\n  align-items: start;\n}`;
  if (kind === 'navbar') return `.${nm} {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: ${v.spread === 'apart' ? 'space-between' : 'flex-start'};\n  gap: 1rem;\n  padding: 0.75rem 0;\n  border-bottom: 2px solid currentColor;\n}`;
  if (kind === 'details') return `.${nm} {\n  padding: 0.75rem 1rem;\n  border: 2px solid currentColor;\n  border-radius: 8px;\n}\n.${nm}[open] > summary {\n  margin-bottom: 0.75rem;\n}\n.${nm} > * + :not(summary) {\n  margin-top: 12px;\n}`;
  return `.${nm} {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  max-height: ${({ small: '8rem', medium: '16rem', large: '28rem' } as Record<string, string>)[s(v.height)] ?? '16rem'};\n  overflow: auto;\n  padding: 0.75rem;\n  border: 2px solid currentColor;\n}`;
}

/** The CSS for one scripted or classed item, or null when it needs none. */
export function itemCss(kind: string, nm: string, v: Params): string | null {
  switch (kind) {
    case 'badge': return `.${nm} {\n  display: inline-block;\n  padding: 0.15rem 0.7rem;\n  border-radius: 999px;\n  background: var(--accent, #171717);\n  color: var(--on-accent, #ffffff);\n  font-size: 0.85rem;\n  font-weight: 700;\n}`;
    case 'counter': return `.${nm} {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.${nm} output {\n  min-width: 3ch;\n  text-align: center;\n  font-size: 1.75rem;\n  font-weight: 700;\n}\n.${nm} button {\n  width: 2.5rem;\n  height: 2.5rem;\n  padding: 0;\n  font-size: 1.25rem;\n}`;
    case 'clock': return `.${nm} {\n  display: block;\n  font-size: 2rem;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n}`;
    case 'stopwatch': return `.${nm} output {\n  display: block;\n  margin-bottom: 0.5rem;\n  font-size: 2.5rem;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n}`;
    case 'countdown': return `.${nm} {\n  font-size: 1.75rem;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n}`;
    case 'typewriter': return `.${nm} {\n  min-height: 1.5em;\n  font-size: 1.5rem;\n}`;
    case 'rain': return `.${nm} {\n  position: fixed;\n  inset: 0;\n  z-index: -1;\n  overflow: hidden;\n  pointer-events: none;\n}`;
    default: return null;
  }
}

/** The rules the colour palette block writes. */
export function paletteCss(v: Params): string[] {
  const base = PALETTES[s(v.theme)] ?? PALETTES.Ocean;
  const accent = hex(v.accent) || base.accent, on = hex(v.accent) ? onColour(accent) : base.on;
  const out = [`:root {\n  --back: ${base.back};\n  --text: ${base.text};\n  --accent: ${accent};\n  --on-accent: ${on};\n  --soft: ${base.soft};\n}`];
  if (v.page !== 'leave it alone') out.push('body {\n  background-color: var(--back);\n  color: var(--text);\n}');
  out.push('a, h1, h2, h3 {\n  color: var(--accent);\n}',
    'button {\n  background: var(--accent);\n  color: var(--on-accent);\n  border: 0;\n  border-radius: 6px;\n}',
    'input, select, textarea {\n  border: 2px solid var(--accent);\n  border-radius: 6px;\n  background: var(--back);\n  color: var(--text);\n}',
    'progress, input[type="range"], input[type="checkbox"] {\n  accent-color: var(--accent);\n}',
    'article, details, pre {\n  background: var(--soft);\n}');
  return out;
}
