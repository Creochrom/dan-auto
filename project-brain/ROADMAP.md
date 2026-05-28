# ROADMAP — Dan Auto Centre

Realistic, incremental direction. Not a wishlist. Update as priorities shift.

**Product goal:** a trustworthy local garage site — easy to book, easy to contact, AI helps when needed, Dan can run requests from admin.

---

## Current stage

**Scalable product + copilot socket shipped.**

Leads and bookings persist in Supabase. Admin is server-guarded. Public POSTs have Zod + rate limits. **Workshop copilot foundation** is live (`POST /api/copilot`, `CopilotPanel`, provider boundary) — Gemini-backed today, **RAG returns `[]` until AnythingLLM is connected**.

**Next big milestone:** Phase 1 — **Knowledge Brain** (real retrieval from workshop docs).  
**Parallel track:** operational Tier 1 (admin CRM, DVLA on hero, slots, privacy).

Verify: `GET /api/health/supabase` → `schemaReady: true`.

---

## Completed systems

### Customer-facing

- Public marketing homepage with hero, services, MOT section, booking CTA, reviews, contact.
- Direct booking form → `POST /api/bookings` (primary path). AI advisor opt-in via “Talk to service advisor” / “Need help first?”.
- AI service advisor (Gemini 2.5 Flash) — structured JSON intake, suggestion chips, workshop intro, media upload, route-aware depth.
- Rule-based advisor fallback (offline / no key).
- Vehicle plate lookup with caching (mock data; DVLA-ready pipeline).
- Lead capture from contact form, AI advisor, and booking flow.
- Multilingual copy packs (en, pl, ro, ru, uk) + Google Translate fallback.
- SEO basics: metadata, JSON-LD, sitemap, robots.
- WhatsApp / phone deep links across the site.
- Single source of truth for services (`siteServices` in `lib/config/services.ts`).

### Platform

- Layered architecture (route → service → repository).
- **Supabase** for `leads` + `bookings` (`STORAGE_BACKEND=supabase`, migration `001`, health route). See `docs/SUPABASE_GO_LIVE.md`.
- **Admin auth** — middleware, httpOnly cookie, env credentials, protected `GET /api/leads|bookings`. See `docs/ADMIN_AUTH.md`.
- **Zod** on `/api/leads`, `/api/bookings`, `/api/ai-intake` (`lib/validation/schemas.ts`).
- **Rate limiting** on public POSTs (`lib/rate-limit/index.ts`; Upstash upgrade path documented).
- Email via Resend + `log` fallback (`docs/EMAIL_SETUP.md`).
- `/api/vehicles` redirects to `/api/vehicle-lookup`.
- **Workshop copilot foundation** — `features/copilot/`, `POST /api/copilot` (admin-only), `lib/copilot/providers`, AnythingLLM stub. See `features/copilot/README.md`, `docs/ANYTHINGLLM_SETUP.md`.

### Secondary / evaluate later

- `BookingIntakeModal` + `/api/booking-intake` — kept off primary path; decide keep vs remove after usage data.

---

## Workshop AI — phased milestones

**Rule:** Customer advisor (`/api/chat`, JSON intake) and workshop copilot (`/api/copilot`, RAG + plain text) stay **separate**. No CrewAI / multi-agent until Phases 1–3 are boring.

| Phase | Goal | Done when |
|-------|------|-----------|
| **0 — Foundation** | Copilot socket + admin UI | ✅ Shipped |
| **1 — Knowledge Brain** | AnythingLLM retrieval useful | `retrieveWorkshopKnowledge()` returns chunks; copilot cites workshop docs; golden query passes (e.g. “N47 injector procedure”) |
| **2 — Workshop memory** | Plate/job history in context | Extend Supabase `vehicle_memory` + bookings/leads; copilot receives job context automatically |
| **3 — Job cards** | AI notes on the record | Generate/store workshop notes on booking; one-click from admin |
| **4 — Recurring patterns** | “Seen this before on this reg” | Read-only insights from history (no autonomous actions) |
| **5 — Service recommendations** | MOT/service nudges | Rules + data-driven suggestions (not full autopilot) |
| **6 — Orchestration** | Multi-step agents (e.g. CrewAI) | Only if single copilot + RAG is insufficient |

