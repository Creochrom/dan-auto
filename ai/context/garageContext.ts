import { businessConfig } from "@/lib/config/business";
import { openingHours } from "@/lib/config/hours";
import { motPolicy, workshopServices } from "@/lib/config/services";

/**
 * Static workshop context injected into AI system prompts.
 * TODO: Sync with CMS / admin settings when available.
 */
export const garageContext = {
  businessName: businessConfig.shortName,
  location: businessConfig.address.line,
  phone: businessConfig.phone.display,
  email: businessConfig.email,
  hours: {
    weekdays: openingHours.weekdays,
    saturday: openingHours.saturday,
    sunday: openingHours.sunday,
  },
  services: workshopServices.map((s) => ({
    name: s.name,
    description: s.description,
  })),
  motPolicy: {
    eligible: motPolicy.eligible,
    notEligible: motPolicy.notEligible,
    advisory: motPolicy.advisory,
  },
  collectionRadius: "20 miles from Southampton (non-runners)",
  tone: "Premium, calm, trustworthy UK garage concierge — never pushy.",
} as const;

export function formatGarageContextForPrompt(): string {
  return [
    `Workshop: ${garageContext.businessName}`,
    `Address: ${garageContext.location}`,
    `Phone: ${garageContext.phone}`,
    `Hours: ${openingHours.weekdays.label} ${openingHours.weekdays.hours}; ${openingHours.saturday.label} ${openingHours.saturday.hours}; ${openingHours.sunday.label} ${openingHours.sunday.hours}`,
    `Services: ${garageContext.services.map((s) => s.name).join(", ")}`,
    `MOT policy: ${garageContext.motPolicy.eligible.join("; ")}. NOT: ${garageContext.motPolicy.notEligible.join("; ")}`,
    `Collection: ${garageContext.collectionRadius}`,
  ].join("\n");
}
