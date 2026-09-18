# Anagha's Art Gallery — Local Dev Guide

## First-time setup

```bash
unzip anaghas-art-gallery-exhibition.zip
cd anaghas-art-gallery
chmod +x setup.sh
./setup.sh
```

Requires **Node 18+**. Uses pnpm (preferred) or npm.

---

## Daily dev

```bash
pnpm run dev:local
# or: npm run dev:local
```

Opens at **http://localhost:3000** with hot reload. **Changes you save to files are live instantly.** Nothing resets between sessions — your files on disk are the source of truth.

---

## Making changes

All source files are in `client/src/`. Key ones:

| File | What it controls |
|------|-----------------|
| `client/src/components/MuseumExperience.tsx` | Main gallery experience / rooms |
| `client/src/lib/exhibition.ts` | Room data, artwork info, config |
| `client/src/index.css` | All styles |
| `client/src/components/AdmissionTicket.tsx` | Entry ticket UI |
| `client/public/exhibition/room*/` | Artwork images (JPGs) |

To add images: drop them in `client/public/exhibition/roomXX/` and reference them in `exhibition.ts`.

---

## Deploy to Netlify

### Option A — Netlify CLI (recommended)

```bash
# Install once
npm i -g netlify-cli

# Build
pnpm run build:local

# Deploy (follow prompts first time to connect your account)
netlify deploy --dir dist/public --prod
```

### Option B — Netlify UI (drag and drop)

1. Run `pnpm run build:local`
2. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
3. Drag the `dist/public/` folder into the drop zone
4. Done — you get a live URL instantly

### Option C — Git-connected (auto-deploys on push)

1. Push this folder to a GitHub repo
2. In Netlify: **Add new site → Import from Git**
3. Set build command: `pnpm run build:local`
4. Set publish directory: `dist/public`
5. Every `git push` auto-deploys

> **Note:** This is a static frontend. The Express server (`server/index.ts`) is only needed if you add API routes. For the gallery as-is, `dist/public` is all Netlify needs.

---

## Multiple people editing

Just share the folder (via Git, Dropbox, etc.). Everyone runs `pnpm run dev:local` on their own machine. Changes persist in the files — no database needed for the gallery content.

If you want live collaborative editing, push to GitHub and use git branches/PRs.
