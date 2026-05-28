# Inspiration board (patterns only — no integrations)

**Canonical doctrine:** [PRODUCT_DOCTRINE.md](./PRODUCT_DOCTRINE.md)

We **do not** embed Open WebUI, Linear, Twenty, etc. We borrow **UX patterns**, **workflows**, and **architecture ideas** for a **garage-specific** OS.

## North star graph (architecture law)

```text
Vehicle ↔ Job ↔ Timeline ↔ AI context ↔ Workshop memory
```

## Categories

### AI / chat

| Repo | Steal |
|------|--------|
| [Open WebUI](https://github.com/open-webui/open-webui) | Side panel chat, model picker, “draft not send” |
| [LibreChat](https://github.com/danny-avila/LibreChat) | Multi-turn context, file attach to thread |

**Our rule:** Customer AI (`/api/chat`) ≠ Workshop AI (`/api/copilot`). Humans send to customers.

### Workflow / jobs

| Repo | Steal |
|------|--------|
| [Plane](https://github.com/makeplane/plane) | Status columns, quick filters |
| [Linear](https://github.com/linear/linear) | Keyboard shortcuts, command palette, dense lists |

**Our rule:** Job cockpit > dashboards. Today queue beats KPIs.

### CRM / activity

| Repo | Steal |
|------|--------|
| [Twenty](https://github.com/twentyhq/twenty) | Activity timeline on a record |
| [Chatwoot](https://github.com/chatwoot/chatwoot) | “Called customer” style events |

**Our rule:** One reg = one vehicle memory. Timeline is append-only.

### Scheduling

| Repo | Steal |
|------|--------|
| [Cal.com](https://github.com/calcom/cal.com) | Confirm/reschedule flows |

**Our rule:** Booking confirms → job exists. Desk copies WhatsApp, we don’t replace it.

### Internal tools

| Repo | Steal |
|------|--------|
| [Budibase](https://github.com/Budibase/budibase) | Admin forms, role-based views |
| [ToolJet](https://github.com/ToolJet/ToolJet) | Quick internal CRUD |

**Our rule:** Tablet-first bay UI, not desk BI.

## Shipped in repo (reference)

| Feature | Where |
|---------|--------|
| Jobs cockpit (queue \| job \| context) | `/admin/jobs` |
| Timeline milestones | `JobMilestoneBar`, `POST /api/jobs/[id]/milestone` |
| Unified search | `GET /api/admin/search`, ⌘/Ctrl+K |
| **Command actions** | ⌘K: mark ready, call, ask AI, open MOT, log parts/called |
| **Attachments lightbox** | `JobAttachmentsGallery` + batch preview API |
| **Vehicle workshop timeline** | `/admin/vehicle/[reg]`, AI grounding in copilot |
| Vehicle intelligence | `VehicleIntelligencePanel`, DVLA |
| Supabase Storage uploads | `lib/supabase/workshop-storage.ts`, private bucket |
| Draft invoice | `JobInvoiceDraftPanel`, `/api/jobs/[id]/invoice` |

## Stabilizing phase — do next (only)

1. MOT queue ranges + Today polish (P3)
2. Vehicle memory card + DVLA sync hints (P4)
3. Unified search grouped results in ⌘K (one reg → everything)

## Do not touch yet

CrewAI, ERP inventory, analytics dashboards, WhatsApp API, AI scheduling.
