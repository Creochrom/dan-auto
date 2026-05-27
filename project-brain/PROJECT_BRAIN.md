# PROJECT BRAIN — Dan Auto Centre

Long-term memory for this codebase. Read this before making any non-trivial change. If a request would contradict this file, push back instead of obeying blindly.

---

## Project overview

- Public website + AI service advisor for **Dan Auto Centre**, an independent garage in Southampton, UK.
- Single Next.js app deployed to Vercel. No separate backend.
- Customers can: look up a plate, chat with an AI advisor, book a service, send a contact message, upload media.
- Staff can: log into a lightweight admin area to review leads and bookings.
- Currently transitioning from **prototype → scalable product**. Persistence is still in-memory; everything else is real.

## Current stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4 + a small set of shared classes in `app/globals.css`. CSS variables drive the theme (gold/cyan dark UI).
- **Animation:** Framer Motion.
- **Icons:** Lucide React.
- **AI:** Google Gemini via `@google/generative-ai` (default model `gemini-2.5-flash`).
- **Email:** Resend HTTP API (with a `log` provider fallback for dev).
- **Hosting:** Vercel.
- **No DB yet.** In-memory mock store on `globalThis`. Supabase is the planned upgrade.
- **No tests, no rate limiter, no auth provider** (admin uses hardcoded credentials in `lib/enterprise/auth.ts`).

> Important: this Next.js version has breaking changes. Always check `node_modules/next/dist/docs/` before writing routing, caching, or data-fetching code.

## Architecture summary

Folder layout (do not reshuffle without a decision log entry):

- `app/` — routes (pages + API). Thin route handlers only.
- `app/api/*` — REST-ish endpoints. Each handler: validate → call service → return `jsonOk` / `jsonError`.
- `app/admin/*` — admin pages (login, leads, bookings).
- `components/` — shared UI. Sub-folders: `hero/`, `landing/`, `platform/`, `vehicle/`, `brand/`, `layout/`, `seo/`, `providers/`, `enterprise/`.
- `features/` — feature modules. Sub-folders: `assistant/`, `booking/`, `chat/`, `marketing/`, `admin/`, `crm/`. Each owns its components + hooks. **New feature work goes here, not in `components/`.**
- `lib/services/` — business logic (chat, lead, booking, ai-intake, gemini, vehicle-memory, upload, etc.). All side-effects live here.
- `lib/repositories/` — data access. Today: mock store. Tomorrow: Supabase. **Routes/services must never touch the store directly.**
- `lib/types/` — TypeScript shapes. Single source of truth for entities.
- `lib/config/` — business info, brand, hours, services, advisor engine selector. Edit here, not in components.
- `lib/api/` — `client.ts` (browser → API) and `response.ts` (`jsonOk`/`jsonError`).
- `lib/email/` — Resend wrapper, templates, summary builders.
- `lib/i18n/` — locale packs (en, pl, ro, ru, uk).
- `lib/utils/` — sanitisation, plate formatting, etc.
- `ai/` — Gemini system prompt, garage context, FAQ context, workflows.
- `public/` — static assets.
- `docs/` — `GEMINI_SETUP.md`. `ARCHITECTURE.md` at root is the canonical layout doc.

Data flow rule (memorise this):

```
browser → lib/api/client.ts → app/api/<route> → lib/services/<service> → lib/repositories/<repo> → mock-store (or future Supabase)
```

Never short-circuit this chain. No direct repository calls from a route. No direct store access from a service. No `fetch` to internal API from a server component.

## AI system summary

- One place uses Gemini: the service advisor chat (floating widget + booking intake).
- Entry point: `lib/services/gemini.service.ts → runGeminiAdvisorTurn`.
- Prompt assembled from `ai/prompts/systemPrompt.ts` + `ai/context/garageContext.ts` + `ai/context/faqContext.ts` + a long `JSON_INSTRUCTION` block in `gemini.service.ts`.
- The model is forced to return **structured JSON** every turn: `assistantMessage`, `suggestionChips`, `structuredIntake`, `intakeComplete`, `typingLabel`.
- The `structuredIntake` shape (`lib/types/structured-intake.ts`) is the contract between AI and the rest of the system. It is mapped into `LeadDraft`, `MechanicSummary`, and `IntakeState` via `lib/services/intake-mapper.ts`.
- Vehicle memory (`lib/services/vehicle-memory.service.ts`) seeds the intake on the first plate so the AI never re-asks known facts.
- A rule-based fallback engine exists in `lib/services/service-advisor.engine.ts` and runs when `ADVISOR_ENGINE=rules` or `GEMINI_API_KEY` is missing. It is a safety net, not a parallel product.
- Errors never bubble to the user — `chatService.geminiErrorTurn` returns a friendly fallback with retry chips.

