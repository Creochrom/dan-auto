# Dan Auto Centre — Platform Architecture

Scalable foundation for AI workshop assistant, booking workflow, and future CRM.

## Layered structure

```
app/
  api/chat/             POST — Gemini service advisor (+ rule fallback)
  api/chat/intake/      GET — structured intake export
  api/bookings/         GET/POST — booking workflow
  api/leads/            GET/POST — lead capture
  api/vehicles/         GET/POST — vehicle lookup facade
  api/vehicle-lookup/   Existing plate lookup
  admin/                Workshop OS + bookings + leads pages
  page.tsx              Marketing homepage (split → features/marketing in Phase 2)

features/
  assistant/            AIChatWidget, useChatSession
  booking/              BookingCard, BookingStatusBadge
  marketing/            BookingCTAStrip, future section splits
  admin/                CRM module roadmap (README)
  crm/                  Placeholder for Phase 2

components/             # Shared UI (hero, layout, platform)
lib/
  config/               # business.ts, hours.ts, services.ts
  types/                # booking, lead, chat
  repositories/         # mock-store + per-entity repos
  services/             # booking, lead, chat services
  api/                  # client.ts, response.ts
ai/
  prompts/systemPrompt.ts
  context/garageContext.ts, faqContext.ts
  tools/index.ts
  workflows/booking-intake.ts
```

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/chat` | AI service advisor (Gemini or rule fallback) |
| `GET /api/chat/intake` | Export structured intake by session |
| `GET/POST /api/bookings` | Booking list / create |
| `GET/POST /api/leads` | Lead capture |
| `GET/POST /api/vehicles` | Vehicle lookup facade |
| `GET/POST /api/vehicle-lookup` | Existing lookup (keep) |

## Phase 2 TODO

- [x] `GEMINI_API_KEY` + `lib/services/gemini.service.ts` (see `docs/GEMINI_SETUP.md`)
- [ ] Supabase tables: `bookings`, `leads`, `chat_sessions`, `customers`
- [ ] Admin auth (middleware + roles)
- [ ] Twilio / WhatsApp Business webhooks
- [ ] Voice AI handoff
- [ ] Split `app/page.tsx` into `features/marketing` sections

## Environment

```env
NEXT_PUBLIC_WHATSAPP_MOBILE=447XXXXXXXXXX
GEMINI_API_KEY=
# GEMINI_MODEL=gemini-2.5-flash
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
```
