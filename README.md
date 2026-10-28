# Health-care-ai-agent
Daily Health Companion
A responsive web app that helps people managing ongoing health conditions (for example diabetes or hypertension) keep track of daily routines in one accessible place. It combines personal health logs, user-created reminders, accessibility options, and AI-assisted summaries of the user's own entries.
> **Important:** Daily Health Companion is a self-management and organization aid. It does **not** diagnose conditions, interpret readings as a diagnosis, prescribe or change treatment, or replace a clinician, emergency service, or medical device. For urgent health concerns, contact local emergency services or a healthcare professional.
>
> This project is **not** claimed to be HIPAA-compliant or production-ready. A qualified security, privacy, and compliance review is required before it is used with real patient data.
Status: Prototype (PRD v1.0, 22 October 2026)
For system design details, see `ARCHITECTURE.md`.
Table of contents
Features
Prerequisites
Local development
Environment variables
Authentication setup
Database setup and migrations
AI assistant and demo mode
API overview
Deploying to Render
Connecting the frontend to the backend
Testing
Security and privacy
Known limitations
Roadmap
---
Features
Daily dashboard: today's logs, upcoming reminders, and recent activity.
Quick health logging: medication, meals, sleep, activity, blood pressure, and glucose, with date, time, and optional notes. Values are shown as user-entered records and are never scored or diagnosed.
Personal reminders: create, edit, snooze, complete, disable, and delete reminders, with timezone and repeat schedules.
Reminder alerts: a visible alert always appears; an optional gentle sound has a test control and respects browser permissions.
Reuse yesterday's schedule: preview, confirm, and copy reminder times into today. Duplicates are prevented and completion history is not copied.
Accessibility and personalization: themes (Calm Blue, Nature Green, Warm Sunset, High Contrast), standard / large / extra-large text, simple-language mode, and optional interests for friendly non-medical greetings.
Voice-friendly interaction: speech input and spoken responses where the browser supports them, with on-screen alternatives.
AI-assisted summaries: factual summaries built from the user's own records, useful for preparing for a healthcare visit.
Confirmed assistant actions: the assistant proposes a log or reminder, and nothing is saved until the user approves.
Accounts and cross-device access: Google or email sign-in; saved schedules and preferences are available on any device.
Demo mode: try the core workflows without an account or an AI key.
Privacy controls: view and delete your own records. Data is isolated per user.
---
Prerequisites
Node.js 20 or newer, and npm
PostgreSQL 14 or newer for local development (or a Render dev database)
Git
Accounts you must create yourself (nothing is provided for you):
Account	Needed for	Required?
Render	Hosting the frontend, API, and database	Yes, for deployment
Supabase	Google and email sign-in	Yes, unless the project already has secure auth
Google Cloud Console	Google OAuth client (used through Supabase)	Only for Google sign-in
An AI provider of your choice	AI assistant	Optional (demo mode works without it)
---
Local development
Clone and install
```bash
   git clone <your-repo-url>
   cd <your-repo>
   cd backend && npm install
   cd ../frontend && npm install
   ```
Create local environment files
```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
Fill in the values yourself. See Environment variables. Never commit `.env` files.
Create a local database
```bash
   createdb daily_health_companion
   ```
Then set `DATABASE_URL` in `backend/.env`.
Run migrations
```bash
   cd backend
   npm run migrate
   ```
Start the backend
```bash
   npm run dev
   ```
The API runs at `http://localhost:4000` by default. Check `http://localhost:4000/health`.
Start the frontend
```bash
   cd ../frontend
   npm run dev
   ```
