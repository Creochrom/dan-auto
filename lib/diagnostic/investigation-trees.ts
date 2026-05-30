/**
 * Symptom-specific diagnostic investigation — drives missing-field checks
 * and minimum depth before terminal handoff chips appear.
 */

import type { ChatMessage } from "@/lib/types/chat";
import type { StructuredIntake } from "@/lib/types/structured-intake";

export type PrimarySymptomCategory =
  | "warning_light"
  | "noise"
  | "smoke"
  | "overheating"
  | "poor_performance"
  | "electrical"
  | "starting"
  | "brakes"
  | "general";

export type DiagnosticConfidence = "low" | "medium" | "high";

type InvestigationField = {
  id: string;
  /** Human label for WORKFLOW_VALIDATION / advisor prompts */
  label: string;
  satisfied: (intake: StructuredIntake) => boolean;
};

type InvestigationTree = {
  category: PrimarySymptomCategory;
  label: string;
  /** Minimum investigation fields satisfied before diagnostic summary */
  minFields: number;
  fields: InvestigationField[];
};

function textPool(intake: StructuredIntake): string {
  return [
    intake.issue.primarySymptom ?? "",
    ...intake.issue.symptoms,
    ...(intake.issue.drivingSymptoms ?? []),
    ...intake.issue.warningLights,
    intake.issue.startedWhen,
    intake.aiEstimate.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matches(pool: string, pattern: RegExp): boolean {
  return pattern.test(pool);
}

function hasTimeline(intake: StructuredIntake): boolean {
  if (intake.issue.startedWhen.trim()) return true;
  const pool = textPool(intake);
  return matches(
    pool,
    /\b(today|yesterday|this week|last week|few days|few weeks|month|months|recently|since|started|appeared|intermittent|constant|always|sometimes|on and off|while ago)\b/
  );
}

function hasDrivability(intake: StructuredIntake): boolean {
  return intake.issue.drivable === true || intake.issue.drivable === false;
}

function hasWarningLights(intake: StructuredIntake): boolean {
  return intake.issue.warningLights.length > 0 || matches(textPool(intake), /\b(warning light|eml|engine light|abs|dpf|coolant|oil pressure|battery light)\b/);
}

const COMMON_FIELDS: InvestigationField[] = [
  {
    id: "timeline",
    label: "when it started",
    satisfied: hasTimeline,
  },
  {
    id: "drivability",
    label: "whether it is safe to drive",
    satisfied: hasDrivability,
  },
];

const TREES: InvestigationTree[] = [
  {
    category: "warning_light",
    label: "Warning light",
    minFields: 4,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "which_light",
        label: "which warning light",
        satisfied: (i) =>
          hasWarningLights(i) ||
          matches(textPool(i), /\b(engine|eml|abs|brake|battery|oil|coolant|airbag|tyre|tpms)\b/),
      },
      {
        id: "steady_or_flash",
        label: "steady or flashing",
        satisfied: (i) => matches(textPool(i), /\b(steady|flash|flashing|intermittent|constant|on and off)\b/),
      },
      {
        id: "power_loss",
        label: "loss of power or rough running",
        satisfied: (i) =>
          matches(textPool(i), /\b(power|limp|rough|stall|normal|drives ok|drives normally|no power loss)\b/),
      },
      {
        id: "noise_smoke",
        label: "unusual noises or smoke",
        satisfied: (i) =>
          matches(textPool(i), /\b(noise|knock|rattle|smoke|none|no smoke|no unusual)\b/),
      },
      {
        id: "recent_repairs",
        label: "recent repairs or work",
        satisfied: (i) =>
          matches(textPool(i), /\b(recent|repair|serviced|work done|nothing recent|no recent|not sure)\b/),
      },
    ],
  },
  {
    category: "noise",
    label: "Unusual noise",
    minFields: 4,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "location",
        label: "front or rear / location",
        satisfied: (i) => matches(textPool(i), /\b(front|rear|under|bonnet|wheel|engine bay|inside|cabin)\b/),
      },
      {
        id: "moving_or_static",
        label: "while moving or stationary",
        satisfied: (i) => matches(textPool(i), /\b(moving|stationary|idle|parked|at standstill|while driving)\b/),
      },
      {
        id: "braking",
        label: "related to braking",
        satisfied: (i) => matches(textPool(i), /\b(brak|when stopping|not when braking|no braking)\b/),
      },
      {
        id: "turning",
        label: "related to turning",
        satisfied: (i) => matches(textPool(i), /\b(turn|corner|straight|not when turning)\b/),
      },
      {
        id: "speed",
        label: "speed related",
        satisfied: (i) => matches(textPool(i), /\b(speed|motorway|slow|fast|higher speed|low speed|constant speed)\b/),
      },
    ],
  },
  {
    category: "overheating",
    label: "Overheating",
    minFields: 4,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "steam",
        label: "steam visible",
        satisfied: (i) => matches(textPool(i), /\b(steam|no steam|not seen)\b/),
      },
      {
        id: "coolant_leak",
        label: "coolant leak",
        satisfied: (i) => matches(textPool(i), /\b(coolant|leak|puddle|no leak|dry)\b/),
      },
      {
        id: "temp_warning",
        label: "temperature warning light",
        satisfied: (i) =>
          hasWarningLights(i) ||
          matches(textPool(i), /\b(temperature|temp warning|red zone|gauge|overheat)\b/),
      },
    ],
  },
  {
    category: "smoke",
    label: "Smoke or smell",
    minFields: 3,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "smoke_colour",
        label: "smoke colour or source",
        satisfied: (i) => matches(textPool(i), /\b(white|blue|black|exhaust|bonnet|burning smell|smell)\b/),
      },
      {
        id: "when_smoke",
        label: "when smoke appears",
        satisfied: (i) =>
          hasTimeline(i) ||
          matches(textPool(i), /\b(startup|cold|accelerat|idle|all the time|only when)\b/),
      },
    ],
  },
  {
    category: "poor_performance",
    label: "Poor performance",
    minFields: 3,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "power",
        label: "power loss or hesitation",
        satisfied: (i) => matches(textPool(i), /\b(power|hesitat|sluggish|limp|misfire|rough)\b/),
      },
      {
        id: "when_worse",
        label: "when it is worse",
        satisfied: (i) =>
          matches(textPool(i), /\b(cold|warm|accelerat|uphill|motorway|idle|constant|intermittent)\b/),
      },
      {
        id: "warning_lights",
        label: "warning lights",
        satisfied: (i) =>
          hasWarningLights(i) ||
          matches(textPool(i), /\b(no light|no warning|engine light|eml)\b/),
      },
    ],
  },
  {
    category: "electrical",
    label: "Electrical issue",
    minFields: 3,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "what_fails",
        label: "what stops working",
        satisfied: (i) =>
          matches(textPool(i), /\b(lights|radio|window|lock|battery|fuse|dash|screen|intermittent)\b/),
      },
      {
        id: "starting_related",
        label: "starting or charging",
        satisfied: (i) =>
          matches(textPool(i), /\b(start|crank|charge|alternator|flat battery|click)\b/),
      },
    ],
  },
  {
    category: "starting",
    label: "Starting issue",
    minFields: 3,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "crank_pattern",
        label: "crank / click pattern",
        satisfied: (i) =>
          matches(textPool(i), /\b(crank|click|turn over|nothing|dead|slow crank|intermittent)\b/),
      },
      {
        id: "when_fails",
        label: "when it fails to start",
        satisfied: (i) =>
          hasTimeline(i) ||
          matches(textPool(i), /\b(cold|hot|overnight|morning|after driving|random)\b/),
      },
    ],
  },
  {
    category: "brakes",
    label: "Brakes",
    minFields: 3,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "when_braking",
        label: "when braking vs driving",
        satisfied: (i) => matches(textPool(i), /\b(brak|when stopping|while driving|at speed|light braking)\b/),
      },
      {
        id: "feel",
        label: "pedal feel or pull",
        satisfied: (i) =>
          matches(textPool(i), /\b(spongy|hard|pull|vibrat|grind|squeal|soft pedal)\b/),
      },
      {
        id: "abs_light",
        label: "ABS or brake warning",
        satisfied: (i) =>
          hasWarningLights(i) ||
          matches(textPool(i), /\b(abs|brake light|no warning|no light)\b/),
      },
    ],
  },
  {
    category: "general",
    label: "Vehicle issue",
    minFields: 3,
    fields: [
      ...COMMON_FIELDS,
      {
        id: "context",
        label: "when or how it happens",
        satisfied: (i) =>
          hasTimeline(i) ||
          matches(textPool(i), /\b(when|while|during|always|sometimes|only|mainly)\b/),
      },
      {
        id: "warning_lights",
        label: "warning lights",
        satisfied: (i) =>
          hasWarningLights(i) ||
          matches(textPool(i), /\b(no light|no warning|warning light)\b/),
      },
    ],
  },
];

