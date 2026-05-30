# DECISIONS LOG — Dan Auto Centre

Short, dated entries. One decision per block. New entries go at the top.

---

## 2026-05-28 — Workshop uploads in Supabase Storage (not base64 in DB)

- **Why:** Admin workshop attachments were stored as base64 data URLs in `uploads.preview_url`, which bloats Postgres and breaks down for PDFs/video at scale.
- **Impact:** `lib/supabase/workshop-storage.ts` uploads bytes to bucket `SUPABASE_STORAGE_BUCKET` (default `workshop-uploads`) under paths `workshop/{id}/{file}`; `upload.service.storeWorkshopFile` persists the path and returns a 1h signed URL. `GET /api/admin/uploads/[id]` and batch refresh signed URLs when `preview_url` is a storage path. Mock mode (`STORAGE_BACKEND` unset) still uses base64 data URLs.

---

## 2026-05-28 — Vehicle-level timeline stream for MOT + job lifecycle

- **Why:** Vehicle history needed a single chronological stream across MOT tests and workshop lifecycle transitions, instead of only per-job events.
- **Impact:**
  - `supabase/migrations/010_vehicle_timeline_events.sql` adds `vehicle_timeline_events` with event typing (`mot_test`, `job_status_change`, `system`), source dedupe (`source_ref` unique where present), and backfill from historical `job_status_events`.
  - New repository/service pair: `lib/repositories/vehicle-timeline.repository.ts`, `lib/repositories/supabase/vehicle-timeline.repository.ts`, and `lib/services/vehicle-timeline.service.ts`.
  - `lib/vehicle-lookup-server.ts` now ingests MOT history tests into vehicle timeline via idempotent source refs during DVLA/MOT lookups.
  - `lib/services/job.service.ts` now mirrors status transitions into vehicle timeline using vehicle-linked events.
  - `lib/services/vehicle-history.service.ts` + `app/admin/vehicle/[reg]/page.tsx` now include and render vehicle timeline events.

---

## 2026-05-28 — Job-centric normalized data model (migration 006)

- **Why:** Workshop execution data needed canonical vehicle/customer identity centered on jobs, plus structured timeline/attachments/invoice-draft/AI-context entities without mixing customer and workshop AI domains.
- **Impact:**
  - `supabase/migrations/006_job_centric_schema.sql` + `007_job_centric_backfill.sql` add `vehicles`, `customers`, `job_timeline_events`, `attachments`, `invoices` (draft-only), `ai_context_snapshots`, and link `jobs`/`bookings` to `vehicle_id` + `customer_id` with idempotent backfill and compatibility-safe constraints.
  - `lib/types/job.ts` extends job identity with linked `vehicle`/`customer` refs while preserving `registration` / `customerName` / `customerPhone` convenience fields for existing API consumers.
  - `lib/types/workshop-data.ts` introduces normalized TS contracts for new entities and creation/update payloads.
  - Added repository + thin service pairs for vehicles, customers, timeline events, attachments, invoices, and AI context snapshots in `lib/repositories/*`, `lib/repositories/supabase/*`, and `lib/services/*`.
  - `project-brain/DATA_MODEL.md` documents relationships, identity rules, and status enums.

---

## 2026-05-28 — Job service API expanded for timeline, check-in, idempotent booking linkage

- **Why:** Workshop flow needed richer job APIs (filters, attachments, timeline audit) and an explicit check-in path while preserving booking-confirm behavior without duplicate jobs.
- **Impact:**
  - `GET /api/jobs` now supports `status`, `date`, `assigned_to`, and `registration` filters.
  - `GET /api/jobs/[id]` now returns `job`, `notes`, `timeline`, and `attachments`; `PATCH /api/jobs/[id]` continues status/notes updates and returns refreshed timeline + attachments.
  - New `POST /api/jobs/check-in` upgrades a booking-linked job to `checked_in` (when needed) and records mileage/damage/photos as audited timeline/note/attachment data.
  - `PATCH /api/bookings` now exists in the route and uses `jobService.ensureBookingJob()` so booking confirmation remains idempotent (`booking_id`-based reuse, no duplicate jobs).
  - `lib/services/job.service.ts` now orchestrates timeline auditing for write operations (`system`, `status_change`, `note`, `attachment_added`) with no customer auto-messaging behavior added.

---

## 2026-05-28 — Workshop OS v1 backend

