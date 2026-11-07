import type { Metadata } from 'next';
import { Band } from '@/components/shared/Band';
import { UiIcon } from '@/components/shared/icons';
import { SuggestForm } from '@/components/shared/SuggestForm';
import { SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Suggest an app',
  description: 'Tell us which small tool you wish existed. Every idea goes to the PMC Studios inbox.',
  alternates: { canonical: `${SITE}/suggest` },
};

export default function Suggest() {
  return (
    <>
      <Band title="Suggest an app" tone="gold" icon={<UiIcon name="idea" size={40} />} />
      <div className="wrap body"><section className="sec suggest" aria-label="Suggest an app"><SuggestForm /></section></div>
    </>
  );
}