**Do not edit the JSON instruction or the structured intake type without a DECISIONS_LOG entry.** Both are tuned and break extraction quality silently when changed.

## Coding philosophy

- **Lean over clever.** If a 30-line function works, do not abstract it into 4 files.
- **Boring over novel.** No new libraries, no new patterns, no new state managers without a decision log entry.
- **Types are documentation.** Every entity gets a type in `lib/types/`. Reuse before redefining.
- **One way to do each thing.** If a helper exists (`stripPlate`, `formatPlate`, `jsonOk`, `sanitizePlainText`, `BUSINESS`, `BRAND`), use it. Do not invent a second one.
- **Edit existing files first.** Only create a new file when the existing files would become harder to read.
- **Comments explain why, not what.** Skip narration comments.

## Backend principles

- Route handlers stay thin: parse body → minimal field check → call service → return `jsonOk` / `jsonError`. No business logic in `app/api/`.
- Services own orchestration, validation that goes beyond required-field checks, and side effects (email, lead capture, vehicle memory writes).
- Repositories own data shape and storage. Today they wrap the mock store. The repo interface should not need to change when Supabase lands.
- Use the existing `jsonOk` / `jsonError` helpers. Do not roll a new response shape.
- IDs are generated in repositories (`newId(prefix)`), not in routes.
- All timestamps are ISO strings, set in repositories.
- Validation today is hand-written. When Zod is introduced (see ROADMAP), introduce it route by route — do not big-bang.
- `runtime = "nodejs"` and `dynamic = "force-dynamic"` are required for routes that touch Gemini, Resend, or the mock store.

## Frontend principles

- Server components by default. Add `"use client"` only when you need state, effects, or browser APIs.
- Talk to the API through `lib/api/client.ts`. Never `fetch("/api/...")` from a component directly.
- State lives in three places, in this order of preference: local `useState` → React Context (`AssistantContext`, `I18nProvider`) → server (mock store / future DB). **No Redux, Zustand, Jotai, etc.**
- No data-fetching libraries (React Query, SWR). Plain `fetch` through `lib/api/client.ts` is enough for current scale.
- Tailwind utility classes for layout. Shared visual primitives (`premium-card`, `premium-panel`, `btn-glow`, `input-premium`, `eyebrow`, `display-section`) are defined in `app/globals.css` — reuse them.
- Theme tokens live as CSS variables in `:root` (in `globals.css`) and are mapped to Tailwind via `@theme inline`. **Add new colours there, not inline.**
- Brand strings (phone, address, hours, advisor intro, WhatsApp) come from `lib/config/`. Never hardcode them in components.
- Icons: Lucide only. Do not introduce a second icon set.
- Animation: Framer Motion. Do not introduce GSAP, Lottie, etc.

## Project constraints

- **Solo / small team.** Keep ceremony low. No PR templates, no Storybook, no monorepo.
- **Vercel-first.** Anything that needs a long-running process, a queue, or a websocket is out of scope for now.
- **Budget-conscious AI usage.** Gemini calls are not free; do not add background AI loops or polling.
- **GDPR-adjacent data.** Customer name, phone, email, plate, vehicle history. Treat all of it as PII. No logging full payloads in production. The `EMAIL_LOG_FULL=1` switch is dev-only.
- **UK-specific:** UK plates, UK phone format, MOT rules, GBP. Localisation packs translate copy but the business rules are UK-only.

## Deployment overview

