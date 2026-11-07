// Generates src/apps/<category>/<app>/{meta.ts,view.tsx} for every app, plus the registry and loader maps.
// Existing view.tsx files are NEVER overwritten, so built apps are safe. `built` in meta.ts is detected from
// whether view.tsx still contains the scaffold marker.
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO } from './seo-data.mjs';
import { TAGLINES } from './taglines.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARK = 'PMC_SCAFFOLD';
const CATEGORY_SLUGS = ['text-formatting', 'file-media', 'productivity-student', 'developer-data', 'business-web'];

// [category, slug, title, description, mode, flags]
const A = [
  ['text-formatting','case-converter','Case Converter','Convert text to upper, lower, title (AP or Chicago), camelCase, snake_case and kebab-case, with your own regex delimiter.','local'],
  ['text-formatting','code-formatter','Code Formatter','Clean up JavaScript, TypeScript, HTML, CSS, Python and SQL with your own indentation rules and syntax error flags.','local'],
  ['text-formatting','code-minifier-diff','Code Minifier & Diff','Strip whitespace and comments, see the bytes saved live, and compare before and after side by side.','local'],
  ['text-formatting','slug-generator','Slug Generator','Turn any title into a URL-safe slug with stop-word removal, transliteration and an SEO length check.','local'],
  ['text-formatting','word-readability-analyzer','Word & Readability Analyzer','Count words, characters, sentences and paragraphs, score readability and see keyword density.','local'],
  ['text-formatting','markdown-studio','Markdown Studio','Write Markdown with a live HTML preview and LaTeX maths, then export to PDF or MD.','local'],
  ['text-formatting','text-diff-inspector','Text Diff Inspector','Compare two texts by character or by line, side by side, and export a .patch file.','local'],
  ['text-formatting','regex-sandbox','RegEx Sandbox','Test regular expressions live, see capture groups, get a plain-English explanation and use the quick reference.','local'],
  ['text-formatting','lorem-generator','Lorem Generator','Generate placeholder text in Latin, tech startup, legal or medical styles.','local'],
  ['text-formatting','list-cleaner-deduplicator','List Cleaner & Deduplicator','Remove duplicate lines, trim whitespace, toggle case sensitivity and see how often each item appears.','local'],
  ['text-formatting','json-formatter-repair','JSON Formatter & Repair','Validate, format and repair JSON, including trailing commas, with a collapsible tree.','local'],
  ['text-formatting','table-converter','Table Converter','Turn CSV, TSV or plain text into Markdown, HTML and LaTeX tables.','local'],

  ['file-media','media-converter','Media Converter','Convert PNG, JPEG, WEBP, AVIF, MP3, WAV and OGG files in your browser with WebAssembly.','local',{heavy:1}],
  ['file-media','image-resizer','Image Resizer','Resize many images at once with locked aspect ratio, exact crops and quality compression.','local'],
  ['file-media','asset-shrinker','Asset Shrinker','Compress SVG, PNG and sprite sheets without losing quality, with a before and after slider.','local'],
  ['file-media','svg-vector-studio','SVG Vector Studio','Clean SVG code, trim path precision, strip metadata and generate React or Vue icon components.','local'],
  ['file-media','audio-trimmer-looper','Audio Trimmer & Looper','Cut audio on a live waveform, normalise volume and loop playback.','local'],
  ['file-media','pdf-page-manager','PDF Page Manager','Drag pages to extract, reorder, rotate, split and merge PDF documents.','local'],
  ['file-media','gif-animation-builder','GIF & Animation Builder','Turn video clips or image sequences into GIFs with per-frame delays and palette tuning.','local'],
  ['file-media','favicon-generator','Favicon Generator','Create a full favicon package (PNGs, ICO, Apple Touch icon and site.webmanifest) in one click.','local'],
  ['file-media','color-palette-extractor','Color & Palette Extractor','Pull dominant colours from an image, check WCAG contrast and export HEX, RGB or CSS variables.','local'],
  ['file-media','background-remover','Background Remover','Remove background colours and alpha channels from graphics and photos on a canvas.','local'],
  ['file-media','pixel-art-maker','Pixel Art Maker','Draw sprites on a fullscreen grid with custom palettes and onion skinning.','local',{heavy:1,fullscreen:1}],
  ['file-media','screenshot-framer','Screenshot Framer','Wrap screenshots in device frames, desktop windows and padding for portfolios.','local'],

  ['productivity-student','vector-qr-maker','Vector QR Maker','Make SVG QR codes with a logo, custom dot and corner shapes and vector downloads.','local'],
  ['productivity-student','unit-currency-matrix','Unit & Currency Matrix','Convert length, mass, temperature, data size, speed and live currency rates.','network'],
  ['productivity-student','global-time-zone-sync','Global Time Zone Sync','Compare cities on one timeline and find slots that suit everyone.','local'],
  ['productivity-student','pomodoro-focus-studio','Pomodoro & Focus Studio','Run focus and break timers with ambient loops, session logs and a daily streak.','local'],
  ['productivity-student','invoice-builder','Invoice Builder','Build line-item invoices with tax, discounts and your logo, then download a PDF.','local'],
  ['productivity-student','habit-heatmap-tracker','Habit Heatmap Tracker','Log habits and see a year-long activity heatmap, streaks and backups.','local'],
  ['productivity-student','password-engine','Password Engine','Generate strong passwords with entropy ratings, character options and leak warnings.','network'],
  ['productivity-student','multi-tally-counter','Multi-Tally Counter','Run several counters with custom steps, hotkeys 1 to 9, sound and CSV logs.','local'],
  ['productivity-student','email-signature-designer','Email Signature Designer','Design an HTML email signature with social icons and copy the code.','local'],
  ['productivity-student','flashcard-revision-studio','Flashcard Revision Studio','Build flashcard decks and revise with flip-to-recall mode.','local'],
  ['productivity-student','student-deadline-grade-planner','Student Deadline & Grade Planner','Plan coursework, count down to deadlines and work out what grades you need.','local'],
  ['productivity-student','encrypted-scratchpad','Encrypted Scratchpad','Keep Markdown notes locked with a password, organised by tag, stored on your device.','local'],

  ['developer-data','block-coder','Block Coder','Make games, toys, tools and real web pages by joining blocks with wires. 155 blocks and 50 projects to play with.','local',{heavy:1,fullscreen:1}],
  ['developer-data','github-readme-studio','GitHub README Studio','Drag section blocks, tech badges and stats into place and render a clean README.md live.','local',{fullscreen:1}],
  ['developer-data','terminal-pastebin','Terminal Pastebin','Share text and code as a link, with syntax colours, an expiry date and an optional password.','local'],
  ['developer-data','base64-studio','Base64 Studio','Encode and decode Base64 and data URIs with instant image, SVG and audio previews.','local'],
  ['developer-data','jwt-inspector','JWT Inspector','Decode JWT headers and payloads, check expiry and verify a secret.','local'],
  ['developer-data','env-file-validator','Env File Validator','Parse .env files, find missing keys and syntax errors, remove duplicates and tidy the format.','local'],
  ['developer-data','multi-hash-calculator','Multi-Hash Calculator','Hash text or files with MD5, SHA-1, SHA-256 and SHA-512 at the same time.','local'],
  ['developer-data','uuid-ulid-generator','UUID & ULID Generator','Generate v4 and v7 UUIDs and ULIDs in bulk, decode timestamps and export arrays.','local'],
  ['developer-data','code-snapshot-studio','Code Snapshot Studio','Turn code into a shareable card with syntax themes and window controls, exported as PNG.','local'],
  ['developer-data','webhook-inspector-replayer','Webhook Inspector & Replayer','Read a webhook request, check its signature, edit it and send it again.','local'],
  ['developer-data','mock-rest-api-studio','Mock REST API Studio','Make pretend endpoints with fake data, status codes and delays, then export the code.','local'],
  ['developer-data','cron-schedule-helper','Cron Schedule Helper','Build a cron expression visually, read it in plain English and see the next run times.','local'],

  ['business-web','social-meta-tag-previewer','Social Meta Tag Previewer','Preview Open Graph and Twitter cards and copy the matching meta tags.','local'],
  ['business-web','wcag-contrast-studio','WCAG Contrast Studio','Check colour pairs against WCAG AA and AAA with live component previews.','local'],
  ['business-web','visual-sitemap-planner','Visual Sitemap Planner','Map a website on a fullscreen canvas and export an XML sitemap.','local',{fullscreen:1}],
  ['business-web','screen-aspect-ratio-matrix','Screen & Aspect Ratio Matrix','Scale resolutions between aspect ratios with device presets.','local'],
  ['business-web','utm-link-builder','UTM Link Builder','Add UTM parameters to links, shorten them and export to CSV.','local'],
  ['business-web','privacy-policy-generator','Privacy Policy Generator','Draft a privacy policy for a website, SaaS product or mobile app.','local'],
  ['business-web','terms-of-service-builder','Terms of Service Builder','Assemble terms of service from clauses for billing, user content and liability.','local'],
  ['business-web','git-license-generator','Git & License Generator','Generate a .gitignore for your stack and add an MIT, Apache or GPL licence.','local'],
  ['business-web','http-protocol-reference','HTTP Protocol Reference & Checker','Search every HTTP status code with plain explanations and fixes.','local'],
  ['business-web','color-system-generator','Color System Generator','Build a 50 to 900 colour scale from one hex colour and export CSS variables.','local'],
  ['business-web','modular-type-scale-calculator','Modular Type Scale Calculator','Compute a type scale from a ratio and export it for your layouts.','local'],
  ['business-web','faq-schema-builder','FAQ Schema Builder','Build an FAQ accordion and get the HTML plus valid FAQPage JSON-LD.','local'],

];

