# Workshop Operating Ecosystem — Dan Auto Centre

Canonical ops + product blueprint. Complements `ROADMAP.md` and `PROJECT_BRAIN.md`.

**North star:** Beat WhatsApp friction for status, context, and knowledge — not Salesforce or ERP.

---

## Principles (non-negotiable)

### 1. Customer AI ≠ Workshop AI

| | Customer AI (`/api/chat`) | Workshop AI (`/api/copilot`, Workshop Assistant) |
|---|---------------------------|--------------------------------------------------|
| **Goal** | Conversion, intake, trust, booking | Speed, knowledge, operations, diagnostics |
| **Users** | Public | Mechanics, front desk, owner |
| **Output** | Structured JSON intake | Plain text + optional RAG sources |
| **Never** | Internal manuals, torque sheets, shop slang to customers | Auto-send messages to customers without human |

Mixing them → liability, leaked internal notes, wrong pricing, mechanic tone in SMS.

### 2. AI suggests — humans confirm

- AI **drafts**, **retrieves**, **summarizes**, **suggests**.
- **Mechanic** confirms diagnosis and work.
- **Front desk** sends anything to the customer.
- **Humans** own decisions.

UI copy should say “Draft” / “Suggest”, not “Send automatically” (until explicitly built with review).

### 3. Today counts beat analytics

Owner needs:

- What’s on fire?
- What’s stuck (parts / customer)?
- Who wasn’t called back?
- How many cars tomorrow?

Not dashboards, KPIs, or BI in v1.

### 4. WhatsApp is the real competitor

You compete with:

- “bro check this BMW”
- photos in WhatsApp
- paper on the bonnet
- “Dan said call the customer”

Win on: faster status, one reg = one job, copy-to-WhatsApp, less re-typing.

Do not try to replace WhatsApp in v1 — **integrate** (copy message, tel: link).

### 5. Operating system, not demo

Prototype → **workshop OS**. Remove or quarantine:

- fake jobs in localStorage
- demo CRM metrics that aren’t Supabase
- tabs that look live but aren’t operational data

Real data: bookings, leads, jobs (when shipped), Today queue.

### 6. Mobile / tablet first in the bay

Design for thumb, portrait, greasy hands, glanceability — not desk dashboards.

---

## Killer workflow (target state)

```text
Customer leaves symptoms (site / advisor)
        ↓
Front desk confirms booking
        ↓
Job auto-created (linked booking_id)
        ↓
Mechanic opens /admin/jobs/[id]
        ↓
Already there: reg, symptoms, intake summary, photos
        ↓
Workshop Assistant preloaded → manuals + drafts
        ↓
Status one tap → Today queue updates
        ↓
Desk copies customer explanation → WhatsApp / SMS
```

**Metric of success:** mechanic does not spend 15 minutes asking “what did the customer mean?”

---

## Build priority (workshop OS)

| Order | Item | Why |
|-------|------|-----|
| **0** | **Kill demo admin confusion** | Trust; Dan must not see fake jobs |
| **1** | **Workshop Assistant** (`/admin/workshop-assistant`) | Daily mechanic/desk tool; polish + mobile |
| **2** | **Today queue** (`/admin/today`) | Owner + floor visibility |
| **3** | **jobs table + job page** | One car = one record |
| **4** | **booking → job** | Killer workflow glue |
| **5** | **Vehicle history** (`/admin/vehicle/[reg]`) | Repeat faults |

### Parallel (do not block 0–5)

- **AnythingLLM + BMW docs** — enhances copilot when ready; copilot works without RAG (Gemini only) until then.
- Hero DVLA, privacy, email confirmations — public trust track.

### Not now

- CrewAI / multi-agent orchestration
- Advanced RAG pipelines beyond workspace search
- Owner analytics / charts
- Voice in workshop
- ERP / parts inventory
- VPS “perfection” before mechanic UX ships

---

## Admin pages (target nav)

| Page | Role |
|------|------|
| `/admin/today` | Everyone — queue + counts |
| `/admin/bookings` | Front desk |
| `/admin/leads` | Front desk |
| `/admin/jobs/[id]` | Mechanic + desk |
| `/admin/workshop-assistant` | Mechanic — knowledge |
| `/admin/training` | Practice / golden queries |
| `/admin/vehicle/[reg]` | History (phase 5) |
| `/admin` | Owner shortcuts — not fake CRM |

---

## Workshop job statuses (floor)

`booked` → `checked_in` → `diagnosing` → `awaiting_approval` → `awaiting_parts` → `in_progress` → `quality_check` → `ready_for_collection` → `collected` | `cancelled`

**Today columns (simplified):** Arriving · On ramp · Waiting parts · Waiting customer · Ready · Done

---

## Highest ROI per role

| Role | #1 feature |
|------|------------|
| **Mechanic** | Job page + Workshop Assistant with reg/symptoms preloaded |
| **Front desk** | Today queue + draft customer message (human sends) |
| **Owner** | Today counts — what’s stuck, not graphs |

---

## Agent rules

When implementing workshop features:

1. Read this file + `PROJECT_BRAIN.md`.
2. Do not merge customer chat prompt or intake into copilot.
3. Do not add features that auto-message customers without review UI.
4. Prefer copy-to-clipboard over built-in WhatsApp API in v1.
5. Tablet-friendly beats pretty desktop-only layouts.
