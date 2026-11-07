import { apps } from '@/registry';
import { ogImage } from '@/lib/og';

export const dynamic = 'force-static';
export const dynamicParams = false;
// One picture per app, at /og/<app-name>.png: a real .png address so every host and social site treats it as an image.
export const generateStaticParams = () => apps.map((a) => ({ file: `${a.slug}.png` }));

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const slug = (await params).file.replace(/\.png$/, '');
  const a = apps.find((x) => x.slug === slug);
  return ogImage(a?.category ?? '', slug);
}