const q = (s) => JSON.stringify(s);
const faqFor = (title, mode) => {
  const lower = title.toLowerCase();
  const privacy = mode === 'local'
    ? ['Does my data leave my device?', `No. ${title} runs entirely in your browser, so what you enter is never uploaded.`]
    : mode === 'network'
    ? ['Does my data leave my device?', 'Only what the tool needs to fetch from outside, such as rates or leak checks. Anything else you type stays on your device.']
    : ['Where is my data stored?', `${title} needs the PMC server to work. Items are kept only for as long as you set, and you can delete them at any time.`];
  return [
    ['Do I need an account to use the ' + lower + '?', 'No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices.'],
    privacy,
    ['Is the ' + lower + ' free?', 'Yes. It is free to use, with no sign-up, trial or usage wall.'],
  ];
};

const RESERVED = new Set(['api', 'og', 'signin', 'signup', 'suggest', 'settings', 'coming-soon', 'sitemap.xml', 'robots.txt', ...CATEGORY_SLUGS]);
{
  const seen = new Set();
  for (const [, slug] of A) {
    if (RESERVED.has(slug) || seen.has(slug)) throw new Error('App slug clashes with a page or another app: ' + slug);
    seen.add(slug);
  }
}

const reg = [], imports = [];
A.forEach(([category, slug, title, description, mode, flags = {}], i) => {
  const dir = join(root, 'src/apps', category, slug);
  mkdirSync(dir, { recursive: true });
  const viewPath = join(dir, 'view.tsx');
  if (!existsSync(viewPath)) {
    writeFileSync(viewPath, `'use client';\n// ${MARK}: replace this file with the real tool. Remove this comment when you do.\nimport { ToolPending } from '@/components/shared/ToolPending';\nimport { meta } from './meta';\n\nexport default function View() {\n  return <ToolPending meta={meta} />;\n}\n`);
  }
  const built = !readFileSync(viewPath, 'utf8').includes(MARK);
  const seo = SEO[slug];
  const keywords = seo?.keywords ?? [title.toLowerCase(), ...slug.split('-')].slice(0, 6);
  const faq = seo?.faq ?? faqFor(title, mode);
  writeFileSync(join(dir, 'meta.ts'),
`import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: ${i + 1},
  category: ${q(category)},
  slug: ${q(slug)},
  title: ${q(title)},
  description: ${q(description)},
  tagline: ${q(TAGLINES[slug] ?? title)},
  keywords: ${q(keywords)},${seo ? `\n  seoTitle: ${q(seo.title)},\n  seoDescription: ${q(seo.description)},\n  features: ${q(seo.features)},` : ''}
  mode: ${q(mode)},${flags.heavy ? '\n  heavy: true,' : ''}${flags.fullscreen ? '\n  fullscreen: true,' : ''}${flags.fullbleed ? '\n  fullbleed: true,' : ''}${flags.note ? `\n  note: ${q(flags.note)},` : ''}
  faq: [
${faq.map(([a, b]) => `    { q: ${q(a)}, a: ${q(b)} },`).join('\n')}
  ],
  built: ${built},
};
`);
  const id = `m${i + 1}`;
  imports.push(`import { meta as ${id} } from '@/apps/${category}/${slug}/meta';`);
  reg.push(id);
  // One route per app, so a page only ever loads its own tool (dev compiles one tool, not sixty).
  // Short URL: the app lives at /<slug>, with no /apps/<category> in front of it.
  const routeDir = join(root, 'src/app', slug);
  mkdirSync(routeDir, { recursive: true });
  rmSync(join(routeDir, 'opengraph-image.tsx'), { force: true });  // the share picture now lives at /og/<slug>.png
  writeFileSync(join(routeDir, 'page.tsx'),
`// GENERATED by scripts/scaffold.mjs. Do not edit.
import { AppPage, appPageMetadata } from '@/components/app/AppPage';
import View from '@/apps/${category}/${slug}/view';

export const generateMetadata = () => appPageMetadata(${q(category)}, ${q(slug)});
export default function Page() {
  return (
    <AppPage category=${JSON.stringify(category)} slug=${JSON.stringify(slug)}>
      <View />
    </AppPage>
  );
}
`);
});

writeFileSync(join(root, 'src/registry/apps.generated.ts'),
`// GENERATED by scripts/scaffold.mjs. Do not edit.\nimport type { AppMeta } from '@/lib/types';\n${imports.join('\n')}\n\nexport const apps: AppMeta[] = [${reg.join(', ')}];\n`);
console.log(`Scaffolded ${A.length} apps.`);