The app runs at `http://localhost:5173` by default.
> Script names (`dev`, `migrate`, `test`, `build`) are the intended ones. If your `package.json` uses different names, update this section.
---
Environment variables
Names only are listed here. Real values go in your own `.env` files or in the Render dashboard.
Backend (secret unless marked public)
Variable	Purpose	Secret?
`NODE_ENV`	`development` or `production`	No
`PORT`	API port (Render sets this automatically)	No
`DATABASE_URL`	PostgreSQL connection string	Yes
`FRONTEND_URL`	Deployed frontend URL for CORS	No
`LOCAL_FRONTEND_URL`	Local dev frontend URL for CORS (for example `http://localhost:5173`)	No
`SUPABASE_URL`	Supabase project URL	No
`SUPABASE_JWT_SECRET` or `SUPABASE_JWKS_URL`	Used to verify access tokens	Yes (secret) / No (JWKS URL)
`AI_PROVIDER_API_KEY`	AI provider key (optional)	Yes
`AI_MODEL`	Model name for the assistant (optional)	No
`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`	Rate limit tuning (optional)	No
Frontend (public values only)
Variable	Purpose
`VITE_API_BASE_URL`	URL of the backend API
`VITE_SUPABASE_URL`	Supabase project URL
`VITE_SUPABASE_ANON_KEY`	Supabase public anon key
> **Never** put the database URL, AI key, JWT secret, or any service-role key in a `VITE_` variable. Anything prefixed with `VITE_` is visible to every visitor.
---
Authentication setup
The app uses Supabase Auth unless the project already has a secure provider.
Create a Supabase project (YOU DO THIS) at supabase.com.
Enable email sign-in: Authentication, then Providers, then Email.
Enable Google sign-in (YOU DO THIS):
In Google Cloud Console, create an OAuth client (Web application).
Add the redirect URL shown in Supabase's Google provider settings.
Paste the Google client ID and secret into Supabase.
Set redirect URLs in Supabase (Authentication, then URL Configuration) to include your deployed frontend URL and `http://localhost:5173`.
Copy values into your environment files: the project URL and anon key go to the frontend; the URL and the JWT verification details go to the backend.
How it works: the frontend signs the user in through Supabase and sends the access token to the API in the `Authorization: Bearer <token>` header. The backend verifies the token on every protected request.
---
Database setup and migrations
Schema changes are managed by versioned migrations in `backend/src/db/migrations`.
Run pending migrations:
```bash
  cd backend
  npm run migrate
  ```
