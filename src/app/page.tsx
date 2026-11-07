import Link from 'next/link';
import { HomeGroups } from '@/components/shared/HomeGroups';
import { AppIcon } from '@/components/shared/icons';
import { JsonLd } from '@/components/shared/JsonLd';
import { RecentList } from '@/components/shared/Recent';
import { AppSearch } from '@/components/shared/AppSearch';
import { homeJsonLd } from '@/lib/seo';
import { apps, groupList, searchIndex } from '@/registry';

/** The common jobs, said the way a person would say them. Each one goes straight to its tool. */
const JOBS: [string, string][] = [
  ['Fix some text', 'case-converter'],
  ['Make a picture smaller', 'image-resizer'],
  ['Make a QR code', 'vector-qr-maker'],
  ['Remove a background', 'background-remover'],
  ['Make a password', 'password-engine'],
  ['Change a PDF', 'pdf-page-manager'],
  ['Start a timer', 'pomodoro-focus-studio'],
  ['Make an invoice', 'invoice-builder'],
  ['Tidy some code', 'code-formatter'],
];

export default function Home() {
  const ready = apps.filter((a) => a.built);
  const jobs = JOBS.map(([say, slug]) => ({ say, a: searchIndex.find((x) => x.slug === slug) })).filter((j): j is { say: string; a: (typeof searchIndex)[number] } => !!j.a);
  return (
    <>
      <section className="start" aria-labelledby="start-title">
        <h1 id="start-title" className="d">{ready.length} free tools</h1>
        <AppSearch variant="hero" />
        <ul className="jobs">
          {jobs.map(({ say, a }) => (
            <li key={a.slug}>
              <Link href={a.href} className="job" data-g={a.key}>
                <span className="ic"><AppIcon slug={a.slug} size={44} still /></span>
                <b className="d">{say}</b>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="wrap body">
        <RecentList apps={searchIndex.map((a) => ({ slug: a.slug, title: a.title, href: a.href }))} />
        <HomeGroups groups={groupList} />
      </div>
      <JsonLd data={homeJsonLd(ready)} />
    </>
  );
}
