# CBL job requisition portal

Next.js + Supabase + Resend, matching the workflow: TA creates a requisition, sets a reviewer
list/order, each reviewer gets emailed a one-time link, approves or rejects with a comment, the
full history is visible to every reviewer after them, and the final approval marks it ready to
publish.

Deliberately left out of this POC, add before using it for real:
- Login for the TA (anyone can currently open `/new` and `/`)
- Row-level security in Supabase (this uses the service role key, which bypasses it entirely)
- Real email delivery beyond Resend's test sender

## 1. Install

```
npm install
```

## 2. Create the database

In your Supabase project, open the SQL editor and run everything in `supabase/schema.sql`.

## 3. Fill in your real values

Copy `.env.example` to `.env.local`:

```
cp .env.example .env.local
```

Then edit `.env.local` and replace each placeholder:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Project Settings → API.
  Use the **service_role** key, not the anon key (this app never runs in the browser, only on
  the server, so the service role key is never exposed).
- `RESEND_API_KEY` — resend.com → API Keys. The free tier works for testing; `onboarding@resend.dev`
  as the sender works without verifying a domain.
- `NEXT_PUBLIC_JD_GENERATOR_URL` — wherever your existing JD generator's React frontend is deployed
  (the one with the "Job Description Generator" form). This is the URL the "Generate AI JD" button
  opens, with the role title/reason/tasks/must-have pre-filled as query parameters. That frontend
  needs one small addition on its own side: reading `URLSearchParams` on page load and using them
  to pre-fill those four fields — it doesn't do this yet.
- `NEXT_PUBLIC_APP_URL` — leave as `http://localhost:3000` for local testing. Change this to your
  real deployed URL once it's on Vercel, since it's used to build the links inside reviewer emails.

## 4. Run it

```
npm run dev
```

Open `http://localhost:3000`.

## How it works, file by file

- `app/page.tsx` — TA's dashboard, lists every requisition and its status.
- `app/new/page.tsx` + `app/new/actions.ts` — the creation form and the server action that saves
  it, creates one `review_steps` row per reviewer, and emails the first one.
- `app/review/[token]/page.tsx` + `actions.ts` — the reviewer's page, looked up by their unique
  token (no login). Shows the job details, the full approval history so far, and an approve/reject
  form only if it's actually their turn.
- `app/requisition/[id]/page.tsx` — the TA-facing read-only view of one requisition's timeline.
- `lib/supabaseServer.ts` — one shared Supabase client using the service role key, used everywhere.
- `lib/resend.ts` — the one function that sends reviewer emails, called from both the creation
  action and the review action (when advancing to the next reviewer).

## Deploying

Push to GitHub, import into Vercel, paste the same environment variables from `.env.local` into
Vercel's project settings (Settings → Environment Variables), deploy.
