// Builds the site as plain static files into /out, ready for GitHub Pages or any static host.
// Sign-in needs a server, so the static build sets the auth route aside and switches sign-in off.
import { existsSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const api = 'src/app/api';
const aside = 'src/app/_api_off'; // folders starting with _ are ignored by the router
let moved = false;
try {
  if (existsSync(api)) { renameSync(api, aside); moved = true; }
  rmSync('out', { recursive: true, force: true });
  spawnSync('node', ['scripts/fonts.mjs'], { stdio: 'inherit' });
  const r = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit', shell: true,
    env: { ...process.env, STATIC_EXPORT: '1', NEXT_PUBLIC_AUTH: 'off' },
  });
  if (r.status !== 0) process.exitCode = r.status ?? 1;
  else console.log('\nStatic site written to ./out');
} finally {
  if (moved) renameSync(aside, api);
}
