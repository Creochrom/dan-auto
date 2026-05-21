import type { VehicleInsight } from "./types";

const INSIGHT_POOL: Omit<VehicleInsight, "id">[] = [
  {
    label: "Brake fluid replacement",
    urgency: "soon",
    reason: "Based on age and typical BMW/Audi service intervals.",
  },
  {
    label: "DPF inspection",
    urgency: "monitor",
    reason: "Diesel vehicles in urban use benefit from periodic DPF checks.",
  },
  {
    label: "Battery health check",
    urgency: "routine",
    reason: "Winter and stop-start driving increase battery load.",
  },
  {
    label: "Cambelt interval review",
    urgency: "soon",
    reason: "Manufacturer cambelt limits may be approaching on this year.",
  },
  {
    label: "Air conditioning regas",
    urgency: "routine",
    reason: "Seasonal A/C performance drops without regular service.",
  },
  {
    label: "Suspension bush inspection",
    urgency: "monitor",
    reason: "Advisories often start with worn front/rear bushes.",
  },
];

export function generateGarageInsights(
  makeModel: string,
  meta: string,
  motDays?: number
): VehicleInsight[] {
  const seed =
    makeModel.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
    meta.length * 7;
  const picked: VehicleInsight[] = [];

  for (let i = 0; i < 3; i++) {
    const item = INSIGHT_POOL[(seed + i * 3) % INSIGHT_POOL.length];
    picked.push({ ...item, id: `insight-${i}` });
  }

  if (motDays !== undefined && motDays < 60) {
    picked.unshift({
      id: "mot-urgent",
      label: "MOT due soon",
      urgency: "soon",
      reason: `MOT expires in ${motDays} days — book early for Saturday slots.`,
    });
  }

  if (/diesel/i.test(meta)) {
    picked.push({
      id: "diesel-dpf",
      label: "DPF regeneration check",
      urgency: "monitor",
      reason: "Short journeys can affect diesel particulate filter health.",
    });
  }

  return picked.slice(0, 4);
}
