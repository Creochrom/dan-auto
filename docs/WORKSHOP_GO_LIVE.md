# Workshop OS — production go-live checklist

Single checklist for **Dan Auto Workshop OS** (admin floor, jobs cockpit, attachments, invoices, vehicle memory, ⌘K). Run top to bottom before pointing staff at production.

**Related docs:** [ADMIN_LOGIN_SMOKE.md](./ADMIN_LOGIN_SMOKE.md) · [ADMIN_AUTH.md](./ADMIN_AUTH.md) · [SUPABASE_GO_LIVE.md](./SUPABASE_GO_LIVE.md)

---

## 1. Supabase migrations (in order)

Run each file once in **Supabase Dashboard → SQL Editor** (or `supabase db push`), in numeric order. All paths: `supabase/migrations/`.

| # | File | Purpose |
|---|------|---------|
| 001 | `001_leads_bookings.sql` | Core `leads` and `bookings` tables plus shared `updated_at` trigger. |
| 002 | `002_chat_sessions_uploads_vehicle_memory.sql` | `chat_sessions`, `uploads`, and `vehicle_memory` (JSONB documents). |
| 003 | `003_slot_overrides.sql` | Per-day booking slot overrides (`slot_overrides`) for `/api/booking-slots`. |
| 004 | `004_workshop_jobs.sql` | Workshop v1: `jobs`, `job_notes`, `job_status_events`. |
| 005 | `005_admin_users.sql` | Multi-user admin logins with roles (`admin_users`). |
| 006 | `006_job_centric_schema.sql` | `vehicles`, `customers`, `job_timeline_events`, `attachments`, `invoices`, `ai_context_snapshots`; FK columns on jobs/bookings. |
| 007 | `007_job_centric_backfill.sql` | Backfill vehicles/customers from bookings/jobs; link FK columns; seed job timeline. |
| 008 | — | *Not in repo — no `008_*.sql` file.* |
| 009 | `009_booking_statuses.sql` | Extends `bookings.status` check to include `rescheduled` and `rejected`. |
| 010 | `010_vehicle_timeline_events.sql` | Append-only `vehicle_timeline_events` (MOT + workshop lifecycle on vehicle). |
| 013 | `013_vehicle_mot_history.sql` | Cached DVSA MOT History API payloads (one row per registration, 24h refresh). |

After all applied: **Table Editor** should show leads/bookings through workshop tables above; confirm no SQL errors on re-run (migrations are idempotent).

---

## 2. Environment variables

Set on **Vercel → Production** (and mirror in local `.env.local` for pre-flight). Never commit secrets. Do not expose service role or AnythingLLM keys as `NEXT_PUBLIC_*`.

### Public site

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_CONTACT_MOBILE` | Optional | UK mobile shown on marketing site and WhatsApp `wa.me` link (default in code if unset). |

### Admin auth

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_USERNAME` | Yes | Env-fallback login name (DB users in `admin_users` are tried first). |
| `ADMIN_PASSWORD` | Dev only | Plain password for local smoke — **omit on Vercel**. |
| `ADMIN_PASSWORD_HASH` | Production | PBKDF2 hash from `node scripts/generate-admin-password-hash.mjs "…"`. |
| `ADMIN_SESSION_SECRET` | Yes | HMAC key for `admin_session` cookie (32+ random chars). |
| `ADMIN_ROLE` | Optional | Role for env-fallback login: `owner` / `admin` / `mechanic` (default `owner`). |

See [ADMIN_AUTH.md](./ADMIN_AUTH.md) for generators and troubleshooting.

