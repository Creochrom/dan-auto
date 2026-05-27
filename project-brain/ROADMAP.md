# ROADMAP — Dan Auto Centre

Realistic, incremental direction. Not a wishlist. Update as priorities shift.

---

## Current stage

**Prototype → scalable product transition.**
The site is live-feeling and the AI flow works end-to-end, but persistence is in-memory and the admin area is unguarded. Next steps are about turning the existing demo into something the workshop can actually rely on.

## Completed systems

- Public marketing homepage with hero, services, MOT section, booking CTA, reviews, contact.
- AI service advisor (Gemini 2.5 Flash) with structured JSON intake, suggestion chips, vehicle memory, returning-customer recognition.
- Rule-based advisor fallback (offline / no key).
- Direct booking form posting to `/api/bookings` via `createBooking()` — primary path. AI advisor is opt-in via "Need help first?" / "Talk to service advisor" buttons that preload the booking context.
- AI booking-intake modal (`BookingIntakeModal` + `/api/booking-intake`) retained as a secondary surface for when AI assistance is explicitly chosen.
- Lead capture from contact form, AI advisor, and booking flow.
- Vehicle plate lookup with caching (mock data, DVLA-ready).
- Email delivery via Resend with `log` provider fallback for dev.
- Admin shell at `/admin` with leads and bookings views.
- Multilingual copy packs (en, pl, ro, ru, uk) + Google Translate fallback.
- SEO basics: metadata, JSON-LD, sitemap, robots.
- Layered architecture (route → service → repository) consistently applied.
- WhatsApp / phone deep links across the site.
- Single source of truth for services (`siteServices` in `lib/config/services.ts`) feeding the cards grid and the booking dropdown.

## Current focus

In priority order. Do these before anything new.

1. **Database migration.** Replace the mock store with Supabase. Keep repository interfaces stable so services do not change. Tables: `leads`, `bookings`, `chat_sessions`, `uploads`, `vehicle_memory`.
2. **Admin auth.** Server-side middleware guard on `/admin/*`. Hashed credentials in env vars (or Supabase Auth once the DB is in). Remove hardcoded accounts from `lib/enterprise/auth.ts`.
3. **Schema validation.** Introduce Zod, one route at a time. Start with `/api/leads`, `/api/bookings`, `/api/ai-intake`.
4. **Rate limiting.** Basic limiter on public POSTs (`/api/chat`, `/api/leads`, `/api/uploads`, `/api/ai-intake`). Upstash or in-memory per-IP is fine.

## Next priorities

After current focus is done.

- **Real slot availability.** Replace `getMockSlotAvailability()` with admin-driven scheduling once the DB lands. Same call site, same shape — swap the source.
- **Decide the future of `BookingIntakeModal` + `/api/booking-intake`.** Now that AI is opt-in, evaluate whether the modal duplicates the floating advisor or remains useful as a focused booking-context flow.
- **Resolve duplicate vehicle lookup routes.** Pick one of `/api/vehicles` / `/api/vehicle-lookup`, redirect or delete the other.
- **Continue extracting `app/page.tsx`** into `features/marketing/` section components. Target one section per PR.
- **Consolidate chat hooks.** Document which of `useChatSession` and `useAdvisorChat` is canonical and remove the other.
- **Real DVLA + MOT History API integration.** The lookup pipeline already has the shape; swap the mock report builder for a real call.
- **Resend domain + sending limits.** Move off shared sender, verify domain, add bounce handling.
- **Minimal observability.** Request IDs in logs + error reporting (Sentry or Vercel built-ins). No full APM yet.
- **Smoke tests.** A handful of Vitest tests around `intake-mapper`, `build-ai-intake-summary`, `prepare-booking-email`. No coverage targets.

## Future ideas

Not committed. Only revisit when current focus + next priorities are done.

- WhatsApp Business inbound handler (Twilio or 360dialog).
- Voice AI handoff for phone calls.
- Saved vehicles + service history in the member portal.
- Customer-facing booking history and quote approval flow (UI scaffolding already exists in `components/platform/`).
- Workshop-side dashboard with charts (jobs in progress, revenue, conversion).
- Calendar sync (Google Calendar) for staff.
- Photo / video AI analysis of damage uploads.
- Referral tracking against the existing `/ref/[code]` route.

## Technical debt

Only items that meaningfully slow future work. Ignore cosmetic debt.

- **In-memory mock store.** Data lost on every restart. Highest-impact debt — covered by current focus #1.
- **`app/page.tsx` ~1200 lines** and still mixes data, layout, forms, and orchestration. Half-migrated to `features/marketing/`. Finish the migration or stop the bleeding.
- **Two vehicle lookup routes** doing the same job.
- **`lib/services/service-advisor.engine.ts` (~660 lines)** overlaps with the Gemini path. Acceptable as a fallback, but it should not grow further.
- **Manual validation in every route.** Repetitive and inconsistent error codes. Zod migration covers this.
- **Hardcoded admin credentials** in `lib/enterprise/auth.ts` with `sessionStorage` only. Demo-grade.
- **No tests.** Refactors are eyeball-verified. Risky around AI extraction.
- **No rate limiting.** Public POSTs are open to abuse.
- **`app/globals.css` (~2600 lines)** is fine but hard to scan. Defer until it actually causes bugs.
- **Duplicate landing components** in `components/landing/` that overlap with sections still inlined in `app/page.tsx`. Delete after migration.
