export interface GenOptions { length: number; upper: boolean; lower: boolean; digits: boolean; symbols: boolean; lookalikes: boolean; avoid: string; mode: 'random' | 'words'; words: number; sep: string; capital: boolean; number: boolean }
export const defaultGen: GenOptions = { length: 20, upper: true, lower: true, digits: true, symbols: true, lookalikes: false, avoid: '', mode: 'random', words: 4, sep: '-', capital: true, number: true };

const WORDS = 'able acid acorn actor adapt agent alarm album alder amber anchor angle apple april arch arena armor arrow aspen atlas attic autumn avenue badge baker balsa banjo barn basil beach beacon beam berry bison blaze bloom boat bonus border bottle brave bread brick bridge brook brush cabin cactus cairn camel candle canoe canyon carbon cargo carpet castle cedar cello chalk charm cherry chess cliff clock cloud clover coast cobalt comet copper coral cotton cove crane creek crest crisp crown daisy dawn delta denim desert diary dingo dock dolphin dragon dream drift drum eagle earth echo elbow elder ember engine fable falcon fancy farm fawn fern ferry field finch flame flint flute forest fossil fox frost garden gecko ginger glade glass globe goat grain grape grove guitar harbor hazel heron hill honey horizon hound iceberg igloo island ivory jade jaguar jelly jewel jigsaw jolly jungle kayak kernel kettle kite koala ladder lagoon lake lantern lark laurel lemon lilac linen lion lotus lunar magnet mango maple marble meadow melon mint mirror moose motor mountain nectar needle nickel noble north nutmeg oasis ocean olive onyx orbit orchid otter oval paddle panda paper parrot peach pearl pebble pepper piano pine planet plum pocket polar pond poppy prairie puddle pumpkin quail quartz quiver rabbit radar rain raven reef ribbon river robin rocket saddle saffron sage sailor salmon sand scarf shadow shell silver sketch slate smile snow solar spark spice spruce squid stable star stone storm sugar summit sunset swan tablet tango teapot thistle thunder tiger timber tomato topaz torch tower trail tulip tundra turtle umber valley velvet violet voyage walnut water wave willow window winter wizard wolf yacht yarrow yellow zebra zephyr zinc'.split(' ');
export const WORD_COUNT = WORDS.length;

const rnd = (n: number) => { const a = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n; let v: number; do { crypto.getRandomValues(a); v = a[0]; } while (v >= lim); return v % n; };
export function pool(o: GenOptions) {
  let p = ''; const drop = new Set((o.lookalikes ? '' : 'Il1O0o') + o.avoid);
  if (o.lower) p += 'abcdefghijklmnopqrstuvwxyz'; if (o.upper) p += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if (o.digits) p += '0123456789'; if (o.symbols) p += '!@#$%^&*()-_=+[]{};:,.?/~';
  return [...p].filter((c) => !drop.has(c)).join('');
}
export function generate(o: GenOptions): { text: string; bits: number } {
  if (o.mode === 'words') {
    const ws = Array.from({ length: o.words }, () => { const w = WORDS[rnd(WORDS.length)]; return o.capital ? w[0].toUpperCase() + w.slice(1) : w; });
    let text = ws.join(o.sep), bits = o.words * Math.log2(WORDS.length);
    if (o.number) { text += o.sep + rnd(100); bits += Math.log2(100); }
    return { text, bits };
  }
  const p = pool(o); if (!p) return { text: '', bits: 0 };
  const sets = [o.lower && 'abcdefghijklmnopqrstuvwxyz', o.upper && 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', o.digits && '0123456789', o.symbols && '!@#$%^&*()-_=+[]{};:,.?/~'].filter(Boolean).map((s) => [...(s as string)].filter((c) => p.includes(c)).join('')).filter(Boolean);
  const out = Array.from({ length: o.length }, () => p[rnd(p.length)]);
  // Make sure each chosen kind of character appears at least once.
  sets.forEach((s, i) => { if (i < o.length && !out.some((c) => s.includes(c))) out[rnd(o.length)] = s[rnd(s.length)]; });
  return { text: out.join(''), bits: o.length * Math.log2(p.length) };
}
/** A rough measure for any typed password: size of the character pool times its length, minus a penalty for common patterns. */
export function measure(pw: string): number {
  if (!pw) return 0; let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 28;
  let bits = pw.length * Math.log2(Math.max(2, pool)); const uniq = new Set(pw).size; if (uniq < pw.length / 2) bits *= 0.6;
  if (/^(.)\1+$/.test(pw) || /(0123|1234|2345|abcd|qwer|asdf|password|letmein)/i.test(pw)) bits *= 0.4; return bits;
}
export const grade = (bits: number) => (bits < 36 ? { name: 'Weak', level: 0 } : bits < 60 ? { name: 'Fair', level: 1 } : bits < 80 ? { name: 'Strong', level: 2 } : { name: 'Very strong', level: 3 });
export function guessTime(bits: number) {
  const s = 2 ** bits / 2 / 1e10, Y = 31557600;   // ten billion guesses a second, half of them on average
  if (s < 1) return 'less than a second';
  if (s < 60) return `${Math.round(s)} seconds`; if (s < 3600) return `${Math.round(s / 60)} minutes`; if (s < 86400) return `${Math.round(s / 3600)} hours`;
  if (s < Y) return `${Math.round(s / 86400)} days`; if (s < Y * 1e3) return `${Math.round(s / Y)} years`; if (s < Y * 1e6) return `${Math.round(s / Y / 1e3)} thousand years`;
  if (s < Y * 1e9) return `${Math.round(s / Y / 1e6)} million years`; if (s < Y * 1e12) return `${Math.round(s / Y / 1e9)} billion years`; return 'longer than the age of the universe';
}
export async function leaked(pw: string): Promise<number> {
  const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw)))).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const r = await fetch(`https://api.pwnedpasswords.com/range/${h.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' } });
  if (!r.ok) throw new Error('no answer');
  const line = (await r.text()).split('\n').find((l) => l.startsWith(h.slice(5)));
  return line ? +line.split(':')[1] : 0;
}
