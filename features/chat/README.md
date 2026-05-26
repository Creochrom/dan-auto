# Chat UI — conversational service advisor

## Data model (`lib/types/chat.ts`)

- `ChatMessage` — `content` (API/CRM), `displayContent` (bubble), `source` (`typed` | `quick_reply`), `status`, `chipsSnapshot`
- `ChatTranscript` — client mirror for sessionStorage / future hydration
- `ChatResponse.userMessage` — server echo for timeline sync

## Timeline (`lib/chat/timeline.ts`)

- Optimistic user bubble → confirmed user message + assistant reply
- Quick replies snapshot onto the preceding assistant message when the user answers

## Hook

`useAdvisorChat` — shared by floating widget and booking modal.

## Future

- `GET /api/chat/[sessionId]` for full history
- Gemini enabled via `GEMINI_API_KEY` (see `docs/GEMINI_SETUP.md`)
- Optional streaming append to assistant message
- CRM conversation logs + WhatsApp sync using the same `ChatMessage` shape