### Supabase

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes (when using DB) | Project URL `https://<ref>.supabase.co` (no `/rest/v1`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; bypasses RLS for app writes. |
| `STORAGE_BACKEND` | Production | Set to `supabase` (unset / `mock` = in-memory dev store). |

### DVLA

| Variable | Required | Purpose |
|----------|----------|---------|
| `DVLA_API_KEY` | Yes (plate lookup) | UK DVLA Vehicle Enquiry API (`x-api-key`). Without it, vehicle lookup returns 503. |

### MOT history

| Variable | Required | Purpose |
|----------|----------|---------|
| `MOT_HISTORY_API_KEY` | Recommended | DVSA MOT History API key. Server-side only — never expose to the browser. |
| `MOT_HISTORY_CLIENT_ID` | For new API | OAuth client ID from DVSA registration email. |
| `MOT_HISTORY_CLIENT_SECRET` | For new API | OAuth client secret from DVSA. |
| `MOT_HISTORY_TOKEN_URL` | For new API | Full Microsoft OAuth token URL from DVSA (includes tenant ID). |
| `MOT_HISTORY_SCOPE` | Optional | OAuth scope (default `https://tapi.dvsa.gov.uk/.default`). |

When OAuth credentials are set, the app uses the **new production API** at `history.mot.api.gov.uk`. With only `MOT_HISTORY_API_KEY`, it falls back to the legacy trade endpoint.

Apply migration **013** (`vehicle_mot_history`) so MOT responses are cached in Supabase and DVSA is not called on every lookup.

### AnythingLLM (workshop copilot RAG)

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANYTHINGLLM_ENABLED` | For RAG | Set `true` to enable retrieval path. |
| `ANYTHINGLLM_BASE_URL` | For RAG | HTTPS endpoint (e.g. VPS); Vercel cannot reach `localhost`. |
| `ANYTHINGLLM_API_KEY` | For RAG | API key from AnythingLLM UI (server-only). |
| `ANYTHINGLLM_WORKSPACE_SLUG` | Optional | Workspace slug (default `dan-auto-workshop`). |

Copilot answers still use **Gemini** via `GEMINI_API_KEY` on the Next.js side. See [ANYTHINGLLM_SETUP.md](./ANYTHINGLLM_SETUP.md).

### Supabase Storage bucket

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_STORAGE_BUCKET` | Optional | Bucket name for workshop file bytes (default `workshop-uploads`). |

---

## 3. Private bucket `workshop-uploads`

Workshop attachments store **metadata in Postgres** (`uploads` / `attachments`) and **bytes in Supabase Storage** under paths `workshop/{id}/{file}` (`lib/supabase/workshop-storage.ts`). The bucket must be **private**; the app uses the service role to upload and returns short-lived signed URLs.

1. Supabase Dashboard → **Storage** → **New bucket**.
2. Name: `workshop-uploads` (or your chosen name — set `SUPABASE_STORAGE_BUCKET` to match).
3. **Public bucket:** off (private).
4. No anon/authenticated upload policies required — only the **service role** (server) writes and signs reads.
5. Set `SUPABASE_STORAGE_BUCKET=workshop-uploads` on Vercel if you used a non-default name.
6. Requires `STORAGE_BACKEND=supabase` plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Vercel deploy order

1. **Supabase:** Apply migrations `001` → `006`, then `009` → `010` (see §1).
2. **Supabase Storage:** Create private bucket (§3).
3. **Secrets locally:** Copy production-bound values into `.env.local`; run `node scripts/verify-setup.mjs`.
4. **Pre-deploy smoke (local):** `npm run dev` → complete [ADMIN_LOGIN_SMOKE.md](./ADMIN_LOGIN_SMOKE.md) and §5 below against local with `STORAGE_BACKEND=supabase`.
5. **Vercel env:** Add all §2 groups for **Production**; use `ADMIN_PASSWORD_HASH`, not plain `ADMIN_PASSWORD`.
6. **Deploy:** Push to connected branch (or `vercel --prod`). Wait for build success.
7. **Post-deploy health (production URLs):**
   - `GET /api/health/supabase` → `storageBackend: "supabase"`, `connected: true`, `schemaReady: true`
   - `GET /api/health/dvla` → DVLA (+ MOT key if set) configured
   - `GET /api/health/anythingllm` → if RAG enabled
   - Or open `/admin/health` while logged in.
8. **Production smoke:** §5 on the live domain.

---

## 5. Ten-minute production smoke

Use production URL and a real admin account (DB user from `/admin/users` or env fallback). ~10 minutes.

| Step | Route / action | Pass criteria |
|------|----------------|---------------|
| 1. Login | `/admin/login` | Redirect to `/admin`; `admin_session` httpOnly cookie; `GET /api/admin/me` → `{ ok: true }`. |
| 2. Today | `/admin/today` | Floor queue loads; MOT / scheduled items visible without errors. |
| 3. Jobs cockpit | `/admin/jobs` | Open a job; status, timeline, and context panels render. |
| 4. Upload attachment | Job detail → attachments | File uploads; thumbnail/preview loads (signed URL from private bucket). |
| 5. Invoice draft | Same job → invoice panel | Create or edit draft; persists after refresh. |
| 6. ⌘K search | `Cmd+K` / `Ctrl+K` anywhere in admin shell | Palette opens; search reg/customer; jump to job or vehicle. |
| 7. Vehicle page | `/admin/vehicle/{REG}` (from ⌘K or job) | Vehicle memory + workshop timeline load for that registration. |

If any step fails, use `/admin/health` and the linked runbooks above before handing keys to the floor.

---

## Quick links

| Doc | Use when |
|-----|----------|
| [ADMIN_LOGIN_SMOKE.md](./ADMIN_LOGIN_SMOKE.md) | Cookie, 401/500 login, env password vs hash |
| [ADMIN_AUTH.md](./ADMIN_AUTH.md) | Roles, `admin_users`, middleware, API auth |
| [SUPABASE_GO_LIVE.md](./SUPABASE_GO_LIVE.md) | Leads/bookings persistence, `STORAGE_BACKEND`, health curl |
