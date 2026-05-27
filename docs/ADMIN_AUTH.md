# Admin authentication

Server-enforced admin access. No NextAuth / Clerk. The httpOnly cookie is the security boundary; `sessionStorage` is display-only.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_USERNAME` | Yes | Login name |
| `ADMIN_PASSWORD` | Dev/local | Plain password (omit in production if using hash) |
| `ADMIN_PASSWORD_HASH` | Production | PBKDF2 hash — preferred on Vercel |
| `ADMIN_SESSION_SECRET` | Yes | HMAC signing key for session cookie (32+ random chars) |

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

| Route | Auth |
|-------|------|
| `POST /api/admin/login` | Public |
| `POST /api/admin/logout` | Public (clears cookie) |
| `GET /api/admin/me` | Session required |
| `GET /api/leads` | Session required |
| `GET /api/bookings` | Session required |
| `POST /api/leads` | Public |
| `POST /api/bookings` | Public |
| `/admin/login` | Public |
| `/admin/*` | Middleware → cookie session |

## Verification

1. Open `/admin` → redirect to `/admin/login`
2. Log in → lands on `/admin`, cookie set
3. Refresh → still logged in
4. `curl http://localhost:3000/api/leads` → `401`
5. Log out → cookie cleared, `/admin` redirects again
