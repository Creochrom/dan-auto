# Admin authentication

Server-enforced admin access. No NextAuth / Clerk. The httpOnly cookie is the security boundary; `sessionStorage` is display-only.

## Multi-user roles (owner/admin/mechanic)

`supabase/migrations/005_admin_users.sql` adds the `admin_users` table so you can
create multiple users from `/admin/users` and reset/restore passwords.

- `owner` — full access + user management
- `admin` — operations + user management
- `mechanic` — workshop usage role

Login now checks `admin_users` first, then falls back to env credentials.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_USERNAME` | Yes | Login name |
| `ADMIN_PASSWORD` | Dev/local | Plain password (omit in production if using hash) |
| `ADMIN_PASSWORD_HASH` | Production | PBKDF2 hash — preferred on Vercel |
| `ADMIN_SESSION_SECRET` | Yes | HMAC signing key for session cookie (32+ random chars) |
| `ADMIN_ROLE` | Optional | Role for env-fallback login (`owner`/`admin`/`mechanic`, default `owner`) |

Generate session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate password hash from a password:

```bash
node scripts/generate-admin-password-hash.mjs "YourSecurePassword"
```

## Local `.env.local` example

```env
ADMIN_USERNAME=dan
ADMIN_PASSWORD=your-dev-password
ADMIN_SESSION_SECRET=replace-with-random-hex-from-command-above
```

## Production (Vercel)

```env
ADMIN_USERNAME=dan
ADMIN_PASSWORD_HASH=pbkdf2:sha256:100000:...
ADMIN_SESSION_SECRET=...
```

Do not set `ADMIN_PASSWORD` in production.

## Routes

Middleware enforces the session cookie on the paths below (401 JSON for APIs, redirect to `/admin/login` for admin pages). Route handlers may add role checks (e.g. owner/admin for user management).

| Route | Auth |
|-------|------|
| `POST /api/admin/login` | Public |
| `POST /api/admin/logout` | Public (clears cookie) |
| `/api/admin/*` (except login/logout) | Session required (middleware) |
| `/api/jobs`, `/api/jobs/*` | Session required (middleware) |
| `/api/knowledge/*` | Session required (middleware) |
| `GET /api/vehicle-history` | Session required (middleware) |
| `GET /api/health/dvla` | Session required (middleware) |
| `POST /api/copilot` | Session required (middleware) |
| `GET /api/leads` | Session required (middleware) |
| `PATCH /api/leads` | Session required (middleware + handler) |
| `POST /api/leads` | Public |
| `GET /api/bookings` | Session required (middleware) |
| `PATCH /api/bookings` | Session required (middleware + handler) |
| `POST /api/bookings` | Public |
| `GET /api/health/supabase` | Public |
| `/api/chat`, `/api/chat/*` | Public |
| `GET /api/vehicle-lookup` | Public |
| `/admin/login` | Public |
| `/admin/*` | Middleware → cookie session (redirect) |

## Troubleshooting login

| Symptom | Fix |
|---------|-----|
| **404** on `/api/admin/login` | Stale `next dev` on port 3000. Stop all Node processes, run `npm run dev`, use the URL in the terminal. |
| **Network error** | Usually a 404 HTML page (see above) or dev server not running. |
| **500** “not configured” | Set `ADMIN_USERNAME`, `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`), `ADMIN_SESSION_SECRET` in `.env.local`. |
| **401** | Wrong username/password — `ADMIN_USERNAME` is case-insensitive match only. |

## Verification

1. Open `/admin` → redirect to `/admin/login`
2. Log in → lands on `/admin`, cookie set
3. Refresh → still logged in
4. `curl http://localhost:3000/api/leads` → `401`
5. Log out → cookie cleared, `/admin` redirects again
