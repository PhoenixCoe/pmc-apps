/**
 * The graph model for the Block Coder: what a block is, what the catalogue holds, and how a graph
 * becomes readable JavaScript, HTML and CSS. Nothing here touches the DOM, so it is easy to test.
 */

import { HELPER_NEEDS, LOGIC_HELPERS, logicDefs, TOP_HELPERS } from './blocks-logic';
import { BASE_CSS, BOX_TAGS, boxCss, CLASSED, EXTRA_ELEMENTS, extraHtml, GAPS, itemCss, pageExtraDefs, paletteCss, SCRIPTED, SCRIPTS, VALUE_ELEMENTS } from './blocks-page';

export type Group = 'page' | 'widget' | 'fun' | 'look' | 'input' | 'var' | 'logic' | 'text' | 'list' | 'time' | 'colour' | 'function' | 'output';
/** What travels down a wire: a plain value, a page item, a Box (which can hold items) or a Style. */
export type Kind = 'value' | 'el' | 'box' | 'style';
export type Val = string | number | boolean;
export type Params = Record<string, Val>;

export interface PortDef {
  key: string;
  label: string;
  /** How an unwired value typed into the node's own field is turned into code. */
  as: 'number' | 'text' | 'any' | 'list';
  /** The value used when nothing is wired in. Ports with a default show a small field on the node. */
  def?: Val;
  /** What may be wired in. Plain values by default. */
  accepts?: Kind;
  /** Shown on the node while nothing is wired in and there is no field. */
  empty?: string;
  /** For page items: the property of the page item that a wired value fills in (textContent, href, src...). */
  bind?: string;
}
export interface ParamDef { key: string; label: string; type: 'number' | 'text' | 'select' | 'expr' | 'color'; options?: string[]; def: Val; placeholder?: string }
export interface Def {
  kind: string;
  name: string;
  group: Group;
  blurb: string;
  inputs: PortDef[];
  params: ParamDef[];
  /** Builds the JavaScript expression for this node from its input expressions. Output nodes build a statement instead. */
  emit: (i: string[], p: Params) => string;
  statement?: boolean;
  /** What this node hands on. 'value' unless said otherwise; 'none' means it has no output square. */
  out?: Kind | 'none';
  /** Helper functions (named in blocks-logic) that this node's code calls. They are written once, at the bottom of the code. */
  need?: string[] | ((v: Params) => string[]);
  /** The answer changes each time it is asked (the time, a countdown), so anything worked out from it is worked out again when it matters. */
  volatile?: boolean;
  /** A box that holds a value you can change later, so it is written with let. */
  mutable?: boolean;
  /** Does nothing in the code at all (a sticky note). */
  inert?: boolean;
}

export const GROUPS: { id: Group; name: string; blurb: string }[] = [
  { id: 'page', name: 'Web page', blurb: 'Headings, text, pictures and boxes' },
  { id: 'widget', name: 'Things to touch', blurb: 'Sliders, ticks and boxes to type in' },
  { id: 'fun', name: 'Fun', blurb: 'Games, clocks, drawing and moving things' },
  { id: 'look', name: 'Style', blurb: 'Colours, fonts and how things look' },
  { id: 'input', name: 'Values', blurb: 'Numbers, text, random things' },
  { id: 'var', name: 'Variables', blurb: 'Boxes that remember a value' },
  { id: 'logic', name: 'Maths and logic', blurb: 'Sums, comparing and deciding' },
  { id: 'text', name: 'Text', blurb: 'Change, find and tidy words' },
  { id: 'list', name: 'Lists', blurb: 'Sort, search and count lists' },
  { id: 'time', name: 'Dates and time', blurb: 'Dates, ages and countdowns' },
  { id: 'colour', name: 'Colour', blurb: 'Mix and change colours' },
  { id: 'function', name: 'Tools', blurb: 'Converters and calculators' },
  { id: 'output', name: 'Output', blurb: 'Show a result, notes' },
];
/** Page blocks are turned into HTML, CSS and page scripts. Everything else is logic. */
export const onPage = (d: Def) => d.group === 'page' || d.group === 'widget' || d.group === 'fun' || d.group === 'look';

const num = (v: Val) => { const n = Number(v); return Number.isFinite(n) ? String(n) : '0'; };
const MATH: Record<string, (a: string, b: string) => string> = {
  '+': (a, b) => `${a} + ${b}`, '−': (a, b) => `${a} - ${b}`, '×': (a, b) => `${a} * ${b}`, '÷': (a, b) => `${a} / ${b}`,
  '%': (a, b) => `${a} % ${b}`, '^': (a, b) => `${a} ** ${b}`, min: (a, b) => `Math.min(${a}, ${b})`, max: (a, b) => `Math.max(${a}, ${b})`,
};
const CMP: Record<string, string> = { '>': '>', '<': '<', '>=': '>=', '<=': '<=', '==': '===', '!=': '!==' };
const TEXTOPS: Record<string, (t: string) => string> = {
  upper: (t) => `${t}.toUpperCase()`, lower: (t) => `${t}.toLowerCase()`, trim: (t) => `${t}.trim()`,
  length: (t) => `${t}.length`, reverse: (t) => `[...${t}].reverse().join('')`,
  'capital first': (t) => `${t}.charAt(0).toUpperCase() + ${t}.slice(1)`,
  'title case': (t) => `${t}.replace(/\\b\\w/g, (c) => c.toUpperCase())`,
  'no spaces': (t) => `${t}.replace(/\\s+/g, "")`,
  'word count': (t) => `(${t}.trim() ? ${t}.trim().split(/\\s+/).length : 0)`,
  'vowel count': (t) => `(${t}.match(/[aeiou]/gi) || []).length`,
  'is a palindrome': (t) => `(() => { const s = ${t}.toLowerCase().replace(/[^a-z0-9]/g, ""); return s === [...s].reverse().join(""); })()`,
};
const MATHTOOL: Record<string, (n: string) => string> = {
  round: (n) => `Math.round(${n})`, 'round down': (n) => `Math.floor(${n})`, 'round up': (n) => `Math.ceil(${n})`, absolute: (n) => `Math.abs(${n})`,
  'square root': (n) => `Math.sqrt(${n})`, square: (n) => `${n} ** 2`, half: (n) => `${n} / 2`, double: (n) => `${n} * 2`, negative: (n) => `-${n}`,
  'is even': (n) => `${n} % 2 === 0`, 'is odd': (n) => `${n} % 2 !== 0`,
};
const LISTOPS: Record<string, (l: string) => string> = {
  count: (l) => `${l}.length`, biggest: (l) => `Math.max(...${l})`, smallest: (l) => `Math.min(...${l})`,
  average: (l) => `${l}.reduce((total, x) => total + x, 0) / ${l}.length`,
  first: (l) => `${l}[0]`, last: (l) => `${l}.at(-1)`,
  sort: (l) => `[...${l}].sort((a, b) => (a > b) - (a < b))`, 'sort backwards': (l) => `[...${l}].sort((a, b) => (b > a) - (b < a))`,
  reverse: (l) => `[...${l}].reverse()`, shuffle: (l) => `[...${l}].sort(() => Math.random() - 0.5)`, 'no repeats': (l) => `[...new Set(${l})]`,
};
const UNITS: Record<string, (n: string) => string> = {
  'Celsius to Fahrenheit': (n) => `${n} * 9 / 5 + 32`, 'Fahrenheit to Celsius': (n) => `(${n} - 32) * 5 / 9`,
  'km to miles': (n) => `${n} * 0.621371`, 'miles to km': (n) => `${n} * 1.609344`,
  'kg to pounds': (n) => `${n} * 2.20462`, 'pounds to kg': (n) => `${n} / 2.20462`,
  'cm to inches': (n) => `${n} / 2.54`, 'inches to cm': (n) => `${n} * 2.54`,
  'metres to feet': (n) => `${n} * 3.28084`, 'feet to metres': (n) => `${n} / 3.28084`,
  'litres to pints': (n) => `${n} * 1.759754`, 'mph to km/h': (n) => `${n} * 1.609344`, 'km/h to mph': (n) => `${n} / 1.609344`,
  'Celsius to Kelvin': (n) => `${n} + 273.15`, 'Kelvin to Celsius': (n) => `${n} - 273.15`, 'mm to inches': (n) => `${n} / 25.4`, 'inches to feet': (n) => `${n} / 12`,
  'miles to metres': (n) => `${n} * 1609.344`, 'ounces to grams': (n) => `${n} * 28.3495`, 'grams to ounces': (n) => `${n} / 28.3495`, 'gallons to litres': (n) => `${n} * 4.54609`,
  'seconds to minutes': (n) => `${n} / 60`, 'minutes to hours': (n) => `${n} / 60`, 'hours to days': (n) => `${n} / 24`, 'bytes to megabytes': (n) => `${n} / 1048576`,
};
const NOW: Record<string, string> = {
  hour: 'new Date().getHours()', minute: 'new Date().getMinutes()', second: 'new Date().getSeconds()', day: 'new Date().getDate()',
  month: 'new Date().getMonth() + 1', year: 'new Date().getFullYear()',
  weekday: 'new Date().toLocaleDateString("en-GB", { weekday: "long" })', time: 'new Date().toLocaleTimeString("en-GB")',
  date: 'new Date().toLocaleDateString("en-GB", { dateStyle: "long" })',
  'year-month-day': 'new Date().toLocaleDateString("en-CA")', 'month name': 'new Date().toLocaleDateString("en-GB", { month: "long" })', timestamp: 'Date.now()',
  'am or pm': 'new Date().getHours() < 12 ? "am" : "pm"', 'is the weekend': '[0, 6].includes(new Date().getDay())',
  'percent of the year gone': 'Math.round((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / (new Date(new Date().getFullYear() + 1, 0, 1) - new Date(new Date().getFullYear(), 0, 1)) * 100)',
};
export const EMOJIS = ['😀 smile', '😂 laughing', '😍 love', '😎 cool', '🤔 thinking', '😴 sleepy', '😮 surprised', '😋 yummy', '🎉 party', '🌟 sparkle', '⭐ star', '❤️ heart', '👍 thumbs up',
  '👀 eyes', '🐶 dog', '🐱 cat', '🐸 frog', '🦄 unicorn', '🍕 pizza', '🍪 cookie', '🚀 rocket', '⚽ football', '🎮 game', '🌈 rainbow', '👾 alien', '🐙 octopus', '🍩 donut', '🌍 earth', '💎 gem', '🏆 trophy'];