- **Why:** Workshop needed a job-card system to track vehicles from arrival through collection, decoupled from the booking request model.
- **Impact:**
  - `supabase/migrations/004_workshop_jobs.sql` — `jobs`, `job_notes`, `job_status_events` tables with full RLS and triggers.
  - `lib/types/job.ts` — `Job`, `JobNote`, `JobStatusEvent`, `JOB_STATUSES`, `JOB_STATUS_LABELS`, input/filter types.
  - `lib/repositories/supabase/jobs.repository.ts` + `lib/repositories/jobs.repository.ts` — Supabase implementation and mock facade with `STORAGE_BACKEND` switch; `listByRegistration` supports vehicle-history view.
  - `lib/services/job.service.ts` — thin service; `update()` records status-transition audit events automatically.
  - `GET/POST /api/jobs` + `GET/PATCH /api/jobs/[id]` — admin-session-guarded endpoints; PATCH supports inline note creation.
  - Booking → job linkage is optional (`bookingId` on `CreateJobInput`) and admin-triggered via `POST /api/jobs`; documented in service JSDoc.
  - `lib/validation/schemas.ts` — `copilotAskSchema` extended with `jobId` + `jobSnapshot` to match pre-built admin copilot UI.

---

## 2026-05-27 — Admin lists hardened UX + authenticated booking status updates

- **Why:** `/admin/leads` and `/admin/bookings` needed clearer loading/error/empty UX, and bookings needed a minimal status-management path without adding new state libraries or changing auth boundaries.
- **Impact:**
  - `app/admin/leads/page.tsx` now uses robust loading/error/empty-state cards with premium styling and always requests via `adminFetch` with cookie credentials.
  - `app/admin/bookings/page.tsx` now has matching loading/error/empty-state UX plus a per-booking status selector that updates state through an authenticated API call.
  - `app/api/bookings/route.ts` gained `PATCH` (admin-session required) that validates `{ id, status }`, calls `bookingService.updateStatus()`, and returns the updated booking.
  - `lib/validation/schemas.ts` gained `updateBookingStatusSchema` for route-level input validation.
  - Auth is unchanged and still server-enforced: `GET /api/leads` and `GET /api/bookings` remain session-protected.

---

## 2026-05-27 — Production admin auth (httpOnly cookie + middleware)

- **Why:** Admin used cosmetic sessionStorage; GET leads/bookings were public. Needed server-enforced sessions without NextAuth/Clerk.
- **Impact:**
  - `middleware.ts` guards `/admin/*` (except login) and GET `/api/leads` + `/api/bookings`; POST stays public.
  - `POST /api/admin/login` + `POST /api/admin/logout` + `GET /api/admin/me`; signed cookie via `lib/admin/session.ts` (Edge-safe HMAC).
  - Credentials: `ADMIN_USERNAME` + `ADMIN_PASSWORD` (dev) or `ADMIN_PASSWORD_HASH` (prod); `ADMIN_SESSION_SECRET` required.
  - `lib/enterprise/auth.ts` — display-only sessionStorage; no hardcoded accounts.
  - Admin UI uses `adminFetch` (`credentials: "include"`). See `docs/ADMIN_AUTH.md`.

---

## 2026-05-27 — Centralized booking notification flow

- **Why:** The direct booking form (`POST /api/bookings`) had no workshop notification. Every booking was silently persisted. The AI intake path had its own richer email but no customer confirmation and was not centralized.
- **Impact:**
  - `lib/email/templates/booking-alert.ts` — two new templates: **workshop alert** (subject, text, HTML for direct bookings) and **customer confirmation** (subject, text, HTML). Follows the existing `escapeHtml`/`sanitizePlainText` pattern.
  - `lib/email/send-booking-alert.ts` — `sendWorkshopBookingAlert(booking)` + `sendCustomerBookingConfirmation(booking)`. Both swallow errors with structured `console.error` logging — a transient email failure must never roll back an already-persisted booking. `sendCustomerBookingConfirmation` is a no-op when `customerEmail` is absent.
  - `lib/services/booking.service.ts` — `create()` now accepts an optional `BookingCreateOptions` parameter (`suppressWorkshopEmail?: boolean`). After persisting, it runs both notifications concurrently with `Promise.all`. Default (no opts): workshop alert + customer confirmation both fire.
  - `lib/services/booking-intake.service.ts` — passes `{ suppressWorkshopEmail: true }` to prevent double workshop email; its existing `sendBookingIntakeEmail()` (richer, includes transcript) is unchanged. Customer confirmation still fires via `bookingService.create()` if the customer email is on the booking record.
  - **Notification matrix after this change:**
    | Path | Workshop notification | Customer confirmation |
    |---|---|---|
    | Direct form (`POST /api/bookings`) | ✓ Workshop alert (new) | ✓ If email present (new) |
    | AI intake (`/api/booking-intake`) | ✓ Richer intake email (unchanged) | ✓ If email present (new) |
  - `lib/email/index.ts` — exports updated.
  - No route changes, no frontend changes, no `CreateBookingInput` type changes, no repository changes.
  - **Future extension points:** `BookingCreateOptions` can accept `workshopNote` to inject extra context into the workshop email. The `sendWorkshopBookingAlert` recipient reads `getIntakeEmailTo()` (env var `BOOKING_EMAIL_TO`).

