import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

/** The page around the sign-in and sign-up boxes: the logo in the middle at the top, the box, and a line along the bottom. */
export function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <header className="auth-top"><Link href="/" aria-label="PMC Apps, home"><Logo /></Link></header>
      <main id="main" className="auth-main" tabIndex={-1}>
        <section className="auth-box" aria-labelledby="auth-title">
          <div className="auth-side tone-green">
            <h1 id="auth-title" className="d">{title}</h1>
          </div>
          <div className="auth-body">{children}</div>
        </section>
      </main>
      <footer className="auth-foot">
        <span className="tx">© {new Date().getFullYear()} PMC Studios</span>
        <nav className="d" aria-label="More">
          <Link href="/">Home</Link>
          <a href="https://pmcstudios.uk">PMC Studios</a>
        </nav>
      </footer>
    </div>
  );
}
