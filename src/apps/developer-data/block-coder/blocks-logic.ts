/**
 * More blocks for the Block Coder: values, variables, maths, text, lists, dates, colours and small calculators.
 * Each block is one definition: what it shows on the node, and the line of JavaScript it writes.
 * Blocks that need a longer helper (is it prime, add days to a date...) write a small named function once, at the bottom
 * of the code, and the block's line just calls it, so the generated code still reads like something a person wrote.
 */
import type { Def, ParamDef, PortDef, Val } from './graph';

export interface Ctx { wrap: (s: string) => string; num: (v: Val) => string }

const IN = (key: string, label: string, as: PortDef['as'], def?: Val): PortDef => ({ key, label, as, ...(def !== undefined ? { def } : {}) });
const SEL = (key: string, label: string, options: string[], def?: string): ParamDef => ({ key, label, type: 'select', options, def: def ?? options[0] });
const TXT = (key: string, label: string, def: string, placeholder?: string): ParamDef => ({ key, label, type: 'text', def, ...(placeholder ? { placeholder } : {}) });
const EVERY: ParamDef = { key: 'when', label: 'Picks', type: 'select', options: ['every time', 'once, at the start'], def: 'every time' };
const s = (v: Val | undefined) => String(v ?? '');
const q = JSON.stringify;

// ------------------------------------------------------------------ small lookup tables
const CONSTANTS: Record<string, string> = {
  pi: 'Math.PI', e: 'Math.E', 'golden ratio': '(1 + Math.sqrt(5)) / 2', 'square root of 2': 'Math.SQRT2', infinity: 'Infinity',
  'seconds in a day': '86400', 'speed of light (m/s)': '299792458', 'gravity (m/s²)': '9.80665',
};
const SAMPLES: Record<string, string> = {
  'a sentence of lorem ipsum': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'a pangram': 'The quick brown fox jumps over the lazy dog.',
  'a famous saying': 'Be the change you wish to see in the world.',
  'a riddle': 'What has keys but cannot open locks? A piano.',
  'a short paragraph': 'The sun came up slowly over the hills. A few birds started singing. Somewhere, a kettle began to whistle.',
  'a long word': 'Pneumonoultramicroscopicsilicovolcanoconiosis',
};
const WORDS: Record<string, string[]> = {
  colours: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white'],
  animals: ['cat', 'dog', 'horse', 'rabbit', 'owl', 'fox', 'whale', 'penguin', 'tiger', 'frog'],
  fruits: ['apple', 'banana', 'cherry', 'grape', 'lemon', 'mango', 'orange', 'peach', 'pear', 'plum'],
  planets: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'],
  'days of the week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  countries: ['Brazil', 'Canada', 'Egypt', 'France', 'India', 'Japan', 'Kenya', 'Mexico', 'Norway', 'Peru'],
  'first names': ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Taylor', 'Morgan', 'Jamie', 'Robin', 'Charlie'],
  emojis: ['😀', '😎', '🎉', '🚀', '🌈', '🍕', '🐶', '⭐', '🎮', '💎'],
  'rainbow colours (hex)': ['#e03131', '#f08c00', '#f2c200', '#2f9e44', '#1c7ed6', '#6741d9', '#c2255c'],
};
const NUMINFO: Record<string, [string, string[]]> = {
  'is prime': ['isPrime($)', ['isPrime']], 'is whole': ['$ % 1 === 0', []], 'is positive': ['$ > 0', []], 'is negative': ['$ < 0', []], 'is zero': ['$ === 0', []],
  'is a perfect square': ['Number.isInteger(Math.sqrt($))', []], factorial: ['factorial($)', ['factorial']], 'Fibonacci number': ['fibonacci($)', ['fibonacci']],
  sign: ['Math.sign($)', []], 'digit count': ['String(Math.abs(Math.trunc($))).length', []], 'digit sum': ['[...String(Math.abs(Math.trunc($)))].reduce((total, digit) => total + Number(digit), 0)', []],
  'digits reversed': ['Number([...String(Math.abs(Math.trunc($)))].reverse().join(""))', []], 'to radians': ['$ * Math.PI / 180', []], 'to degrees': ['$ * 180 / Math.PI', []],
  'whole part': ['Math.trunc($)', []], 'decimal part': ['$ % 1', []],
};
const TRIG: Record<string, string> = { sine: 'Math.sin', cosine: 'Math.cos', tangent: 'Math.tan', 'arc sine': 'Math.asin', 'arc cosine': 'Math.acos', 'arc tangent': 'Math.atan' };
const LOGS: Record<string, (n: string) => string> = {
  'power of 2': (n) => `2 ** ${n}`, 'power of 10': (n) => `10 ** ${n}`, 'e to the power': (n) => `Math.exp(${n})`, 'log base 10': (n) => `Math.log10(${n})`,
  'log base 2': (n) => `Math.log2(${n})`, 'natural log': (n) => `Math.log(${n})`, cube: (n) => `${n} ** 3`, 'cube root': (n) => `Math.cbrt(${n})`, 'one over': (n) => `1 / ${n}`,
};
const CHECKS: Record<string, (v: string) => string> = {
  'is empty': (v) => `(${v} === "" || ${v} == null || (Array.isArray(${v}) && ${v}.length === 0))`,
  'is a number': (v) => `(${v} !== "" && Number.isFinite(Number(${v})))`,
  'is text': (v) => `typeof ${v} === "string"`, 'is a list': (v) => `Array.isArray(${v})`, 'is yes or no': (v) => `typeof ${v} === "boolean"`,
};
const CLEAN: Record<string, (t: string) => string> = {
  'remove accents': (t) => `${t}.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")`,
  'remove punctuation': (t) => `${t}.replace(/[^\\p{L}\\p{N}\\s]/gu, "")`,
  'remove digits': (t) => `${t}.replace(/\\d/g, "")`, 'keep only letters': (t) => `${t}.replace(/[^\\p{L}]/gu, "")`, 'keep only digits': (t) => `${t}.replace(/\\D/g, "")`,
  'squash spaces': (t) => `${t}.replace(/\\s+/g, " ").trim()`, 'trim the start': (t) => `${t}.trimStart()`, 'trim the end': (t) => `${t}.trimEnd()`,
  'remove web tags': (t) => `${t}.replace(/<[^>]*>/g, "")`,
};
const LINES: Record<string, (t: string) => string> = {
  'count the lines': (t) => `${t}.split("\\n").length`, 'first line': (t) => `${t}.split("\\n")[0]`, 'last line': (t) => `${t}.split("\\n").at(-1)`,
  'number the lines': (t) => `${t}.split("\\n").map((line, i) => (i + 1) + ". " + line).join("\\n")`,
  'sort the lines': (t) => `${t}.split("\\n").sort().join("\\n")`, 'reverse the lines': (t) => `${t}.split("\\n").reverse().join("\\n")`,
  'remove blank lines': (t) => `${t}.split("\\n").filter((line) => line.trim()).join("\\n")`,
  'remove repeated lines': (t) => `[...new Set(${t}.split("\\n"))].join("\\n")`,
  'indent the lines': (t) => `${t}.split("\\n").map((line) => "  " + line).join("\\n")`,
};
const MORE_TEXT: Record<string, (t: string) => string> = {
  'first word': (t) => `${t}.trim().split(/\\s+/)[0]`, 'last word': (t) => `${t}.trim().split(/\\s+/).at(-1)`,
  initials: (t) => `${t}.trim().split(/\\s+/).map((word) => word[0]).join("").toUpperCase()`,
  'sentence case': (t) => `${t}.charAt(0).toUpperCase() + ${t}.slice(1).toLowerCase()`,
  'sorted letters': (t) => `[...${t}].sort().join("")`, 'is a number': (t) => `(${t}.trim() !== "" && Number.isFinite(Number(${t})))`,
  'is an email': (t) => `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${t})`, 'is a web address': (t) => `/^https?:\\/\\/\\S+$/.test(${t})`,
  'letters only count': (t) => `(${t}.match(/\\p{L}/gu) || []).length`, 'shout': (t) => `${t}.toUpperCase() + "!"`,
};
const LIST_MATHS: Record<string, (l: string) => string> = {
  sum: (l) => `${l}.reduce((total, x) => total + x, 0)`, product: (l) => `${l}.reduce((total, x) => total * x, 1)`, average: (l) => `${l}.reduce((total, x) => total + x, 0) / ${l}.length`,
  median: (l) => `median(${l})`, mode: (l) => `mode(${l})`, 'biggest minus smallest': (l) => `Math.max(...${l}) - Math.min(...${l})`, 'standard deviation': (l) => `stdev(${l})`,
  'how many are numbers': (l) => `${l}.filter((x) => Number.isFinite(Number(x))).length`,
};
const COLOUR_ACTIONS: Record<string, (c: string, n: string) => string> = {
  lighter: (c, n) => `lighten(${c}, ${n})`, darker: (c, n) => `lighten(${c}, -${n})`, 'more vivid': (c, n) => `saturate(${c}, ${n})`, 'less vivid': (c, n) => `saturate(${c}, -${n})`,
  'opposite colour': (c) => `turn(${c}, 180)`, 'turn the hue': (c, n) => `turn(${c}, ${n} * 3.6)`, 'make see-through': (c, n) => `fade(${c}, ${n})`,
};
const FACTS: Record<string, (c: string) => string> = {
  red: (c) => `toRgb(${c})[0]`, green: (c) => `toRgb(${c})[1]`, blue: (c) => `toRgb(${c})[2]`, 'brightness (0 to 100)': (c) => `Math.round(brightness(${c}))`,
  'is light': (c) => `brightness(${c}) > 55`, 'is dark': (c) => `brightness(${c}) <= 55`, 'text colour that reads on it': (c) => `(brightness(${c}) > 55 ? "#171717" : "#ffffff")`,
  'as rgb()': (c) => `"rgb(" + toRgb(${c}).join(", ") + ")"`, 'as hex': (c) => `toHex(...toRgb(${c}))`, hue: (c) => `Math.round(toHsl(...toRgb(${c}))[0])`,
  saturation: (c) => `Math.round(toHsl(...toRgb(${c}))[1])`, lightness: (c) => `Math.round(toHsl(...toRgb(${c}))[2])`,
};
const DATE_UNITS = ['days', 'weeks', 'months', 'years', 'hours', 'minutes'];