---

## 2026-05-27 — Admin route protection (middleware + httpOnly cookie session)

- **Why:** The existing admin "auth" was entirely client-side: `sessionStorage` + hardcoded plaintext credentials in `lib/enterprise/auth.ts`, visible in the JS bundle and trivially bypassed by direct navigation. ROADMAP priority #2.
- **Impact:**
  - `middleware.ts` (project root) — Next.js Edge middleware guards all `/admin/*` routes. Allows `/admin/login` through; all other paths require a valid signed session cookie. Redirects to `/admin/login?from=<path>` on failure.
  - `lib/admin/session.ts` — stateless session token: `base64url(JSON payload) + "." + base64url(HMAC-SHA256 sig)`. Uses `crypto.subtle` only — Edge-safe. 8-hour TTL. `ADMIN_SESSION_SECRET` env var required.
  - `lib/admin/credentials.ts` — PBKDF2-SHA256 (100k iterations) password verification via Node.js built-in `crypto`. No extra dependencies. `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` env vars required.
  - `app/api/admin/login/route.ts` — POST handler (`runtime: nodejs`). Verifies credentials, sets httpOnly + Secure + SameSite=lax session cookie. Returns minimal user object for client-side display. 400ms constant-delay on failure (timing attack mitigation).
  - `app/api/admin/logout/route.ts` — POST handler. Clears the session cookie (`maxAge: 0`).
  - `app/admin/login/page.tsx` — submit handler changed from `authenticate()` (client-side) to `fetch('/api/admin/login', ...)`. UI unchanged.
  - `components/enterprise/AdminDashboard.tsx` — sign-out button now calls `fetch('/api/admin/logout', ...)` before redirect. UI unchanged.
  - `lib/enterprise/auth.ts` — NOT modified. `loadSession()`/`saveSession()`/`clearSession()` kept for client-side display (name, role). `authenticate()` is now dead code; will be removed when Supabase Auth lands.
  - New env vars required: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`. Fallback: if env vars absent the login API returns 500 (safe fail — admin is inaccessible, not unguarded).
  - No Supabase Auth, no third-party auth library, no role system, no user management.

---

## 2026-05-27 — Supabase migration Phase 2: leads + bookings persistence

- **Why:** First real tables in Supabase. `leads` and `bookings` chosen because they are the highest-value data (customer contacts, booking requests) and have the cleanest repository isolation — no dependency on chat sessions or uploads.
- **Impact:**
  - `supabase/migrations/001_leads_bookings.sql` — idempotent DDL for `leads` and `bookings` tables. Both have `TIMESTAMPTZ` `created_at`/`updated_at` (DB trigger keeps `updated_at` accurate), `CHECK` constraints mirroring TypeScript union types, partial index on `leads.registration`, RLS enabled (service role bypasses it; anon blocked by default). Run once via Supabase SQL editor or `supabase db push`.
  - `lib/repositories/backend.ts` — reads `STORAGE_BACKEND` env var. Default `"mock"`. Set `STORAGE_BACKEND=supabase` to activate real DB. Safe to omit in dev.
  - `lib/repositories/supabase/leads.repository.ts` + `supabase/bookings.repository.ts` — Supabase implementations with snake_case ↔ camelCase mappers. Identical method signatures to mock repos.
  - `lib/repositories/leads.repository.ts` + `bookings.repository.ts` — methods made `async` (necessary for DB calls); backend switch added. Mock path is unchanged code, now wrapped in `Promise`. Default (`STORAGE_BACKEND` unset or `"mock"`) behaviour is identical to before.
  - Async cascade: `lead.service.ts`, `booking.service.ts`, `ai-intake.service.ts`, `chat.service.ts`, `booking-intake.service.ts`, `app/api/leads/route.ts`, `app/api/bookings/route.ts` — each updated with `await` at the call site only. No business logic changed.
  - Mock store (`lib/repositories/mock-store.ts`) is **not modified**. It remains the default backend.
  - `chat_sessions`, `uploads`, `vehicle_memory` are NOT migrated in this phase.
  - New env vars required: `STORAGE_BACKEND=supabase` (opt-in), plus `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Phase 1.

