const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FULLM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], FULLD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALIAS: Record<string, string> = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };
interface F { min: number; max: number; names?: string[]; off?: number }
const FIELDS: F[] = [{ min: 0, max: 59 }, { min: 0, max: 23 }, { min: 1, max: 31 }, { min: 1, max: 12, names: MONTHS, off: 1 }, { min: 0, max: 7, names: DAYS, off: 0 }];
const LABEL = ['minute', 'hour', 'day of the month', 'month', 'day of the week'];

export interface Parsed { sets: Set<number>[]; star: boolean[]; parts: string[] }
export function parse(expr: string): Parsed | string {
  const t = ALIAS[expr.trim().toLowerCase()] ?? expr.trim(), parts = t.split(/\s+/);
  if (parts.length !== 5) return 'A cron expression has 5 parts: minute, hour, day of month, month, day of week.';
  const sets: Set<number>[] = [], star: boolean[] = [];
  for (let i = 0; i < 5; i++) {
    const f = FIELDS[i], s = new Set<number>(); star.push(parts[i] === '*' || parts[i] === '?' || /^\*\/1$/.test(parts[i]));
    for (const piece of parts[i].split(',')) {
      const [rng, stepS] = piece.split('/'), step = stepS === undefined ? 1 : +stepS;
      if (!(step >= 1) || !Number.isInteger(step)) return `The step in the ${LABEL[i]} part (“${piece}”) is not valid.`;
      const num = (x: string) => { const n = f.names ? f.names.indexOf(x.toUpperCase()) : -1; return n >= 0 ? n + (f.off ?? 0) : /^\d+$/.test(x) ? +x : NaN; };
      let a: number, b: number;
      if (rng === '*' || rng === '?') { a = f.min; b = i === 4 ? 6 : f.max; } else if (rng.includes('-')) { const [x, y] = rng.split('-'); a = num(x); b = num(y); } else { a = num(rng); b = stepS === undefined ? a : f.max; }
      if (isNaN(a) || isNaN(b) || a < f.min || b > f.max || a > b) return `“${piece}” is not valid in the ${LABEL[i]} part (allowed ${f.min} to ${f.max}).`;
      for (let v = a; v <= b; v += step) s.add(i === 4 && v === 7 ? 0 : v);
    }
    sets.push(s);
  }
  return { sets, star, parts };
}

export function nextRuns(p: Parsed, from: Date, n: number): Date[] {
  const out: Date[] = [], d = new Date(from); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
  const [mi, ho, dm, mo, dw] = p.sets, domStar = p.star[2], dowStar = p.star[4];
  for (let guard = 0; out.length < n && guard < 3000000; guard++) {
    if (!mo.has(d.getMonth() + 1)) { d.setMonth(d.getMonth() + 1, 1); d.setHours(0, 0, 0, 0); continue; }
    const dayOk = domStar && dowStar ? true : domStar ? dw.has(d.getDay()) : dowStar ? dm.has(d.getDate()) : dm.has(d.getDate()) || dw.has(d.getDay());
    if (!dayOk) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue; }
    if (!ho.has(d.getHours())) { d.setHours(d.getHours() + 1, 0, 0, 0); continue; }
    if (!mi.has(d.getMinutes())) { d.setMinutes(d.getMinutes() + 1, 0, 0); continue; }
    out.push(new Date(d)); d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
const list = (xs: string[]) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const ord = (n: number) => `${n}${[, 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10] || 'th'}`;
export function describe(p: Parsed): string {
  const [m, h, dom, mon, dow] = p.parts.map((x) => (x === '?' ? '*' : x)), sm = p.sets[0], sh = p.sets[1];
  let when: string;
  if (m === '*' && h === '*') when = 'Every minute';
  else if (/^\*\/\d+$/.test(m) && h === '*') when = `Every ${m.slice(2)} minutes`;
  else if (h === '*' && sm.size === 1) when = `At ${sm.size ? ([...sm][0] === 0 ? 'the start of every hour' : `minute ${[...sm][0]} past every hour`) : ''}`;
  else if (sm.size === 1 && sh.size <= 4 && !/[*/]/.test(h)) when = `At ${list([...sh].sort((a, b) => a - b).map((x) => `${pad(x)}:${pad([...sm][0])}`))}`;
  else if (sm.size === 1 && /^\*\/\d+$/.test(h)) when = `At minute ${[...sm][0]} of every ${h.slice(2)} hours`;
  else when = `At ${m === '*' ? 'every minute' : `minute ${list([...sm].sort((a, b) => a - b).map(String))}`}${h === '*' ? '' : `, during hour ${list([...sh].sort((a, b) => a - b).map(String))}`}`;
  const days = dow === '*' ? '' : ` on ${list([...p.sets[4]].sort((a, b) => a - b).map((x) => FULLD[x]))}`;
  const dm = dom === '*' ? '' : ` on the ${list([...p.sets[2]].sort((a, b) => a - b).map(ord))}`;
  const months = mon === '*' ? '' : ` in ${list([...p.sets[3]].sort((a, b) => a - b).map((x) => FULLM[x - 1]))}`;
  const both = dom !== '*' && dow !== '*' ? `${dm} or${days}` : dm + days;
  return `${when}${both}${months}.`;
}
export { LABEL as FIELD_LABELS };
