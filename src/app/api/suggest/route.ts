import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
const TO = process.env.SUGGEST_TO ?? 'ideas@pmcstudios.uk';

// Three ideas an hour from one address is plenty for a person and slow for a bot. (Per server process.)
const hits = new Map<string, number[]>();
const tooMany = (ip: string) => {
  const now = Date.now(), recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now); hits.set(ip, recent);
  return recent.length > 3;
};
const reply = (status: number, error?: string) => Response.json(error ? { error } : { ok: true }, { status });
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ');

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, 'That request was not understood.'); }

  // A hidden box real people never see. If it is filled in, pretend it worked.
  if (clean(body.website, 200)) return reply(200);
  if (tooMany(ip)) return reply(429, 'That is a few ideas already. Please try again in an hour.');

  const app = clean(body.app, 100), what = clean(body.what, 3000), example = clean(body.example, 1500), email = clean(body.email, 200);
  if (!app) return reply(400, 'Give the app a name, even a rough one.');
  if (what.length < 15) return reply(400, 'Say a little more about what it should do.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, 'That email address does not look right.');

  const server = process.env.EMAIL_SERVER, from = process.env.EMAIL_FROM;
  if (!server || !from) return reply(503, 'Sending is not switched on for this copy of the site. You can email ideas@pmcstudios.uk instead.');

  try {
    await nodemailer.createTransport(server).sendMail({
      to: TO, from, replyTo: email || undefined,
      subject: `App idea: ${oneLine(app)}`,
      text: [`App: ${oneLine(app)}`, `From: ${email || 'no email given'}`, '', 'What it should do:', what, ...(example ? ['', 'Example of using it:', example] : []), '', `Sent from apps.pmcstudios.uk`].join('\n'),
    });
    return reply(200);
  } catch {
    return reply(502, 'The email did not go through. Please try again, or write to ideas@pmcstudios.uk.');
  }
}
