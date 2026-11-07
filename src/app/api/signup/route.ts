import { Pool } from 'pg';
import { hashPassword, isEmail, MIN_PASSWORD } from '@/lib/password';

export const dynamic = 'force-dynamic';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// A small brake on sign-ups from one address: five a minute. (Per server process, which is enough for one site.)
const hits = new Map<string, number[]>();
const tooMany = (ip: string) => {
  const now = Date.now(), recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now); hits.set(ip, recent);
  return recent.length > 5;
};
const reply = (status: number, error?: string) => Response.json(error ? { error } : { ok: true }, { status });

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (tooMany(ip)) return reply(429, 'Too many tries. Wait a minute and try again.');
  let body: { email?: string; password?: string; name?: string };
  try { body = await req.json(); } catch { return reply(400, 'That request was not understood.'); }
  const email = String(body.email ?? '').trim().toLowerCase(), password = String(body.password ?? ''), name = String(body.name ?? '').trim().slice(0, 80) || null;
  if (!isEmail(email)) return reply(400, 'That email address does not look right.');
  if (password.length < MIN_PASSWORD) return reply(400, `Use at least ${MIN_PASSWORD} characters for the password.`);
  if (password.length > 200) return reply(400, 'That password is too long.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT id FROM users WHERE lower(email) = $1', [email]);
    if (found.rowCount) { await client.query('ROLLBACK'); return reply(409, 'There is already an account with that email. Try signing in.'); }
    const made = await client.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', [name ?? email.split('@')[0], email]);
    await client.query('INSERT INTO credentials (user_id, hash) VALUES ($1, $2)', [made.rows[0].id, await hashPassword(password)]);
    await client.query('COMMIT');
    return reply(201);
  } catch {
    await client.query('ROLLBACK').catch(() => {});
    return reply(500, 'Something went wrong on our side. Please try again.');
  } finally { client.release(); }
}
