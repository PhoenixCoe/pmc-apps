import { HomeGroups } from '@/components/shared/HomeGroups';
import { JsonLd } from '@/components/shared/JsonLd';
import { Lockup } from '@/components/shared/Lockup';
import { RecentList } from '@/components/shared/Recent';
import { AppSearch } from '@/components/shared/AppSearch';
import { INTRO_SCRIPT } from '@/lib/intro';
import { homeJsonLd } from '@/lib/seo';
import { apps, groupList, searchIndex } from '@/registry';

export default function Home() {
  const ready = apps.filter((a) => a.built);
  return (
    <>
      {/* starts the first-visit sequence before anything is painted */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-stage" aria-hidden><Lockup /></div>
        <div className="wrap hero-body">
          <h1 id="hero-title" className="d">{ready.length} free tools</h1>
          <AppSearch variant="hero" />
        </div>
      </section>
      <div className="wrap body">
        <RecentList apps={searchIndex.map((a) => ({ slug: a.slug, title: a.title, href: a.href }))} />
        <HomeGroups groups={groupList} />
      </div>
      <JsonLd data={homeJsonLd(ready)} />
    </>
  );
}