---

## 2026-05-27 — Supabase connectivity layer (Phase 1 foundation)

- **Why:** Starting the mock-store → Supabase migration incrementally. The goal for this phase is to validate and centralise connectivity before any repository is changed, so the migration boundary stays clean.
- **Impact:**
  - `lib/supabase/config.ts` validates `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` at call time; throws a clear error if either is missing. Server-only — no `NEXT_PUBLIC_` prefix.
  - `lib/supabase/server.ts` exports `getSupabaseServerClient()` — the single place in the codebase that creates a service-role Supabase client. Lazy singleton on `globalThis` (survives hot-reloads). Future repositories import from here; one file to swap if the client setup ever needs to change.
  - `app/api/health/supabase/route.ts` (`GET /api/health/supabase`) probes Supabase connectivity without depending on schema: `connected + schemaReady: true` when tables exist, `connected + schemaReady: false` when Supabase is reachable but schema not yet migrated (expected in Phase 1), 503 when unreachable.
  - No repository, service, route, or frontend file was modified. Mock store is unchanged. No new npm packages (supabase-js was already installed).
  - Required env vars to add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Vercel dashboard + `.env.local`).

Format:

- **Date** — what was decided
- **Why** — one or two sentences
- **Impact** — what it locks in or rules out

---

## 2026-05-27 — Knowledge Brain pilot: BMW + four golden queries

- **Why:** Prove retrieval with one marque and explicit acceptance queries before scaling ingest or adding agents.
- **Impact:** BMW Tier 1 docs first; golden queries for diagnostics, procedures, customer explanation, MOT; VPS+HTTPS for AnythingLLM; pass criteria = grounded `sources[]`, not fluent hallucination. Documented in `docs/ANYTHINGLLM_SETUP.md`.

## 2026-05-27 — Workshop AI roadmap: Knowledge Brain before multi-agent

- **Why:** Real mechanic value needs RAG over workshop manuals (MOT, OEM procedures), not more chat UI or autonomous agents. Customer advisor and workshop copilot must stay separate contracts.
- **Impact:**
  - Phases 0–6 documented in `project-brain/ROADMAP.md` (Phase 1 = AnythingLLM retrieval + doc tiers).
  - Setup guide: `docs/ANYTHINGLLM_SETUP.md`.
  - No CrewAI/LangChain until retrieval, memory, and job-card workflows are stable.

## 2026-05-27 — Workshop copilot foundation (AnythingLLM boundary, Gemini-backed)

- **Why:** Prepare an internal workshop AI copilot (manuals, diagnostics, customer explanations) without replacing the customer service advisor or introducing autonomous agents yet.
- **Impact:**
  - `features/copilot/` — prompts, types, tools placeholder, `CopilotPanel`, client.
  - `POST /api/copilot` (admin-only) → `copilot.service` → `lib/copilot/providers` (`askCopilot`, `retrieveWorkshopKnowledge`).
  - Gemini plain-text path in `gemini-copilot.provider.ts` — separate from `gemini.service.ts` JSON intake contract.
  - AnythingLLM: config placeholders + retrieval stub only; enable via `ANYTHINGLLM_*` env when Docker service is ready.
  - Mounted on `/admin` as floating panel. Customer `POST /api/chat` unchanged.

## 2026-05-27 — Server admin auth (middleware + httpOnly session)

- **Why:** Admin listed real customer PII while `GET /api/leads` and `GET /api/bookings` were public and credentials lived in source.
- **Impact:**
  - `middleware.ts` guards `/admin/*` (except login) and `GET` list APIs.
  - `POST /api/admin/login` sets signed `dan_admin_session` cookie; env `ADMIN_USERNAME` + `ADMIN_PASSWORD` (dev) or `ADMIN_PASSWORD_HASH` (prod) + `ADMIN_SESSION_SECRET`.
  - `lib/enterprise/auth.ts` is display-only (`sessionStorage` for name/role). See `docs/ADMIN_AUTH.md`.