// ------------------------------------------------------------------ helper functions the blocks above call
export const LOGIC_HELPERS: Record<string, string> = {
  isPrime: 'function isPrime(n) {\n  if (n < 2 || n % 1 !== 0) return false;\n  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;\n  return true;\n}',
  factorial: 'function factorial(n) {\n  let total = 1;\n  for (let i = 2; i <= Math.min(n, 170); i++) total *= i;\n  return total;\n}',
  fibonacci: 'function fibonacci(n) {\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) [a, b] = [b, a + b];\n  return a;\n}',
  gcd: 'function gcd(a, b) {\n  a = Math.abs(a);\n  b = Math.abs(b);\n  while (b) [a, b] = [b, a % b];\n  return a;\n}',
  median: 'function median(list) {\n  const sorted = [...list].sort((a, b) => a - b);\n  const mid = Math.floor(sorted.length / 2);\n  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;\n}',
  mode: 'function mode(list) {\n  const counts = new Map();\n  list.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1));\n  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];\n}',
  stdev: 'function stdev(list) {\n  const mean = list.reduce((total, x) => total + x, 0) / list.length;\n  return Math.sqrt(list.reduce((total, x) => total + (x - mean) ** 2, 0) / list.length);\n}',
  casing: 'function casing(text, style) {\n  const words = String(text).replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w.toLowerCase());\n  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);\n  if (style === "camelCase") return words.map((w, i) => (i ? cap(w) : w)).join("");\n  if (style === "PascalCase") return words.map(cap).join("");\n  if (style === "snake_case") return words.join("_");\n  if (style === "kebab-case") return words.join("-");\n  if (style === "CONSTANT_CASE") return words.join("_").toUpperCase();\n  if (style === "Title Case") return words.map(cap).join(" ");\n  return [...String(text)].map((c, i) => (i % 2 ? c.toLowerCase() : c.toUpperCase())).join("");\n}',
  encodeText: 'function encodeText(text, how) {\n  const t = String(text);\n  const MORSE = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };\n  if (how === "URL encode") return encodeURIComponent(t);\n  if (how === "URL decode") { try { return decodeURIComponent(t); } catch { return t; } }\n  if (how === "Base64 encode") return btoa(String.fromCharCode(...new TextEncoder().encode(t)));\n  if (how === "Base64 decode") { try { return new TextDecoder().decode(Uint8Array.from(atob(t), (c) => c.charCodeAt(0))); } catch { return "not Base64"; } }\n  if (how === "HTML escape") return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");\n  if (how === "ROT13") return t.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));\n  if (how === "binary") return [...t].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");\n  if (how === "hex") return [...t].map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");\n  return [...t.toLowerCase()].map((c) => MORSE[c] || (c === " " ? "/" : "")).join(" ");\n}',
  showNumber: 'function showNumber(n, style) {\n  n = Number(n);\n  if (style === "with commas") return n.toLocaleString("en-GB");\n  if (style === "pounds") return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });\n  if (style === "dollars") return n.toLocaleString("en-US", { style: "currency", currency: "USD" });\n  if (style === "euros") return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });\n  if (style === "percent") return Math.round(n * 100) + "%";\n  if (style === "short (1.2K)") return new Intl.NumberFormat("en", { notation: "compact" }).format(n);\n  if (style === "ordinal (1st)") { const end = n % 100 > 10 && n % 100 < 14 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"; return n + end; }\n  if (style === "Roman numerals") { let r = "", left = Math.max(0, Math.min(3999, Math.round(n))); for (const [v, c] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) while (left >= v) { r += c; left -= v; } return r; }\n  if (style === "binary") return Math.round(n).toString(2);\n  if (style === "hex") return Math.round(n).toString(16).toUpperCase();\n  if (style === "octal") return Math.round(n).toString(8);\n  return n.toExponential(2);\n}',
  toRgb: 'function toRgb(colour) {\n  const text = String(colour).trim();\n  if (text.startsWith("hsl")) return toRgb(fromHsl(...text.match(/[\\d.]+/g).map(Number)));\n  if (text.startsWith("rgb")) return text.match(/[\\d.]+/g).slice(0, 3).map(Number);\n  const hex = text.replace("#", "");\n  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;\n  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);\n}',
  toHex: 'function toHex(r, g, b) {\n  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");\n}',
  toHsl: 'function toHsl(r, g, b) {\n  r /= 255;\n  g /= 255;\n  b /= 255;\n  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;\n  if (max === min) return [0, 0, l * 100];\n  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);\n  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;\n  return [h * 60, s * 100, l * 100];\n}',
  fromHsl: 'function fromHsl(h, s, l) {\n  s /= 100;\n  l /= 100;\n  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);\n  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));\n  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);\n}',
  brightness: 'function brightness(colour) {\n  const [r, g, b] = toRgb(colour);\n  return (0.299 * r + 0.587 * g + 0.114 * b) / 2.55;\n}',
  lighten: 'function lighten(colour, amount) {\n  const [h, s, l] = toHsl(...toRgb(colour));\n  return fromHsl(h, s, Math.max(0, Math.min(100, l + amount)));\n}',
  saturate: 'function saturate(colour, amount) {\n  const [h, s, l] = toHsl(...toRgb(colour));\n  return fromHsl(h, Math.max(0, Math.min(100, s + amount)), l);\n}',
  turn: 'function turn(colour, degrees) {\n  const [h, s, l] = toHsl(...toRgb(colour));\n  return fromHsl((h + degrees + 360) % 360, s, l);\n}',
  fade: 'function fade(colour, percent) {\n  return "rgba(" + toRgb(colour).join(", ") + ", " + (1 - percent / 100) + ")";\n}',
  asDate: 'function asDate(text) {\n  const t = String(text).trim().toLowerCase();\n  if (t === "today") return new Date(new Date().setHours(0, 0, 0, 0));\n  return !t || t === "now" ? new Date() : new Date(text);\n}',
  addToDate: 'function addToDate(date, amount, unit) {\n  const d = asDate(date);\n  if (unit === "months") d.setMonth(d.getMonth() + amount);\n  else if (unit === "years") d.setFullYear(d.getFullYear() + amount);\n  else d.setTime(d.getTime() + amount * { days: 864e5, weeks: 6048e5, hours: 36e5, minutes: 6e4 }[unit]);\n  return d.toLocaleDateString("en-CA");\n}',
  dateGap: 'function dateGap(from, to, unit) {\n  const a = asDate(from), b = asDate(to);\n  if (unit === "months") return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();\n  if (unit === "years") return b.getFullYear() - a.getFullYear();\n  const gap = (b - a) / { days: 864e5, weeks: 6048e5, hours: 36e5, minutes: 6e4 }[unit];\n  return unit === "weeks" ? Math.round(gap * 10) / 10 : Math.round(gap);\n}',
  showDate: 'function showDate(date, style) {\n  const d = asDate(date);\n  if (style === "long date") return d.toLocaleDateString("en-GB", { dateStyle: "long" });\n  if (style === "short date") return d.toLocaleDateString("en-GB");\n  if (style === "weekday") return d.toLocaleDateString("en-GB", { weekday: "long" });\n  if (style === "month name") return d.toLocaleDateString("en-GB", { month: "long" });\n  if (style === "year") return d.getFullYear();\n  if (style === "day of the year") return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);\n  if (style === "week number") return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 864e5 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);\n  if (style === "is a weekend") return d.getDay() === 0 || d.getDay() === 6;\n  if (style === "is a leap year") return new Date(d.getFullYear(), 1, 29).getDate() === 29;\n  return d.toLocaleDateString("en-CA");\n}',
  ageOf: 'function ageOf(birthday) {\n  const born = asDate(birthday), today = new Date();\n  let years = today.getFullYear() - born.getFullYear();\n  if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) years--;\n  return years;\n}',
  clockText: 'function clockText(seconds) {\n  const s = Math.max(0, Math.round(seconds)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);\n  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0");\n}',
  countdownText: 'function countdownText(date) {\n  const left = Math.max(0, asDate(date) - Date.now()), s = Math.floor(left / 1000);\n  return Math.floor(s / 86400) + "d " + String(Math.floor(s % 86400 / 3600)).padStart(2, "0") + "h " + String(Math.floor(s % 3600 / 60)).padStart(2, "0") + "m " + String(s % 60).padStart(2, "0") + "s";\n}',
  jsonGet: 'function jsonGet(text, path) {\n  try {\n    return String(path).split(".").filter(Boolean).reduce((value, key) => value?.[key], JSON.parse(text));\n  } catch {\n    return undefined;\n  }\n}',
  loanPayment: 'function loanPayment(amount, yearlyRate, years) {\n  const r = yearlyRate / 1200, n = years * 12;\n  return r === 0 ? amount / n : amount * r / (1 - (1 + r) ** -n);\n}',
  tracker: 'const pmc = { key: "", x: 0, y: 0, down: false };\naddEventListener("keydown", (event) => { pmc.key = event.key; });\naddEventListener("pointermove", (event) => { pmc.x = event.clientX; pmc.y = event.clientY; });\naddEventListener("pointerdown", () => { pmc.down = true; });\naddEventListener("pointerup", () => { pmc.down = false; });',
};
/** Helpers that other helpers call. */
export const HELPER_NEEDS: Record<string, string[]> = {
  addToDate: ['asDate'], dateGap: ['asDate'], showDate: ['asDate'], ageOf: ['asDate'], countdownText: ['asDate'],
  toRgb: ['fromHsl'], fromHsl: ['toHex'], brightness: ['toRgb'], lighten: ['toRgb', 'toHsl', 'fromHsl'], saturate: ['toRgb', 'toHsl', 'fromHsl'], turn: ['toRgb', 'toHsl', 'fromHsl'], fade: ['toRgb'],
};
/** Helpers that go at the top of the code, because the lines below read what they set up. */
export const TOP_HELPERS = new Set(['tracker']);

