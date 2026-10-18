# plainstrata.com

The website of Plain Strata, decentralized AI, layer by layer. Astro, static, on GitHub Pages.

## Pages

- `/` the question tree
- `/episodes/` pick a question, then follow it episode by episode
- `/map/` the whole show as one map: tree on the left, episode list on the right

## Episode data

- `src/data/episodes.json` is the checked-in list. It carries the question, the answer, the about line and the threads (lines) for each episode.
- New episodes arrive here from the Cast Companion's finalize step (step 9b of `Finalize Playbook.md` in the vault). It appends one entry and commits. Dastan pushes.
- `scripts/fetch-episodes.mjs` runs before every build. It reads `episodes.json` from the R2 bucket beside `feed.xml`.
- The R2 copy is used only when every episode has `question`, `answer`, `about` and `threads`, and when every id in the tree and the lines exists. Otherwise the site uses the checked-in file.
- If the fetch fails, the last good copy in `src/data/live.json` stays.
- The tree, the lines and the links are in `src/data/site.js`. Spotify and YouTube show up when they get an address there.

## Run

```bash
npm install
npm run dev
```

`npm run build` fetches the episodes and builds to `dist/`.

## Deploy

`.github/workflows/deploy.yml` builds and deploys on every push to `main`, every 6 hours, and on demand. `public/CNAME` sets the custom domain `plainstrata.com`.
