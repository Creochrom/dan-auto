# Data Model — Job-Centric (v1)

Workshop data is centered on `jobs`. Bookings/leads remain intake-side records; execution-side state lives on/around jobs.

## Core Relationships

- `vehicles (1) -> (many) jobs`
- `vehicles (1) -> (many) vehicle_timeline_events`
- `customers (1) -> (many) jobs`
- `bookings (0..1) -> (0..1) jobs` via `jobs.booking_id` (confirmed booking can create one job)
- `jobs (1) -> (many) job_timeline_events`
- `jobs (1) -> (many) attachments`
- `jobs (1) -> (0..1) invoices` (draft-only in v1)
- `jobs (1) -> (many) ai_context_snapshots` (optional, Workshop AI only)

Bookings are also linked to canonical `vehicle_id` and `customer_id` for consistent identity.

## Identity Rules

- **Vehicle identity:** `vehicles.registration_canonical` (uppercase stripped alnum) is unique.
- **Vehicle display:** `vehicles.registration` stores formatted uppercase display form.
- **Customer identity:** stable `customers.id` generated from normalized name+phone key in repository layer.
- **Job center rule:** customer/vehicle business state must be attached to `jobs` and linked entities, not duplicated in localStorage.

## Status Enums

- `jobs.status`
  - `booked`
  - `checked_in`
  - `diagnosing`
  - `awaiting_approval`
  - `awaiting_parts`
  - `in_progress`
  - `quality_check`
  - `ready_for_collection`
  - `collected`
  - `cancelled`

- `job_timeline_events.event_type`
  - `status_change`
  - `note`
  - `attachment_added`
  - `invoice_draft_created`
  - `invoice_draft_updated`
  - `ai_snapshot`
  - `system`

- `vehicle_timeline_events.event_type`
  - `mot_test`
  - `job_status_change`
  - `system`

- `attachments.kind`
  - `photo`
  - `document`

- `invoices.status`
  - `draft` (v1 only)

- `ai_context_snapshots.source`
  - `workshop_copilot` (explicitly internal Workshop AI)

## AI Boundary

- Customer AI (`/api/chat`) and Workshop AI (`/api/copilot`) stay separate by design.
- `ai_context_snapshots` is for Workshop AI context only and must not be reused as customer chat memory.
