Tracker Journal

Quickstart

1. Install deps:

```
npm install
```

2. Run dev server:

```
npm run dev
```

The app uses LocalStorage for persistence. Tailwind is configured; toggle dark mode via the button.

Deployment (Vercel / Netlify)

1) Build the production bundle:

```bash
npm install
npm run build
```

2) Preview locally:

```bash
npm run preview
```

3) Deploy to Vercel:

- Push your repo to GitHub.
- On Vercel, import the repository. Vercel auto-detects Vite and runs `npm run build`.

4) Deploy to Netlify:

- Push your repo to GitHub.
- On Netlify, click "New site from Git" and connect the repo.
- Set build command: `npm run build` and publish directory: `dist`.

Or use the included `netlify.toml` for Netlify configuration (publish = "dist").

Quick share (optional): you can expose the dev server with `npx ngrok http 5173` and open the URL on your phone for testing.

# Tracker / Journal

