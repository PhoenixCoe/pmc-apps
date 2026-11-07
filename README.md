# PMC Apps (apps.pmcstudios.uk)

Sixty free browser tools in five groups. Next.js 15 (App Router), React 19, TypeScript.
Everything runs in the visitor's browser. Sign-in and the three server-backed apps are optional and off by default.

## What you need
- **Node.js 22 or newer** (free, from https://nodejs.org). Check with `node -v`.
- That is all for looking at the site and for putting it on GitHub Pages.

## 1. Look at it on your computer
Open a terminal in this folder (Windows: right-click the folder, "Open in Terminal"), then:

```bash
npm install
npm run dev
```
Open http://localhost:3000. The first visit to each page is slow because it compiles then; it is fast after that.

To see it at real speed, the way visitors will:
```bash
npm run build:static
npx serve out
```
`serve` prints an address (usually http://localhost:3000). The finished site is the `out` folder.

## 2. Put it on the internet (GitHub Pages)
Full steps are in **DEPLOY.md**. In short:
1. Make a repository on GitHub and push this folder to it (`git init`, `git add .`, `git commit -m "PMC Apps"`, `git remote add origin <your repo>`, `git push -u origin main`).
2. In the repository: Settings > Pages > Source: **GitHub Actions**. The workflow in `.github/workflows/pages.yml` builds and publishes on every push.
3. Add a DNS record at your domain host: type `CNAME`, name `apps`, value `<your-github-name>.github.io`. Then enter `apps.pmcstudios.uk` under Settings > Pages > Custom domain and tick Enforce HTTPS.

The site is built for **apps.pmcstudios.uk** (`public/CNAME` and `SITE_URL` in the workflow). If you want `app.` instead, change those two and the DNS name, and use one spelling everywhere.

On GitHub Pages these are switched off because they need a server: sign-in, saved accounts, and Terminal Pastebin, Webhook Inspector and Mock REST API. Every other tool works. The "Suggest an app" form falls back to an email link unless you set `NEXT_PUBLIC_SUGGEST_ENDPOINT`.

## 3. Day-to-day commands
| Command | What it does |
|---|---|
| `npm run dev` | Edit the site with live reload |
| `npm run typecheck` | Checks the code for mistakes |
| `npm run build:static` | Builds the GitHub Pages site into `out/` |
| `npm run scaffold` | Regenerates the app folders and the app list. Safe to re-run; it never overwrites a finished `view.tsx` |
| `npm run build` then `npm start` | Normal Node server build (needed only for sign-in and the server apps) |

If a `build:static` is ever interrupted, run `mv src/app/_api_off src/app/api` to put the server folder back (Windows: rename `_api_off` to `api`).

## Where things are
```
src/apps/<group>/<app>/     one folder per app
    meta.ts                 title, description, search words, 3 FAQ answers (generated; SEO text comes from scripts/seo-data.mjs)
    view.tsx                the tool itself
    utils.ts and friends    helpers beside it
src/components/shared/      the shared pieces: sidebar, Select (dropdown), ColorPicker, Segmented, previews, loaders, fullscreen canvas
src/app/globals.css         all the styling, in the PMC style
src/app/<app-name>/         one route per app (generated)
src/lib/seo.ts              titles, descriptions, share images and search-engine data
scripts/scaffold.mjs        the list of all 60 apps
scripts/seo-data.mjs        the search copy for each finished app
public/fonts/               Caractères L2 and L4 and the symbol fonts
```

## Adding the next app
1. Open `src/apps/<group>/<app>/view.tsx` and write the tool (delete the `PMC_SCAFFOLD` line).
2. Use `useLocalState('<app-slug>', key, initial)` so settings are remembered with no account.
3. Put optional controls in `<SettingsDrawer>`. Use `Select`, `ColorPicker` and `Segmented` from `components/shared`, not the browser's own controls.
4. Add the app's search copy to `scripts/seo-data.mjs`, then run `npm run scaffold`. That marks it built and lists it in the sitemap.

## Optional: sign-in
Copy `.env.example` to `.env` and fill in only what you have (Google, Microsoft, GitHub, email links). Load `src/db/schema.sql` into Postgres. None of this is needed to browse or use the tools.
