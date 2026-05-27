# Email setup — Resend + Vercel

Workshop notifications (every booking) go **to** `BOOKING_EMAIL_TO` via Resend. Sent **from** a verified domain (`EMAIL_FROM`).

---

## Required environment variables (production)

| Variable | Example / notes |
|----------|-----------------|
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | From [Resend → API Keys](https://resend.com/api-keys) |
| `EMAIL_FROM` | `Dan Auto Centre <contact@danautocentre.co.uk>` (verified domain) |
| `BOOKING_EMAIL_TO` | Workshop inbox (Gmail OK for receiving) |

**Do not** set `EMAIL_FROM` to `@gmail.com` — Resend rejects it.

Local dev without sending:

```env
EMAIL_PROVIDER=log
BOOKING_EMAIL_TO=your@gmail.com
```

---

## Storage (production)

| Variable | Value |
|----------|--------|
| `STORAGE_BACKEND` | `supabase` |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |

Run migration once: `supabase/migrations/001_leads_bookings.sql`

---

## Health checks

```text
GET /api/health/email
GET /api/health/email?probe=1
GET /api/health/supabase
```

`/api/health/supabase` reports `storageBackend` and whether `leads`/`bookings` schema is reachable.

---

## Booking notification flow

All paths use **`bookingService.create()`** (not routes):

1. Validate input (route)
2. Persist booking (repository → Supabase when `STORAGE_BACKEND=supabase`)
3. Workshop email (standard alert or AI intake transcript email)
4. Customer confirmation if `customerEmail` present — request received, **not** a confirmed slot
5. Return booking — email failures are logged and **do not** roll back persistence

| Flow | Endpoint | Workshop | Customer |
|------|----------|----------|----------|
| Direct booking | `POST /api/bookings` | Standard alert | If email provided |
| AI booking intake | `POST /api/booking-intake` | Rich intake email | If draft email captured |
| AI callback | `POST /api/ai-intake` | Lead email (not a booking) | N/A |

Structured logs: `scope: "booking"` JSON events (`booking.created`, `notification.sent`, `notification.failed`).

---

## Vercel checklist (Production)

1. **Environment Variables** (Production):
   - `STORAGE_BACKEND=supabase`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_PROVIDER=resend`
   - `BOOKING_EMAIL_TO` = workshop inbox
   - `EMAIL_FROM` after domain verified
2. **Redeploy**
3. `GET /api/health/supabase` → `storageBackend: "supabase"`, `schemaReady: true`
4. `GET /api/health/email?probe=1` → `ready: true`
5. Submit test booking; check inbox + Vercel logs for `notification.sent`

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Bookings not in Supabase | `STORAGE_BACKEND` not `supabase` on Vercel |
| Health `ready: false` | Missing `RESEND_API_KEY` or invalid `EMAIL_FROM` |
| Booking saved, no email | Missing `BOOKING_EMAIL_TO` or `EMAIL_PROVIDER=log` in prod |
| Customer no confirmation | No `customerEmail` on request / intake draft |

---

## Related

- `lib/services/booking.service.ts` — notification orchestration
- `lib/email/config.ts` — env helpers
- `docs/GEMINI_SETUP.md` — AI advisor env
