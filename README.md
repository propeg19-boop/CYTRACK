# CYTRACK — Master Cycle Tracker PWA

CYTRACK is a private, mobile-first menstrual and cycle tracking Progressive Web App (PWA). Built with deterministic mathematical intelligence, luxury wellness design aesthetics, robust privacy isolation, and server-side AI pattern insights.

---

## 🌟 Key Features

1. **Deterministic Cycle Prediction Engine (`cycleStats.ts`)**:
   - Pure mathematical calculations using historical intervals between cycle start dates.
   - Computes cycle days, average cycle lengths, period bleed durations, estimated upcoming period windows (`±2 days`), and estimated ovulation windows.
   - Zero speculative guessing or AI-dependent date calculation.

2. **Unskippable Warm Onboarding**:
   - Brand-new users are guided through a gentle 4-step onboarding flow.
   - Collects minimal baseline data (recent period start, typical cycle length, tone preference) and produces an instant deterministic preview.
   - Persisted at database level (`profiles.onboarding_completed`), strictly blocking main app access until finished.

3. **Daily Journal & Sensation Logging**:
   - Track menstrual flow (`none`, `spotting`, `light`, `medium`, `heavy`).
   - Track mood and emotional tone (`calm`, `happy`, `energetic`, `sensitive`, `anxious`, `irritated`, `tired`, `sad`).
   - 1–5 energy and vitality scale.
   - Physical, digestive, and emotional symptom toggles.
   - **Private User Notes**: Stored securely with strict database isolation. Never shared with partners or sent to AI.

4. **Accessible Custom Calendar**:
   - High-contrast visual distinctions (filled indicator for logged period, dashed ring for estimated window, sage badge for ovulation).
   - 44px navigation targets, full month switching, and interactive day inspection modal.

5. **Cycle Trends & Patterns (Insights)**:
   - Custom accessible SVG cycle length variation charts.
   - Symptom occurrence rankings and mood distribution graphs.
   - Clear medical boundaries and empty states when data is insufficient.

6. **Granular Partner Mode & Security Isolation**:
   - Owner generates a 6-character invite code.
   - Granular permission matrix: independently toggle `share_cycle`, `share_mood`, `share_energy`, `share_symptoms`.
   - **Database Row/Column Protection**: Partners are strictly forbidden from direct `SELECT` on `daily_logs`. Instead, a `SECURITY DEFINER` function (`get_partner_shared_logs`) executes server-side, checks permissions, and returns masked data with private notes completely excluded.
   - Separate partner observation and check-in note thread.
   - Instant Revoke / Disconnect capability.

7. **Server-Side AI Daily Insights (Gemini)**:
   - Proxied through Supabase Edge Function `/daily-insight` to keep API keys secure.
   - **Data Minimization**: Only passes non-sensitive parameters (`cycleDay`, `recentMoods`, `recentSymptoms`, `tone`). Free-text notes are never sent.
   - Cached once per day per user in `ai_insights` to avoid unnecessary API costs.
   - Clear informational disclaimer: *"AI-generated and for informational purposes only. Not medical advice."*

8. **Web Push Reminders**:
   - VAPID Web Push notifications alerting users 2 days before their estimated period window.
   - Server-side scheduled Edge Function `/send-period-reminders` with deduplication history table to prevent repetitive spam.

9. **Data Ownership & Account Management**:
   - Complete personal data export in JSON format.
   - Permanent account deletion with explicit `"DELETE"` confirmation modal and cascading database cleanup.

10. **Zero White-Screen Architecture**:
    - Environment validation banner on missing keys with fallback offline demo mode.
    - React Error Boundary catching unexpected runtime issues.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Vite PWA
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Supabase Edge Functions (Deno)
- **AI**: Google Gemini (via server-side Edge Function proxy)
- **Notifications**: Web Push (VAPID)
- **Deployment**: Vercel (SPA routing configured in `vercel.json`)

---

## 📁 Repository Structure

```
CYTRACK/
├── .env.example
├── README.md
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── public/
│   ├── favicon.svg
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── Button.tsx
│   │   ├── Toggle.tsx
│   │   ├── Modal.tsx
│   │   ├── LoadingState.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── MissingEnvBanner.tsx
│   ├── screens/
│   │   ├── Auth.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Today.tsx
│   │   ├── Calendar.tsx
│   │   ├── Log.tsx
│   │   ├── Insights.tsx
│   │   ├── Partner.tsx
│   │   ├── Settings.tsx
│   │   └── ResetPassword.tsx
│   └── lib/
│       ├── supabase.ts
│       ├── AuthContext.tsx
│       ├── types.ts
│       ├── cycleStats.ts
│       ├── cycleStats.test.ts
│       ├── useCycles.ts
│       ├── useDailyLog.ts
│       ├── usePartner.ts
│       ├── useDailyInsight.ts
│       ├── exportData.ts
│       └── push.ts
└── supabase/
    ├── schema.sql
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   ├── 002_rls_and_security_definer.sql
    │   └── 003_seed_symptoms.sql
    └── functions/
        ├── daily-insight/index.ts
        ├── send-period-reminders/index.ts
        ├── accept-invite/index.ts
        └── delete-account/index.ts
```

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your frontend keys:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_VAPID_PUBLIC_KEY=BEl62iUY...
```

### 3. Initialize Supabase Database
In your Supabase Dashboard:
1. Navigate to **SQL Editor**.
2. Open `supabase/schema.sql` (or run migrations in `supabase/migrations/`).
3. Click **Run** to create all tables, indexes, RLS policies, symptoms seed, and security definer functions.

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 5. Run Automated Tests
```bash
npm run test
```

---

## 🔒 Security & Privacy Architecture

### Row Level Security (RLS) Policy Table
| Table | Owner Access | Partner Access | Anonymous Access |
|---|---|---|---|
| `profiles` | SELECT, INSERT, UPDATE, DELETE | None | None |
| `cycles` | SELECT, INSERT, UPDATE, DELETE | None | None |
| `daily_logs` | SELECT, INSERT, UPDATE, DELETE | **BLOCKED (0 SELECT)** | None |
| `partner_connections` | SELECT, INSERT, UPDATE, DELETE | SELECT, UPDATE (Status) | None |
| `sharing_permissions` | ALL | SELECT only | None |
| `partner_observations` | SELECT, INSERT | SELECT, INSERT | None |
| `push_subscriptions` | ALL | None | None |
| `ai_insights` | ALL | None | None |

### Masked Partner Access
Partners read owner data exclusively via `get_partner_shared_logs(owner_id, start_date, end_date)`. This function:
1. Validates caller is active partner.
2. Reads `sharing_permissions`.
3. Returns JSON objects omitting unshared fields and permanently excluding `notes`.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. Import project into Vercel.
3. In **Project Settings > Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
4. Deploy! `vercel.json` ensures all SPA routes (`/today`, `/calendar`, `/log`, `/insights`, `/partner`, `/settings`) resolve correctly without 404s.
