# Putting PMC Apps online (apps.pmcstudios.uk)

GitHub Pages hosts plain files, so the site is built as a static export (`npm run build:static`). Sign-in, saved accounts and the three apps that need a server
(Terminal Pastebin, Webhook Inspector, Mock REST API) are switched off in that build. Every other tool works. The "Suggest an app" form falls back to an email link.

## First time
1. github.com > **+** (top right) > **New repository**. Name it `pmc-apps`. Choose **Public**. Leave every "Add a ..." box empty. **Create repository**.
2. On the empty repository page press **uploading an existing file**. GitHub takes 100 files at a time, so the files come in batches (`2-upload-batch-1` ... in the zip). For each batch, in order: open the folder, select everything inside it (Ctrl+A), drag it onto the page, wait for the bar to finish, press **Commit changes**. Then **Add file > Upload files** for the next batch.
3. Repository > **Settings** > **Pages** (left menu) > Build and deployment > Source: **GitHub Actions**.
4. **Code** tab > **Add file** > **Create new file**. In the name box type `.github/workflows/pages.yml` (typing each `/` starts a folder). Paste everything from `1-create-this-file-on-GitHub/pages.yml`. Press **Commit changes**.
5. **Actions** tab. Wait for the green tick on "Deploy to GitHub Pages" (about 3 minutes).
6. Settings > Pages > **Custom domain**: type `apps.pmcstudios.uk` > **Save**.
7. Where pmcstudios.uk's DNS is managed (Cloudflare dashboard > pmcstudios.uk > **DNS** > **Records** > **Add record**): Type `CNAME`, Name `apps`, Target `<your-github-name>.github.io`, Proxy status **DNS only** (grey cloud). **Save**.
8. Back in Settings > Pages, wait for "DNS check successful" (minutes, sometimes a few hours). Tick **Enforce HTTPS**.
9. Open https://apps.pmcstudios.uk and press Ctrl+Shift+R.

## Updating later
Upload the changed files the same way (**Add file > Upload files**, same folder paths), then **Commit changes**. The Actions tab rebuilds the site.

## If you want to build it on your own computer
Needs Node.js 22 or newer. `npm install`, then `npm run dev` (editing) or `npm run build:static` then `npx serve out` (the real thing).

## Each app has its own address
Every app is at `apps.pmcstudios.uk/<app-name>`, for example `apps.pmcstudios.uk/case-converter`. One domain with a clean path per app is the best set-up for search.
Sub-domains per app (`case-converter.apps.pmcstudios.uk`) are not possible on GitHub Pages alone, since a Pages site gets exactly one custom domain.
