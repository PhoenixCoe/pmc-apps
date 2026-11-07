export interface Endpoint { id: number; method: string; path: string; status: number; delay: number; count: number; body: string }
const FIRST = ['Ava', 'Noah', 'Mia', 'Leo', 'Zara', 'Omar', 'Ivy', 'Kai', 'Nina', 'Theo', 'Luca', 'Maya', 'Finn', 'Esme', 'Jonas', 'Priya'];
const LAST = ['Smith', 'Khan', 'Jones', 'Brown', 'Patel', 'Clark', 'Evans', 'Wood', 'Rossi', 'Lopez', 'Reid', 'Ward', 'Singh', 'Hale'];
const WORDS = ['river', 'lantern', 'maple', 'orbit', 'basket', 'copper', 'meadow', 'signal', 'ember', 'harbor', 'pixel', 'velvet', 'anchor', 'puzzle', 'summit', 'willow'];
const CITIES = ['London', 'Leeds', 'Cardiff', 'Glasgow', 'Bristol', 'York', 'Belfast', 'Oxford'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const int = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000000');
export const TOKENS: [string, string][] = [['{{name}}', 'Full name'], ['{{first}}', 'First name'], ['{{email}}', 'Email'], ['{{int 1 100}}', 'Whole number'], ['{{float 1 100}}', 'Decimal'], ['{{price}}', 'Price'], ['{{bool}}', 'True or false'], ['{{uuid}}', 'Unique id'], ['{{index}}', 'Item number'], ['{{date}}', 'Date'], ['{{word}}', 'Word'], ['{{words 4}}', 'Few words'], ['{{city}}', 'City'], ['{{pick a|b|c}}', 'One of a list'], ['{{param id}}', 'Value from the path']];

export function fill(t: string, i: number, params: Record<string, string>) {
  return t.replace(/\{\{\s*([a-z]+)\s*([^}]*)\}\}/gi, (_m, k: string, a: string) => {
    const x = a.trim().split(/\s+/).filter(Boolean);
    switch (k.toLowerCase()) {
      case 'name': return `${pick(FIRST)} ${pick(LAST)}`; case 'first': return pick(FIRST); case 'last': return pick(LAST);
      case 'email': return `${pick(FIRST)}.${pick(LAST)}`.toLowerCase() + int(1, 99) + '@example.com';
      case 'int': return String(int(+x[0] || 0, +x[1] || 100)); case 'float': { const lo = +x[0] || 0, hi = +x[1] || 100; return (lo + Math.random() * (hi - lo)).toFixed(2); }
      case 'price': return (int(199, 9999) / 100).toFixed(2); case 'bool': return String(Math.random() < 0.5); case 'uuid': return uuid(); case 'index': case 'id': return String(i + 1);
      case 'date': return new Date(Date.now() - int(0, 365) * 864e5).toISOString().slice(0, 10); case 'word': return pick(WORDS); case 'words': return Array.from({ length: +x[0] || 3 }, () => pick(WORDS)).join(' ');
      case 'city': return pick(CITIES); case 'pick': return pick(a.split('|').map((s) => s.trim())); case 'param': return params[x[0]] ?? '';
      default: return _m;
    }
  });
}
export function check(body: string): string | null { try { JSON.parse(body.replace(/\{\{[^}]*\}\}/g, '1')); return null; } catch { /* maybe tokens inside quotes */ } try { JSON.parse(body.replace(/"?\{\{[^}]*\}\}"?/g, '"x"')); return null; } catch (e) { return (e as Error).message; } }
/** Tokens bare in JSON (numbers/booleans) are written unquoted by the user; strings are quoted. Fill then parse. */
export function build(e: Endpoint, params: Record<string, string>): unknown {
  const one = (i: number) => JSON.parse(fill(e.body, i, params));
  return e.count > 1 ? Array.from({ length: e.count }, (_, i) => one(i)) : one(0);
}
export const toRegex = (path: string) => new RegExp('^' + path.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}|:(\w+)/g, '(?<$1$2>[^/]+)') + '/?$');
export function match(list: Endpoint[], method: string, url: string) {
  const p = url.split('?')[0];
  for (const e of list) { if (e.method !== method) continue; const m = toRegex(e.path).exec(p); if (m) return { e, params: { ...(m.groups ?? {}) } as Record<string, string> }; }
  return null;
}
export const sampleUrl = (path: string) => path.replace(/\{(\w+)\}|:(\w+)/g, '1');
export const CODE = {
  msw: (l: Endpoint[]) => `import { http, HttpResponse, delay } from 'msw';\n\nexport const handlers = [\n${l.map((e) => `  http.${e.method.toLowerCase()}('${e.path.replace(/\{(\w+)\}/g, ':$1')}', async () => {\n${e.delay ? `    await delay(${e.delay});\n` : ''}    return HttpResponse.json(${e.count > 1 ? `Array.from({ length: ${e.count} }, (_, i) => (${e.body.trim()}))` : e.body.trim()}, { status: ${e.status} });\n  }),`).join('\n')}\n];\n`,
  express: (l: Endpoint[]) => `const express = require('express');\nconst app = express();\napp.use(express.json());\n\n${l.map((e) => `app.${e.method.toLowerCase()}('${e.path.replace(/\{(\w+)\}/g, ':$1')}', (req, res) => {\n  setTimeout(() => res.status(${e.status}).json(${e.count > 1 ? `Array.from({ length: ${e.count} }, (_, i) => (${e.body.trim()}))` : e.body.trim()}), ${e.delay});\n});`).join('\n\n')}\n\napp.listen(3000, () => console.log('http://localhost:3000'));\n`,
  openapi: (l: Endpoint[]) => { const paths: Record<string, Record<string, unknown>> = {}; for (const e of l) { const p = e.path.replace(/:(\w+)/g, '{$1}'); (paths[p] ??= {})[e.method.toLowerCase()] = { responses: { [e.status]: { description: 'Example response', content: { 'application/json': { example: (() => { try { return build(e, {}); } catch { return null; } })() } } } } }; } return JSON.stringify({ openapi: '3.0.3', info: { title: 'Mock API', version: '1.0.0' }, paths }, null, 2); },
};