## 2026-05-27 — Workshop terminal intake UI (static intro, quick starts, media)

- **Why:** The advisor should feel like workshop infrastructure — not a chatbot introducing itself. Customers need fast entry (quick-start topics), contextual tap replies from Gemini, and optional photo/video/audio for staff — without AI pretending to diagnose from media alone.
- **Impact:**
  - `introMode: "workshop"` skips Gemini init; `AdvisorWorkshopIntro` + `AdvisorQuickStartGrid` show static copy from `lib/config/advisor-copy.ts`.
  - Dynamic `suggestionChips` still come from Gemini each turn (max 4, cleared on send). Semantic lines include `INFO:` plus existing `QUESTION`/`WARNING`/`ESTIMATE`/`NEXT STEP:`.
  - `AdvisorMediaBar` + `useMediaUpload` on hero chat, floating widget, and booking intake; audio MIME types allowed. Uploads attach to workshop intake submit, not deep video analysis.

## 2026-05-27 — Service advisor behaviour, routing, and semantic message UI

- **Why:** The AI must act as a 24/7 digital service advisor (not primary booking), with context-specific depth, UK indicative pricing language, safety guardrails, and a premium calm tone. Hero chat was still mocked locally.
- **Impact:**
  - `ai/prompts/systemPrompt.ts` + `lib/services/advisor-routing-prompt.ts` + `lib/config/advisor-copy.ts` define positioning, surfaces (`booking_flow`, `hero_ai_assistant`, `mot_help`, `warning_light_help`), hero opening guide, one-question-at-a-time flow, and workshop summaries.
  - `AdvisorRouteContext` flows client → `/api/chat` → session → Gemini (`formatAdvisorRouteForPrompt`). `AssistantContext.openAssistant(options)` resets launch when routing changes.
  - `HeroAIChatModal` uses real `useAdvisorChat` + Gemini; floating widget and booking intake pass matching routes.
  - `parseAdvisorMessageContent` + `ChatMessageBubble` highlight `MAIN QUESTION:`, `WARNING:`, `ESTIMATE:`, `NEXT STEP:` lines with gold-accent styles.

## 2026-05-27 — Hero onboarding modal + contextual advisor routing

- **Why:** Instant multi-window reveal after plate scan felt cluttered and gave no clear next step. The advisor also behaved the same whether the customer wanted a fast booking or diagnostic help.
- **Impact:**
  - After DVLA lookup, a single centered `HeroOnboardingModal` presents four paths (quick booking, service advisor, vehicle insights, create account). Insight categories open the **existing** `HeroVehicleReportSuite` floating windows on demand — no rebuild of report cards.
  - `AdvisorRouteContext` (`entry_point`, `intent`, `vehicle_data`) flows: hero/page → `AssistantContext` → chat API → session → Gemini `ADVISOR_ROUTE` block in `lib/services/advisor-routing-prompt.ts`. Extend intents there; do not fork chat UIs.
  - Hero inline CTAs replaced by “View your vehicle options” link when the onboarding modal is dismissed.

## 2026-05-27 — Smart booking date presets + remembered registration

- **Why:** Customers were typing today's date and re-typing their plate every visit. Both are friction the form can remove. Date presets ("Today / Tomorrow / Next week / Next month") cover ~90% of real bookings and the plate is stable per customer.
- **Impact:**
  - New `lib/date.ts` exports `localIsoDate(days, months)` with end-of-month clamping. Used by `BookingSlotStep` for the chip values and the `min` attribute, and by `BookingIntakeFlow` to default the date input to today (local timezone — no UTC drift).
  - New `lib/registration-memory.ts` owns the persistence boundary: `read/writeRememberedRegistration()` helpers + `useRememberedRegistration()` hook (SSR-safe, hydrates in `useEffect`, exposes a `fromMemory` flag). Storage key: `dan-auto:remembered-registration`.
  - `app/page.tsx` swapped `useState("")` for the hook; `bookReg` is now the single owner of the customer's plate and any update (hero lookup or booking-form typing) round-trips through it. `BookingIntakeFlow` got `onRegistrationChange` + `registrationFromMemory` props for that round-trip and the subtle "Registration remembered" hint (auto-hides on focus / first edit).
  - Active chip state is **derived** from `date === preset.value` — no extra state, manual date picks deactivate chips automatically.

