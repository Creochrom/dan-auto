# DECISIONS LOG — Dan Auto Centre

Short, dated entries. One decision per block. New entries go at the top.

Format:

- **Date** — what was decided
- **Why** — one or two sentences
- **Impact** — what it locks in or rules out

---

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


