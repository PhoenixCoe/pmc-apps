import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import Credentials from 'next-auth/providers/credentials';
import Nodemailer from 'next-auth/providers/nodemailer';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';
import { verifyPassword } from '@/lib/password';

const env = process.env;
const pool = new Pool({ connectionString: env.DATABASE_URL });

// A provider is only registered when its credentials exist, so a missing key
// disables that one sign-in method instead of breaking the build or the site.
const providers: Provider[] = [];
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) providers.push(Google);
if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) providers.push(GitHub);
if (env.AUTH_MICROSOFT_ENTRA_ID_ID && env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(MicrosoftEntraID({ issuer: env.AUTH_MICROSOFT_ENTRA_ID_ISSUER ?? 'https://login.microsoftonline.com/common/v2.0' }));
}
// Email and password. Needs the `credentials` table from src/db/schema.sql.
providers.push(Credentials({
  credentials: { email: {}, password: {} },
  async authorize(c) {
    const email = String(c?.email ?? '').trim().toLowerCase(), password = String(c?.password ?? '');
    if (!email || !password) return null;
    const { rows } = await pool.query(
      'SELECT u.id, u.name, u.email, u.image, c.hash FROM users u JOIN credentials c ON c.user_id = u.id WHERE lower(u.email) = $1', [email]);
    const u = rows[0];
    if (!u || !(await verifyPassword(password, u.hash))) return null;
    return { id: String(u.id), name: u.name, email: u.email, image: u.image };
  },
}));
if (env.EMAIL_SERVER && env.EMAIL_FROM) providers.push(Nodemailer({ server: env.EMAIL_SERVER, from: env.EMAIL_FROM }));

/** Sign-in is always optional. No app route ever requires a session. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Needed when self-hosting (anywhere except Vercel). The site is served from your own domain.
  trustHost: true,
  adapter: PostgresAdapter(pool),
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin', error: '/signin' },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = String(token.uid);
      return session;
    },
  },
});