// Brackets are added only where the expression is not already a single name, number, string or list.
const SIMPLE = /^(?:[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|\[[^\[\]]*\])$/;
const wrap = (s: string) => (SIMPLE.test(s) ? s : `(${s})`);

const EVERY: ParamDef = { key: 'when', label: 'Picks', type: 'select', options: ['every time', 'once, at the start'], def: 'every time' };

export const DEFS: Def[] = [
  { kind: 'number', name: 'Number', group: 'input', blurb: 'A number you type in', inputs: [],
    params: [{ key: 'value', label: 'Value', type: 'number', def: 10 }], emit: (_, p) => num(p.value) },
  { kind: 'text', name: 'Text', group: 'input', blurb: 'A piece of text', inputs: [],
    params: [{ key: 'value', label: 'Text', type: 'text', def: 'hello' }], emit: (_, p) => JSON.stringify(String(p.value)) },
  { kind: 'bool', name: 'True / False', group: 'input', blurb: 'A yes or no value', inputs: [],
    params: [{ key: 'value', label: 'Is', type: 'select', options: ['true', 'false'], def: 'true' }], emit: (_, p) => String(p.value) },
  { kind: 'list', name: 'List', group: 'input', blurb: 'Several values, separated by commas', inputs: [],
    params: [{ key: 'items', label: 'Items', type: 'text', def: '3, 1, 4, 1, 5', placeholder: '1, 2, 3' }],
    emit: (_, p) => '[' + String(p.items).split(',').map((s) => s.trim()).filter((s) => s !== '').map((s) => (Number.isFinite(Number(s)) ? s : JSON.stringify(s))).join(', ') + ']' },
  { kind: 'range', name: 'Range', group: 'input', blurb: 'The whole numbers from one to another', inputs: [
      { key: 'from', label: 'from', as: 'number', def: 1 }, { key: 'to', label: 'to', as: 'number', def: 10 }],
    params: [], emit: (i) => `Array.from({ length: ${wrap(i[1])} - ${wrap(i[0])} + 1 }, (_, n) => ${wrap(i[0])} + n)` },
  { kind: 'random', name: 'Random number', group: 'input', blurb: 'A surprise number between two numbers', inputs: [
      { key: 'from', label: 'from', as: 'number', def: 1 }, { key: 'to', label: 'to', as: 'number', def: 6 }],
    params: [EVERY], emit: (i) => `Math.floor(Math.random() * (${wrap(i[1])} - ${wrap(i[0])} + 1)) + ${wrap(i[0])}` },
  { kind: 'pick', name: 'Random pick', group: 'input', blurb: 'Pick one item out of a list at random', inputs: [{ key: 'list', label: 'list', as: 'list' }],
    params: [EVERY], emit: (i) => `((items) => items[Math.floor(Math.random() * items.length)])(${i[0]})` },
  { kind: 'rcolour', name: 'Random colour', group: 'input', blurb: 'A bright colour picked at random', inputs: [],
    params: [EVERY], emit: () => '"hsl(" + Math.floor(Math.random() * 360) + ", 80%, 60%)"' },
  { kind: 'now', name: 'Date and time', group: 'input', blurb: 'The time or date right now', inputs: [],
    params: [{ key: 'part', label: 'Give me', type: 'select', options: Object.keys(NOW), def: 'time' }], emit: (_, p) => NOW[String(p.part)] ?? NOW.time },
  { kind: 'emojiv', name: 'Emoji', group: 'input', blurb: 'A picture character you can use as text', inputs: [],
    params: [{ key: 'which', label: 'Pick', type: 'select', options: EMOJIS, def: EMOJIS[0] }], emit: (_, p) => JSON.stringify(String(p.which).split(' ')[0]) },

  { kind: 'math', name: 'Maths', group: 'logic', blurb: 'Add, subtract, multiply, divide and more', inputs: [
      { key: 'a', label: 'a', as: 'number', def: 0 }, { key: 'b', label: 'b', as: 'number', def: 0 }],
    params: [{ key: 'op', label: 'Do', type: 'select', options: Object.keys(MATH), def: '+' }],
    emit: (i, p) => (MATH[String(p.op)] ?? MATH['+'])(wrap(i[0]), wrap(i[1])) },
  { kind: 'mathtool', name: 'Maths tool', group: 'logic', blurb: 'Round, square root, double, is it even...', inputs: [{ key: 'n', label: 'number', as: 'number', def: 2.5 }],
    params: [{ key: 'op', label: 'Do', type: 'select', options: Object.keys(MATHTOOL), def: 'round' }], emit: (i, p) => (MATHTOOL[String(p.op)] ?? MATHTOOL.round)(wrap(i[0])) },
  { kind: 'compare', name: 'Compare', group: 'logic', blurb: 'Is one value bigger, smaller or equal?', inputs: [
      { key: 'a', label: 'a', as: 'any', def: 0 }, { key: 'b', label: 'b', as: 'any', def: 0 }],
    params: [{ key: 'op', label: 'Is a', type: 'select', options: Object.keys(CMP), def: '>' }],
    emit: (i, p) => `${wrap(i[0])} ${CMP[String(p.op)] ?? '>'} ${wrap(i[1])}` },
  { kind: 'between', name: 'Is between', group: 'logic', blurb: 'Is a number inside a range?', inputs: [
      { key: 'n', label: 'number', as: 'number', def: 5 }, { key: 'lo', label: 'low', as: 'number', def: 1 }, { key: 'hi', label: 'high', as: 'number', def: 10 }],
    params: [], emit: (i) => `${wrap(i[0])} >= ${wrap(i[1])} && ${wrap(i[0])} <= ${wrap(i[2])}` },
  { kind: 'clamp', name: 'Keep between', group: 'logic', blurb: 'Stop a number going below or above a limit', inputs: [
      { key: 'n', label: 'number', as: 'number', def: 120 }, { key: 'lo', label: 'lowest', as: 'number', def: 0 }, { key: 'hi', label: 'highest', as: 'number', def: 100 }],
    params: [], emit: (i) => `Math.min(Math.max(${i[0]}, ${i[1]}), ${i[2]})` },
  { kind: 'logic', name: 'And / Or', group: 'logic', blurb: 'Combine two yes or no values', inputs: [
      { key: 'a', label: 'a', as: 'any', def: 'true' }, { key: 'b', label: 'b', as: 'any', def: 'true' }],
    params: [{ key: 'op', label: 'Use', type: 'select', options: ['and', 'or'], def: 'and' }],
    emit: (i, p) => `${wrap(i[0])} ${p.op === 'or' ? '||' : '&&'} ${wrap(i[1])}` },
  { kind: 'not', name: 'Not', group: 'logic', blurb: 'Flip a yes or no value', inputs: [{ key: 'a', label: 'value', as: 'any', def: 'true' }],
    params: [], emit: (i) => `!${wrap(i[0])}` },
  { kind: 'if', name: 'If', group: 'logic', blurb: 'Pick one of two values', inputs: [
      { key: 'cond', label: 'if', as: 'any', def: 'true' }, { key: 'yes', label: 'then', as: 'any', def: 'yes' }, { key: 'no', label: 'else', as: 'any', def: 'no' }],
    params: [], emit: (i) => `${wrap(i[0])} ? ${wrap(i[1])} : ${wrap(i[2])}` },

  { kind: 'textop', name: 'Text tool', group: 'function', blurb: 'Capitals, trim, length, word count, palindrome...', inputs: [{ key: 't', label: 'text', as: 'text', def: 'hello' }],
    params: [{ key: 'op', label: 'Do', type: 'select', options: Object.keys(TEXTOPS), def: 'upper' }],
    emit: (i, p) => (TEXTOPS[String(p.op)] ?? TEXTOPS.upper)(wrap(i[0])) },
  { kind: 'has', name: 'Has text', group: 'function', blurb: 'Does some text contain, start or end with a bit of text?', inputs: [
      { key: 't', label: 'text', as: 'text', def: 'hello world' }, { key: 'bit', label: 'bit', as: 'text', def: 'world' }],
    params: [{ key: 'op', label: 'Does it', type: 'select', options: ['contain', 'start with', 'end with'], def: 'contain' }],
    emit: (i, p) => `${wrap(i[0])}.${p.op === 'start with' ? 'startsWith' : p.op === 'end with' ? 'endsWith' : 'includes'}(${i[1]})` },
  { kind: 'replace', name: 'Swap text', group: 'function', blurb: 'Swap every bit of text for another bit', inputs: [
      { key: 't', label: 'text', as: 'text', def: 'hello world' }, { key: 'find', label: 'find', as: 'text', def: 'world' }, { key: 'with', label: 'with', as: 'text', def: 'there' }],
    params: [], emit: (i) => `${wrap(i[0])}.replaceAll(${i[1]}, ${i[2]})` },
  { kind: 'repeat', name: 'Repeat text', group: 'function', blurb: 'Say the same thing again and again', inputs: [
      { key: 't', label: 'text', as: 'text', def: 'ha' }, { key: 'n', label: 'times', as: 'number', def: 3 }],
    params: [], emit: (i) => `${wrap(i[0])}.repeat(Math.max(0, ${i[1]}))` },
  { kind: 'split', name: 'Split text', group: 'function', blurb: 'Cut some text into a list', inputs: [
      { key: 't', label: 'text', as: 'text', def: 'red, green, blue' }, { key: 'by', label: 'cut at', as: 'text', def: ', ' }],
    params: [], emit: (i) => `${wrap(i[0])}.split(${i[1]})` },
  { kind: 'glue', name: 'Put text together', group: 'function', blurb: 'Stick pieces of text side by side', inputs: [
      { key: 'a', label: 'first', as: 'text', def: 'Hello, ' }, { key: 'b', label: 'then', as: 'text', def: '' }, { key: 'c', label: 'then', as: 'text', def: '!' },
      { key: 'd', label: 'then', as: 'text', def: '' }, { key: 'e', label: 'then', as: 'text', def: '' }],
    params: [], emit: (i) => `[${i[0]}, ${i[1]}, ${i[2]}, ${i[3]}, ${i[4]}].join("")` },
  { kind: 'join', name: 'Join', group: 'function', blurb: 'Turn a list into one piece of text', inputs: [{ key: 'list', label: 'list', as: 'list' }],
    params: [{ key: 'sep', label: 'With', type: 'text', def: ', ' }], emit: (i, p) => `${wrap(i[0])}.join(${JSON.stringify(String(p.sep))})` },
  { kind: 'listtool', name: 'List tool', group: 'function', blurb: 'Count, biggest, average, sort, shuffle...', inputs: [{ key: 'list', label: 'list', as: 'list' }],
    params: [{ key: 'op', label: 'Give me', type: 'select', options: Object.keys(LISTOPS), def: 'count' }], emit: (i, p) => (LISTOPS[String(p.op)] ?? LISTOPS.count)(wrap(i[0])) },
  { kind: 'take', name: 'First few', group: 'function', blurb: 'Keep only the first few items of a list', inputs: [
      { key: 'list', label: 'list', as: 'list' }, { key: 'n', label: 'how many', as: 'number', def: 3 }],
    params: [], emit: (i) => `${wrap(i[0])}.slice(0, ${i[1]})` },
  { kind: 'itemat', name: 'Item number', group: 'function', blurb: 'Get one item from a list (1 is the first)', inputs: [
      { key: 'list', label: 'list', as: 'list' }, { key: 'n', label: 'number', as: 'number', def: 1 }],
    params: [], emit: (i) => `${wrap(i[0])}[${wrap(i[1])} - 1]` },
  { kind: 'map', name: 'Map', group: 'function', blurb: 'Change every item in a list', inputs: [{ key: 'list', label: 'list', as: 'list' }],
    params: [{ key: 'expr', label: 'x becomes', type: 'expr', def: 'x * 2', placeholder: 'x * 2' }], emit: (i, p) => `${wrap(i[0])}.map((x) => ${wrap(String(p.expr) || 'x')})` },
  { kind: 'filter', name: 'Filter', group: 'function', blurb: 'Keep only the items that pass a test', inputs: [{ key: 'list', label: 'list', as: 'list' }],
    params: [{ key: 'expr', label: 'Keep if', type: 'expr', def: 'x % 2 === 0', placeholder: 'x > 3' }], emit: (i, p) => `${wrap(i[0])}.filter((x) => ${wrap(String(p.expr) || 'true')})` },
  { kind: 'sum', name: 'Sum', group: 'function', blurb: 'Add every number in a list', inputs: [{ key: 'list', label: 'list', as: 'list' }],
    params: [], emit: (i) => `${wrap(i[0])}.reduce((total, x) => total + x, 0)` },
  { kind: 'convert', name: 'Convert units', group: 'function', blurb: 'Celsius, miles, kilograms, inches...', inputs: [{ key: 'n', label: 'number', as: 'number', def: 100 }],
    params: [{ key: 'op', label: 'Convert', type: 'select', options: Object.keys(UNITS), def: 'Celsius to Fahrenheit' }], emit: (i, p) => (UNITS[String(p.op)] ?? UNITS['km to miles'])(wrap(i[0])) },
  { kind: 'places', name: 'Decimal places', group: 'function', blurb: 'Tidy a number to a few decimal places', inputs: [
      { key: 'n', label: 'number', as: 'number', def: 3.14159 }, { key: 'dp', label: 'places', as: 'number', def: 2 }],
    params: [], emit: (i) => `Number(${i[0]}).toFixed(${i[1]})` },
  { kind: 'rgbmix', name: 'Colour mix', group: 'function', blurb: 'Mix red, green and blue (0 to 255) into a colour', inputs: [
      { key: 'r', label: 'red', as: 'number', def: 200 }, { key: 'g', label: 'green', as: 'number', def: 120 }, { key: 'b', label: 'blue', as: 'number', def: 60 }],
    params: [], emit: (i) => `"rgb(" + ${i[0]} + ", " + ${i[1]} + ", " + ${i[2]} + ")"` },
  { kind: 'daysuntil', name: 'Days until', group: 'function', blurb: 'How many days until a date (like 2026-12-25)', inputs: [{ key: 'date', label: 'date', as: 'text', def: '2026-12-25' }],
    params: [], emit: (i) => `Math.ceil((new Date(${i[0]}) - Date.now()) / 86400000)` },
  { kind: 'expr', name: 'Your function', group: 'function', blurb: 'Write your own one-line function', inputs: [
      { key: 'a', label: 'a', as: 'any', def: 0 }, { key: 'b', label: 'b', as: 'any', def: 0 }],
    params: [{ key: 'expr', label: 'Returns', type: 'expr', def: 'a * b + 1', placeholder: 'a + b' }],
    emit: (i, p) => `((a, b) => ${wrap(String(p.expr) || 'a')})(${i[0]}, ${i[1]})` },

  { kind: 'log', name: 'Log', group: 'output', blurb: 'Print a value to the output', inputs: [{ key: 'v', label: 'value', as: 'any' }],
    params: [{ key: 'label', label: 'Label', type: 'text', def: '', placeholder: 'optional' }], statement: true,
    emit: (i, p) => `console.log(${p.label ? JSON.stringify(String(p.label)) + ', ' : ''}${i[0]});` },
];

// ---------------------------------------------------------------- web page nodes
// These never run as logic. They are turned into HTML (what is on the page), CSS (how it looks) and JavaScript (what it does).
const INSIDE: PortDef = { key: 'inside', label: 'put inside', as: 'any', accepts: 'box', empty: 'the page' };
const LOOK: PortDef = { key: 'look', label: 'look', as: 'any', accepts: 'style', empty: 'plain' };
const noEmit = () => '';
const LABEL: ParamDef = { key: 'label', label: 'Label', type: 'text', def: '', placeholder: 'optional' };
const SIZE: Record<string, string> = { small: '0.875rem', large: '1.5rem', huge: '2.5rem', giant: '4.5rem' };
const ROUND: Record<string, string> = { 'a little': '8px', very: '20px', pill: '999px' };
const SPACE: Record<string, string> = { small: '0.5rem', medium: '1rem', large: '2rem' };
const ALIGN: Record<string, string> = { left: 'left', centre: 'center', right: 'right' };
const SHADOW: Record<string, string> = { soft: '0 4px 14px rgba(0, 0, 0, 0.25)', hard: '6px 6px 0 currentColor' };
const WIDTH: Record<string, string> = { half: '50%', full: '100%' };
const MOVES: Record<string, { rule: string; frames: string }> = {
  bounce: { rule: 'bounce 1s ease-in-out infinite', frames: '@keyframes bounce {\n  50% { transform: translateY(-12px); }\n}' },
  pulse: { rule: 'pulse 1.2s ease-in-out infinite', frames: '@keyframes pulse {\n  50% { transform: scale(1.08); }\n}' },
  spin: { rule: 'spin 3s linear infinite', frames: '@keyframes spin {\n  to { transform: rotate(360deg); }\n}' },
  wobble: { rule: 'wobble 0.9s ease-in-out infinite', frames: '@keyframes wobble {\n  25% { transform: rotate(-4deg); }\n  75% { transform: rotate(4deg); }\n}' },
  rainbow: { rule: 'rainbow 4s linear infinite', frames: '@keyframes rainbow {\n  to { filter: hue-rotate(360deg); }\n}' },
};
const EMOJI_SIZE: Record<string, string> = { normal: '2rem', big: '4rem', huge: '7rem' };
const FLOAT_SIZE: Record<string, string> = { medium: '3rem', big: '5rem', huge: '8rem' };
const PLAYER_STEP: Record<string, number> = { slow: 8, normal: 14, fast: 24 };
const BOUNCE_SPEED: Record<string, number> = { slow: 2, normal: 4, fast: 8 };
const PEN: Record<string, number> = { thin: 2, medium: 5, thick: 12 };
const PATTERNS = ['plain', 'dots', 'stripes', 'grid', 'gradient', 'night sky'];
const PAGE_WIDTH: Record<string, string> = { narrow: '30rem', normal: '40rem', wide: '60rem', full: 'none' };
export const FONTS: Record<string, string> = {
  clean: 'system-ui, sans-serif', book: 'Georgia, "Times New Roman", serif', round: '"Trebuchet MS", "Segoe UI", sans-serif',
  typewriter: '"Courier New", Courier, monospace', headline: 'Impact, "Arial Narrow Bold", "Arial Black", sans-serif',
  handwritten: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive', code: 'ui-monospace, Menlo, Consolas, monospace',
};

/** When something is pressed, typed in and so on. The first group needs an item to watch; the second is about the whole page. */
export const ENTER = 'has Enter pressed in it';
export const WHEN_ITEM: Record<string, string> = {
  'is clicked': 'click', 'is double clicked': 'dblclick', 'is hovered over': 'mouseenter', 'is left by the mouse': 'mouseleave', 'is pressed down': 'pointerdown', 'is let go': 'pointerup',
  'is right clicked': 'contextmenu', 'is typed in or moved': 'input', 'is ticked or chosen': 'change', 'gets focus': 'focus', 'loses focus': 'blur', [ENTER]: 'keydown',
};
export const TOUCH = 'is touched by the player';
export const WHEN_EVENTS: Record<string, string> = { 'the page opens': 'load', 'a key is pressed': 'keydown', 'a key is released': 'keyup', 'the mouse moves': 'pointermove', 'the page is clicked': 'click', 'the window is resized': 'resize' };
export const WHEN_TIMERS: Record<string, number> = { 'every tenth of a second': 100, 'every half second': 500, 'every second': 1000, 'every 5 seconds': 5000, 'every 10 seconds': 10000, 'every minute': 60000 };
export const WHEN_PAGE = [...Object.keys(WHEN_EVENTS), ...Object.keys(WHEN_TIMERS)];
/** Names used in earlier versions, mapped to today's. */
const WHEN_OLD: Record<string, string> = { 'is typed in': 'is typed in or moved', changes: 'is ticked or chosen' };
export const DO: Record<string, string> = {
  'set the text to': 'text', 'add to the number': 'count', 'show or hide it': 'toggle', 'set its text colour to': 'colour', 'set its background to': 'back',
  'set the picture to': 'src', 'set its size to': 'size', 'hide it': 'hide', 'show it': 'show', 'make it a random colour': 'randcol',
  'jump to a random place': 'jump', 'shake it': 'shake', 'spin it': 'spin', 'grow it a bit': 'grow', 'play a note': 'note', 'say it out loud': 'speak',
  'throw confetti': 'confetti', 'add to the end of the list': 'push', 'clear it': 'clear',
  'make it smaller': 'shrink', 'set its opacity to': 'opacity', 'fade it out': 'fadeout', 'fade it in': 'fadein', 'rotate it by': 'rotate', 'flip it': 'flip',
  'set its value to': 'value', 'tick it': 'tick', 'untick it': 'untick', 'focus it': 'focus', 'type it out': 'typeout', 'show a message': 'toast', 'copy it to the clipboard': 'copy',
  'log it': 'log', 'change the page title to': 'title', 'set the page background to': 'pageback', 'scroll to the top': 'top', 'vibrate': 'vibrate',
  'set variable to': 'setvar', 'change variable by': 'changevar', 'flip variable (yes or no)': 'flipvar', 'add to list variable': 'pushvar', 'take the last off list variable': 'popvar',
  'empty list variable': 'emptyvar', 'reset variable': 'resetvar',
};
const VAR_DO = new Set(['setvar', 'changevar', 'flipvar', 'pushvar', 'popvar', 'emptyvar', 'resetvar']);

/** What a Global style block styles, and the selector it writes. Boxes are listed by their own class names when the CSS is made. */
const GLOBAL_TARGETS: Record<string, string> = {
  'the whole page': 'body', 'all headings': 'h1, h2, h3', 'all text': 'p, li, blockquote', 'all buttons': 'button', 'all links': 'a', 'all pictures': 'img',
  'all boxes': '', 'all input boxes': 'input, select, textarea', everything: '*',
};
const HOVER: Record<string, string> = {
  'lift up': 'transform: translateY(-3px);\n  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);', 'grow': 'transform: scale(1.06);', 'glow': 'box-shadow: 0 0 14px currentColor;',
  'darken': 'filter: brightness(0.85);', 'underline': 'text-decoration: underline;',
};
const LETTERS: Record<string, string> = { CAPITALS: 'uppercase', lowercase: 'lowercase', Capitalised: 'capitalize' };

const STYLE_PARAMS: ParamDef[] = [
  { key: 'color', label: 'Colour', type: 'color', def: '' }, { key: 'bg', label: 'Fill', type: 'color', def: '' }, { key: 'bg2', label: 'Fill to', type: 'color', def: '' },
  { key: 'font', label: 'Font', type: 'select', options: ['page font', ...Object.keys(FONTS)], def: 'page font' },
  { key: 'size', label: 'Size', type: 'select', options: ['normal', ...Object.keys(SIZE)], def: 'normal' },
  { key: 'bold', label: 'Bold', type: 'select', options: ['no', 'yes'], def: 'no' },
  { key: 'letters', label: 'Letters', type: 'select', options: ['normal', 'CAPITALS', 'lowercase', 'Capitalised'], def: 'normal' },
  { key: 'align', label: 'Align', type: 'select', options: ['normal', ...Object.keys(ALIGN)], def: 'normal' },
  { key: 'round', label: 'Corners', type: 'select', options: ['square', ...Object.keys(ROUND)], def: 'square' },
  { key: 'space', label: 'Space', type: 'select', options: ['none', ...Object.keys(SPACE)], def: 'none' },
  { key: 'border', label: 'Border', type: 'select', options: ['none', 'thin', 'thick'], def: 'none' },
  { key: 'shadow', label: 'Shadow', type: 'select', options: ['none', ...Object.keys(SHADOW)], def: 'none' },
  { key: 'width', label: 'Width', type: 'select', options: ['normal', ...Object.keys(WIDTH)], def: 'normal' },
  { key: 'hover', label: 'On hover', type: 'select', options: ['nothing', ...Object.keys(HOVER)], def: 'nothing' },
  { key: 'move', label: 'Moves', type: 'select', options: ['still', ...Object.keys(MOVES)], def: 'still' }];
export const PAGE_DEFS: Def[] = [
  { kind: 'heading', name: 'Heading', group: 'page', blurb: 'Big title text', out: 'el',
    inputs: [{ key: 'text', label: 'text', as: 'text', def: 'My page', bind: 'textContent' }, INSIDE, LOOK],
    params: [{ key: 'level', label: 'Size', type: 'select', options: ['big', 'medium', 'small'], def: 'big' }], emit: noEmit },
  { kind: 'para', name: 'Text', group: 'page', blurb: 'Some words', out: 'el',
    inputs: [{ key: 'text', label: 'text', as: 'text', def: 'Write something here.', bind: 'textContent' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'emoji', name: 'Big emoji', group: 'page', blurb: 'A big picture character, like 🎉', out: 'el',
    inputs: [{ key: 'text', label: 'emoji', as: 'text', def: '🎉', bind: 'textContent' }, INSIDE, LOOK],
    params: [{ key: 'size', label: 'Size', type: 'select', options: Object.keys(EMOJI_SIZE), def: 'big' }], emit: noEmit },
  { kind: 'button', name: 'Button', group: 'page', blurb: 'A button to press', out: 'el',
    inputs: [{ key: 'text', label: 'label', as: 'text', def: 'Click me', bind: 'textContent' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'link', name: 'Link', group: 'page', blurb: 'A link to another site', out: 'el',
    inputs: [{ key: 'text', label: 'words', as: 'text', def: 'Click here', bind: 'textContent' }, { key: 'address', label: 'goes to', as: 'text', def: 'https://example.com', bind: 'href' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'image', name: 'Picture', group: 'page', blurb: 'A picture (paste its web address)', out: 'el',
    inputs: [{ key: 'address', label: 'address', as: 'text', def: '', bind: 'src' }, { key: 'words', label: 'describe', as: 'text', def: 'A picture', bind: 'alt' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'bullets', name: 'List', group: 'page', blurb: 'Bullets or numbers', out: 'el',
    inputs: [INSIDE, LOOK],
    params: [{ key: 'items', label: 'Items', type: 'text', def: 'Milk, Eggs, Bread', placeholder: 'one, two, three' }, { key: 'type', label: 'Shown as', type: 'select', options: ['bullets', 'numbers'], def: 'bullets' }], emit: noEmit },
  { kind: 'progress', name: 'Progress bar', group: 'page', blurb: 'A bar that fills up', out: 'el',
    inputs: [{ key: 'amount', label: 'amount', as: 'number', def: 50, bind: 'value' }, INSIDE, LOOK],
    params: [{ key: 'max', label: 'Full at', type: 'number', def: 100 }], emit: noEmit },
  { kind: 'divider', name: 'Line', group: 'page', blurb: 'A line across the page', out: 'el', inputs: [INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'box', name: 'Box', group: 'page', blurb: 'Keeps other things together', out: 'box',
    inputs: [INSIDE, LOOK], params: [{ key: 'flow', label: 'Lay out', type: 'select', options: ['down', 'across'], def: 'down' }, { key: 'gap', label: 'Gap', type: 'select', options: Object.keys(GAPS), def: 'medium' }], emit: noEmit },
  { kind: 'style', name: 'Style', group: 'look', blurb: 'Colours, fonts, shadows and movement for one item. Plug it into a “look”', out: 'style', inputs: [], params: STYLE_PARAMS, emit: noEmit },
  { kind: 'gstyle', name: 'Global style', group: 'look', blurb: 'The same look for every heading, button, link, picture or box at once. No wiring needed', out: 'none', inputs: [],
    params: [{ key: 'target', label: 'Styles', type: 'select', options: Object.keys(GLOBAL_TARGETS), def: 'all headings' }, ...STYLE_PARAMS], emit: noEmit },
  { kind: 'action', name: 'When pressed', group: 'page', blurb: 'Make something happen: on a click, every second, on a key...', out: 'none',
    inputs: [{ key: 'on', label: 'watch', as: 'any', accepts: 'el', empty: 'connect one' }, { key: 'target', label: 'change', as: 'any', accepts: 'el', empty: 'the page' }, { key: 'value', label: 'with', as: 'any', def: '1' },
      { key: 'only', label: 'only if', as: 'any', empty: 'always' }],
    params: [{ key: 'when', label: 'When', type: 'select', options: [...Object.keys(WHEN_ITEM), TOUCH, ...WHEN_PAGE], def: 'is clicked' },
      { key: 'do', label: 'Then', type: 'select', options: Object.keys(DO), def: 'set the text to' }], emit: noEmit },
  { kind: 'pagecfg', name: 'Page settings', group: 'look', blurb: 'Title, description, icon, colours, font and background', out: 'none', inputs: [],
    params: [{ key: 'title', label: 'Title', type: 'text', def: 'My page' }, { key: 'description', label: 'About', type: 'text', def: '', placeholder: 'what is it?' },
      { key: 'icon', label: 'Icon', type: 'text', def: '', placeholder: 'an emoji' },
      { key: 'bg', label: 'Back', type: 'color', def: '#ffffff' }, { key: 'color', label: 'Text', type: 'color', def: '#1a1a1a' },
      { key: 'font', label: 'Font', type: 'select', options: Object.keys(FONTS), def: 'clean' },
      { key: 'pattern', label: 'Backdrop', type: 'select', options: PATTERNS, def: 'plain' },
      { key: 'width', label: 'Width', type: 'select', options: Object.keys(PAGE_WIDTH), def: 'normal' }], emit: noEmit },

  // things people touch: each hands on what was chosen
  { kind: 'field', name: 'Input box', group: 'widget', blurb: 'A box to type in', out: 'el',
    inputs: [{ key: 'text', label: 'hint', as: 'text', def: 'Type here', bind: 'placeholder' }, INSIDE, LOOK], params: [], emit: noEmit },
  { kind: 'numbox', name: 'Number box', group: 'widget', blurb: 'A box to type a number in', out: 'el', inputs: [INSIDE, LOOK],
    params: [LABEL, { key: 'start', label: 'Start at', type: 'number', def: 0 }], emit: noEmit },
  { kind: 'slider', name: 'Slider', group: 'widget', blurb: 'Slide to pick a number', out: 'el', inputs: [INSIDE, LOOK],
    params: [LABEL, { key: 'min', label: 'From', type: 'number', def: 0 }, { key: 'max', label: 'To', type: 'number', def: 100 }, { key: 'start', label: 'Start at', type: 'number', def: 50 }], emit: noEmit },
  { kind: 'checkbox', name: 'Tick box', group: 'widget', blurb: 'On or off', out: 'el', inputs: [INSIDE, LOOK],
    params: [{ key: 'label', label: 'Label', type: 'text', def: 'Tick me' }, { key: 'start', label: 'Starts', type: 'select', options: ['unticked', 'ticked'], def: 'unticked' }], emit: noEmit },
  { kind: 'dropdown', name: 'Drop-down', group: 'widget', blurb: 'Choose one from a list', out: 'el', inputs: [INSIDE, LOOK],
    params: [LABEL, { key: 'choices', label: 'Choices', type: 'text', def: 'Red, Green, Blue', placeholder: 'one, two, three' }], emit: noEmit },
  { kind: 'colourpick', name: 'Colour picker', group: 'widget', blurb: 'Let people pick a colour', out: 'el', inputs: [INSIDE, LOOK],
    params: [LABEL, { key: 'start', label: 'Start', type: 'color', def: '#b49a57' }], emit: noEmit },

  // fun
  { kind: 'canvas', name: 'Drawing board', group: 'fun', blurb: 'Draw with the mouse or a finger', out: 'el', inputs: [INSIDE, LOOK],
    params: [{ key: 'pen', label: 'Pen', type: 'color', def: '#171717' }, { key: 'size', label: 'Pen size', type: 'select', options: Object.keys(PEN), def: 'medium' },
      { key: 'ink', label: 'Ink', type: 'select', options: ['one colour', 'rainbow'], def: 'one colour' }], emit: noEmit },
  { kind: 'player', name: 'Player', group: 'fun', blurb: 'Something you move with the arrow keys (click the preview first)', out: 'el',
    inputs: [{ key: 'text', label: 'face', as: 'text', def: '🚀', bind: 'textContent' }, LOOK],
    params: [{ key: 'size', label: 'Size', type: 'select', options: Object.keys(FLOAT_SIZE), def: 'medium' }, { key: 'speed', label: 'Speed', type: 'select', options: Object.keys(PLAYER_STEP), def: 'normal' }], emit: noEmit },
  { kind: 'bouncer', name: 'Bouncer', group: 'fun', blurb: 'Something that bounces round the page for ever', out: 'el',
    inputs: [{ key: 'text', label: 'face', as: 'text', def: '⚽', bind: 'textContent' }, LOOK],
    params: [{ key: 'size', label: 'Size', type: 'select', options: Object.keys(FLOAT_SIZE), def: 'medium' }, { key: 'speed', label: 'Speed', type: 'select', options: Object.keys(BOUNCE_SPEED), def: 'normal' }], emit: noEmit },
];
export const ELEMENTS = new Set(['heading', 'para', 'emoji', 'button', 'link', 'image', 'bullets', 'progress', 'divider', 'box', 'field', 'numbox', 'slider', 'checkbox', 'dropdown', 'colourpick', 'canvas', 'player', 'bouncer', ...EXTRA_ELEMENTS]);
/** Page items that hold something the user chose, so a wire can carry it away as a value. */
const VALUE_EL = new Set(['field', 'numbox', 'slider', 'checkbox', 'dropdown', 'colourpick', ...VALUE_ELEMENTS]);
const FLOATERS = new Set(['player', 'bouncer', 'follower']);

DEFS.push(...PAGE_DEFS, ...pageExtraDefs, ...logicDefs({ wrap, num }));
/** Where the older blocks live in the Add menu now that there are more groups. */
const REGROUP: Record<string, Group> = {
  textop: 'text', has: 'text', replace: 'text', repeat: 'text', split: 'text', glue: 'text',
  join: 'list', listtool: 'list', take: 'list', itemat: 'list', map: 'list', filter: 'list', sum: 'list', range: 'list', list: 'list', pick: 'list',
  now: 'time', daysuntil: 'time', rgbmix: 'colour', rcolour: 'colour',
};
DEFS.forEach((d) => { if (REGROUP[d.kind]) d.group = REGROUP[d.kind]; });
// "And / Or" also does xor, nand and nor
const LOGIC_OP = DEFS.find((d) => d.kind === 'logic');
if (LOGIC_OP) {
  LOGIC_OP.params = [{ key: 'op', label: 'Use', type: 'select', options: ['and', 'or', 'one or the other, not both', 'not both', 'neither'], def: 'and' }];
  LOGIC_OP.emit = (i, p) => { const a = wrap(i[0]), b = wrap(i[1]); return p.op === 'or' ? `${a} || ${b}` : p.op === 'one or the other, not both' ? `${a} !== ${b}` : p.op === 'not both' ? `!(${a} && ${b})` : p.op === 'neither' ? `!(${a} || ${b})` : `${a} && ${b}`; };
}
export const DEF = Object.fromEntries(DEFS.map((d) => [d.kind, d])) as Record<string, Def>;

export interface GNode { id: string; kind: string; x: number; y: number; v: Params }
export interface Wire { id: string; from: string; to: string; port: number }
export interface Graph { nodes: GNode[]; wires: Wire[]; seq: number }

/** Layout numbers, shared by the editor and the wires so a wire always meets its port without measuring the page. */
export const NODE_W = 236, HEAD = 36, ROW = 36, PAD = 8, FOLD_H = 56;
export const rowsOf = (d: Def) => Math.max(1, d.inputs.length + d.params.length);
/** A folded block shows its title bar and one line saying what is set. Its wires meet the title bar. */
export const isCollapsed = (n?: GNode) => !!n && !!n.v._c;
export const heightOf = (d: Def, n?: GNode) => (isCollapsed(n) ? FOLD_H : HEAD + ROW * rowsOf(d) + PAD);
export const inPort = (n: GNode, i: number) => ({ x: n.x, y: isCollapsed(n) ? n.y + HEAD / 2 : n.y + HEAD + ROW * i + ROW / 2 });
export const outPort = (n: GNode) => ({ x: n.x + NODE_W, y: isCollapsed(n) ? n.y + HEAD / 2 : n.y + HEAD + ROW / 2 });

export const defaults = (d: Def): Params => {
  const v: Params = {};
  d.params.forEach((p) => { v[p.key] = p.def; });
  d.inputs.forEach((p) => { if (p.def !== undefined) v[p.key] = p.def; });
  return v;
};
export function makeNode(g: Graph, kind: string, x: number, y: number): [Graph, GNode] {
  const n: GNode = { id: 'n' + (g.seq + 1), kind, x: Math.round(x), y: Math.round(y), v: defaults(DEF[kind]) };
  return [{ ...g, nodes: [...g.nodes, n], seq: g.seq + 1 }, n];
}

// ---------------------------------------------------------------- which wires are allowed
const outKind = (d: Def): Kind | 'none' => d.out ?? (d.statement ? 'none' : 'value');

/** null when a block of kind `from` may be wired into input `port` of a block of kind `to`; otherwise a short, plain reason. */
export function kindProblem(from: string, to: string, port: number): string | null {
  const fd = DEF[from], td = DEF[to]; if (!fd || !td) return 'That cannot be joined.';
  const p = td.inputs[port]; if (!p) return 'That block has no input there.';
  const out = outKind(fd), want = p.accepts ?? 'value';
  if (out === 'none') return `${fd.name} has nothing to hand on, so nothing can plug into it from there.`;
  if (want === 'value') return out === 'value' || VALUE_EL.has(from) ? null : `${fd.name} is part of the page, not a value. Things people use, like an Input box, a Slider or a Tick box, can give you a value.`;
  if (want === 'box') return out === 'box' ? null : 'Only a Box, Card, Grid or another box can hold things.';
  if (want === 'style') return out === 'style' ? null : 'That slot wants a Style block.';
  if (from === 'variable' && p.key === 'target') return null;
  return out === 'el' || out === 'box' ? null : 'That slot wants something from the page, such as a Button.';
}
/** null when `from` may be wired into input `port` of `to`; otherwise a short, plain reason. */
export function wireProblem(g: Graph, from: string, to: string, port: number): string | null {
  const f = g.nodes.find((n) => n.id === from), t = g.nodes.find((n) => n.id === to);
  if (!f || !t || from === to) return 'That cannot be joined.';
  return kindProblem(f.kind, t.kind, port);
}

// ---------------------------------------------------------------- compiling
export interface Compiled {
  /** The JavaScript: the logic nodes, then whatever the page needs. */
  code: string;
  /** The variable name each node gets in `code`. */
  names: Record<string, string>;
  /** Line number (0-based) of each node in `code`, so a selected node can light up its line. */
  lines: Record<string, number>;
  /** Problems that stop the code being right: a loop in the wiring, a broken expression. */
  errors: { node?: string; message: string }[];
  /** Things worth knowing that do not stop it running. */
  notes: { node?: string; message: string }[];
  /** True when the graph has web page nodes, so there is a page to preview. */
  page: boolean;
  /** The markup that goes inside <body>. */
  html: string;
  css: string;
  /** The whole page as one file you can save and open. */
  doc: string;
}

const literal = (p: PortDef, v: Val | undefined): string => {
  if (v === undefined || v === '') return p.as === 'list' ? '[]' : p.as === 'text' ? '""' : 'undefined';
  if (p.as === 'number') return num(v);
  if (p.as === 'text') return JSON.stringify(String(v));
  if (p.as === 'list') return '[]';
  const s = String(v).trim();
  if (s === 'true' || s === 'false') return s;
  if (s !== '' && Number.isFinite(Number(s))) return String(Number(s));
  return JSON.stringify(String(v));
};

/** Does this expression parse? Checked without running it. */
const parses = (e: string) => { try { new Function('x', 'a', 'b', `return (${e});`); return true; } catch { return false; } };
const SLUGS: Record<string, string> = {
  bool: 'flag', textop: 'text', expr: 'custom', logic: 'logic', para: 'paragraph', bullets: 'list', pagecfg: 'settings', glue: 'together', rcolour: 'colour', emojiv: 'emojiChar',
  mathtool: 'maths', listtool: 'listing', itemat: 'item', daysuntil: 'days', rgbmix: 'mix', replace: 'swapped', places: 'rounded', colourpick: 'picker', numbox: 'numbox', has: 'has',
};
const slug = (k: string) => SLUGS[k] ?? k;
/** Names that would clash with the page or with the helper code, so a block with that title gets "Block" added. */
const RESERVED = new Set(('break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null return super switch this throw true try typeof var void while with yield await async static ' +
  'document window self top parent frames location history navigator screen name status length event item hit bit alert confirm prompt print close open focus blur stop find scroll fetch console Math JSON Date Number String Array Object Promise Map Set Boolean Symbol Error ' +
  'undefined NaN Infinity pmc showValues jump shake spin grow shrink rotate note confetti overlaps toast typeOut speaker NOTES ' + Object.keys(LOGIC_HELPERS).join(' ') + ' toRgb toHex toHsl fromHsl brightness lighten saturate turn fade MORSE').split(' '));
/** A block title as a safe JavaScript name: "My score" becomes myScore. Empty when nothing usable is left. */
export function identOf(title: string): string {
  const words = title.normalize('NFKD').replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  let id = words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w[0].toLowerCase() + w.slice(1))).join('');
  if (/^\d/.test(id)) id = 'my' + id[0].toUpperCase() + id.slice(1);
  if (id.length < 2) id += 'Block';
  return RESERVED.has(id) ? id + 'Block' : id;
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hex = (v: Val | undefined) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v : '');
const PICTURE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160'%3E%3Crect width='240' height='160' fill='%23ddd'/%3E%3Ccircle cx='170' cy='50' r='16' fill='%23bbb'/%3E%3Cpath d='M0 160l70-80 50 50 40-30 80 60z' fill='%23bbb'/%3E%3C/svg%3E";
const csv = (s: Val | undefined) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean);

/** Small helper functions the page borrows when a block needs them. Only the ones a graph uses are written out. */
const HELPERS: Record<string, string> = {
  jump: 'function jump(item) {\n  item.style.position = "fixed";\n  item.style.left = Math.random() * (innerWidth - item.offsetWidth) + "px";\n  item.style.top = Math.random() * (innerHeight - item.offsetHeight) + "px";\n}',
  shake: 'function shake(item) {\n  item.animate([{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }], { duration: 300 });\n}',
  spin: 'function spin(item) {\n  item.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], { duration: 600, easing: "ease-in-out" });\n}',
  grow: 'function grow(item) {\n  const size = (Number(item.dataset.size) || 1) * 1.2;\n  item.dataset.size = size;\n  item.style.transform = "scale(" + size + ")";\n}',
  note: 'const NOTES = { C: 262, D: 294, E: 330, F: 349, G: 392, A: 440, B: 494 };\nlet speaker;\nfunction note(which) {\n  const pitch = NOTES[String(which).toUpperCase()] || (Number(which) > 20 ? Number(which) : 440);\n  speaker = speaker || new AudioContext();\n  const tone = speaker.createOscillator();\n  tone.frequency.value = pitch;\n  tone.connect(speaker.destination);\n  tone.start();\n  tone.stop(speaker.currentTime + 0.3);\n}',
  confetti: 'function confetti() {\n  for (let i = 0; i < 40; i++) {\n    const bit = document.createElement("span");\n    bit.textContent = ["🎉", "✨", "⭐", "🎈", "💥"][i % 5];\n    bit.style.cssText = "position: fixed; top: -2rem; font-size: 1.5rem; pointer-events: none; left: " + Math.random() * 100 + "vw";\n    document.body.append(bit);\n    const fall = [{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(110vh) rotate(" + (Math.random() * 720 - 360) + "deg)" }];\n    bit.animate(fall, { duration: 1500 + Math.random() * 1500, delay: Math.random() * 400, fill: "forwards" }).onfinish = () => bit.remove();\n  }\n}',
  shrink: 'function shrink(item) {\n  const size = (Number(item.dataset.size) || 1) / 1.2;\n  item.dataset.size = size;\n  item.style.transform = "scale(" + size + ")";\n}',
  rotate: 'function rotate(item, degrees) {\n  const angle = (Number(item.dataset.angle) || 0) + Number(degrees);\n  item.dataset.angle = angle;\n  item.style.transition = "transform 0.3s";\n  item.style.transform = "rotate(" + angle + "deg)";\n}',
  toast: 'function toast(message) {\n  const bubble = document.createElement("div");\n  bubble.textContent = message;\n  bubble.style.cssText = "position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); padding: 0.75rem 1.25rem; background: #171717; color: #fff; border-radius: 8px; z-index: 10";\n  document.body.append(bubble);\n  setTimeout(() => bubble.remove(), 2200);\n}',
  typeOut: 'function typeOut(item, words) {\n  words = String(words);\n  let shown = 0;\n  const timer = setInterval(() => {\n    item.textContent = words.slice(0, ++shown);\n    if (shown >= words.length) clearInterval(timer);\n  }, 50);\n}',
  overlaps: 'function overlaps(a, b) {\n  const one = a.getBoundingClientRect();\n  const two = b.getBoundingClientRect();\n  return one.left < two.right && one.right > two.left && one.top < two.bottom && one.bottom > two.top;\n}',
};

export function compile(g: Graph): Compiled {
  const errors: Compiled['errors'] = [], notes: Compiled['notes'] = [];
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const into = new Map<string, Wire>();               // `${node}:${port}` -> the wire arriving there
  g.wires.forEach((w) => { if (byId.has(w.from) && byId.has(w.to)) into.set(`${w.to}:${w.port}`, w); });
  const outgoing = new Map<string, Wire[]>();
  into.forEach((w) => outgoing.set(w.from, [...(outgoing.get(w.from) ?? []), w]));
  const isPageNode = (n: GNode) => onPage(DEF[n.kind]);
  const page = g.nodes.some(isPageNode);

  // names: number1, number2, math1 ... in the order the nodes were made. A block you have renamed keeps your name (score, myTotal).
  const count: Record<string, number> = {}, name: Record<string, string> = {}, taken = new Set<string>();
  const byAge = [...g.nodes].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  byAge.forEach((n) => {
    const own = typeof n.v._t === 'string' ? identOf(n.v._t) : '';
    if (!own || DEF[n.kind]?.inert) return;
    let id = own, k = 1; while (taken.has(id)) id = own + ++k;
    taken.add(id); name[n.id] = id;
  });
  byAge.forEach((n) => {
    if (name[n.id] || DEF[n.kind]?.inert) return;
    const s = slug(n.kind); let id: string;
    do { count[s] = (count[s] ?? 0) + 1; id = `${s}${count[s]}`; } while (taken.has(id));
    taken.add(id); name[n.id] = id;
  });

  // order: a node comes after everything wired into it (Kahn's algorithm, ties broken left to right)
  const indeg = new Map(g.nodes.map((n) => [n.id, 0]));
  into.forEach((w) => indeg.set(w.to, (indeg.get(w.to) ?? 0) + 1));
  const ready = g.nodes.filter((n) => indeg.get(n.id) === 0).sort((a, b) => a.x - b.x || a.y - b.y);
  const order: GNode[] = [];
  while (ready.length) {
    const n = ready.shift()!; order.push(n);
    g.wires.filter((w) => w.from === n.id && byId.has(w.to)).forEach((w) => {
      const d = (indeg.get(w.to) ?? 1) - 1; indeg.set(w.to, d);
      if (d === 0) { ready.push(byId.get(w.to)!); ready.sort((a, b) => a.x - b.x || a.y - b.y); }
    });
  }
  if (order.length < g.nodes.length) {
    const stuck = g.nodes.filter((n) => !order.includes(n));
    errors.push({ message: `The wires go round in a loop (${stuck.map((n) => DEF[n.kind].name).join(', ')}). A block cannot depend on itself.`, node: stuck[0].id });
    stuck.forEach((n) => order.push(n));
  }

  const wired = (n: GNode, key: string) => { const i = DEF[n.kind].inputs.findIndex((p) => p.key === key); return i < 0 ? undefined : into.get(`${n.id}:${i}`); };

  // Which page items the JavaScript has to find by name: anything a wire reads from or writes to, and anything with a script of its own.
  const refs = new Set<string>();
  g.nodes.forEach((n) => { if (n.kind === 'canvas' || FLOATERS.has(n.kind) || SCRIPTED.has(n.kind)) refs.add(n.id); });
  g.wires.forEach((w) => {
    const f = byId.get(w.from), t = byId.get(w.to); const pd = t && DEF[t.kind].inputs[w.port]; if (!f || !t || !pd) return;
    if ((pd.accepts ?? 'value') === 'value') { if (VALUE_EL.has(f.kind)) refs.add(f.id); if (isPageNode(t) && t.kind !== 'action') refs.add(t.id); }
    else if (t.kind === 'action' && pd.accepts === 'el' && f.kind !== 'variable') refs.add(f.id);
  });
  const player = order.find((n) => n.kind === 'player');
  g.nodes.filter((n) => n.kind === 'action' && String(n.v.when) === TOUCH && player).forEach(() => refs.add(player!.id));
  // Blocks whose answer changes each time they are asked (a random number, the time, what a person typed in).
  const volatile = (n: GNode) => { const d = DEF[n.kind]; return !!d.volatile || n.kind === 'now' || n.kind === 'daysuntil' || (d.params.some((p) => p.key === 'when') && n.v.when !== 'once, at the start'); };
  // What an Input box holds changes while the page is open, so anything worked out from one is worked out again each time it matters.
  const live = new Set<string>();
  order.forEach((n) => {
    if (isPageNode(n)) return;
    if (volatile(n) || DEF[n.kind].inputs.some((_, i) => { const w = into.get(`${n.id}:${i}`); const k = byId.get(w?.from ?? '')?.kind ?? ''; return w && (VALUE_EL.has(k) || k === 'variable' || live.has(w.from)); })) live.add(n.id);
  });
  // What comes from a Variable or an Input box changes while the page is open. Words on the page that come from one are shown again whenever something happens.
  const dyn = new Set<string>();
  order.forEach((n) => {
    if (isPageNode(n)) return;
    if (DEF[n.kind].inputs.some((_, i) => { const w = into.get(`${n.id}:${i}`); const k = byId.get(w?.from ?? '')?.kind ?? ''; return w && (VALUE_EL.has(k) || k === 'variable' || dyn.has(w.from)); })) dyn.add(n.id);
  });
  const dynFill = (w: Wire) => {
    const to = byId.get(w.to), f = byId.get(w.from);
    if (!to || !f || !ELEMENTS.has(to.kind) || !DEF[to.kind].inputs[w.port]?.bind) return false;
    return f.kind === 'variable' || VALUE_EL.has(f.kind) || dyn.has(f.id);
  };
  const redo = new Set<string>();    // live values only a "When pressed" (or a page item that keeps itself up to date) uses: worked out inside it, not at the top
  [...order].reverse().forEach((n) => {
    if (!live.has(n.id) || DEF[n.kind].statement) return;
    const outs = outgoing.get(n.id) ?? [];
    if (outs.length && outs.every((w) => byId.get(w.to)!.kind === 'action' || redo.has(w.to) || dynFill(w))) redo.add(n.id);
  });
  /** How a wire's value is read in the code: a name for a block, or what was chosen for a Slider, Tick box and the like. */
  const src = (w: Wire, p: PortDef) => {
    const f = byId.get(w.from)!, nm = name[f.id];
    if (f.kind === 'checkbox') return `${nm}.checked`;
    if (f.kind === 'slider' || f.kind === 'numbox') return `Number(${nm}.value)`;
    if (f.kind === 'field') return p.as === 'number' ? `Number(${nm}.value)` : `${nm}.value`;
    if (VALUE_EL.has(f.kind)) return `${nm}.value`;
    return nm;
  };

  // ---- the logic: one line per node
  const out: string[] = ['// PMC Block Coder', ''];
  const lines: Record<string, number> = {};
  // Helper functions the blocks call. Most are written once at the bottom; the few that set things up (the key tracker) go first.
  const needs = new Set<string>();
  g.nodes.forEach((n) => { const nd = DEF[n.kind]?.need; (typeof nd === 'function' ? nd(n.v) : nd ?? []).forEach((h) => needs.add(h)); });
  for (let grew = true; grew;) { grew = false; [...needs].forEach((h) => (HELPER_NEEDS[h] ?? []).forEach((x) => { if (!needs.has(x)) { needs.add(x); grew = true; } })); }
  const topHelpers = Object.keys(LOGIC_HELPERS).filter((h) => needs.has(h) && TOP_HELPERS.has(h));
  topHelpers.forEach((h) => out.push(...LOGIC_HELPERS[h].split('\n'), ''));
  const base = out.length;
  const helpers = new Set<string>();
  const gap = () => { if (out[out.length - 1] !== '') out.push(''); };
  const flushHelpers = () => {
    const all = [...Object.keys(LOGIC_HELPERS).filter((h) => needs.has(h) && !TOP_HELPERS.has(h)), ...helpers];
    if (!all.length) return;
    gap(); out.push('// Little helpers the blocks above use');
    all.forEach((h, i) => { if (i) out.push(''); out.push(LOGIC_HELPERS[h] ?? HELPERS[h]); });
  };
  const exprs = new Map<string, string>();
  const used = new Set(g.wires.map((w) => w.from));
  const elems = order.filter((n) => refs.has(n.id));
  elems.forEach((n) => out.push(`const ${name[n.id]} = document.getElementById("${name[n.id]}");`));
  if (elems.length) out.push('');
  order.forEach((n) => {
    const d = DEF[n.kind]; if (!d || isPageNode(n) || d.inert) return;
    const ins = d.inputs.map((p, i) => {
      const w = into.get(`${n.id}:${i}`);
      if (w) return src(w, p);
      if (p.def === undefined && d.kind !== 'log') notes.push({ node: n.id, message: `${d.name}: nothing is connected to “${p.label}”, so it will be empty.` });
      if (d.kind === 'log' && !w) notes.push({ node: n.id, message: 'Log has nothing connected, so it prints undefined.' });
      return literal(p, n.v[p.key]);
    });
    d.params.filter((p) => p.type === 'expr').forEach((p) => {
      const e = String(n.v[p.key] ?? '');
      if (!parses(e)) errors.push({ node: n.id, message: `${d.name}: “${e}” is not valid JavaScript.` });
    });
    const e = d.emit(ins, n.v);
    exprs.set(n.id, e);
    if (redo.has(n.id)) return;
    lines[n.id] = out.length;
    if (d.statement) out.push(e);
    else out.push(`${d.mutable ? 'let' : 'const'} ${name[n.id]} = ${e};`);
    if (!d.statement && !used.has(n.id)) notes.push({ node: n.id, message: `${d.name} is not connected to anything.` });
  });
  if (!g.nodes.length) out.push('// Add a block to begin.');
  else if (!page && !g.nodes.some((n) => n.kind === 'log' || n.kind === 'check_')) notes.push({ message: 'Add a Log block and connect it to see a result.' });

  let html = '', css = '', doc = '';
  if (!page) flushHelpers();
  if (page) {

    // ---- words and values on the page that come from other nodes
    const ind = (ls: string[], n: number) => ls.map((l) => ' '.repeat(n) + l);
    const fills: string[] = [], dynLines: string[] = [], dynSrc: Wire[] = [];
    order.filter((n) => ELEMENTS.has(n.kind)).forEach((n) => DEF[n.kind].inputs.forEach((p, i) => {
      const w = into.get(`${n.id}:${i}`); if (!w || !p.bind) return;
      if (dynFill(w)) { dynLines.push(`${name[n.id]}.${p.bind} = ${src(w, p)};`); dynSrc.push(w); } else fills.push(`${name[n.id]}.${p.bind} = ${src(w, p)};`);
    }));
    if (fills.length) out.push(...(out[out.length - 1] === '' ? [] : ['']), '// Fill in the page', ...fills);
    if (dynLines.length) {
      const need = new Set<string>();
      const walk = (id: string) => { if (!redo.has(id) || need.has(id)) return; need.add(id); DEF[byId.get(id)!.kind].inputs.forEach((_, i) => { const w = into.get(`${id}:${i}`); if (w) walk(w.from); }); };
      dynSrc.forEach((w) => walk(w.from));
      const setup = order.filter((q) => need.has(q.id)).map((q) => `const ${name[q.id]} = ${exprs.get(q.id)};`);
      const typed = dynSrc.some((w) => VALUE_EL.has(byId.get(w.from)!.kind) || [...need].some((id) => DEF[byId.get(id)!.kind].inputs.some((_, i) => VALUE_EL.has(byId.get(into.get(`${id}:${i}`)?.from ?? '')?.kind ?? ''))));
      gap();
      out.push('// Show the latest values on the page. This runs again each time something happens.', 'function showValues() {', ...ind([...setup, ...dynLines], 2), '}', 'showValues();');
      if (typed) out.push('document.addEventListener("input", showValues);', 'document.addEventListener("change", showValues);');
    }
    const refresh = dynLines.length ? ['showValues();'] : [];

    // ---- items with a script of their own
    order.filter((n) => n.kind === 'canvas').forEach((n) => {
      const nm = name[n.id], pen = `${nm}Pen`;
      gap();
      out.push(`// Draw on ${nm} with the mouse or a finger`, `const ${pen} = ${nm}.getContext("2d");`, `${pen}.lineCap = "round";`, `${pen}.lineWidth = ${PEN[String(n.v.size)] ?? 5};`,
        `${pen}.strokeStyle = "${hex(n.v.pen) || '#171717'}";`, `let ${nm}Down = false;${n.v.ink === 'rainbow' ? ` let ${nm}Hue = 0;` : ''}`,
        `const ${nm}Spot = (event) => {`, `  const box = ${nm}.getBoundingClientRect();`, `  return [(event.clientX - box.left) * ${nm}.width / box.width, (event.clientY - box.top) * ${nm}.height / box.height];`, '};',
        `${nm}.addEventListener("pointerdown", (event) => {`, `  ${nm}Down = true;`, `  ${nm}.setPointerCapture(event.pointerId);`, `  ${pen}.beginPath();`, `  ${pen}.moveTo(...${nm}Spot(event));`, '});',
        `${nm}.addEventListener("pointermove", (event) => {`, `  if (!${nm}Down) return;`,
        ...(n.v.ink === 'rainbow' ? [`  ${pen}.strokeStyle = "hsl(" + (${nm}Hue += 4) + ", 90%, 55%)";`] : []),
        `  ${pen}.lineTo(...${nm}Spot(event));`, `  ${pen}.stroke();`,
        ...(n.v.ink === 'rainbow' ? [`  ${pen}.beginPath();`, `  ${pen}.moveTo(...${nm}Spot(event));`] : []), '});',
        `${nm}.addEventListener("pointerup", () => { ${nm}Down = false; });`);
    });
    order.filter((n) => n.kind === 'player').forEach((n) => {
      const nm = name[n.id], s = PLAYER_STEP[String(n.v.speed)] ?? 14;
      gap();
      out.push(`// Move ${nm} with the arrow keys (or W A S D)`, `let ${nm}X = 60, ${nm}Y = 60;`, 'addEventListener("keydown", (event) => {', `  const step = ${s};`,
        `  if (event.key === "ArrowLeft" || event.key === "a") ${nm}X -= step;`, `  if (event.key === "ArrowRight" || event.key === "d") ${nm}X += step;`,
        `  if (event.key === "ArrowUp" || event.key === "w") ${nm}Y -= step;`, `  if (event.key === "ArrowDown" || event.key === "s") ${nm}Y += step;`,
        `  ${nm}X = Math.max(0, Math.min(${nm}X, innerWidth - ${nm}.offsetWidth));`, `  ${nm}Y = Math.max(0, Math.min(${nm}Y, innerHeight - ${nm}.offsetHeight));`,
        `  ${nm}.style.left = ${nm}X + "px";`, `  ${nm}.style.top = ${nm}Y + "px";`, '  if (event.key.startsWith("Arrow")) event.preventDefault();', '});');
      notes.push({ node: n.id, message: 'Player: click the page preview once, then use the arrow keys.' });
    });
    order.filter((n) => n.kind === 'bouncer').forEach((n) => {
      const nm = name[n.id], s = BOUNCE_SPEED[String(n.v.speed)] ?? 4;
      gap();
      out.push(`// ${nm} bounces off the edges for ever`, `let ${nm}X = 80, ${nm}Y = 80, ${nm}DX = ${s}, ${nm}DY = ${Math.round(s * 0.75 * 10) / 10};`, `function ${nm}Move() {`, `  ${nm}X += ${nm}DX;`, `  ${nm}Y += ${nm}DY;`,
        `  if (${nm}X < 0 || ${nm}X > innerWidth - ${nm}.offsetWidth) ${nm}DX = -${nm}DX;`, `  if (${nm}Y < 0 || ${nm}Y > innerHeight - ${nm}.offsetHeight) ${nm}DY = -${nm}DY;`,
        `  ${nm}.style.left = ${nm}X + "px";`, `  ${nm}.style.top = ${nm}Y + "px";`, `  requestAnimationFrame(${nm}Move);`, '}', `${nm}Move();`);
    });

    // ---- items that have a script of their own (counter, clock, stopwatch, typewriter, mouse follower, falling things...)
    order.filter((n) => SCRIPTS[n.kind]).forEach((n) => { gap(); out.push(...SCRIPTS[n.kind](name[n.id], n.v)); });

    // ---- what happens when something is pressed, every second, and so on
    order.filter((n) => n.kind === 'action').forEach((a) => {
      const raw = String(a.v.when), when = WHEN_OLD[raw] ?? raw;
      const on = wired(a, 'on');
      const forPage = WHEN_PAGE.includes(when), touch = when === TOUCH;
      if (!forPage && !on) { notes.push({ node: a.id, message: 'When pressed: connect a Button (or other item) to “watch”, so it knows what to wait for.' }); return; }
      if (touch && !player) { notes.push({ node: a.id, message: 'Touched by the player: add a Player block to the page first.' }); return; }
      const tw = wired(a, 'target'), vw = wired(a, 'value'), cw = wired(a, 'only');
      const tKind = tw ? byId.get(tw.from)?.kind : undefined;
      const t = tw ? name[tw.from] : 'document.body';
      const vp = DEF.action.inputs[2];
      const v = vw ? src(vw, vp) : literal(vp, a.v.value);
      const what = DO[String(a.v.do)] ?? 'text';
      const plain = /^-?\d+(\.\d+)?$/.test(v);
      if (VAR_DO.has(what) && tKind !== 'variable') { notes.push({ node: a.id, message: `“${a.v.do}” needs a Variable. Wire one into “change”.` }); return; }
      if (!VAR_DO.has(what) && tKind === 'variable') { notes.push({ node: a.id, message: `“${a.v.do}” changes something on the page. Wire a page item into “change”, or choose a variable action such as “set variable to”.` }); return; }
      const use = (h: string) => { helpers.add(h); };
      const stmt: string[] = what === 'count' ? [`${t}.textContent = Number(${t}.textContent) + ${plain ? v : `Number(${v})`};`]
        : what === 'toggle' ? [`${t}.hidden = !${t}.hidden;`]
        : what === 'hide' ? [`${t}.hidden = true;`]
        : what === 'show' ? [`${t}.hidden = false;`]
        : what === 'colour' ? [`${t}.style.color = ${v};`]
        : what === 'back' ? [`${t}.style.background = ${v};`]
        : what === 'src' ? [`${t}.src = ${v};`]
        : what === 'size' ? [`${t}.style.fontSize = ${v} + "px";`]
        : what === 'randcol' ? [`${t}.style.background = "hsl(" + Math.floor(Math.random() * 360) + ", 80%, 60%)";`]
        : what === 'jump' ? (use('jump'), [`jump(${t});`])
        : what === 'shake' ? (use('shake'), [`shake(${t});`])
        : what === 'spin' ? (use('spin'), [`spin(${t});`])
        : what === 'grow' ? (use('grow'), [`grow(${t});`])
        : what === 'shrink' ? (use('shrink'), [`shrink(${t});`])
        : what === 'rotate' ? (use('rotate'), [`rotate(${t}, ${v});`])
        : what === 'flip' ? [`${t}.style.transform = ${t}.style.transform === "scaleX(-1)" ? "" : "scaleX(-1)";`]
        : what === 'opacity' ? [`${t}.style.opacity = ${v} / 100;`]
        : what === 'fadeout' ? [`${t}.style.transition = "opacity 0.5s";`, `${t}.style.opacity = 0;`]
        : what === 'fadein' ? [`${t}.style.transition = "opacity 0.5s";`, `${t}.style.opacity = 1;`]
        : what === 'value' ? [`${t}.value = ${v};`]
        : what === 'tick' ? [`${t}.checked = true;`]
        : what === 'untick' ? [`${t}.checked = false;`]
        : what === 'focus' ? [`${t}.focus();`]
        : what === 'typeout' ? (use('typeOut'), [`typeOut(${t}, ${v});`])
        : what === 'toast' ? (use('toast'), [`toast(${v});`])
        : what === 'copy' ? [`navigator.clipboard?.writeText(String(${v}));`]
        : what === 'log' ? [`console.log(${v});`]
        : what === 'title' ? [`document.title = ${v};`]
        : what === 'pageback' ? [`document.body.style.background = ${v};`]
        : what === 'top' ? ['scrollTo({ top: 0, behavior: "smooth" });']
        : what === 'vibrate' ? ['navigator.vibrate?.(200);']
        : what === 'note' ? (use('note'), [`note(${v});`])
        : what === 'confetti' ? (use('confetti'), ['confetti();'])
        : what === 'speak' ? [`speechSynthesis.speak(new SpeechSynthesisUtterance(String(${v})));`]
        : what === 'setvar' ? [`${t} = ${v};`]
        : what === 'changevar' ? [`${t} += ${plain ? v : `Number(${v})`};`]
        : what === 'flipvar' ? [`${t} = !${t};`]
        : what === 'pushvar' ? [`${t}.push(${v});`]
        : what === 'popvar' ? [`${t}.pop();`]
        : what === 'emptyvar' ? [`${t}.length = 0;`]
        : what === 'resetvar' ? [`${t} = ${exprs.get(tw!.from) ?? '0'};`]
        : what === 'push' ? ['const item = document.createElement("li");', `item.textContent = ${v};`, `${t}.append(item);`]
        : what === 'clear' ? [tKind === 'canvas' ? `${t}.getContext("2d").clearRect(0, 0, ${t}.width, ${t}.height);` : `${t}.textContent = "";`]
        : [`${t}.textContent = ${v};`];
      const need = new Set<string>();
      const walk = (id: string) => { if (!redo.has(id) || need.has(id)) return; need.add(id); DEF[byId.get(id)!.kind].inputs.forEach((_, i) => { const w = into.get(`${id}:${i}`); if (w) walk(w.from); }); };
      if (vw) walk(vw.from);
      if (cw) walk(cw.from);
      const setup = order.filter((q) => need.has(q.id)).map((q) => `const ${name[q.id]} = ${exprs.get(q.id)};`);
      const body = cw ? [...setup, `if (${src(cw, DEF.action.inputs[3])}) {`, ...ind(stmt, 2), '}', ...refresh] : [...setup, ...stmt, ...refresh];
      gap();
      lines[a.id] = out.length;
      const nm = name[a.id];
      if (touch) {
        helpers.add('overlaps');
        out.push(`let ${nm}Touching = false;`, 'setInterval(() => {', `  const hit = overlaps(${name[on!.from]}, ${name[player!.id]});`, `  if (hit && !${nm}Touching) {`, ...ind(body, 4), '  }', `  ${nm}Touching = hit;`, '}, 50);');
      } else if (forPage) {
        if (WHEN_TIMERS[when]) out.push('setInterval(() => {', ...ind(body, 2), `}, ${WHEN_TIMERS[when]});`);
        else out.push(`addEventListener("${WHEN_EVENTS[when]}", () => {`, ...ind(body, 2), '});');
      } else if (when === ENTER) {
        out.push(`${name[on!.from]}.addEventListener("keydown", (event) => {`, '  if (event.key !== "Enter") return;', ...ind(body, 2), '});');
      } else {
        out.push(`${name[on!.from]}.addEventListener("${WHEN_ITEM[when] ?? 'click'}", () => {`, ...ind(body, 2), '});');
      }
    });
    flushHelpers();
    if (out.length === base) out.push('// Nothing happens yet. Add a “When pressed” block.');

    // ---- the page itself
    const styleOf = (n: GNode) => { const w = wired(n, 'look'); const s = w && byId.get(w.from); return s && s.kind === 'style' ? s : null; };
    const kids = new Map<string, GNode[]>(), roots: GNode[] = [];
    g.nodes.filter((n) => ELEMENTS.has(n.kind)).sort((a, b) => a.y - b.y || a.x - b.x).forEach((n) => {
      const w = wired(n, 'inside'), p = w && byId.get(w.from);
      if (p && BOX_TAGS[p.kind]) kids.set(p.id, [...(kids.get(p.id) ?? []), n]); else roots.push(n);
    });
    const body: string[] = [];
    const put = (n: GNode, depth: number, seen: Set<string>) => {
      if (seen.has(n.id)) return; seen.add(n.id);
      const pad = '  '.repeat(depth), nm = name[n.id], s = styleOf(n);
      const cls = [CLASSED.has(n.kind) ? nm : '', s ? name[s.id] : ''].filter(Boolean).join(' ');
      const at = (more = '') => `${refs.has(n.id) ? ` id="${nm}"` : ''}${cls ? ` class="${cls}"` : ''}${more}`;
      const val = (key: string) => (wired(n, key) ? null : esc(String(n.v[key] ?? '')));
      const labelled = (control: string) => { const lab = String(n.v.label ?? '').trim(); body.push(lab ? `${pad}<label>${esc(lab)} ${control}</label>` : `${pad}${control}`); };
      if (n.kind === 'heading') { const h = n.v.level === 'small' ? 3 : n.v.level === 'medium' ? 2 : 1; body.push(`${pad}<h${h}${at()}>${val('text') ?? ''}</h${h}>`); }
      else if (n.kind === 'para') body.push(`${pad}<p${at()}>${val('text') ?? ''}</p>`);
      else if (n.kind === 'emoji') body.push(`${pad}<p${at(` style="font-size: ${EMOJI_SIZE[String(n.v.size)] ?? '4rem'}; line-height: 1.1; width: fit-content${s?.v.align === 'centre' ? '; margin-inline: auto' : ''}"`)}>${val('text') ?? ''}</p>`);
      else if (n.kind === 'button') body.push(`${pad}<button${at()}>${val('text') ?? ''}</button>`);
      else if (n.kind === 'link') body.push(`${pad}<a${at(val('address') !== null ? ` href="${val('address')}"` : '')}>${val('text') ?? ''}</a>`);
      else if (n.kind === 'image') { const a = val('address'); body.push(`${pad}<img${at(wired(n, 'address') ? '' : ` src="${a || PICTURE}"`)}${val('words') !== null ? ` alt="${val('words')}"` : ''}>`); }
      else if (n.kind === 'field') body.push(`${pad}<input type="text"${at(val('text') !== null ? ` placeholder="${val('text')}"` : '')}>`);
      else if (n.kind === 'numbox') labelled(`<input type="number"${at(` value="${num(n.v.start)}"`)}>`);
      else if (n.kind === 'slider') labelled(`<input type="range"${at(` min="${num(n.v.min)}" max="${num(n.v.max)}" value="${num(n.v.start)}"`)}>`);
      else if (n.kind === 'checkbox') body.push(`${pad}<label><input type="checkbox"${at(n.v.start === 'ticked' ? ' checked' : '')}> ${esc(String(n.v.label ?? ''))}</label>`);
      else if (n.kind === 'dropdown') labelled(`<select${at()}>${csv(n.v.choices).map((c) => `<option>${esc(c)}</option>`).join('')}</select>`);
      else if (n.kind === 'colourpick') labelled(`<input type="color"${at(` value="${hex(n.v.start) || '#b49a57'}"`)}>`);
      else if (n.kind === 'progress') body.push(`${pad}<progress${at(` max="${num(n.v.max)}" value="${wired(n, 'amount') ? 0 : num(n.v.amount)}"`)}></progress>`);
      else if (n.kind === 'divider') body.push(`${pad}<hr${at()}>`);
      else if (n.kind === 'canvas') body.push(`${pad}<canvas${at(' width="480" height="280"')}></canvas>`);
      else if (FLOATERS.has(n.kind)) body.push(`${pad}<div${at()}>${val('text') ?? ''}</div>`);
      else if (n.kind === 'bullets') {
        const tag = n.v.type === 'numbers' ? 'ol' : 'ul';
        const items = csv(n.v.items);
        if (!items.length) body.push(`${pad}<${tag}${at()}></${tag}>`);
        else { body.push(`${pad}<${tag}${at()}>`); items.forEach((x) => body.push(`${pad}  <li>${esc(x)}</li>`)); body.push(`${pad}</${tag}>`); }
      } else if (BOX_TAGS[n.kind]) {
        const tag = BOX_TAGS[n.kind];
        body.push(`${pad}<${tag}${at(n.kind === 'details' && n.v.open === 'open' ? ' open' : '')}>`);
        if (n.kind === 'details') body.push(`${pad}  <summary>${esc(String(n.v.title ?? ''))}</summary>`);
        (kids.get(n.id) ?? []).forEach((c) => put(c, depth + 1, seen));
        body.push(`${pad}</${tag}>`);
      } else extraHtml(n.kind, n.v, { pad, nm, body, esc, at, val, labelled });
    };
    const seen = new Set<string>();
    roots.forEach((n) => put(n, 0, seen));
    html = body.join('\n');

    // ---- how it looks
    const cfg = order.find((n) => n.kind === 'pagecfg');
    const night = cfg?.v.pattern === 'night sky';
    const bg = night ? '#0b1026' : hex(cfg?.v.bg) || '#ffffff', fg = night ? '#f5f1e6' : hex(cfg?.v.color) || '#1a1a1a', font = FONTS[String(cfg?.v.font)] ?? FONTS.clean;
    const backdrop: Record<string, string> = {
      dots: '  background-image: radial-gradient(rgba(0, 0, 0, 0.18) 1.5px, transparent 1.5px);\n  background-size: 22px 22px;',
      stripes: '  background-image: repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.06) 0 12px, transparent 12px 24px);',
      grid: '  background-image: linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);\n  background-size: 28px 28px;',
      gradient: `  background-image: linear-gradient(160deg, ${bg}, rgba(0, 0, 0, 0.18));\n  min-height: 100vh;`,
      'night sky': '  background-image: radial-gradient(#fff 1px, transparent 1.5px), radial-gradient(#fff 1px, transparent 1.5px);\n  background-size: 90px 90px, 140px 140px;\n  background-position: 0 0, 40px 60px;',
    };
    const sheet: string[] = [
      '* { box-sizing: border-box; }',
      `body {\n  max-width: ${PAGE_WIDTH[String(cfg?.v.width)] ?? '40rem'};\n  margin: 0 auto;\n  padding: 2rem 1rem;\n  font-family: ${font};\n  line-height: 1.5;\n  background-color: ${bg};\n${backdrop[String(cfg?.v.pattern)] ? backdrop[String(cfg?.v.pattern)] + '\n' : ''}  color: ${fg};\n}`,
      'img { max-width: 100%; }',
      'button, select, input[type="text"], input[type="number"] { font: inherit; padding: 0.5rem 1rem; }',
      'button { cursor: pointer; }',
      'label { display: inline-flex; gap: 0.5rem; align-items: center; }',
      'input[type="range"], progress { width: 14rem; max-width: 100%; }',
      '[hidden] { display: none !important; }',
    ];
    // rules every page of a kind needs once (quotes, tables, code boxes...)
    const kinds = new Set(g.nodes.map((n) => n.kind));
    Object.entries(BASE_CSS).forEach(([k, rule]) => { if (kinds.has(k) && !sheet.includes(rule)) sheet.push(rule); });
    // colour palette: sets the colours of the page and of buttons, links and headings, before any Style block
    order.filter((n) => n.kind === 'palette').forEach((n) => sheet.push(...paletteCss(n.v)));
    g.nodes.filter((n) => BOX_TAGS[n.kind]).forEach((n) => sheet.push(boxCss(n.kind, name[n.id], n.v)));
    g.nodes.filter((n) => n.kind === 'canvas').forEach((n) => sheet.push(`.${name[n.id]} {\n  display: block;\n  max-width: 100%;\n  background: #fff;\n  border: 3px solid currentColor;\n  touch-action: none;\n  cursor: crosshair;\n}`));
    g.nodes.filter((n) => FLOATERS.has(n.kind)).forEach((n) => sheet.push(`.${name[n.id]} {\n  position: fixed;\n  left: 60px;\n  top: 60px;\n  font-size: ${FLOAT_SIZE[String(n.v.size)] ?? '3rem'};\n  line-height: 1;\n  user-select: none;${n.kind === 'follower' ? '\n  pointer-events: none;\n  z-index: 5;' : ''}\n}`));
    g.nodes.forEach((n) => { const c = itemCss(n.kind, name[n.id], n.v); if (c) sheet.push(c); });

    // Style blocks (one item each) and Global style blocks (every item of a kind)
    const styled = new Set(g.wires.filter((w) => byId.get(w.to) && DEF[byId.get(w.to)!.kind].inputs[w.port]?.accepts === 'style').map((w) => w.from));
    const frames = new Set<string>();
    const decls = (n: GNode): string[] => {
      const r: string[] = [];
      if (hex(n.v.color)) r.push(`color: ${hex(n.v.color)};`);
      if (hex(n.v.bg) && hex(n.v.bg2)) r.push(`background: linear-gradient(135deg, ${hex(n.v.bg)}, ${hex(n.v.bg2)});`);
      else if (hex(n.v.bg)) r.push(`background: ${hex(n.v.bg)};`);
      if (FONTS[String(n.v.font)]) r.push(`font-family: ${FONTS[String(n.v.font)]};`);
      if (SIZE[String(n.v.size)]) r.push(`font-size: ${SIZE[String(n.v.size)]};`);
      if (n.v.bold === 'yes') r.push('font-weight: 700;');
      if (LETTERS[String(n.v.letters)]) r.push(`text-transform: ${LETTERS[String(n.v.letters)]};`);
      if (ALIGN[String(n.v.align)]) r.push(`text-align: ${ALIGN[String(n.v.align)]};`);
      if (ROUND[String(n.v.round)]) r.push(`border-radius: ${ROUND[String(n.v.round)]};`);
      if (SPACE[String(n.v.space)]) r.push(`padding: ${SPACE[String(n.v.space)]};`);
      if (n.v.border === 'thin' || n.v.border === 'thick') r.push(`border: ${n.v.border === 'thin' ? 1 : 3}px solid currentColor;`);
      if (SHADOW[String(n.v.shadow)]) r.push(`box-shadow: ${SHADOW[String(n.v.shadow)]};`);
      if (WIDTH[String(n.v.width)]) r.push(`width: ${WIDTH[String(n.v.width)]};`);
      if (HOVER[String(n.v.hover)]) r.push('transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;');
      if (MOVES[String(n.v.move)]) { r.push('display: inline-block;', `animation: ${MOVES[String(n.v.move)].rule};`); frames.add(String(n.v.move)); }
      return r;
    };
    const rule = (sel: string, n: GNode) => {
      const r = decls(n);
      sheet.push(`${sel} {${r.length ? '\n' + r.map((x) => '  ' + x).join('\n') + '\n' : ''}}`);
      if (HOVER[String(n.v.hover)]) sheet.push(`${sel.split(', ').map((x) => x + ':hover').join(', ')} {\n  ${HOVER[String(n.v.hover)]}\n}`);
    };
    g.nodes.filter((n) => n.kind === 'gstyle').sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1))).forEach((n) => {
      const target = String(n.v.target);
      const sel = target === 'all boxes' ? g.nodes.filter((b) => BOX_TAGS[b.kind]).map((b) => '.' + name[b.id]).join(', ') : GLOBAL_TARGETS[target] ?? 'body';
      if (!sel) { notes.push({ node: n.id, message: 'Global style: there are no boxes on the page yet, so “all boxes” changes nothing.' }); return; }
      rule(sel, n);
    });
    g.nodes.filter((n) => n.kind === 'style').sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1))).forEach((n) => {
      if (!styled.has(n.id)) { notes.push({ node: n.id, message: 'Style is not plugged into any “look”, so it changes nothing.' }); return; }
      rule('.' + name[n.id], n);
    });
    frames.forEach((f) => sheet.push(MOVES[f].frames));
    css = sheet.join('\n\n') + '\n';

    const hasJs = out.length > base && !(out.length === base + 1 && out[base].startsWith('// Nothing happens'));
    const title = esc(String(cfg?.v.title || 'My page'));
    const about = esc(String(cfg?.v.description ?? '').trim());
    const icon = String(cfg?.v.icon ?? '').trim();
    const head = ['  <meta charset="utf-8">', '  <meta name="viewport" content="width=device-width, initial-scale=1">', `  <title>${title}</title>`,
      ...(about ? [`  <meta name="description" content="${about}">`] : []),
      `  <meta name="theme-color" content="${bg}">`,
      `  <meta property="og:title" content="${title}">`, ...(about ? [`  <meta property="og:description" content="${about}">`] : []), '  <meta property="og:type" content="website">',
      '  <meta name="generator" content="PMC Block Coder">',
      ...(icon ? [`  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${esc(icon)}</text></svg>`)}">`] : [])];
    doc = ['<!doctype html>', '<html lang="en">', '<head>', ...head,
      '  <style>', css.trimEnd().split('\n').map((l) => (l ? '    ' + l : l)).join('\n'), '  </style>', '</head>', '<body>',
      html.split('\n').map((l) => (l ? '  ' + l : l)).join('\n'),
      ...(hasJs ? ['', '  <script>', out.join('\n').replace(/<\/script/gi, '<\\/script').trimEnd().split('\n').map((l) => (l ? '    ' + l : l)).join('\n'), '  </script>'] : []),
      '</body>', '</html>', ''].join('\n');
  }
  return { code: out.join('\n') + '\n', names: name, lines, errors, notes, page, html, css, doc };
}

/** Makes what you see in the preview report back, so Log and errors show in the Output tab. Only the preview gets this; the saved page does not. */
const SHIM = '<script>(function(){function s(k,a){try{parent.postMessage({pmcNode:k,text:Array.prototype.map.call(a,function(x){if(typeof x==="string")return x;try{return JSON.stringify(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}}console.log=function(){s("log",arguments)};window.addEventListener("error",function(e){s("error",[e.message])})})();</script>';
export const previewDoc = (doc: string) => doc.replace('<head>', '<head>\n  ' + SHIM);

export const emptyGraph = (): Graph => ({ nodes: [], wires: [], seq: 0 });
export const cloneGraph = (g: Graph): Graph => JSON.parse(JSON.stringify(g));

/** Accepts only a graph that has the right shape, so a corrupt save can never break the page. */
export function sanitise(raw: unknown): Graph | null {
  try {
    const g = raw as Graph;
    if (!g || !Array.isArray(g.nodes) || !Array.isArray(g.wires)) return null;
    const nodes = g.nodes.filter((n) => n && DEF[n.kind] && typeof n.x === 'number' && typeof n.y === 'number').map((n) => {
      const v = { ...defaults(DEF[n.kind]), ...(n.v ?? {}) };
      if (n.kind === 'action' && typeof v.when === 'string' && WHEN_OLD[v.when]) v.when = WHEN_OLD[v.when];
      return { ...n, v };
    });
    const ids = new Set(nodes.map((n) => n.id));
    const base: Graph = { nodes, wires: [], seq: 0 };
    const wires = g.wires.filter((w) => ids.has(w.from) && ids.has(w.to) && Number.isInteger(w.port) && w.port >= 0 && w.port < DEF[nodes.find((n) => n.id === w.to)!.kind].inputs.length && wireProblem(base, w.from, w.to, w.port) === null);
    return { nodes, wires, seq: Math.max(Number(g.seq) || 0, ...nodes.map((n) => Number(n.id.slice(1)) || 0)) };
  } catch { return null; }
}
