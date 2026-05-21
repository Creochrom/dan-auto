/**
 * Workshop opening hours — used across site, AI context, and booking UX.
 */

export const openingHours = {
  weekdays: {
    label: "Monday – Friday",
    hours: "8:00 – 17:00",
  },
  saturday: {
    label: "Saturday",
    hours: "8:00 – 13:00",
    note: "Shorter hours — book early for MOT & diagnostics",
  },
  sunday: {
    label: "Sunday",
    hours: "Closed",
  },
  /** Short line for headers / footers */
  summary: "Mon–Fri 8:00–17:00 · Sat 8:00–13:00",
  detail: "Sunday closed",
  /** Legacy-compatible single line */
  legacyHours: "Mon–Sat (Sat until 13:00)",
} as const;
