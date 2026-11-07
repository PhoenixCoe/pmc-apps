export interface Line { id: number; desc: string; qty: number; price: number }
export interface Invoice {
  from: string; to: string; number: string; issued: string; due: string; currency: string; tax: number; discount: number; discountKind: 'percent' | 'amount'; notes: string; lines: Line[]; logo?: string;
}
export const money = (n: number, cur: string) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(n); } catch { return `${cur} ${n.toFixed(2)}`; } };
export function totals(inv: Invoice) {
  const sub = inv.lines.reduce((n, l) => n + l.qty * l.price, 0), disc = inv.discountKind === 'percent' ? (sub * inv.discount) / 100 : Math.min(sub, inv.discount), taxable = sub - disc, tax = (taxable * inv.tax) / 100;
  return { sub, disc, tax, total: taxable + tax };
}
export const CURRENCIES = ['GBP', 'USD', 'EUR', 'AUD', 'CAD', 'NZD', 'CHF', 'JPY', 'INR', 'SEK', 'NOK', 'DKK', 'PLN', 'ZAR', 'SGD', 'HKD', 'AED'];