Migrations are idempotent and safe to run on an empty database.
All timestamps are stored in UTC (`timestamptz`). Each reminder stores the user's IANA timezone.
Main tables (high level): profiles, preferences, health logs, reminders, and reminder occurrences. Every row belongs to a user and is protected by ownership checks.
---
AI assistant and demo mode
Demo mode: works with no account and no AI key. Demo data is stored in the browser and clearly labeled as sample data.
AI mode: turns on when `AI_PROVIDER_API_KEY` is set on the server. The key is never sent to the browser.
AI safety rules:
The assistant runs only when the user asks.
It sends only the minimum information needed for the current request.
It does not diagnose, prescribe, interpret readings as a diagnosis, or advise changing medication or treatment.
Any proposed log or reminder is shown as a draft. Nothing is saved until the user confirms.
Urgent concerns are directed to local emergency services or a healthcare professional.
Prompts and responses containing health details are not logged.
---
API overview
All routes require a valid access token, except `/health`.
Method	Path	Purpose
GET	`/health`	Render health check
GET / PATCH	`/api/v1/me`	Profile and preferences
GET / POST	`/api/v1/logs`	List or create health logs
GET / PATCH / DELETE	`/api/v1/logs/:id`	View, edit, delete a log
GET / POST	`/api/v1/reminders`	List or create reminders
GET / PATCH / DELETE	`/api/v1/reminders/:id`	View, edit, delete a reminder
GET	`/api/v1/reminders/due`	Reminders due now
POST	`/api/v1/reminders/:id/snooze`	Snooze a reminder
POST	`/api/v1/reminders/:id/complete`	Mark a reminder done
GET	`/api/v1/reminders/copy-yesterday/preview`	Preview yesterday's schedule copy
POST	`/api/v1/reminders/copy-yesterday`	Confirm and copy
POST	`/api/v1/assistant`	Ask the assistant (draft suggestions only)
Errors use a consistent JSON format and never expose stack traces or secrets.
---
Deploying to Render
Steps marked YOU DO THIS need your own account or credentials.
Push the project to GitHub (YOU DO THIS). Make sure `.env` files are not committed.
Create a Render account (YOU DO THIS) and connect your GitHub repository.
Create the PostgreSQL database (YOU DO THIS): Render dashboard, New, PostgreSQL. Copy the Internal Database URL.
Create the backend Web Service:
Root directory: `backend`
Build command: `npm install && npm run build`
Start command: `npm start`
Health check path: `/health`
Set backend environment variables (YOU DO THIS) in the Render dashboard: `DATABASE_URL`, `FRONTEND_URL`, `LOCAL_FRONTEND_URL`, Supabase values, and optionally `AI_PROVIDER_API_KEY` and `AI_MODEL`.
Run migrations: use a pre-deploy command (`npm run migrate`) or run it once from the Render shell.
Deploy the backend and open `https://<your-api>.onrender.com/health` to confirm it responds.
Set frontend environment variables (YOU DO THIS): `VITE_API_BASE_URL` (your API URL), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Then redeploy the frontend, since Vite reads these at build time.
Update Supabase redirect URLs to include the deployed frontend URL.
Test end to end: sign in, create a reminder, then sign in on another device and confirm it appears.
If a `render.yaml` Blueprint is included, you can use it to create the API and database together; you still need to enter secret values yourself in the dashboard.
> **Free tier note:** free Render services can sleep when idle, so the first request after a pause may be slow.
---
Connecting the frontend to the backend
Set `VITE_API_BASE_URL` in the frontend environment (for local development, `http://localhost:4000`).
Make sure the backend allows the frontend's origin through `FRONTEND_URL` and `LOCAL_FRONTEND_URL`. Only these origins are permitted by CORS.
Signed-in users read and write through the API. Signed-out users, and builds with no backend configured, stay in demo mode.
Importing existing local data: local browser data is never moved to an account automatically. The app asks first, and local data is not deleted.
---
Testing
```bash
cd backend
npm test
npm run typecheck
npm run build

cd ../frontend
npm run build
```
The test suite should cover:
Rejection of missing, invalid, or expired tokens
Ownership isolation (user A cannot read, edit, or delete user B's data)
Input validation failures
Reminder timezone and repeat handling
Copy-yesterday: confirmation required, no duplicates, no completion status or logs copied
No duplicate alerts for the same reminder occurrence
AI demo mode, no auto-saving of suggestions, and no-diagnosis guardrails (with the provider mocked)
---
Security and privacy
HTTPS in deployment, secure headers, request size limits, and rate limiting (stricter for the AI endpoint)
Input validation on every request, parameterized queries, and server-side authorization
CORS limited to the deployed frontend and the local dev URL
No passwords, tokens, API keys, or unnecessary health details in logs
No health information stored in Google profile fields
Users can view and delete their own entries and reminders
`.env` files are git-ignored. Only `.env.example` files with placeholder values are committed
---
Known limitations
Reminder sound depends on the browser. Alerts can be blocked by browser permissions, or may not play if the browser or device has closed the app. A visible reminder is always shown, but alarms are not guaranteed.
No SMS, email, or phone notifications in the current scope.
AI output can be wrong. Users should check it against their own records and speak to a healthcare professional about medical questions.
Health and market statistics used in presentations must be checked against credible sources before publication.
Not reviewed for HIPAA or other regulatory compliance.
---
Roadmap
Caregiver access with explicit user-granted permissions
Data export and a full account deletion workflow
More languages, plus expanded speech input and output
Integrations with health platforms or devices, only after privacy, security, and clinical review
---
License
Add your license here.
