# Admin login — 5-minute smoke

Full reference: [ADMIN_AUTH.md](./ADMIN_AUTH.md)

## Required env (`.env.local` or Vercel)

| Variable | Purpose |
|----------|---------|
| `ADMIN_USERNAME` | Login name |
| `ADMIN_SESSION_SECRET` | 32+ char random hex — **required** for cookie |
| `ADMIN_PASSWORD` | Dev plain password **or** |
| `ADMIN_PASSWORD_HASH` | Production PBKDF2 hash |

Optional: `admin_users` table (migration `005`) — DB users tried **first**, then env fallback.

```bash
# Session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Password hash
node scripts/generate-admin-password-hash.mjs "YourPassword"
```

## Smoke steps

1. `npm run dev` — note the URL (often `http://localhost:3000`).
2. Open **`/admin/login`** (not `/admin` — unauthenticated users redirect here).
3. Enter `ADMIN_USERNAME` + password.
4. Expect redirect to **`/admin`** hub.
5. Confirm cookie: DevTools → Application → Cookies → `admin_session` (httpOnly).
6. `GET /api/admin/me` with credentials should return `{ ok: true, data: { login, role } }`.

## Two login paths

| Path | When |
|------|------|
| **DB user** | `005_admin_users.sql` applied + user created at `/admin/users` |
| **Env fallback** | `ADMIN_USERNAME` + `ADMIN_PASSWORD` (or hash) |

## Common failures

| Symptom | Fix |
|---------|-----|
| **500** “not configured” | Set `ADMIN_SESSION_SECRET` + password env |
| **401** Invalid credentials | Wrong password; or use DB user from `/admin/users` |
| Login API **404** | Wrong port / stale `next dev` — restart dev server |
| Redirect loop | Clear cookies; check `ADMIN_SESSION_SECRET` unchanged between restarts |
| `/admin` works locally but not Vercel | Set same env on Vercel Production; use `ADMIN_PASSWORD_HASH` not plain password |

## After login — quick workshop check

- `/admin/today` — floor queue + MOT  
- `/admin/jobs` — cockpit  
- **⌘K** — search + commands (needs active job for mark ready / call)
