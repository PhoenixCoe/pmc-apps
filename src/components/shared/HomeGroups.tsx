import type { GroupEntry } from '@/registry';
import { AppCell } from './AppCell';

/** Every tool, in five plain groups. Nothing to open or close: scroll and pick. */
export function HomeGroups({ groups }: { groups: GroupEntry[] }) {
  return (
    <section aria-labelledby="all-title" className="hgs">
      <h2 id="all-title" className="sr">All tools</h2>
      {groups.map((g) => (
        <section key={g.key} className="hg" data-g={g.key} aria-labelledby={`hg-${g.key}`}>
          <header className="hg-h">
            <span className="sq" aria-hidden />
            <h2 id={`hg-${g.key}`} className="d">{g.name}</h2>
            <p className="tx">{g.blurb}</p>
          </header>
          <div className="tiles">
            {g.apps.map((a) => <AppCell key={a.slug} slug={a.slug} href={a.href} title={a.title} tagline={a.tagline} />)}
          </div>
        </section>
      ))}
    </section>
  );
}
