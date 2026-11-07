export interface Req { method: string; url: string; headers: [string, string][]; body: string }
const split = (s: string) => { const out: string[] = []; let cur = '', q = ''; let has = false; for (let i = 0; i < s.length; i++) { const c = s[i]; if (q) { if (c === q) q = ''; else if (c === '\\' && q === '"' && i + 1 < s.length) cur += s[++i]; else cur += c; } else if (c === '"' || c === "'") { q = c; has = true; } else if (c === '\\' && s[i + 1] === '\n') i++; else if (/\s/.test(c)) { if (cur || has) { out.push(cur); cur = ''; has = false; } } else cur += c; } if (cur || has) out.push(cur); return out; };

export function parseRequest(text: string): Req | string {
  const t = text.trim(); if (!t) return 'Paste a request first.';
  if (/^curl\s/i.test(t)) {
    const a = split(t.replace(/^curl\s+/i, '')), r: Req = { method: '', url: '', headers: [], body: '' };
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      if (x === '-X' || x === '--request') r.method = (a[++i] ?? '').toUpperCase(); else if (x === '-H' || x === '--header') { const h = a[++i] ?? '', k = h.indexOf(':'); if (k > 0) r.headers.push([h.slice(0, k).trim(), h.slice(k + 1).trim()]); }
      else if (['-d', '--data', '--data-raw', '--data-binary', '--data-urlencode'].includes(x)) r.body += (r.body ? '&' : '') + (a[++i] ?? ''); else if (x === '--url') r.url = a[++i] ?? ''; else if (x === '-u' || x === '--user') { r.headers.push(['Authorization', 'Basic ' + btoa(a[++i] ?? '')]); }
      else if (!x.startsWith('-') && !r.url) r.url = x;
    }
    if (!r.url) return 'No web address found in that curl command.'; r.method ||= r.body ? 'POST' : 'GET'; return r;
  }
  const m = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)(?:\s+HTTP\/[\d.]+)?\r?\n/i.exec(t + '\n');
  if (m) {
    const rest = t.slice(m[0].length - (t.endsWith('\n') ? 0 : 1)), at = rest.search(/\r?\n\r?\n/), head = at < 0 ? rest : rest.slice(0, at), body = at < 0 ? '' : rest.slice(at).replace(/^\r?\n\r?\n/, '');
    const headers = head.split(/\r?\n/).filter((l) => l.includes(':')).map((l) => { const k = l.indexOf(':'); return [l.slice(0, k).trim(), l.slice(k + 1).trim()] as [string, string]; });
    const host = headers.find(([k]) => k.toLowerCase() === 'host')?.[1]; let url = m[2]; if (!/^https?:/i.test(url) && host) url = `https://${host}${url}`;
    return { method: m[1].toUpperCase(), url, headers: headers.filter(([k]) => k.toLowerCase() !== 'host'), body };
  }
  return { method: 'POST', url: '', headers: [['Content-Type', /^[{[]/.test(t) ? 'application/json' : 'text/plain']], body: t };
}
export const toCurl = (r: Req) => `curl -X ${r.method} ${JSON.stringify(r.url || 'https://example.com')}${r.headers.map(([k, v]) => ` \\\n  -H ${JSON.stringify(`${k}: ${v}`)}`).join('')}${r.body ? ` \\\n  -d '${r.body.replace(/'/g, "'\\''")}'` : ''}`;
export function provider(h: [string, string][]) {
  const has = (n: string) => h.find(([k]) => k.toLowerCase() === n); if (has('x-github-event')) return { name: 'GitHub', sig: 'x-hub-signature-256', prefix: 'sha256=', note: `Event: ${has('x-github-event')![1]}` };
  if (has('stripe-signature')) return { name: 'Stripe', sig: 'stripe-signature', prefix: '', note: 'Stripe signs a timestamp and the body together.' }; if (has('x-slack-signature')) return { name: 'Slack', sig: 'x-slack-signature', prefix: 'v0=', note: 'Slack signs “v0:timestamp:body”.' };
  if (has('x-shopify-hmac-sha256')) return { name: 'Shopify', sig: 'x-shopify-hmac-sha256', prefix: '', note: 'Shopify uses Base64.' }; return null;
}