const CATEGORY_PATTERNS: Array<{ category: PrimarySymptomCategory; pattern: RegExp }> = [
  { category: "overheating", pattern: /\b(overheat|overheating|temperature warning|coolant|steam|boiling)\b/i },
  { category: "warning_light", pattern: /\b(warning light|dashboard light|engine light|eml|check engine|abs light|dpf light)\b/i },
  { category: "noise", pattern: /\b(noise|knock|rattle|grind|squeal|whine|clunk|buzz|hum)\b/i },
  { category: "smoke", pattern: /\b(smoke|smell|burning smell|exhaust smoke)\b/i },
  { category: "brakes", pattern: /\b(brake|braking|pedal|abs)\b/i },
  { category: "starting", pattern: /\b(won.?t start|not starting|starting issue|crank|click.*start|immobiliser)\b/i },
  { category: "electrical", pattern: /\b(electrical|battery|alternator|fuse|lights out|dead battery)\b/i },
  { category: "poor_performance", pattern: /\b(power loss|limp|misfire|rough running|sluggish|poor performance|stall)\b/i },
];

export function detectPrimarySymptom(
  intake: StructuredIntake,
  messages?: ChatMessage[]
): PrimarySymptomCategory {
  const explicit = intake.issue.primarySymptom?.trim().toLowerCase() ?? "";
  if (explicit) {
    const fromExplicit = TREES.find(
      (t) => t.label.toLowerCase() === explicit || t.category.replace(/_/g, " ") === explicit
    );
    if (fromExplicit) return fromExplicit.category;
  }

  const pool = [
    textPool(intake),
    ...(messages ?? [])
      .filter((m) => m.role === "user")
      .slice(-6)
      .map((m) => m.content.toLowerCase()),
  ].join(" ");

  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(pool)) return category;
  }

  return "general";
}