## 2026-05-27 — Booking UX: AI demoted from primary path, two CTAs everywhere

- **Why:** Client feedback says the AI advisor felt like the only way to book. Older / hurried users want a traditional fast form. Hiding the floating advisor FAB plus surfacing a direct "Send booking request" submit makes the default path obvious; the AI is reachable via deliberate "Talk to service advisor" / "Need help first?" buttons that preload the booking context.
- **Impact:**
  - Hero shows two CTAs after a successful plate scan: Quick booking → `#booking`, Talk to service advisor → `openAssistant({ registrationHint })`. Floating advisor FAB removed.
  - `BookingIntakeFlow` is now a plain form posting through the existing `createBooking()` client (no API change). The legacy AI-intake modal (`BookingIntakeModal`) and `/api/booking-intake` are kept intact but off the primary path.
  - `AssistantContext.openAssistant` accepts an optional `{ bookingContext, registrationHint }` payload and stores it on the provider so the chat session bootstraps with that context.
  - Time-slot buttons consume `getMockSlotAvailability(date)` (deterministic mock) and render disabled state. No admin scheduling yet.

## 2026-05-27 — Single source of truth for services (`siteServices`)

- **Why:** The homepage cards list, the booking dropdown, and the hero quick-strip were drifting (different labels, different counts). Required hand-fixing every time a service changed.
- **Impact:** `lib/config/services.ts` now exports a canonical `siteServices` array (icon, title, description, from, duration, optional tag). `bookingServiceOptions` is derived from it. `HERO_SERVICE_CARDS.bookLabel` aligned to those titles. `app/page.tsx` no longer carries its own `SERVICES`/`SERVICE_OPTIONS`. Adding a service is now a one-file edit.

## 2026-05-27 — Adopt a minimal "project brain" (PROJECT_BRAIN, ROADMAP, DECISIONS_LOG)

- **Why:** Prevent future Cursor / AI sessions from drifting the architecture or rewriting working systems. Solo-dev workflow, so anything heavier is overkill.
- **Impact:** All future significant changes should reference these three files. No additional docs system will be added.

## 2026-05-27 — Defer database migration but keep repositories stable

- **Why:** Mock store works for current demo traffic. Supabase is the planned target, but switching mid-flight while AI flow is still being tuned would compound risk.
- **Impact:** Repository interfaces are the migration boundary. Services and routes must not depend on mock-store internals so the swap is mechanical when it happens.

## 2026-05-27 — Lock the AI contract: prompt + structured intake schema are stable

- **Why:** Gemini extraction quality depends on the JSON instruction in `gemini.service.ts` and the `StructuredIntake` type. Small tweaks have silently broken downstream mapping in the past.
- **Impact:** Changes to the prompt or `lib/types/structured-intake.ts` require a new entry in this log explaining the trigger and the expected effect.

---

## Standing decisions (carried from project setup)

These are not dated because they predate the log. Treat them as committed.

### Gemini chosen for the AI advisor

- **Why:** Best price-to-quality ratio for short structured replies, native JSON output mode (`responseMimeType: "application/json"`), low latency on `gemini-2.5-flash`, generous free tier for early traffic. Single-vendor simplicity vs. an OpenAI/Anthropic combo.
- **Impact:** All AI work assumes Gemini SDK conventions. Switching providers later is possible but would mean rewriting `gemini.service.ts` and re-tuning the JSON instruction.

### Schema-based AI extraction (forced JSON every turn)

- **Why:** Free-text replies are unreliable to parse. Forcing the model to fill `StructuredIntake` on every turn means the conversation and the data extraction happen together, downstream code only deals with typed values, and partial intakes are still useful.
- **Impact:** The schema is the contract. AI extraction must remain schema-based. Do not reintroduce regex/text parsing of replies.

### Rule-based advisor kept as offline fallback

- **Why:** Local development without an API key still needs to work. Production also needs a graceful path if Gemini is down, deprecated, or rate-limited.
- **Impact:** `service-advisor.engine.ts` stays. It must keep matching the same `AdvisorTurnResult` shape Gemini returns. It is a safety net, not a feature — do not grow it.

### Layered architecture: route → service → repository

