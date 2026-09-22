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
   not the frontend. If your project already ran an earlier version of this
   file, just run the new `-- === Phase 5 additions ===` block at the bottom
   instead of the whole file (avoids "policy already exists" errors).

## 3. Configure auth redirect (needed for "forgot password")

Supabase dashboard → Authentication → URL Configuration → add your app's URL
(`http://localhost:5173` for local dev, plus your deployed URL once you have one)
to **Redirect URLs**. Without this, the password-reset email link will fail to
return the user to the app.

## 4. Phase 7 setup — push notifications (skip if not using reminders yet)

This is the one phase that needs real infrastructure, not just code:

1. **VAPID keys.** A key pair was generated for this project:
   - Public: `BOLUu67gE4bcZiySc2sk5o88VG54AzbHBXAK-GFkr9E_cIxyr8bUwcJ-4XNL4ni99eIvKtccrR-YuFXTCGbDbFo`
   - Private: `oRHHojf6GjlmKXbIvfAK3S1VO9bKshEfXC34jqJwbco`

   Put the public one in `.env` as `VITE_VAPID_PUBLIC_KEY`. **Never put the
   private key in `.env` or anywhere in the frontend** — it only goes into
   the Edge Function's secrets (next step).

2. **Deploy the Edge Function** (needs the [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set VAPID_PUBLIC_KEY=BOLUu67gE4bcZiySc2sk5o88VG54AzbHBXAK-GFkr9E_cIxyr8bUwcJ-4XNL4ni99eIvKtccrR-YuFXTCGbDbFo
   supabase secrets set VAPID_PRIVATE_KEY=oRHHojf6GjlmKXbIvfAK3S1VO9bKshEfXC34jqJwbco
   supabase functions deploy send-period-reminders
   ```

3. **Schedule it** — in the Supabase SQL Editor, run once (replace the URL and
   service role key with your project's actual values, from Project Settings → API):
   ```sql
   select cron.schedule(
     'period-reminders-daily',
     '0 9 * * *', -- 9am daily; adjust to taste
     $$
     select net.http_post(
       url := 'https://<your-project-ref>.supabase.co/functions/v1/send-period-reminders',
       headers := jsonb_build_object('Authorization', 'Bearer <your-service-role-key>')
     );
     $$
   );
   ```
   (`pg_cron` and `pg_net` need to be enabled once, under Database → Extensions,
   if they aren't already.)

4. **Run `supabase/schema.sql`'s Phase 7 additions block** (same rule as
   before — only the new block if you already ran earlier versions).

Once that's done, the "Period reminders" toggle in Settings actually works.

## 5. Phase 8 setup — partner mode

1. Run `supabase/schema.sql`'s new `Phase 8 additions` block (same rule as
   before — just the new block if you already ran earlier versions).
2. Deploy the second Edge Function — no extra secrets needed this time,
   Supabase auto-injects the project URL and keys:
   ```bash
   supabase functions deploy accept-invite
   ```
   Accepting an invite deliberately isn't a plain database write from the
   client — `partner_connections` has no policy letting anyone browse
   pending invites (that's what keeps invite codes from being guessable/
   enumerable), so acceptance has to happen through this function.

## 6. Phase 9 setup — AI insights + account deletion

1. Run `supabase/schema.sql`'s new `Phase 9 additions` block.
2. Get a free Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey).
3. Deploy both functions:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-key-here
   supabase functions deploy daily-insight
   supabase functions deploy delete-account
   ```
4. The daily insight is cached per user per day — opening the app repeatedly
   won't burn extra Gemini calls, which matters given the free tier's request
   limits. It's also built to never send your notes to Gemini; only cycle
   day, recent moods, and recent symptom names go into the prompt.
5. `delete-account` needs no extra secrets, but it's genuinely irreversible —
   it removes the auth user, which cascades through every table via the
   `on delete cascade` foreign keys already in the schema.

If you skip this section, everything else still works — the Today screen
just won't show an insight card, and Settings' delete button will error until
the function is deployed.

## 7. Push to GitHub

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

## 8. Deploy — Vercel

```bash
npm i -g vercel
vercel
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in
the Vercel project settings (Settings → Environment Variables), then redeploy.
Free Hobby tier — fine for personal, non-commercial use.

## 8b. Deploy — Cloudflare Pages (alternative)

Connect the GitHub repo in the Cloudflare dashboard → Pages → Create a project.
Build command: `npm run build`. Output directory: `dist`. Add the same two env
vars under Settings → Environment Variables. No commercial-use restriction on
the free tier.

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Authentication (sign up, login, logout, password reset)
- [x] Phase 3 — Period tracking (start/end/edit/delete, cycle calc)
- [x] Phase 4 — Calendar (actual vs. predicted)
- [x] Phase 5 — Daily logs (mood, energy, flow, symptoms, notes)
- [x] Phase 6 — Analytics (cycle-length trend, symptom & mood frequency)
- [x] Phase 7 — Notifications (period-due push reminders)
- [x] Phase 8 — Partner mode (invite, sharing permissions, shared view)
- [x] Phase 9 — AI insights + account management (data export, delete account)