**Do not skip to Phase 6.** Without clean data, memory, retrieval, and workflows, agents become expensive chaos.

### Phase 1 — Knowledge Brain (detail)

**Goal:** Mechanic asks → answer grounded in **your** docs, not general LLM hallucination.

| Step | Action | Owner |
|------|--------|-------|
| 1 | Run AnythingLLM (Docker) | You / ops |
| 2 | Set `ANYTHINGLLM_*` on Vercel + local | Ops |
| 3 | Implement `lib/copilot/providers/anythingllm.provider.ts` | Backend |
| 4 | Ingest docs by tier (below) | You |
| 5 | Golden-query test in admin Copilot | You |

**Pilot rule:** one marque → one workflow → one golden query. **Start with BMW** (recurring faults, doc depth, profitable jobs, constant spec lookups). Add VAG/Mercedes only after BMW golden queries pass.

**Document ingest priority:**

| Tier | BMW pilot |
|------|-----------|
| **1** | UK MOT criteria, BMW N47/N57 TSBs, injector/timing procedures, torque PDFs |
| **2** | Common faults, service schedules |
| **3** | Dan Auto SOPs, pricing, customer templates |

**Golden queries (grounded = pass):**

| Mode | Query |
|------|--------|
| Diagnostics | Common N47 timing chain symptoms |
| Procedures | Injector replacement torque sequence |
| Customer explanation | Explain DPF regeneration issue simply |
| MOT | Tyre sidewall MOT fail criteria |

Pass = non-empty `sources[]` + answer cites uploaded docs — not “sounds plausible”.

**Hosting:** AnythingLLM on **VPS + HTTPS** (not localhost-only) so Vercel can call retrieval in production. See `docs/ANYTHINGLLM_SETUP.md`.

Full setup: `docs/ANYTHINGLLM_SETUP.md`.

---

## Committed — operations (Tier 1)

Workshop operations + trust data on the **public site**. Can run **in parallel** with Phase 1 Knowledge Brain (different agents).

| # | Item | Owner | Done when |
|---|------|-------|-----------|
| 1 | **Admin CRM** — status badges, filters, errors/empty states, update booking status from admin | Frontend + small API | Dan confirms/declines bookings without email-only workflow |
| 2 | **Real DVLA + MOT History** — swap mock vehicle lookup; same frontend shape; graceful fallback | Backend | Plate scan shows real make/model/MOT where API allows |
| 3 | **Real slot availability** — replace `getMockSlotAvailability()` with admin-driven capacity (minimal: open/closed/full per day) | Backend + admin UI | Customer cannot pick a slot Dan cannot honour |
| 4 | **Supabase Phase 2** — `chat_sessions`, `uploads`, `vehicle_memory` (migration `002`, repo pattern) | Backend | Chat + uploads survive restarts |
| 5 | **Booking/lead email polish** — customer “we received your request” + clean workshop summary | Backend | Every submit triggers clear confirmation to customer + Dan |
| 6 | **Privacy policy + footer links** — GDPR-adjacent PII (plate, phone, email) | Content + light frontend | `/privacy` linked from footer; hours/contact accurate |

---

## Next — professional polish (Tier 2)

After Tier 1 is stable for 2–4 weeks.

