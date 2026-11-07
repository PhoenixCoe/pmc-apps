export type CategorySlug =
  | 'text-formatting'
  | 'file-media'
  | 'productivity-student'
  | 'developer-data'
  | 'business-web';

/** local = runs fully in the browser; network = needs an outside request; server = needs the PMC backend */
export type AppMode = 'local' | 'network' | 'server';

export interface FaqItem {
  q: string;
  a: string;
}

export interface AppMeta {
  n: number;
  category: CategorySlug;
  slug: string;
  title: string;
  /** One sentence, plain language. Used for the page intro, meta description and JSON-LD. */
  description: string;
  /** Two to five plain words, shown under the name in menus, search and the group lists. */
  tagline: string;
  keywords: string[];
  /** Page title for search results (about 60 characters). Falls back to the app title. */
  seoTitle?: string;
  /** Meta description for search results (120 to 155 characters). Falls back to `description`. */
  seoDescription?: string;
  /** Short plain-English list of what the tool does. Shown on the page and sent as JSON-LD featureList. */
  features?: string[];
  mode: AppMode;
  /** Shows the loading tracker before the tool mounts (WASM, big canvases). */
  heavy?: boolean;
  /** Opens in the fullscreen pan/zoom viewport. */
  fullscreen?: boolean;
  /** The tool fills the page under the top bar (a chat window), with no title band. */
  fullbleed?: boolean;
  /** Replaces the usual one-line note about where your data goes. */
  note?: string;
  /** Exactly three entries. */
  faq: [FaqItem, FaqItem, FaqItem];
  /** false until the app's real view ships */
  built: boolean;
}

export type GroupKey = 'text' | 'file' | 'prod' | 'dev' | 'biz';

export interface Category {
  slug: CategorySlug;
  name: string;
  blurb: string;
  /** The group's colour set. CSS reads it from data-g="<key>" (see the Group colours block in globals.css). */
  key: GroupKey;
  /** One word, used on the small group tag in search results. */
  short: string;
}
