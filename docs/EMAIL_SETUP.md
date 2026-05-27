# Email setup — Resend + Vercel (Gmail inbox interim)

Workshop notifications (bookings, AI intake) go **to** your inbox via Resend. They are **sent from** a verified domain address — not from Gmail.

Until `danautocentre.co.uk` is verified in Resend, you can keep receiving everything on **Gmail**.

---

## Interim: Gmail inbox (now)

| Variable | Value |
|----------|--------|
| `EMAIL_TO` | Your Gmail (e.g. `you@gmail.com`) |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | From [Resend → API Keys](https://resend.com/api-keys) |
| `EMAIL_FROM` | Leave unset until domain is verified — defaults to `Dan Auto Centre <contact@danautocentre.co.uk>` once DNS is done |

**Do not** set `EMAIL_FROM` to a `@gmail.com` address — Resend rejects it and the app blocks it on purpose.

Optional duplicate: `BOOKING_EMAIL_TO` (same as `EMAIL_TO` if you only use one inbox).

Local dev without sending:

```env
EMAIL_PROVIDER=log
EMAIL_TO=your@gmail.com
```

Emails print in the terminal instead of sending.

---

## Health check

```text
GET /api/health/email
GET /api/health/email?probe=1   # also pings Resend API (domains)
```

Example when ready for production send:

```json
{
  "ok": true,
  "data": {
    "provider": "resend",
    "hasApiKey": true,
    "intakeToDomain": "gmail.com",
    "intakeToConfigured": true,
    "fromDomain": "danautocentre.co.uk",
    "fromAllowed": true,
    "ready": true,
    "warnings": []
  }
}
```

`ready: false` with warnings → fix env vars before relying on booking emails.

---

## Vercel checklist (Production)

1. **Settings → Environment Variables** (Production):
   - `RESEND_API_KEY` — required
   - `EMAIL_PROVIDER` = `resend` (not `log`)
   - `EMAIL_TO` = Gmail inbox for Dan until workshop domain mail is ready
   - `EMAIL_FROM` — only after Resend domain verification (see below)
2. **Redeploy** after changing env vars.
3. Open `https://your-site.vercel.app/api/health/email?probe=1` — confirm `ready: true` and `resendProbe.ok: true`.
4. Submit a test booking on production; check Gmail inbox + Resend → Emails dashboard.
5. Check spam if nothing arrives within a minute.

Preview / Development can use `EMAIL_PROVIDER=log` if you prefer no real sends.

---

## Resend domain (when customer DNS is ready)

1. Resend → **Domains** → add `danautocentre.co.uk`.
2. Add DNS records (SPF, DKIM, etc.) at the domain host.
3. Wait until Resend shows **Verified**.
4. Set in Vercel:
   - `EMAIL_FROM=Dan Auto Centre <contact@danautocentre.co.uk>`
5. Redeploy and re-run `/api/health/email?probe=1`.

---

## What sends email today

| Flow | Endpoint / service | Workshop email |
|------|-------------------|----------------|
| AI booking intake (modal) | `POST /api/booking-intake` | Yes |
| AI advisor handoff | `POST /api/ai-intake` | Yes |
| Direct booking form | `POST /api/bookings` | **No** (save only — add notification when prioritised) |
| Contact form | `POST /api/leads` | **No** |

Customer **confirmation** emails are not implemented yet — only workshop intake notifications.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Health `ready: false`, no API key | Missing `RESEND_API_KEY` on Vercel |
| Resend probe 401 | Invalid or revoked API key |
| Resend send fails “domain not verified” | `EMAIL_FROM` domain not verified yet — finish DNS or omit `EMAIL_FROM` until verified |
| Booking saved, no email | Used direct `/api/bookings` only, or intake modal not completed |
| Dev works, prod silent | `EMAIL_PROVIDER=log` in production or wrong `EMAIL_TO` |

---

## Related

- `lib/email/config.ts` — provider and address helpers
- `docs/GEMINI_SETUP.md` — AI advisor env
- `GET /api/health/supabase` — database connectivity
