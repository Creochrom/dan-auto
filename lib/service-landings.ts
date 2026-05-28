export type ServiceLandingSlug =
  | "bmw-diagnostics"
  | "mot-prep"
  | "dpf-issues"
  | "timing-chain";

export type ServiceLanding = {
  slug: ServiceLandingSlug;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  localIntent: string;
  symptoms: string[];
  process: string[];
  whyChooseUs: string[];
  faq: Array<{ q: string; a: string }>;
  ctaLabel: string;
};

export const SERVICE_LANDINGS: ServiceLanding[] = [
  {
    slug: "bmw-diagnostics",
    title: "BMW Diagnostics in Southampton",
    metaTitle: "BMW Diagnostics Southampton",
    metaDescription:
      "BMW diagnostics in Southampton with dealer-level scan tools, live data checks, and clear repair guidance for UK drivers.",
    intro:
      "Warning lights, reduced power, or rough running on your BMW? Our Southampton workshop provides structured diagnostics for BMW petrol and diesel models with practical next steps.",
    localIntent:
      "Serving Southampton and nearby Hampshire areas, we help BMW owners get faults identified quickly before booking major repairs.",
    symptoms: [
      "Engine management light (EML) on or returning",
      "DPF and emissions warnings on diesel BMW models",
      "Misfire, rough idle, or hesitation under load",
      "Transmission or drivetrain warning messages",
    ],
    process: [
      "Initial interview about symptoms, driving pattern, and recent repairs",
      "Dealer-level code scan plus freeze-frame and live-data checks",
      "Targeted physical checks to confirm likely root cause",
      "Clear report with priority order and estimated cost ranges",
    ],
    whyChooseUs: [
      "Independent workshop pricing with premium diagnostics standards",
      "Clear, non-jargon explanation suitable for customer handover",
      "Booking support for follow-up repairs in the same workshop",
    ],
    faq: [
      {
        q: "Do you only work on BMW?",
        a: "No. We work on all makes, but this page is focused on BMW diagnostic cases.",
      },
      {
        q: "Can you guarantee the fault on first visit?",
        a: "No workshop can guarantee every outcome. We provide evidence-led diagnostics and practical next steps.",
      },
    ],
    ctaLabel: "Book BMW diagnostics",
  },
  {
    slug: "mot-prep",
    title: "MOT Prep Checks in Southampton",
    metaTitle: "MOT Prep Southampton",
    metaDescription:
      "MOT preparation checks in Southampton. Reduce avoidable MOT failures with practical pre-test checks and repair planning.",
    intro:
      "If your MOT date is close, an MOT prep check can highlight common fail points before test day. We focus on practical, safety-first checks that matter for UK MOT standards.",
    localIntent:
      "Popular with Southampton drivers who want to avoid repeat visits and unexpected fail items.",
    symptoms: [
      "MOT due soon and unsure about pass condition",
      "Previous advisories on brakes, tyres, or suspension",
      "Concern about warning lights, emissions, or uneven braking",
      "Vehicle has been parked for long periods",
    ],
    process: [
      "Review prior MOT history and known advisory themes",
      "Workshop pre-check of safety and compliance-critical items",
      "Flag urgent defects vs advisory-only observations",
      "Plan MOT booking and any required repairs efficiently",
    ],
    whyChooseUs: [
      "Straightforward prep checks tailored to UK MOT expectations",
      "Honest guidance on what needs immediate attention",
      "MOT booking and repair scheduling in one place",
    ],
    faq: [
      {
        q: "Is MOT prep the same as an MOT test?",
        a: "No. MOT prep is an inspection to reduce surprises before your formal MOT test.",
      },
      {
        q: "Will prep guarantee a pass?",
        a: "No. It reduces risk, but test outcomes depend on the vehicle condition at test time.",
      },
    ],
    ctaLabel: "Book MOT prep",
  },
  {
    slug: "dpf-issues",
    title: "DPF Issues & Diagnostics in Southampton",
    metaTitle: "DPF Issues Southampton",
    metaDescription:
      "DPF issue diagnostics in Southampton for warning lights, limp mode, and regeneration faults. Practical checks before expensive replacements.",
    intro:
      "DPF problems can escalate quickly, especially with repeated short journeys. We assess DPF-related faults with diagnostics and supporting checks before recommending repair options.",
    localIntent:
      "Trusted by Southampton diesel drivers for DPF warning investigation and practical workshop planning.",
    symptoms: [
      "DPF warning lamp or repeated regeneration messages",
      "Limp mode, poor acceleration, or increased fuel use",
      "Frequent short journeys with incomplete regen cycles",
      "Smoke, emissions warnings, or failed emissions checks",
    ],
    process: [
      "Scan fault memory and evaluate soot load / regen status",
      "Check supporting systems that can trigger repeat DPF faults",
      "Assess whether regeneration, cleaning, or deeper repair is needed",
      "Provide a staged plan with indicative cost ranges",
    ],
    whyChooseUs: [
      "Focus on root causes, not just clearing warning lights",
      "Clear guidance on drivability and urgency level",
      "In-house follow-on repair support after diagnostics",
    ],
    faq: [
      {
        q: "Can I keep driving with a DPF warning?",
        a: "It depends on severity. If power is reduced or warnings escalate, avoid long drives and book inspection promptly.",
      },
      {
        q: "Do you guarantee DPF cleaning will fix it?",
        a: "No. Outcomes depend on filter condition and underlying engine/emissions faults.",
      },
    ],
    ctaLabel: "Book DPF diagnostics",
  },
  {
    slug: "timing-chain",
    title: "Timing Chain Noise Checks in Southampton",
    metaTitle: "Timing Chain Checks Southampton",
    metaDescription:
      "Timing chain noise checks and diagnostics in Southampton. Early assessment of rattles, startup noise, and chain-related warning symptoms.",
    intro:
      "Rattling on cold start or timing-related warnings should be checked early. We inspect likely timing chain issues and provide a risk-based repair plan for UK drivers.",
    localIntent:
      "Southampton timing chain diagnostics for drivers who want to avoid major engine damage risk.",
    symptoms: [
      "Rattle on startup, especially from cold",
      "Engine timing correlation or cam/crank fault codes",
      "Rough running with chain-related warning signs",
      "Noise worsening over time or after service interval delays",
    ],
    process: [
      "Symptom review and startup behaviour checks",
      "Diagnostic scan for chain-timing related fault patterns",
      "Targeted mechanical inspection guidance from findings",
      "Repair recommendation with urgency and planning advice",
    ],
    whyChooseUs: [
      "Cautious, evidence-led approach to chain-related diagnosis",
      "Clear urgency advice where safety/engine risk may increase",
      "Local Southampton workshop support from diagnosis to repair",
    ],
    faq: [
      {
        q: "Is startup rattle always a timing chain?",
        a: "Not always. Several faults can sound similar, so diagnostics are important before parts decisions.",
      },
      {
        q: "Can you provide exact repair price immediately?",
        a: "We can provide indicative ranges, but final cost depends on confirmed findings and parts access.",
      },
    ],
    ctaLabel: "Book timing chain check",
  },
];

export function getServiceLanding(slug: ServiceLandingSlug): ServiceLanding {
  const landing = SERVICE_LANDINGS.find((entry) => entry.slug === slug);
  if (!landing) {
    throw new Error(`Unknown service landing slug: ${slug}`);
  }
  return landing;
}
