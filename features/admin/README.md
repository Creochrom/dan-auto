# Admin & CRM (Phase 2+)

Scalable module layout — not fully implemented in Phase 1.

```
features/admin/
  dashboard/       → KPIs, workshop overview
  bookings/        → Status pipeline, calendar (uses /api/bookings)
  leads/           → Inbox, qualification (uses /api/leads)
  customers/       → Customer records, vehicle history
  crm/             → Pipelines, notes, assignments
  ai-summaries/    → Per-lead/session Gemini summaries
```

Routes today:

- `/admin` — Workshop OS (legacy enterprise dashboard)
- `/admin/bookings` — Booking list from mock API
- `/admin/leads` — Lead inbox from mock API

TODO: Unified admin shell, auth middleware, Supabase sync.