| Item | Owner | Notes |
|------|-------|-------|
| **Trust content** — workshop photos, About page, pricing hints on MOT/diagnostics | You + frontend | Biggest non-code trust win: real photos + Google reviews |
| **Google Reviews** on site (embed or curated) | Frontend | Align with Google Business Profile |
| **Dedicated service pages** — `/mot`, `/servicing`, `/diagnostics` (or anchors) | Frontend | Local SEO; reuse `lib/config` |
| **Resend domain** — verify sending domain, bounce handling | Ops + backend | `contact@danautocentre.co.uk` already set; confirm deliverability |
| **Observability** — request IDs + Sentry or Vercel error alerts | Backend | Know when booking/email/AI breaks |
| **Smoke tests** — Vitest on `intake-mapper`, booking email builders | Backend | Safe refactors around AI extraction |
| **Homepage split** — one section per PR from `app/page.tsx` → `features/marketing/` | Frontend | Maintainability |
| **Consolidate chat hooks** — document + remove duplicate of `useChatSession` / `useAdvisorChat` | Frontend | Less drift |
| **BookingIntakeModal decision** | Product | Keep focused flow vs merge into advisor |

---

## Later — only if the workshop asks (Tier 3)

Not committed. Revisit when Tier 1 + Tier 2 are done.

| Item | Why wait |
|------|----------|
| SMS confirmations (Twilio) | Email flow must be solid first |
| WhatsApp Business inbound | Volume + ops complexity |
| Customer “my bookings” portal | Needs stable CRM + auth model |
| Google Calendar sync | Needs real slot system first |
| Quote approval UI (`components/platform/`) | Only if quotes go digital |
| Workshop dashboard (charts, revenue) | Nice; not core website |
| Voice AI / damage photo AI | Cost + liability |
| Referral tracking (`/ref/[code]`) | Marketing experiment |

---

## Non-code (you — ongoing)

These make a garage site *good* without new architecture:

- **Google Business Profile** — hours, services, photos, link to site.
- **Weekly smoke test** — book on site → row in Supabase → visible in admin.
- **Real workshop photos** — bays, team, signage (6–12 images).
- **Collect / surface real reviews** — not placeholder copy.

---

## Technical debt

Only items that slow future work.

| Item | Status |
|------|--------|
| Mock store for chat / uploads / vehicle memory | Open — Phase 2 Supabase |
| `app/page.tsx` ~1200 lines | Open — incremental marketing extract |
| `service-advisor.engine.ts` (~660 lines) | Acceptable fallback — do not grow |
| No automated tests | Open — smoke tests in Tier 2 |
| Duplicate `components/landing/` vs `features/marketing/` | Open — delete after homepage split |
| `app/globals.css` size | Defer until it causes bugs |
| ~~Leads/bookings in-memory~~ | **Done** — Supabase |
| ~~Admin demo auth~~ | **Done** |
| ~~No Zod / rate limits~~ | **Done** |
| ~~Duplicate vehicle routes~~ | **Done** |

---

## Suggested timeline

```text
Now – 6 weeks     Phase 1 Knowledge Brain (AnythingLLM + Tier 1 docs)  ← highest copilot value
Parallel          Ops Tier 1: admin CRM, DVLA hero, slots, privacy
+1–2 months       Phase 2–3 workshop memory + job cards
+2–3 months       Tier 2 polish: trust, reviews, observability, tests
Later             Phases 4–6 only when 1–3 are stable
```

---

## Agent delegation quick ref

| Agent | Task |
|-------|------|
| **Backend (priority)** | Phase 1: AnythingLLM retrieval in `anythingllm.provider.ts` — see `docs/ANYTHINGLLM_SETUP.md` |
| **You / ops** | Docker AnythingLLM, ingest Tier 1 PDFs, golden-query test, GBP, photos |
| **Frontend** | Admin CRM, trust pages, homepage split |
| **Backend (parallel)** | DVLA hero, slots, Phase 2 Supabase, email polish, observability |

Do **not** re-assign: admin auth, Zod, rate limits, Supabase leads/bookings, **copilot foundation** — shipped.  
Do **not** start: CrewAI, LangChain orchestration, merging customer chat with copilot RAG.
