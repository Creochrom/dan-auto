# Gemini service advisor setup

## 1. API key

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env.local` in the project root.
3. Set `GEMINI_API_KEY=your_key_here` (never commit `.env.local`).

## 2. Run locally

```bash
npm install
npm run dev
```

Open the site and use the floating **service advisor** chat widget.

- **Default:** Gemini replaces the scripted advisor (`ADVISOR_ENGINE` defaults to `gemini`).
- Without `GEMINI_API_KEY` → the chat shows setup instructions (no silent fallback to scripts).
- For the old scripted flow only: `ADVISOR_ENGINE=rules` in `.env.local`.

Optional: `GEMINI_MODEL=gemini-2.5-flash` (default — override only to pin a specific version, e.g. `gemini-2.5-flash-lite`). The legacy `gemini-2.0-flash` is deprecated and returns 404 for new API keys.

## 3. How it works

| Piece | Role |
|-------|------|
| `POST /api/chat` | Customer messages; returns assistant reply + chips |
| `lib/services/chat.service.ts` | Session + Gemini / fallback routing |
| `lib/services/gemini.service.ts` | Gemini API calls + JSON structured intake |
| `lib/types/structured-intake.ts` | Canonical intake JSON stored per session |
| `GET /api/chat/intake?sessionId=` | Export intake for mechanic dashboard |
| `POST /api/ai-intake` | Email workshop when customer submits |

Structured intake is merged on every turn so the model does not re-ask for details already collected.

## 4. Mechanic handoff

**Export (JSON):**

```
GET /api/chat/intake?sessionId=<chat_session_id>
```

**Email workshop (existing flow):** customer completes chat → frontend calls `POST /api/ai-intake` with `{ chatSessionId }`.

## 5. Safety behaviour

System prompt + JSON rules require:

- No guaranteed diagnoses or prices
- Indicative GBP ranges only
- Driving warnings for high-risk symptoms

## 6. Production notes

- Chat sessions live in **in-memory** `mock-store` today (lost on cold start). Plan Supabase/`chat_sessions` before production scale.
- Monitor Gemini quota and log `[chat] Gemini turn failed` for fallback to the rule engine.