- Hosted on Vercel. `main` branch deploys to production.
- Env vars (set in Vercel dashboard, mirrored locally in `.env.local`):
  - `GEMINI_API_KEY` — enables AI advisor.
  - `GEMINI_MODEL` — optional override, default `gemini-2.5-flash`.
  - `ADVISOR_ENGINE` — set to `rules` to force the offline fallback.
  - `EMAIL_PROVIDER` — `resend` or `log`.
  - `EMAIL_PROVIDER_API_KEY` (or `RESEND_API_KEY`) — Resend key.
  - `EMAIL_FROM`, `EMAIL_TO` / `BOOKING_EMAIL_TO` (Gmail inbox OK until domain verified), `RESEND_API_KEY`. See `docs/EMAIL_SETUP.md` and `GET /api/health/email`.
  - `NEXT_PUBLIC_WHATSAPP_MOBILE`.
  - `EMAIL_LOG_FULL` — dev only.
- Build: `npm run build`. Local dev: `npm run dev`. Lint: `npm run lint`.
- No CI test suite yet. Linter runs on commit hooks if configured locally; do not block deploys on it.

## Current priorities

In order. Anything outside this list is a distraction unless explicitly asked for.

1. Move persistence off the mock store (Supabase). Repositories already abstract this — keep their interface stable.
2. Lock down the admin area (server-side auth, hashed credentials, route guard middleware).
3. Add Zod validation, route by route, starting with `/api/leads` and `/api/bookings`.
4. Add basic rate limiting to public POST endpoints (`/api/chat`, `/api/leads`, `/api/uploads`, `/api/ai-intake`).
5. Continue extracting `app/page.tsx` into `features/marketing/` sections.
6. Decide between `/api/vehicles` and `/api/vehicle-lookup` and remove the duplicate.

## Anti-patterns to avoid

Hard "no"s. Reject these even if a prompt asks for them.

- Do **not** introduce a new state library (Redux, Zustand, Jotai, MobX, Recoil).
- Do **not** introduce a new data-fetching library (React Query, SWR, tRPC) at current scale.
- Do **not** introduce a new UI kit (shadcn, MUI, Chakra, Mantine, Ant Design).
- Do **not** add ORMs (Prisma, Drizzle, TypeORM) before the Supabase decision is made.
- Do **not** add monorepo tooling (Turborepo, Nx).
- Do **not** swap Tailwind v4 for Tailwind v3 or anything else.
- Do **not** swap Framer Motion or Lucide.
- Do **not** rewrite the AI prompt or `structuredIntake` type without a DECISIONS_LOG entry.
- Do **not** delete the rule-based advisor engine; it is the offline fallback.
- Do **not** call `mockStore` directly from routes, services, or components — go through repositories.
- Do **not** hardcode business strings (phone, hours, address, brand colours) in components.
- Do **not** create new top-level folders. Use existing ones.
- Do **not** create parallel chat hooks. `useChatSession` (assistant widget) and `useAdvisorChat` (in-flow) already exist; consolidate before duplicating.
- Do **not** create per-component CSS files. Theme via Tailwind + `globals.css`.
- Do **not** add server-side React Query or SSR data caching layers; the App Router covers it.

## Rules for future Cursor / AI sessions

Before changing anything:

1. Read this file, then `ARCHITECTURE.md`, then the relevant feature README (`features/*/README.md`).
2. If the request is ambiguous, ask. Do not invent product direction.
3. If a "better" library or pattern comes to mind, check the anti-patterns list first.
4. Prefer editing existing files over creating new ones. If a new file is needed, justify it in one sentence in the PR/commit message.
5. Match the existing naming, folder, and import conventions exactly. Use `@/` aliases.
6. Keep route handlers thin. Put logic in services. Put data access in repositories.
7. Reuse helpers from `lib/utils`, `lib/config`, `lib/api`, `lib/email`, `lib/format-plate.ts` before writing your own.
8. When touching the AI flow, do not change the prompt or schema unless explicitly told to. Add behaviour around it instead.
9. Never expose internal errors to customers. Wrap with friendly messages like the existing `geminiErrorTurn`.
10. After non-trivial changes, append a short entry to `DECISIONS_LOG.md` and update `ROADMAP.md` if priorities shifted.
11. Do not generate placeholder content, fake data, or "TODO" features the user did not ask for.
12. Treat customer data (name, phone, email, plate) as PII. No logging it outside dev.