export function getInvestigationTree(category: PrimarySymptomCategory): InvestigationTree {
  return TREES.find((t) => t.category === category) ?? TREES[TREES.length - 1]!;
}

export function getInvestigationMissingFields(intake: StructuredIntake): string[] {
  const category = detectPrimarySymptom(intake);
  const tree = getInvestigationTree(category);
  return tree.fields.filter((f) => !f.satisfied(intake)).map((f) => f.label);
}

export function countInvestigationFieldsSatisfied(intake: StructuredIntake): number {
  const tree = getInvestigationTree(detectPrimarySymptom(intake));
  return tree.fields.filter((f) => f.satisfied(intake)).length;
}

export function investigationDepthMet(intake: StructuredIntake): boolean {
  const tree = getInvestigationTree(detectPrimarySymptom(intake));
  const satisfied = tree.fields.filter((f) => f.satisfied(intake)).length;
  return satisfied >= tree.minFields;
}

export function inferDiagnosticConfidence(intake: StructuredIntake): DiagnosticConfidence {
  const explicit = intake.aiEstimate.diagnosticConfidence?.trim().toLowerCase();
  if (explicit === "low" || explicit === "medium" || explicit === "high") {
    return explicit;
  }

  const causes = intake.aiEstimate.possibleCauses.filter(Boolean).length;
  const satisfied = countInvestigationFieldsSatisfied(intake);
  const tree = getInvestigationTree(detectPrimarySymptom(intake));
  const hasSeverity = Boolean(intake.issue.severity.trim() || intake.aiEstimate.urgencyLevel.trim());
  const hasDriv = hasDrivability(intake);

  if (
    causes >= 2 &&
    satisfied >= tree.minFields &&
    hasSeverity &&
    hasDriv &&
    intake.issue.symptoms.length >= 1
  ) {
    return causes >= 3 && satisfied >= tree.minFields + 1 ? "high" : "medium";
  }

  if (causes >= 1 && satisfied >= 2) return "medium";
  return "low";
}

export function estimateBridgeReady(intake: StructuredIntake): boolean {
  const confidence = inferDiagnosticConfidence(intake);
  return (
    confidence !== "low" &&
    intake.aiEstimate.possibleCauses.filter(Boolean).length >= 1 &&
    hasDrivability(intake)
  );
}

export function primarySymptomLabel(category: PrimarySymptomCategory): string {
  return getInvestigationTree(category).label;
}
