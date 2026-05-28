# Supabase go-live (leads + bookings)

Persistence for **leads** and **bookings** only. Chat, uploads, and vehicle memory stay on the in-memory mock store until Phase 2.

See also: [ADMIN_AUTH.md](./ADMIN_AUTH.md) — enable admin auth **before** production `STORAGE_BACKEND=supabase`.

## Environment variables

| Variable | Required when | Purpose |
|----------|---------------|---------|
| `SUPABASE_URL` | `STORAGE_BACKEND=supabase` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Same | Server-only; bypasses RLS |
| `STORAGE_BACKEND` | Production go-live | Set to `supabase` (default / unset = `mock`) |

Do **not** expose the service role key as `NEXT_PUBLIC_*`.

## 1. Run migration

1. Supabase Dashboard → **SQL Editor**
2. Paste and run `supabase/migrations/001_leads_bookings.sql`
3. Confirm **Table Editor** shows `leads` and `bookings`

## 2. Configure env

**Local (`.env.local`):**

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STORAGE_BACKEND=supabase
```

**Vercel (Production):** same three variables.

## 3. Verify health

```bash
curl -s http://localhost:3000/api/health/supabase
```

Expect: `"connected": true`, `"schemaReady": true`.

If `schemaReady: false`, the migration was not applied (or wrong project).

## 4. Smoke test writes

```bash
curl -s -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"service":"MOT","registration":"AB12CDE","preferredDate":"2026-06-01","preferredTime":"10:00","duration":"1h","customerName":"Test","customerPhone":"07700900000"}'

curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","phone":"07700900001"}'
```

- Rows appear in Supabase tables
- Restart `npm run dev` → data still listed (proves not mock)

## 5. Admin lists

1. Log in at `/admin/login` (see ADMIN_AUTH.md)
2. Open `/admin/leads` and `/admin/bookings`
3. Confirm test rows visible

`GET /api/leads` and `GET /api/bookings` require admin session (401 without cookie).

## Rollback

Set `STORAGE_BACKEND=mock` (or remove the var) and redeploy. Mock mode does not read existing Postgres rows.

## Phase 2 (not in this doc)

Tables still needed later: `chat_sessions`, `uploads`, `vehicle_memory` — same repository pattern as leads/bookings.
