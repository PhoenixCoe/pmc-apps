'use client';
import { BrandIcon, type Brand } from '@/components/shared/icons';
import type { Via } from '@/lib/accounts';

export const PROVIDERS: { brand: Brand; id: Via; name: string }[] = [
  { brand: 'google', id: 'google', name: 'Google' },
  { brand: 'microsoft', id: 'microsoft-entra-id', name: 'Microsoft' },
  { brand: 'github', id: 'github', name: 'GitHub' },
];

/** Three squares, one per company. A square is switched off when this copy of the site has no keys for that company. */
export function ProviderButtons({ available, busy, onPick }: { available: string[] | null; busy: boolean; onPick: (id: Via) => void }) {
  return (
    <div className="provs" role="group" aria-label="Continue with">
      {PROVIDERS.map((p) => {
        const off = available !== null && !available.includes(p.id);
        return (
          <button key={p.id} type="button" className="prov" disabled={busy || off} onClick={() => onPick(p.id)}
            aria-label={off ? `${p.name} sign-in is not set up here` : `Continue with ${p.name}`} title={off ? `${p.name} is not set up on this site yet` : `Continue with ${p.name}`}>
            <BrandIcon brand={p.brand} size={26} />
          </button>
        );
      })}
    </div>
  );
}