- **Why:** Keeps route handlers tiny, centralises logic in services, isolates data access. Makes the eventual Supabase swap a one-folder change.
- **Impact:** No business logic in `app/api/`. No direct mock-store access outside `lib/repositories/`. Frontend talks to the API only through `lib/api/client.ts`.

### Modular APIs over a single mega-endpoint

- **Why:** Each capability (leads, bookings, chat, uploads, vehicle lookup, AI intake) has a clear input/output and lifecycle. Easier to add validation, rate limiting, and auth per route.
- **Impact:** New capabilities get their own route + service + repository, not a switch statement on a generic endpoint.

### Resend with a `log` provider fallback

- **Why:** Avoids needing a real email account in dev. Same code path in production by setting `EMAIL_PROVIDER=resend`.
- **Impact:** `sendTransactionalEmail` stays the only outbound email surface. The `log` provider is dev-only and must never be the production default.

### Lightweight architecture preferred — no enterprise tooling

- **Why:** Solo / small team, Vercel-first, prototype maturing into product. Adding Redux, React Query, tRPC, monorepos, ORMs, or design systems now would slow iteration without solving a real problem.
- **Impact:** New tooling needs an entry here proving an actual pain point. Until then, the stack stays Next.js + Tailwind + Framer Motion + Lucide + `@google/generative-ai` + Resend.

### Overengineering is explicitly avoided

- **Why:** Every added abstraction is also a thing future sessions can break or rewrite. Lean code is faster to change.
- **Impact:** Prefer editing existing files. Reuse helpers (`stripPlate`, `formatPlate`, `jsonOk`, `BUSINESS`, `BRAND`). Reject "clever" rewrites in code review and AI prompts.

### Tailwind v4 + CSS variable theme tokens

- **Why:** Matches the new Tailwind release, lets the gold/cyan dark theme live in one place (`:root` in `globals.css`) and stay consistent across components.
- **Impact:** New colours go in `:root` and `@theme inline`, not inline in components. No second CSS framework.

### Brand and business strings centralised in `lib/config/`

- **Why:** Phone, hours, address, advisor intro, WhatsApp number are referenced in dozens of places. Hardcoding would guarantee inconsistency.
- **Impact:** Components import from `lib/config`. Prompts read from `BRAND` and `garageContext`. Editing the garage's details is a one-folder change.

### Features folder pattern for new feature work

- **Why:** Co-locating components, hooks, and READMEs per feature is easier to reason about than a flat `components/` tree.
- **Impact:** New features go in `features/<name>/`. Shared primitives stay in `components/`. Old `components/landing/`* will be migrated, not extended.

### Zod for public POST route validation

- **Why:** Hand-written `if (!body.x?.trim())` guards were scattered, inconsistent (missing length caps, no email format check), and easy to regress. Zod `safeParse` gives field-level error messages in one place.
- **Scope:** `POST /api/leads`, `POST /api/bookings`, `POST /api/ai-intake`. Chat and uploads do not deserialize structured JSON entities so Zod adds no value there.
- **AI contract untouched:** `snapshot` (the AI session fallback) passes through as `z.unknown()`. `lib/types/structured-intake.ts` is not referenced.
- **Impact:** `lib/validation/schemas.ts` owns all three schemas + `parseBody()`. Routes stay thin. Zod v4 installed as an explicit `dependencies` entry (was already a transitive dep).

### In-memory sliding-window rate limiter

- **Why:** Public POSTs (`/api/chat`, `/api/leads`, `/api/uploads`, `/api/ai-intake`) were completely unprotected — trivial to spam or trigger costly Gemini/Resend calls.
- **Implementation:** `lib/rate-limit/index.ts` — pure in-memory `Map` on `globalThis`, no external service. Vercel cold-starts reset the counter, which is acceptable at current traffic volumes.
- **Upgrade path documented:** When distributed limiting is needed, replace `checkRateLimit()` body with `@upstash/ratelimit` + `@upstash/redis` adapter. Route code is unchanged (same function signature). Env vars required: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- **Limits:** chat 30/min · leads 10/min · uploads 15/min · ai-intake 5/min (all per IP, 60 s window).

### Bookings route destructuring bug fix

- **What:** `app/api/bookings/route.ts` used `const { booking } = await bookingService.create(...)` but `bookingService.create()` returns `Promise<Booking>` directly. The destructured `booking` was always `undefined`, so the 201 response body was `{ booking: undefined }`.
- **Fix:** Changed to `const booking = await bookingService.create(...)`. Caught while touching the file for Zod migration.

