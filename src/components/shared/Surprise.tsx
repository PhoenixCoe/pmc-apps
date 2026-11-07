'use client';
import { useRouter } from 'next/navigation';
import { UiIcon } from './icons';

/** One button for people who do not know what they need: it opens a tool at random. */
export function Surprise({ hrefs }: { hrefs: string[] }) {
  const r = useRouter();
  return (
    <button type="button" className="surprise" onClick={() => r.push(hrefs[Math.floor(Math.random() * hrefs.length)])}>
      <UiIcon name="idea" size={22} /><span className="d">Surprise me</span>
    </button>
  );
}
