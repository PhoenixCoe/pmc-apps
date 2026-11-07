// Writes the list of apps that Coe is told about: src/registry/coe-catalog.json (also copied into Coe by hand).
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../src/apps/', import.meta.url).pathname;
const out = [];
for (const cat of readdirSync(root)) {
  for (const slug of readdirSync(join(root, cat))) {
    const dir = join(root, cat, slug);
    if (!existsSync(join(dir, 'meta.ts'))) continue;
    const meta = readFileSync(join(dir, 'meta.ts'), 'utf8');
    const get = (k) => (meta.match(new RegExp(k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"')) || [])[1] || '';
    let src = '';
    for (const f of readdirSync(dir)) if (/\.tsx?$/.test(f) && f !== 'meta.ts') src += readFileSync(join(dir, f), 'utf8') + '\n';
    const keys = [];
    const re = /useLocalState(?:<[^>]*>)?\(\s*['"]([\w-]+)['"]\s*,\s*['"]([\w-]+)['"]\s*,\s*([^)]*?)\)\s*[,;]/g;
    let m;
    while ((m = re.exec(src))) { if (m[1] === slug && !keys.some((k) => k.key === m[2])) keys.push({ key: m[2], init: m[3].replace(/\s+/g, ' ').slice(0, 50) }); }
    out.push({ slug, cat, title: get('title'), tagline: get('tagline'), mode: get('mode'), fullscreen: /fullscreen:\s*true/.test(meta), files: /FileDrop|type="file"/.test(src), keys });
  }
}
out.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(new URL('../src/registry/coe-catalog.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(out.length, 'apps;', out.filter((a) => a.keys.length).length, 'with settings;', out.filter((a) => a.files).length, 'take files');
for (const a of out) console.log(a.slug.padEnd(34), a.fullscreen ? 'F' : ' ', a.files ? 'files' : '     ', a.keys.map((k) => k.key).join(','));
