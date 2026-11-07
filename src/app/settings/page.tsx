import type { Metadata } from 'next';
import { Band } from '@/components/shared/Band';
import { UiIcon } from '@/components/shared/icons';
import { SettingsView } from '@/components/shared/SettingsView';
import { SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Choose how PMC Apps looks and behaves on this device.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE}/settings` },
};

export default function Settings() {
  return (
    <>
      <Band title="Settings" tone="ink" icon={<UiIcon name="gear" size={40} />} />
      <div className="wrap body"><SettingsView /></div>
    </>
  );
}
