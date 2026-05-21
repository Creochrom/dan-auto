# Dana Auto Centre — Platform Architecture

Scalable foundation for AI workshop assistant, booking workflow, and future CRM.

## Layered structure

```
app/
  api/chat/             POST — assistant (mock → Gemini)
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
| `POST /api/chat` | AI assistant (mock → Gemini) |
| `GET/POST /api/bookings` | Booking list / create |
| `GET/POST /api/leads` | Lead capture |
| `GET/POST /api/vehicles` | Vehicle lookup facade |
| `GET/POST /api/vehicle-lookup` | Existing lookup (keep) |

## Phase 2 TODO

- [ ] `GEMINI_API_KEY` + `lib/services/gemini.service.ts`
- [ ] Supabase tables: `bookings`, `leads`, `chat_sessions`, `customers`
- [ ] Admin auth (middleware + roles)
- [ ] Twilio / WhatsApp Business webhooks
- [ ] Voice AI handoff
- [ ] Split `app/page.tsx` into `features/marketing` sections

## Environment

```env
NEXT_PUBLIC_WHATSAPP_MOBILE=447XXXXXXXXXX
# GEMINI_API_KEY=
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
```