// ------------------------------------------------------------------ the blocks
export function logicDefs({ wrap, num }: Ctx): Def[] {
  const defs: Def[] = [
    // ---- values
    { kind: 'coin', name: 'Coin flip', group: 'input', blurb: 'Heads or tails, at random', inputs: [], params: [EVERY], emit: () => 'Math.random() < 0.5 ? "heads" : "tails"' },
    { kind: 'dice', name: 'Dice', group: 'input', blurb: 'Roll one or more dice and add them up', inputs: [IN('n', 'dice', 'number', 1)],
      params: [SEL('sides', 'Sides', ['4', '6', '8', '10', '12', '20', '100'], '6'), EVERY],
      emit: (i, p) => `Array.from({ length: ${i[0]} }, () => Math.floor(Math.random() * ${s(p.sides)}) + 1).reduce((total, roll) => total + roll, 0)` },
    { kind: 'constant', name: 'Constant', group: 'input', blurb: 'Pi, e, the golden ratio and other fixed numbers', inputs: [], params: [SEL('which', 'Is', Object.keys(CONSTANTS))],
      emit: (_, p) => CONSTANTS[s(p.which)] ?? 'Math.PI' },
    { kind: 'sample', name: 'Sample text', group: 'input', blurb: 'Ready-made words to try things on', inputs: [], params: [SEL('which', 'Give me', Object.keys(SAMPLES))],
      emit: (_, p) => q(SAMPLES[s(p.which)] ?? '') },
    { kind: 'words', name: 'Word list', group: 'input', blurb: 'Colours, animals, fruits, planets, months and more', inputs: [], params: [SEL('which', 'Give me', Object.keys(WORDS))],
      emit: (_, p) => JSON.stringify(WORDS[s(p.which)] ?? []).replace(/","/g, '", "') },
    { kind: 'seconds', name: 'Seconds running', group: 'input', blurb: 'How long the page has been open, in seconds', inputs: [], params: [], volatile: true, emit: () => 'Math.floor(performance.now() / 1000)' },
    { kind: 'randomid', name: 'Random letters', group: 'input', blurb: 'A random code, like for a password or an ID', inputs: [IN('n', 'length', 'number', 8)],
      params: [SEL('from', 'Made of', ['letters and digits', 'letters', 'digits', 'hex digits']), EVERY],
      emit: (i, p) => {
        const set = p.from === 'letters' ? 'abcdefghijklmnopqrstuvwxyz' : p.from === 'digits' ? '0123456789' : p.from === 'hex digits' ? '0123456789abcdef' : 'abcdefghijklmnopqrstuvwxyz0123456789';
        return `Array.from({ length: ${i[0]} }, () => ${q(set)}[Math.floor(Math.random() * ${set.length})]).join("")`;
      } },
    { kind: 'eventinfo', name: 'Key and mouse', group: 'input', blurb: 'The last key pressed, where the mouse is, how far you have scrolled', inputs: [],
      params: [SEL('what', 'Give me', ['last key pressed', 'mouse across', 'mouse down', 'mouse button is held', 'scroll position', 'window width', 'window height'])], volatile: true, need: ['tracker'],
      emit: (_, p) => ({ 'last key pressed': 'pmc.key', 'mouse across': 'pmc.x', 'mouse down': 'pmc.y', 'mouse button is held': 'pmc.down', 'scroll position': 'Math.round(self.scrollY)', 'window width': 'self.innerWidth', 'window height': 'self.innerHeight' } as Record<string, string>)[s(p.what)] ?? 'pmc.key' },

    // ---- variables
    { kind: 'variable', name: 'Variable', group: 'var', blurb: 'A box that remembers a value. “When pressed” blocks can change it', inputs: [],
      params: [SEL('holds', 'Holds', ['a number', 'some text', 'yes or no', 'a list']), TXT('start', 'Starts as', '0', '0, or a word, or 1, 2, 3')], mutable: true,
      emit: (_, p) => {
        const v = s(p.start).trim();
        if (p.holds === 'some text') return q(s(p.start));
        if (p.holds === 'yes or no') return String(/^(yes|true|1|on)$/i.test(v));
        if (p.holds === 'a list') return '[' + v.split(',').map((x) => x.trim()).filter((x) => x !== '').map((x) => (Number.isFinite(Number(x)) ? x : q(x))).join(', ') + ']';
        return num(v);
      } },

    // ---- maths
    { kind: 'percent', name: 'Percent', group: 'logic', blurb: '20% of 50? 10 is what percent of 40? How much did it change?', inputs: [IN('a', 'a', 'number', 20), IN('b', 'b', 'number', 50)],
      params: [SEL('work', 'Work out', ['a% of b', 'a as a % of b', '% change from a to b'])],
      emit: (i, p) => p.work === 'a as a % of b' ? `${wrap(i[0])} / ${wrap(i[1])} * 100` : p.work === '% change from a to b' ? `(${i[1]} - ${i[0]}) / ${wrap(i[0])} * 100` : `${wrap(i[0])} / 100 * ${wrap(i[1])}` },
    { kind: 'mapnum', name: 'Map range', group: 'logic', blurb: 'Turn a number in one range into the same spot in another (0 to 100 into 0 to 1)', inputs: [
        IN('n', 'number', 'number', 50), IN('a', 'from low', 'number', 0), IN('b', 'from high', 'number', 100), IN('c', 'to low', 'number', 0), IN('d', 'to high', 'number', 1)],
      params: [], emit: (i) => `(${i[0]} - ${wrap(i[1])}) * (${i[4]} - ${wrap(i[3])}) / (${i[2]} - ${wrap(i[1])}) + ${wrap(i[3])}` },
    { kind: 'blend', name: 'Blend', group: 'logic', blurb: 'A number part of the way between two numbers (0 is the first, 1 is the second)', inputs: [
        IN('a', 'first', 'number', 0), IN('b', 'second', 'number', 100), IN('t', 'how far', 'number', 0.5)],
      params: [], emit: (i) => `${wrap(i[0])} + (${i[1]} - ${wrap(i[0])}) * ${wrap(i[2])}` },
    { kind: 'trig', name: 'Angles', group: 'logic', blurb: 'Sine, cosine, tangent and their opposites', inputs: [IN('n', 'number', 'number', 30)],
      params: [SEL('op', 'Do', Object.keys(TRIG)), SEL('unit', 'In', ['degrees', 'radians'])],
      emit: (i, p) => {
        const f = TRIG[s(p.op)] ?? 'Math.sin', arc = s(p.op).startsWith('arc');
        if (p.unit === 'radians') return `${f}(${i[0]})`;
        return arc ? `${f}(${i[0]}) * 180 / Math.PI` : `${f}(${wrap(i[0])} * Math.PI / 180)`;
      } },
    { kind: 'logs', name: 'Powers and logs', group: 'logic', blurb: 'Powers of 2 and 10, logs, cubes and cube roots', inputs: [IN('n', 'number', 'number', 8)],
      params: [SEL('op', 'Do', Object.keys(LOGS))], emit: (i, p) => (LOGS[s(p.op)] ?? LOGS['natural log'])(wrap(i[0])) },
    { kind: 'numinfo', name: 'Number facts', group: 'logic', blurb: 'Is it prime? Factorial, Fibonacci, digit sum, degrees to radians...', inputs: [IN('n', 'number', 'number', 7)],
      params: [SEL('op', 'Tell me', Object.keys(NUMINFO))], need: (v) => NUMINFO[s(v.op)]?.[1] ?? [],
      emit: (i, p) => (NUMINFO[s(p.op)] ?? NUMINFO['is prime'])[0].replace(/\$/g, wrap(i[0])) },
    { kind: 'divisors', name: 'Divisors', group: 'logic', blurb: 'Biggest shared factor, smallest shared multiple, remainder', inputs: [IN('a', 'a', 'number', 12), IN('b', 'b', 'number', 18)],
      params: [SEL('op', 'Give me', ['greatest common divisor', 'lowest common multiple', 'remainder', 'divides exactly (yes or no)'])], need: (v) => (v.op === 'remainder' || v.op === 'divides exactly (yes or no)' ? [] : ['gcd']),
      emit: (i, p) => p.op === 'lowest common multiple' ? `${wrap(i[0])} * ${wrap(i[1])} / gcd(${i[0]}, ${i[1]})` : p.op === 'remainder' ? `${wrap(i[0])} % ${wrap(i[1])}` : p.op === 'divides exactly (yes or no)' ? `${wrap(i[0])} % ${wrap(i[1])} === 0` : `gcd(${i[0]}, ${i[1]})` },
    { kind: 'wrapnum', name: 'Wrap around', group: 'logic', blurb: 'Count up to a limit, then start again from 0 (like a clock)', inputs: [IN('n', 'number', 'number', 14), IN('size', 'size', 'number', 12)],
      params: [], emit: (i) => `((${i[0]} % ${wrap(i[1])}) + ${wrap(i[1])}) % ${wrap(i[1])}` },
    { kind: 'roundto', name: 'Round to', group: 'logic', blurb: 'Round to the nearest 5, 10, 0.25 or anything', inputs: [IN('n', 'number', 'number', 47), IN('step', 'nearest', 'number', 5)],
      params: [], emit: (i) => `Math.round(${wrap(i[0])} / ${wrap(i[1])}) * ${wrap(i[1])}` },
    { kind: 'chance', name: 'Chance', group: 'logic', blurb: 'Yes or no, with a chance you choose (25 means one time in four)', inputs: [IN('pct', 'percent', 'number', 25)], params: [EVERY],
      emit: (i) => `Math.random() * 100 < ${i[0]}` },
    { kind: 'check', name: 'Check value', group: 'logic', blurb: 'Is it empty? A number? Text? A list?', inputs: [IN('v', 'value', 'any')], params: [SEL('op', 'Is it', Object.keys(CHECKS))],
      emit: (i, p) => (CHECKS[s(p.op)] ?? CHECKS['is empty'])(wrap(i[0])) },
    { kind: 'fallback', name: 'If empty use', group: 'logic', blurb: 'Use a different value when the first one is empty', inputs: [IN('v', 'value', 'any'), IN('alt', 'instead', 'any', 'nothing')], params: [],
      emit: (i) => `(${wrap(i[0])} === "" || ${wrap(i[0])} == null ? ${i[1]} : ${wrap(i[0])})` },
    { kind: 'pickn', name: 'Pick by number', group: 'logic', blurb: 'Choose the 1st, 2nd, 3rd... value by a number', inputs: [IN('n', 'number', 'number', 1), IN('a', '1st', 'any', 'one'), IN('b', '2nd', 'any', 'two'), IN('c', '3rd', 'any', 'three'), IN('d', '4th', 'any', ''), IN('e', '5th', 'any', '')],
      params: [], emit: (i) => `[${i[1]}, ${i[2]}, ${i[3]}, ${i[4]}, ${i[5]}][${wrap(i[0])} - 1]` },
    { kind: 'lookup', name: 'Look up', group: 'logic', blurb: 'Swap a word for another using a table, like cat=🐱, dog=🐶', inputs: [IN('k', 'look up', 'text', 'cat')],
      params: [TXT('table', 'Table', 'cat=🐱, dog=🐶, fox=🦊', 'a=1, b=2'), TXT('other', 'Otherwise', '?')],
      emit: (i, p) => {
        const pairs = s(p.table).split(',').map((x) => x.trim()).filter((x) => x.includes('=')).map((x) => { const [k, ...v] = x.split('='); const val = v.join('=').trim(); return `${q(k.trim())}: ${Number.isFinite(Number(val)) && val !== '' ? val : q(val)}`; });
        const other = s(p.other), o = Number.isFinite(Number(other)) && other.trim() !== '' ? other.trim() : q(other);
        return `({ ${pairs.join(', ')} })[${i[0]}] ?? ${o}`;
      } },
    { kind: 'numfmt', name: 'Show number as', group: 'logic', blurb: 'With commas, as money, a percent, 1st/2nd, Roman numerals, binary...', inputs: [IN('n', 'number', 'number', 1234567)],
      params: [SEL('style', 'Show as', ['with commas', 'pounds', 'dollars', 'euros', 'percent', 'short (1.2K)', 'ordinal (1st)', 'Roman numerals', 'binary', 'hex', 'octal', 'scientific'])], need: ['showNumber'],
      emit: (i, p) => `showNumber(${i[0]}, ${q(s(p.style))})` },

    // ---- text
    { kind: 'slice', name: 'Part of text', group: 'text', blurb: 'Letters from one place to another (1 is the first letter)', inputs: [IN('t', 'text', 'text', 'Hello world'), IN('a', 'from', 'number', 1), IN('b', 'to', 'number', 5)],
      params: [], emit: (i) => `${wrap(i[0])}.slice(${wrap(i[1])} - 1, ${i[2]})` },
    { kind: 'charat', name: 'Letter number', group: 'text', blurb: 'The 1st, 2nd, 3rd... letter of some text', inputs: [IN('t', 'text', 'text', 'Hello'), IN('n', 'number', 'number', 1)],
      params: [], emit: (i) => `${wrap(i[0])}.charAt(${wrap(i[1])} - 1)` },
    { kind: 'findtext', name: 'Find in text', group: 'text', blurb: 'Where a bit of text is (0 if it is not there), or how many times', inputs: [IN('t', 'text', 'text', 'banana'), IN('bit', 'find', 'text', 'an')],
      params: [SEL('op', 'Give me', ['the first position', 'the last position', 'how many times'])],
      emit: (i, p) => p.op === 'the last position' ? `${wrap(i[0])}.lastIndexOf(${i[1]}) + 1` : p.op === 'how many times' ? `(${i[1]} ? ${wrap(i[0])}.split(${i[1]}).length - 1 : 0)` : `${wrap(i[0])}.indexOf(${i[1]}) + 1` },
    { kind: 'pad', name: 'Pad text', group: 'text', blurb: 'Fill the front or back of text up to a length (7 becomes 007)', inputs: [IN('t', 'text', 'text', '7'), IN('n', 'length', 'number', 3), IN('with', 'with', 'text', '0')],
      params: [SEL('side', 'Pad the', ['start', 'end'])], emit: (i, p) => `String(${i[0]}).${p.side === 'end' ? 'padEnd' : 'padStart'}(${i[1]}, ${i[2]})` },
    { kind: 'casing', name: 'Naming style', group: 'text', blurb: 'camelCase, snake_case, kebab-case, Title Case and more', inputs: [IN('t', 'text', 'text', 'hello big world')],
      params: [SEL('style', 'Make it', ['camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'CONSTANT_CASE', 'Title Case', 'aLtErNaTiNg'])], need: ['casing'],
      emit: (i, p) => `casing(${i[0]}, ${q(s(p.style))})` },
    { kind: 'lines', name: 'Lines of text', group: 'text', blurb: 'Count, sort, number or tidy the lines of some text', inputs: [IN('t', 'text', 'text', 'pear\napple\nfig')],
      params: [SEL('op', 'Do', Object.keys(LINES))], emit: (i, p) => (LINES[s(p.op)] ?? LINES['count the lines'])(wrap(i[0])) },
    { kind: 'cleantext', name: 'Clean text', group: 'text', blurb: 'Remove accents, digits, punctuation, extra spaces or web tags', inputs: [IN('t', 'text', 'text', '  Café   déjà vu!  ')],
      params: [SEL('op', 'Do', Object.keys(CLEAN))], emit: (i, p) => (CLEAN[s(p.op)] ?? CLEAN['squash spaces'])(wrap(i[0])) },
    { kind: 'encode', name: 'Encode text', group: 'text', blurb: 'Base64, web address encoding, binary, hex, ROT13 and Morse code', inputs: [IN('t', 'text', 'text', 'Hello, world')],
      params: [SEL('how', 'Do', ['Base64 encode', 'Base64 decode', 'URL encode', 'URL decode', 'HTML escape', 'ROT13', 'binary', 'hex', 'Morse code'])], need: ['encodeText'],
      emit: (i, p) => `encodeText(${i[0]}, ${q(s(p.how))})` },
    { kind: 'charcode', name: 'Letter codes', group: 'text', blurb: 'Turn a letter into its number, or a number into a letter', inputs: [IN('v', 'value', 'any', 'A')],
      params: [SEL('op', 'Do', ['letter to number', 'number to letter'])], emit: (i, p) => p.op === 'number to letter' ? `String.fromCharCode(${i[0]})` : `String(${i[0]}).charCodeAt(0)` },
    { kind: 'template', name: 'Fill in blanks', group: 'text', blurb: 'A sentence with {1}, {2} and {3} blanks filled by blocks', inputs: [IN('a', '{1}', 'text', 'Sam'), IN('b', '{2}', 'text', '12'), IN('c', '{3}', 'text', '')],
      params: [TXT('t', 'Sentence', '{1} is {2} years old.')],
      emit: (i, p) => {
        const parts = s(p.t).split(/(\{[123]\})/).filter((x) => x !== '');
        return parts.length ? parts.map((x) => (x === '{1}' ? `String(${i[0]})` : x === '{2}' ? `String(${i[1]})` : x === '{3}' ? `String(${i[2]})` : q(x))).join(' + ') : '""';
      } },
    { kind: 'pattern', name: 'Pattern match', group: 'text', blurb: 'Test text against a pattern (a regular expression)', inputs: [IN('t', 'text', 'text', 'order 66 and 12')],
      params: [TXT('re', 'Pattern', '\\d+', '\\d+'), SEL('op', 'Give me', ['does it match', 'the first match', 'all the matches', 'how many matches'])],
      emit: (i, p) => {
        const re = s(p.re).replace(/\//g, '\\/') || '.';
        return p.op === 'the first match' ? `(${wrap(i[0])}.match(/${re}/) || [""])[0]` : p.op === 'all the matches' ? `${wrap(i[0])}.match(/${re}/g) || []` : p.op === 'how many matches' ? `(${wrap(i[0])}.match(/${re}/g) || []).length` : `/${re}/.test(${i[0]})`;
      } },
    { kind: 'shorten', name: 'Shorten text', group: 'text', blurb: 'Cut text to a length and add … at the end', inputs: [IN('t', 'text', 'text', 'A long sentence that goes on'), IN('n', 'length', 'number', 12)], params: [],
      emit: (i) => `(${wrap(i[0])}.length > ${wrap(i[1])} ? ${wrap(i[0])}.slice(0, ${wrap(i[1])} - 1) + "…" : ${i[0]})` },
    { kind: 'plural', name: 'Pluralise', group: 'text', blurb: 'Put a count and a word together: 1 apple, 3 apples', inputs: [IN('n', 'count', 'number', 3), IN('w', 'word', 'text', 'apple')], params: [],
      emit: (i) => `${i[0]} + " " + (${wrap(i[0])} === 1 ? ${i[1]} : ${wrap(i[1])} + "s")` },
    { kind: 'moretext', name: 'Text facts', group: 'text', blurb: 'First or last word, initials, is it an email, is it a web address...', inputs: [IN('t', 'text', 'text', 'Ada Lovelace')],
      params: [SEL('op', 'Tell me', Object.keys(MORE_TEXT))], emit: (i, p) => (MORE_TEXT[s(p.op)] ?? MORE_TEXT.initials)(wrap(i[0])) },

    // ---- lists
    { kind: 'listadd', name: 'Add to list', group: 'list', blurb: 'A list with one more item on the end or the start', inputs: [IN('list', 'list', 'list'), IN('item', 'item', 'any', 'new')],
      params: [SEL('where', 'Add to the', ['end', 'start'])], emit: (i, p) => p.where === 'start' ? `[${i[1]}, ...${wrap(i[0])}]` : `[...${wrap(i[0])}, ${i[1]}]` },
    { kind: 'listremove', name: 'Remove from list', group: 'list', blurb: 'A list without the first or last item, or without one value', inputs: [IN('list', 'list', 'list'), IN('item', 'which', 'any', '')],
      params: [SEL('op', 'Remove', ['the first item', 'the last item', 'item number', 'every copy of'])],
      emit: (i, p) => p.op === 'the first item' ? `${wrap(i[0])}.slice(1)` : p.op === 'the last item' ? `${wrap(i[0])}.slice(0, -1)` : p.op === 'item number' ? `${wrap(i[0])}.filter((x, index) => index !== ${wrap(i[1])} - 1)` : `${wrap(i[0])}.filter((x) => x !== ${i[1]})` },
    { kind: 'joinlists', name: 'Join lists', group: 'list', blurb: 'Put two lists end to end', inputs: [IN('a', 'first', 'list'), IN('b', 'then', 'list')], params: [], emit: (i) => `[...${wrap(i[0])}, ...${wrap(i[1])}]` },
    { kind: 'listpart', name: 'Part of list', group: 'list', blurb: 'Items from one place to another (1 is the first)', inputs: [IN('list', 'list', 'list'), IN('a', 'from', 'number', 1), IN('b', 'to', 'number', 3)],
      params: [], emit: (i) => `${wrap(i[0])}.slice(${wrap(i[1])} - 1, ${i[2]})` },
    { kind: 'listhas', name: 'Find in list', group: 'list', blurb: 'Is an item in the list? Where is it? How many times?', inputs: [IN('list', 'list', 'list'), IN('item', 'item', 'any', 3)],
      params: [SEL('op', 'Give me', ['yes or no', 'the position (0 if not there)', 'how many times'])],
      emit: (i, p) => p.op === 'the position (0 if not there)' ? `${wrap(i[0])}.indexOf(${i[1]}) + 1` : p.op === 'how many times' ? `${wrap(i[0])}.filter((x) => x === ${i[1]}).length` : `${wrap(i[0])}.includes(${i[1]})` },
    { kind: 'sortlist', name: 'Sort list', group: 'list', blurb: 'Smallest first, A to Z, shortest first, or in a random order', inputs: [IN('list', 'list', 'list')],
      params: [SEL('how', 'Sort', ['smallest first', 'biggest first', 'A to Z', 'Z to A', 'shortest first', 'longest first', 'at random'])],
      emit: (i, p) => {
        const l = wrap(i[0]);
        return ({ 'smallest first': `[...${l}].sort((a, b) => a - b)`, 'biggest first': `[...${l}].sort((a, b) => b - a)`, 'A to Z': `[...${l}].sort((a, b) => String(a).localeCompare(String(b)))`,
          'Z to A': `[...${l}].sort((a, b) => String(b).localeCompare(String(a)))`, 'shortest first': `[...${l}].sort((a, b) => String(a).length - String(b).length)`,
          'longest first': `[...${l}].sort((a, b) => String(b).length - String(a).length)`, 'at random': `[...${l}].sort(() => Math.random() - 0.5)` } as Record<string, string>)[s(p.how)] ?? `[...${l}].sort()`;
      } },
    { kind: 'listmaths', name: 'List maths', group: 'list', blurb: 'Sum, average, median, most common, spread of a list of numbers', inputs: [IN('list', 'list', 'list')],
      params: [SEL('op', 'Give me', Object.keys(LIST_MATHS))],
      need: (v) => (v.op === 'median' ? ['median'] : v.op === 'mode' ? ['mode'] : v.op === 'standard deviation' ? ['stdev'] : []),
      emit: (i, p) => (LIST_MATHS[s(p.op)] ?? LIST_MATHS.sum)(wrap(i[0])) },
    { kind: 'reduce', name: 'Combine list', group: 'list', blurb: 'Boil a list down to one value with your own rule', inputs: [IN('list', 'list', 'list')],
      params: [{ key: 'expr', label: 'a and b become', type: 'expr', def: 'a + b', placeholder: 'a * b' }, TXT('start', 'Start with', '0')],
      emit: (i, p) => `${wrap(i[0])}.reduce((a, b) => ${wrap(s(p.expr) || 'a')}, ${Number.isFinite(Number(p.start)) && s(p.start).trim() !== '' ? s(p.start).trim() : q(s(p.start))})` },
    { kind: 'findwhere', name: 'Search list', group: 'list', blurb: 'Find the first item that passes a test, or count or check them all', inputs: [IN('list', 'list', 'list')],
      params: [SEL('op', 'Give me', ['the first that passes', 'its position (0 if none)', 'how many pass', 'all pass', 'any pass']), { key: 'expr', label: 'Test', type: 'expr', def: 'x > 2', placeholder: 'x > 2' }],
      emit: (i, p) => {
        const l = wrap(i[0]), t = wrap(s(p.expr) || 'true');
        return p.op === 'its position (0 if none)' ? `${l}.findIndex((x) => ${t}) + 1` : p.op === 'how many pass' ? `${l}.filter((x) => ${t}).length` : p.op === 'all pass' ? `${l}.every((x) => ${t})` : p.op === 'any pass' ? `${l}.some((x) => ${t})` : `${l}.find((x) => ${t})`;
      } },
    { kind: 'chunk', name: 'Groups of', group: 'list', blurb: 'Split a list into smaller lists of a size', inputs: [IN('list', 'list', 'list'), IN('n', 'size', 'number', 2)], params: [],
      emit: (i) => `Array.from({ length: Math.ceil(${wrap(i[0])}.length / ${wrap(i[1])}) }, (_, k) => ${wrap(i[0])}.slice(k * ${wrap(i[1])}, (k + 1) * ${wrap(i[1])}))` },
    { kind: 'fill', name: 'Repeat item', group: 'list', blurb: 'A list with the same item many times', inputs: [IN('item', 'item', 'any', '⭐'), IN('n', 'times', 'number', 5)], params: [],
      emit: (i) => `Array(Math.max(0, ${i[1]})).fill(${i[0]})` },
    { kind: 'series', name: 'Number series', group: 'list', blurb: 'Count up (or down) from a start in steps: 5, 10, 15...', inputs: [IN('a', 'start', 'number', 5), IN('step', 'step', 'number', 5), IN('n', 'how many', 'number', 6)], params: [],
      emit: (i) => `Array.from({ length: ${i[2]} }, (_, k) => ${wrap(i[0])} + k * ${wrap(i[1])})` },
    { kind: 'randlist', name: 'Random numbers', group: 'list', blurb: 'A list of random whole numbers', inputs: [IN('n', 'how many', 'number', 5), IN('a', 'from', 'number', 1), IN('b', 'to', 'number', 100)], params: [EVERY],
      emit: (i) => `Array.from({ length: ${i[0]} }, () => Math.floor(Math.random() * (${wrap(i[2])} - ${wrap(i[1])} + 1)) + ${wrap(i[1])})` },
    { kind: 'tally', name: 'Count each', group: 'list', blurb: 'How many times each item appears, as text: red × 3, blue × 1', inputs: [IN('list', 'list', 'list')], params: [],
      emit: (i) => `Object.entries(${wrap(i[0])}.reduce((counts, x) => ({ ...counts, [x]: (counts[x] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).map(([x, n]) => x + " × " + n).join(", ")` },

    // ---- dates and times
    { kind: 'dateadd', name: 'Add to date', group: 'time', blurb: 'The date a number of days, weeks, months or years from now (or from a date)', inputs: [IN('date', 'date', 'text', 'today'), IN('n', 'amount', 'number', 7)],
      params: [SEL('unit', 'Unit', DATE_UNITS)], need: ['addToDate'], emit: (i, p) => `addToDate(${i[0]}, ${i[1]}, ${q(s(p.unit))})` },
    { kind: 'dategap', name: 'Time between', group: 'time', blurb: 'How many days, weeks, months or years between two dates', inputs: [IN('a', 'from', 'text', 'today'), IN('b', 'to', 'text', '2026-12-25')],
      params: [SEL('unit', 'In', DATE_UNITS)], need: ['dateGap'], emit: (i, p) => `dateGap(${i[0]}, ${i[1]}, ${q(s(p.unit))})` },
    { kind: 'datefmt', name: 'Show date', group: 'time', blurb: 'A date as a long date, weekday, month name, week number, leap year...', inputs: [IN('date', 'date', 'text', 'today')],
      params: [SEL('style', 'Show', ['long date', 'short date', 'weekday', 'month name', 'year', 'day of the year', 'week number', 'is a weekend', 'is a leap year', 'year-month-day'])], need: ['showDate'],
      emit: (i, p) => `showDate(${i[0]}, ${q(s(p.style))})` },
    { kind: 'age', name: 'Age', group: 'time', blurb: 'How many years old, from a birthday (like 2012-05-30)', inputs: [IN('date', 'birthday', 'text', '2012-05-30')], params: [], need: ['ageOf'], emit: (i) => `ageOf(${i[0]})` },
    { kind: 'clocktext', name: 'Seconds as time', group: 'time', blurb: 'Turn 125 seconds into 2:05', inputs: [IN('n', 'seconds', 'number', 125)], params: [], need: ['clockText'], emit: (i) => `clockText(${i[0]})` },
    { kind: 'countdowntext', name: 'Countdown text', group: 'time', blurb: 'Days, hours, minutes and seconds left until a date. Changes as time passes', inputs: [IN('date', 'date', 'text', '2026-12-25')],
      params: [], volatile: true, need: ['countdownText'], emit: (i) => `countdownText(${i[0]})` },

    // ---- colours
    { kind: 'colourv', name: 'Colour', group: 'colour', blurb: 'A colour you pick, to wire into other blocks', inputs: [], params: [{ key: 'value', label: 'Colour', type: 'color', def: '#b49a57' }],
      emit: (_, p) => q(/^#[0-9a-f]{3,8}$/i.test(s(p.value)) ? s(p.value) : '#b49a57') },
    { kind: 'hslcol', name: 'Colour wheel', group: 'colour', blurb: 'A colour from its place on the wheel (0 to 360), how vivid and how light', inputs: [IN('h', 'hue', 'number', 200), IN('s', 'vivid %', 'number', 80), IN('l', 'light %', 'number', 55)], params: [],
      emit: (i) => `"hsl(" + ${i[0]} + ", " + ${i[1]} + "%, " + ${i[2]} + "%)"` },
    { kind: 'adjustcol', name: 'Change colour', group: 'colour', blurb: 'Make a colour lighter, darker, more vivid, see-through or turn its hue', inputs: [IN('c', 'colour', 'text', '#337957'), IN('amount', 'amount', 'number', 20)],
      params: [SEL('op', 'Make it', Object.keys(COLOUR_ACTIONS))],
      need: (v) => (v.op === 'lighter' || v.op === 'darker' ? ['lighten'] : v.op === 'more vivid' || v.op === 'less vivid' ? ['saturate'] : v.op === 'make see-through' ? ['fade'] : ['turn']),
      emit: (i, p) => (COLOUR_ACTIONS[s(p.op)] ?? COLOUR_ACTIONS.lighter)(i[0], wrap(i[1])) },
    { kind: 'mixcol', name: 'Mix colours', group: 'colour', blurb: 'The colour part of the way between two colours', inputs: [IN('a', 'first', 'text', '#337957'), IN('b', 'second', 'text', '#b49a57'), IN('t', 'how far', 'number', 0.5)], params: [], need: ['toRgb', 'toHex'],
      emit: (i) => `toHex(...toRgb(${i[0]}).map((v, k) => v + (toRgb(${i[1]})[k] - v) * ${wrap(i[2])}))` },
    { kind: 'colourfacts', name: 'Colour facts', group: 'colour', blurb: 'Red, green, blue, brightness, or a text colour that reads well on it', inputs: [IN('c', 'colour', 'text', '#337957')],
      params: [SEL('op', 'Tell me', Object.keys(FACTS))],
      need: (v) => (['brightness (0 to 100)', 'is light', 'is dark', 'text colour that reads on it'].includes(s(v.op)) ? ['brightness'] : v.op === 'as hex' ? ['toRgb', 'toHex'] : ['hue', 'saturation', 'lightness'].includes(s(v.op)) ? ['toRgb', 'toHsl'] : ['toRgb']), emit: (i, p) => (FACTS[s(p.op)] ?? FACTS.red)(wrap(i[0])) },
    { kind: 'rainbowcol', name: 'Rainbow colour', group: 'colour', blurb: 'The nth colour of a rainbow spread over some steps', inputs: [IN('n', 'number', 'number', 3), IN('of', 'out of', 'number', 7)], params: [],
      emit: (i) => `"hsl(" + Math.round(${wrap(i[0])} / ${wrap(i[1])} * 360) + ", 85%, 55%)"` },

    // ---- calculators and tools
    { kind: 'tip', name: 'Tip and split', group: 'function', blurb: 'What each person pays when a bill has a tip and is shared', inputs: [IN('bill', 'bill', 'number', 48), IN('pct', 'tip %', 'number', 10), IN('people', 'people', 'number', 3)], params: [],
      emit: (i) => `Number((${wrap(i[0])} * (1 + ${wrap(i[1])} / 100) / ${wrap(i[2])}).toFixed(2))` },
    { kind: 'bmi', name: 'BMI', group: 'function', blurb: 'Body mass index from weight in kg and height in cm', inputs: [IN('kg', 'weight kg', 'number', 60), IN('cm', 'height cm', 'number', 165)], params: [],
      emit: (i) => `Number((${wrap(i[0])} / (${wrap(i[1])} / 100) ** 2).toFixed(1))` },
    { kind: 'sale', name: 'Sale price', group: 'function', blurb: 'A price after a percentage off (or on)', inputs: [IN('price', 'price', 'number', 80), IN('pct', '% off', 'number', 25)], params: [],
      emit: (i) => `Number((${wrap(i[0])} * (1 - ${wrap(i[1])} / 100)).toFixed(2))` },
    { kind: 'loan', name: 'Loan payment', group: 'function', blurb: 'The monthly payment on a loan', inputs: [IN('amount', 'amount', 'number', 5000), IN('rate', 'yearly %', 'number', 6), IN('years', 'years', 'number', 3)], params: [], need: ['loanPayment'],
      emit: (i) => `Number(loanPayment(${i[0]}, ${i[1]}, ${i[2]}).toFixed(2))` },
    { kind: 'interest', name: 'Compound interest', group: 'function', blurb: 'What savings grow to with interest each year', inputs: [IN('amount', 'start', 'number', 1000), IN('rate', 'yearly %', 'number', 5), IN('years', 'years', 'number', 10)], params: [],
      emit: (i) => `Number((${wrap(i[0])} * (1 + ${wrap(i[1])} / 100) ** ${wrap(i[2])}).toFixed(2))` },
    { kind: 'jsonget', name: 'JSON tool', group: 'function', blurb: 'Read a value out of JSON, tidy it or check it', inputs: [IN('t', 'JSON text', 'text', '{"user": {"name": "Sam"}}')],
      params: [SEL('op', 'Do', ['get a value', 'is valid JSON', 'tidy it up', 'make it one line']), TXT('path', 'Path', 'user.name', 'user.name')], need: ['jsonGet'],
      emit: (i, p) => p.op === 'is valid JSON' ? `(() => { try { JSON.parse(${i[0]}); return true; } catch { return false; } })()`
        : p.op === 'tidy it up' ? `JSON.stringify(JSON.parse(${i[0]}), null, 2)` : p.op === 'make it one line' ? `JSON.stringify(JSON.parse(${i[0]}))` : `jsonGet(${i[0]}, ${q(s(p.path))})` },

    // ---- output
    { kind: 'check_', name: 'Test', group: 'output', blurb: 'Print ✔ or ✘ next to a label, depending on a yes or no value', inputs: [IN('v', 'is true?', 'any', 'true')], params: [TXT('label', 'Label', 'It works')], statement: true,
      emit: (i, p) => `console.log(${wrap(i[0])} ? ${q('✔ ' + s(p.label))} : ${q('✘ ' + s(p.label))});` },
    { kind: 'note', name: 'Note', group: 'output', blurb: 'A sticky note for you. It does nothing in the code', inputs: [], params: [TXT('text', 'Note', 'Write a reminder here')], inert: true, out: 'none', emit: () => '' },
  ];
  return defs;
}
