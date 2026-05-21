export type ServiceDetail = {
  slug: string;
  title: string;
  headline: string;
  process: string[];
  whySuperior: string;
  workshopExample: string;
  typicalDuration: string;
};

export function serviceSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  "mot-testing": {
    slug: "mot-testing",
    title: "MOT Testing",
    headline: "Class 4 MOT with pre-check support",
    process: [
      "Digital booking with your registration pre-loaded",
      "Visual safety inspection to DVSA standards",
      "Emissions and lighting checks on our MOT bay",
      "Clear report with advisories explained in plain English",
      "Free retest guidance if minor items need attention",
    ],
    whySuperior:
      "We combine MOT testing with workshop diagnostics — faults are explained before you leave, not as surprises on the certificate alone.",
    workshopExample:
      "A pre-MOT walk-around catches worn wiper blades and a minor bulb fault before the official test — saving a failed certificate and a second visit.",
    typicalDuration: "45–60 minutes",
  },
  "vehicle-diagnostics": {
    slug: "vehicle-diagnostics",
    title: "Vehicle Diagnostics",
    headline: "Dealer-level fault finding",
    process: [
      "OBD scan across all control modules",
      "Live data review under load where required",
      "Root-cause analysis — not just code clearing",
      "Written report with repair options and pricing",
    ],
    whySuperior:
      "Our technicians trace faults to the failing component, avoiding repeated visits and unnecessary parts.",
    workshopExample:
      "An EGR fault on a diesel Audi traced to a stuck valve and wiring — repaired same week after collection within 20 miles.",
    typicalDuration: "1–2 hours",
  },
  "dpf-cleaning": {
    slug: "dpf-cleaning",
    title: "DPF Deep Clean",
    headline: "Full dismantle — not a quick blast",
    process: [
      "Confirm DPF restriction via live data and pressure tests",
      "Remove the filter assembly from the vehicle",
      "Fully dismantle the DPF core in the workshop",
      "Ultrasonic and manual deep-clean of channels",
      "Reassembly, refit, and forced regeneration / road test",
      "Post-repair data log to confirm flow restored",
    ],
    whySuperior:
      "Many garages only pressure-blast the filter in situ. We dismantle and deep-clean so soot and ash are actually removed — reducing repeat failures.",
    workshopExample:
      "A BMW 320d with recurring limp mode: in-situ blast failed twice. Our dismantle clean restored flow; no replacement DPF required — saving over £800.",
    typicalDuration: "1–2 days",
  },
  "car-servicing": {
    slug: "car-servicing",
    title: "Car Servicing",
    headline: "Manufacturer-schedule servicing",
    process: [
      "Service interval check against your mileage",
      "Genuine or OEM-grade filters and oils",
      "Multi-point safety inspection",
      "Digital service stamp and invoice for resale value",
    ],
    whySuperior:
      "Basic, full, and major packages are scoped honestly — we won't sell major service items your car doesn't need yet.",
    workshopExample:
      "Full service on a high-mileage van includes brake fluid and cambelt age check even when not due — preventing MOT advisories.",
    typicalDuration: "2–5 hours",
  },
  brakes: {
    slug: "brakes",
    title: "Brakes",
    headline: "Safety-first brake workshop",
    process: [
      "Measure pad, disc, and fluid condition",
      "Road test if symptoms reported",
      "Quote before work — pads, discs, fluid as needed",
      "Bedding-in procedure after disc replacement",
    ],
    whySuperior:
      "We replace only what fails inspection — no blanket disc+pads packages unless justified.",
    workshopExample:
      "Mercedes C-Class MOT advisory for rear disc lip — machined and pads replaced same day.",
    typicalDuration: "2–3 hours",
  },
  clutches: {
    slug: "clutches",
    title: "Clutches",
    headline: "Clutch & flywheel specialists",
    process: [
      "Confirm slip, smell, or vibration symptoms",
      "Gearbox removal with transmission support",
      "Dual-mass flywheel inspection — replace if worn",
      "Clutch kit fitted with new bearing and fluid bleed",
    ],
    whySuperior:
      "Flywheel condition is always assessed — preventing premature clutch failure after a cheap kit-only change.",
    workshopExample:
      "Ford Fiesta clutch job completed under £1k where main dealers quoted £2,800+.",
    typicalDuration: "1 day",
  },
  "timing-belts": {
    slug: "timing-belts",
    title: "Timing Belts",
    headline: "Cambelt & tensioner replacement",
    process: [
      "Verify interval by age and mileage",
      "Replace belt, tensioner, and idlers as a kit",
      "Water pump replacement when belt-driven",
      "Timing locked and verified before reassembly",
    ],
    whySuperior:
      "We treat cambelt jobs as engine protection — not a quick belt-only swap that leaves worn tensioners behind.",
    workshopExample:
      "Full cambelt kit on a VW diesel including pump — one visit, no interval guesswork.",
    typicalDuration: "Half–1 day",
  },
  tyres: {
    slug: "tyres",
    title: "Tyres",
    headline: "Supply, fit, and balance",
    process: [
      "Tread and sidewall inspection",
      "Pressure and alignment check",
      "Premium or mid-range options quoted",
      "Torque-set and valve replacement",
    ],
    whySuperior:
      "Correct tyre choice for Southampton weather and your driving style — not upselling unnecessary run-flats.",
    workshopExample:
      "Same-day tyre fitting before MOT — advisory cleared without retest delay.",
    typicalDuration: "30–60 minutes",
  },
  "air-conditioning": {
    slug: "air-conditioning",
    title: "Air Conditioning",
    headline: "A/C recharge & leak detection",
    process: [
      "System pressure and temperature test",
      "Vacuum and leak test on the circuit",
      "Correct refrigerant charge to spec",
      "Cabin filter recommendation if blocked",
    ],
    whySuperior:
      "We find leaks before recharging — so you're not paying for gas that escapes in a week.",
    workshopExample:
      "Summer A/C weak on a family SUV — leak at condenser found, repaired, and re-gassed same day.",
    typicalDuration: "1 hour",
  },
  "exhaust-repairs": {
    slug: "exhaust-repairs",
    title: "Exhaust Repairs",
    headline: "Exhaust & emissions systems",
    process: [
      "Lift inspection of full exhaust route",
      "Section repair or replacement quoted",
      "Welded joints and hanger renewal",
      "Noise and emissions check after repair",
    ],
    whySuperior:
      "Section repairs where safe — full system only when corrosion demands it.",
    workshopExample:
      "Rear silencer replacement on MOT failure — retest passed same afternoon.",
    typicalDuration: "1–3 hours",
  },
  "general-repairs": {
    slug: "general-repairs",
    title: "General Repairs",
    headline: "One-stop workshop repairs",
    process: [
      "Fault reported or found on inspection",
      "Transparent quote with parts options",
      "Repair with photo updates for members",
      "Quality check and invoice",
    ],
    whySuperior:
      "25+ years in Southampton — cars, vans, and complex jobs welcome with honest communication.",
    workshopExample:
      "Gearbox repair completed in one day with collection — customer reported dealer-level smoothness.",
    typicalDuration: "Varies",
  },
};

export function getServiceDetail(title: string): ServiceDetail {
  const slug = serviceSlug(title);
  return (
    SERVICE_DETAILS[slug] ?? {
      slug,
      title,
      headline: "Premium workshop process",
      process: [
        "Book online or call our diagnostics team",
        "Vehicle inspection on arrival",
        "Clear quote before work begins",
        "Repair with quality parts",
        "Final check and digital invoice",
      ],
      whySuperior:
        "Dan Auto Centre combines experienced technicians with transparent pricing — built for drivers who expect dealer care without dealer bills.",
      workshopExample:
        "Every job is logged against your registration for service history and member notifications.",
      typicalDuration: "As quoted",
    }
  );
}
