# Dan Auto — Internal Product Doctrine

**Garage-native operating system.** Not a Frankenstein stack. Not plugin hell.

---

## Core architecture law

```text
Vehicle ↔ Job ↔ Timeline ↔ AI context ↔ Workshop memory
```

Everything else hangs off this graph:

- reminders, invoices, diagnostics, MOT, uploads, customer updates

**Rule:** Everything belongs to a **vehicle** or a **job**. No floating notes, uploads, or chats.

---

## Non-negotiable principles

### 1. Patterns only — no integrations

Borrow UX and workflows from Open WebUI, Linear, Twenty, Cal.com, etc.  
**Do not** embed their stacks or depend on their roadmaps.

### 2. Job cockpit > dashboards

Operational cockpit for the floor — not BI cinema. Today queue beats KPIs.

### 3. Timeline is append-only

Audit trail, operational memory, less blame-game. AI summarizes history from events — never rewrites them.

### 4. AI suggests — humans confirm

Legal safety, trust, operational sanity. Draft / Suggest / Copy — not auto-send to customers.

| Surface | AI | Human |
|---------|-----|-------|
| Customer chat | intake, trust | books, sends |
| Workshop copilot | diagnostics, manuals | mechanic decides |
| Front desk | customer message **draft** | copy → WhatsApp / SMS |

### 5. Desk copies WhatsApp — we don’t replace it

WhatsApp is the reality layer. We generate useful drafts; humans check, copy, send.

### 6. Tablet-first bay UI

Dirty hands, bright light, fast tap, minimal typing. No 400-column desktop CRM.

### 7. Customer AI ≠ Workshop AI

`/api/chat` (public) vs `/api/copilot` + Workshop Assistant (admin). Never mix tones or leak internal notes.

### 8. One search across everything (north star)

One query (e.g. `WP56YAD`) → bookings, jobs, MOT, uploads, invoices, manuals, vehicle memory.  
**Operational superpower** — implement incrementally; ⌘K is the shell.

---

## Event-driven platform (how we build)

```text
milestone / status change
        ↓
timeline event (job + vehicle)
        ↓
queue update (Today)
        ↓
notification / draft (human sends)
        ↓
AI summary (optional, grounded on timeline)
```

Build **AI around workflow** — not workflow around AI.

---

## Stabilizing phase (current)

| Priority | Item | Status |
|----------|------|--------|
| P1 | Supabase Storage attachments | Shipped |
| P2 | Draft invoice on job | Shipped |
| P3 | MOT queue (ranges, overdue, Today) | Shipped |
| P4 | Vehicle memory card + timeline | Shipped |
| — | Unified search grouped (⌘K) | Shipped |
| — | Admin login smoke | [docs/ADMIN_LOGIN_SMOKE.md](../docs/ADMIN_LOGIN_SMOKE.md) |
| — | Workshop OS production go-live | [docs/WORKSHOP_GO_LIVE.md](../docs/WORKSHOP_GO_LIVE.md) |

## Do not touch yet

Multi-agent AI, autonomous diagnosis, inventory ERP, AI scheduling, predictive dashboards, voice assistant.

---

## Inspiration

See [INSPIRATION_BOARD.md](./INSPIRATION_BOARD.md) for pattern references by category.
