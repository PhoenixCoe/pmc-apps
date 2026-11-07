// GitHub's web uploader can refuse folder names with [ ] characters.
// The upload package spells them "dyn-…"; this puts the real names back before the build.
import fs from 'node:fs'; import path from 'node:path';
const MAP = { 'dyn-category': '[category]', 'dyn-file': '[file]', 'dyn-dots-nextauth': '[...nextauth]' };
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (MAP[e.name]) { const t = path.join(d, MAP[e.name]); fs.renameSync(p, t); console.log('restored', t); walk(t); }
    else walk(p);
  }
}
walk('src');
