# Booking intake (AI-assisted)

## Flow

1. **Schedule** — service, date, time (`BookingSlotStep`)
2. **Intake** — modal opens with service advisor chat + media upload (`BookingIntakeModal`)
3. **Send** — `POST /api/booking-intake` creates booking + prepares email payload

## Modules

| Path | Role |
|------|------|
| `BookingIntakeFlow.tsx` | Homepage section orchestration |
| `hooks/useBookingIntakeChat.ts` | Chat with `bookingContext` |
| `hooks/useMediaUpload.ts` | Client upload queue + progress |
| `lib/services/booking-intake.service.ts` | Finalize summary + booking |
| `lib/email/` | Templates + `prepareBookingIntakeEmail` (no SMTP yet) |
| `lib/services/upload.service.ts` | Mock storage (Supabase later) |

## Future

- Gemini for chat + Vision on uploads
- Supabase storage + CRM mechanic panel
- Send prepared email via transactional provider
