import type { HeroConciergeMode } from "@/lib/types/hero-concierge";
import type { SuggestionChip } from "@/lib/types/intake";
import type { VehicleResult } from "@/lib/types/vehicle";
import { DIAGNOSTIC_TOPIC_ACTIONS } from "@/lib/config/hero-concierge-copy";

export type ModeIntroCopy = {
  title: string;
  body: string;
};

/** Format stored on assistant messages — parsed by ChatMessageBubble for title styling. */
export function formatModeIntroMessage(copy: ModeIntroCopy): string {
  return `${copy.title}\n\n${copy.body}`;
}

const MODE_INTROS: Record<Exclude<HeroConciergeMode, "hub">, ModeIntroCopy> = {
  diagnostic: {
    title: "Vehicle issue",
    body: "Describe what the vehicle is doing — warning lights, noises, smoke, or how it is running. I will ask a few focused questions to understand the issue.",
  },
  pricing: {
    title: "Repair cost guidance",
    body: "Describe the repair or symptom and I will give a rough Southampton estimate. A confirmed quote always needs inspection first.",
  },
  callback: {
    title: "Mechanic callback",
    body: "Tell me what you would like the mechanic to call about. I will check it is suitable for a phone discussion, then take your details.",
  },
  booking: {
    title: "Book MOT or service",
    body: "Tell me whether you need an MOT, interim service, or major service and I will guide you to the right next step.",
  },
  quick_question: {
    title: "Quick question",
    body: "Ask one clear question — urgency, MOT timing, or whether something can wait. Keep it short and I will answer directly.",
  },
};

function repairsContext(vehicle: VehicleResult): string {
  return [vehicle.suggestedRepairs?.join(" ") ?? "", vehicle.aiInsight ?? ""]
    .join(" ")
    .toLowerCase();
}

function chip(id: string, label: string, message: string): SuggestionChip {
  return { id, label, message };
}

/** Opening quick replies per mode — 4 or 8 chips only (visual balance). */
export function getModeOpeningChips(
  mode: Exclude<HeroConciergeMode, "hub">,
  vehicle: VehicleResult
): SuggestionChip[] {
  const ctx = repairsContext(vehicle);

  switch (mode) {
    case "diagnostic": {
      const fromTopics = DIAGNOSTIC_TOPIC_ACTIONS.slice(0, 8).map((a) =>
        chip(`diag-${a.id}`, a.label, a.message)
      );
      if (fromTopics.length >= 8) return fromTopics;
      return fromTopics;
    }

    case "pricing": {
      const chips: SuggestionChip[] = [
        chip("price-brakes", "Brake issue", "I need rough pricing for a brake-related repair."),
        chip("price-suspension", "Suspension noise", "I need a rough price range for a suspension noise concern."),
        chip("price-engine", "Engine issue", "I need an approximate repair range for an engine-related issue."),
        chip("price-electrical", "Electrical issue", "I need rough pricing guidance for an electrical concern."),
      ];
      if (/dpf|egr|emission/.test(ctx)) {
        chips.push(
          chip("price-dpf", "DPF / emissions", "Can you estimate typical Southampton pricing for a DPF or emissions issue?")
        );
      }
      if (/turbo/.test(ctx)) {
        chips.push(
          chip("price-turbo", "Turbo issue", "What is a typical local price range for turbo-related repairs?")
        );
      }
      chips.push(
        chip("price-mot", "MOT repair", "I need a rough estimate for MOT-related repair work.")
      );
      chips.push(
        chip("price-diagnostics", "Diagnostics first", "I would like a rough cost for diagnostics before repair work.")
      );
      return chips.slice(0, 8);
    }

    case "callback":
      return [
        chip("cb-brakes", "Brake concern", "I would like a callback about a brake-related concern."),
        chip("cb-warning", "Warning light", "I would like a callback about a dashboard warning light."),
        chip("cb-noise", "Unusual noise", "I would like a callback about an unusual noise from the vehicle."),
        chip("cb-general", "General question", "I would like a mechanic to call me back about my vehicle."),
      ];

    case "booking":
      return [
        chip("book-mot", "Book MOT", "I need to book an MOT for this vehicle."),
        chip("book-interim", "Interim service", "I would like to book an interim service."),
        chip("book-major", "Major service", "I would like to book a major service."),
        chip("book-unsure", "Not sure yet", "I am not sure whether I need an MOT or a service yet."),
      ];

    case "quick_question":
    default:
      return [
        chip("q-safe", "Safe to drive?", "Is my vehicle safe to drive with this issue?"),
        chip("q-wait", "Can it wait?", "Can this issue wait until next week?"),
        chip("q-cost", "Rough cost?", "What is a rough ballpark cost for this type of work?"),
        chip("q-mot", "MOT timing", "How long does an MOT usually take and when should I book?"),
        chip("q-light", "Warning light", "A warning light is on — how urgent is it?"),
        chip("q-brakes", "Brakes feel wrong", "My brakes feel unusual — how urgent could this be?"),
        chip("q-noise", "Strange noise", "There is a noise I am worried about — what should I do?"),
        chip("q-smoke", "Smoke or smell", "I noticed smoke or a smell — should I stop driving?"),
      ];
  }
}

export function getModeIntro(
  mode: Exclude<HeroConciergeMode, "hub">
): ModeIntroCopy {
  return MODE_INTROS[mode];
}

export function getModeConversationStart(
  mode: Exclude<HeroConciergeMode, "hub">,
  vehicle: VehicleResult
): { message: string; chips: SuggestionChip[] } {
  const intro = getModeIntro(mode);
  return {
    message: formatModeIntroMessage(intro),
    chips: getModeOpeningChips(mode, vehicle),
  };
}

/** Safe-to-drive uses quick_question mode with dedicated intro override. */
export function getSafeToDriveConversationStart(vehicle: VehicleResult): {
  message: string;
  chips: SuggestionChip[];
} {
  const intro: ModeIntroCopy = {
    title: "Safe to drive check",
    body: "Describe what the vehicle is doing and I will help assess whether it may need urgent inspection, or whether short journeys may be okay until checked.",
  };
  return {
    message: formatModeIntroMessage(intro),
    chips: [
      chip("safe-light", "Warning light on", "A dashboard warning light is on."),
      chip("safe-noise", "Strange noise", "There is an unusual noise from the vehicle."),
      chip("safe-smoke", "Smoke or smell", "I have noticed smoke or a burning smell."),
      chip("safe-brakes", "Braking issue", "The brakes do not feel right."),
      chip("safe-steer", "Steering problem", "There is a steering or handling concern."),
      chip("safe-overheat", "Overheating", "The temperature gauge is high or the engine is overheating."),
      chip("safe-wont-start", "Won't start", "The vehicle will not start or struggles to start."),
      chip("safe-other", "Something else", "Something else is wrong and I need drivability guidance."),
    ],
  };
}
