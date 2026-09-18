# Cycle Tracker

A private, privacy-first cycle tracking PWA. Phase 1 foundation: React + TypeScript
+ Vite + Tailwind + Supabase, installable as a PWA, deployable for free.

Scope for now (Phases 1–4 only — see project notes for the full roadmap):
account, period logging, calendar, basic average-based prediction. Partner mode,
AI insights, and notifications come later, once this version is actually in daily use.

## 1. Local setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

## 2. Set up Supabase

1. Create a free project at supabase.com.
2. Project Settings → API → copy the Project URL and anon public key into `.env`.
3. SQL Editor → paste and run `supabase/schema.sql`. This creates every table
   with Row Level Security already on — the database enforces access control,
   not the frontend.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Phase 1: foundation"
gh repo create cycle-tracker --private --source=. --remote=origin --push
```

(No `gh` CLI? Create an empty repo on github.com first, then:)

```bash
git remote add origin https://github.com/<your-username>/cycle-tracker.git
git branch -M main
git push -u origin main
```

## 4. Deploy — Vercel

```bash
npm i -g vercel
vercel
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in
the Vercel project settings (Settings → Environment Variables), then redeploy.
Free Hobby tier — fine for personal, non-commercial use.

## 4b. Deploy — Cloudflare Pages (alternative)

Connect the GitHub repo in the Cloudflare dashboard → Pages → Create a project.
Build command: `npm run build`. Output directory: `dist`. Add the same two env
vars under Settings → Environment Variables. No commercial-use restriction on
the free tier.

## Roadmap

- [x] Phase 1 — Foundation (this scaffold)
- [ ] Phase 2 — Auth (sign up / login / logout)
- [ ] Phase 3 — Period tracking (start/end/edit/delete, cycle calc)
- [ ] Phase 4 — Calendar (actual vs. predicted)
- [ ] Phase 5+ — daily logs, analytics, partner mode, AI — only after 1–4 are in real use
