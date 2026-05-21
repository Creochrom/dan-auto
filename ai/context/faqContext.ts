import { businessConfig } from "@/lib/config/business";

/**
 * FAQ knowledge base for assistant — expand over time.
 * TODO: Load from database / admin CMS.
 */

export const faqEntries = [
  {
    q: "Do you MOT vans?",
    a: "We MOT standard cars and passenger vehicles only — not vans, commercial vehicles, or Class 4 commercial MOT. Message us your reg if you're unsure.",
  },
  {
    q: "What are your Saturday hours?",
    a: "Saturday we are open 8:00–13:00 (shorter day). Monday–Friday 8:00–17:00. Sunday closed.",
  },
  {
    q: "How do I book?",
    a: `Book online on our website, use the service advisor chat, call ${businessConfig.phone.display}, or WhatsApp us. We'll confirm your slot by phone.`,
  },
  {
    q: "Do you collect non-running cars?",
    a: "Yes — complimentary collection within 20 miles of Southampton for non-runners.",
  },
  {
    q: "What services do you offer?",
    a: "MOT (eligible passenger vehicles), diagnostics, brakes, servicing, DPF cleaning, and general repairs for BMW, Audi, Mercedes, VW and all makes.",
  },
] as const;

export function formatFaqForPrompt(): string {
  return faqEntries.map((e) => `Q: ${e.q}\nA: ${e.a}`).join("\n\n");
}
