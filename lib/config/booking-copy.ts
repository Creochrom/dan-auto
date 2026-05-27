/**
 * Booking intake UX copy — conversational, non-robotic.
 */

export const BOOKING_INTAKE_COPY = {
  eyebrow: "Workshop booking",
  title: "Book your visit",
  description:
    "Choose your service and preferred slot, then send your request. Our team will call you back to confirm — no AI chat required.",
  scheduleStep: "Choose your visit",
  intakeStep: "Your details",
  confirmStep: "Review & send",
  serviceLabel: "What do you need?",
  dateLabel: "Preferred date",
  timeLabel: "Preferred time",
  submitBooking: "Send booking request",
  needHelpFirst: "Need help first? Talk to the service advisor",
  registrationLabel: "Registration",
  registrationRemembered: "Registration remembered",
  nameLabel: "Your name",
  phoneLabel: "Phone number",
  emailLabel: "Email (optional)",
  notesLabel: "Notes (optional)",
  submittingBooking: "Sending request…",
  uploadHint:
    "Photos and short videos help our technicians — dashboard warning lights, unusual noises, leaks, smoke, body damage, or tyre wear.",
  uploadExamples: [
    "Warning lights",
    "Noises",
    "Leaks",
    "Smoke",
    "Damage",
    "Tyre wear",
  ] as const,
  uploadButton: "Add photos or video",
  uploadDrop: "Drop files here or tap to browse",
  modalTitle: "Service advisor",
  modalSubtitle: "Intelligent intake for your booking",
  submitRequest: "Send request to workshop",
  submitting: "Sending to our team…",
  successTitle: "Request received",
  successBody:
    "A mechanic will review your notes and call you back to confirm your slot. Indicative guidance is not a fixed quote until we've inspected the vehicle.",
  disclaimer:
    "Rough guidance only — not a diagnosis or guaranteed price. Our technician confirms after inspection.",
  reopenIntake: "Add more detail",
  changeSlot: "Change date or time",
} as const;
