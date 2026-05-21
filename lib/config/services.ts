/**
 * Workshop services & MOT eligibility policy.
 */

export const workshopServices = [
  {
    id: "mot",
    name: "MOT Testing",
    description: "Comprehensive MOT testing for eligible passenger vehicles.",
    motEligible: true,
  },
  {
    id: "diagnostics",
    name: "Diagnostics",
    description: "Dealer-grade fault finding and AI-assisted reporting.",
    motEligible: false,
  },
  {
    id: "brakes",
    name: "Brake Repairs",
    description: "Pads, discs, fluid, and safety inspections.",
    motEligible: false,
  },
  {
    id: "servicing",
    name: "Servicing",
    description: "Interim and full manufacturer-schedule servicing.",
    motEligible: false,
  },
  {
    id: "dpf",
    name: "DPF Cleaning",
    description: "Professional diesel particulate filter cleaning.",
    motEligible: false,
  },
] as const;

export const motPolicy = {
  title: "Standard passenger vehicles only",
  eligible: [
    "Standard cars and passenger vehicles",
    "Private use vehicles within standard MOT class",
  ],
  notEligible: [
    "Vans and light commercial vehicles",
    "Class 4 commercial MOT vehicles",
    "Heavy commercial or specialist fleet vehicles",
  ],
  advisory:
    "Unsure if we can MOT your vehicle? Message us on WhatsApp or use the AI assistant before booking.",
} as const;

export const bookingServiceOptions = [
  "MOT",
  "Diagnostics",
  "Brakes",
  "Servicing — interim",
  "Servicing — full",
  "DPF cleaning",
  "General repair",
  "Air conditioning",
] as const;

export const bookingDurations = [
  { value: "1h", label: "Up to 1 hour" },
  { value: "2h", label: "Up to 2 hours" },
  { value: "half-day", label: "Half day" },
  { value: "full-day", label: "Full day" },
] as const;

export const bookingTimeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

/** Half-hour grid for online booking intake */
export const bookingTimeSlotsDetailed = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;
