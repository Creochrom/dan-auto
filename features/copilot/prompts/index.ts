import { formatGarageContextForPrompt } from "@/ai/context/garageContext";
import type { CopilotPromptKind } from "@/features/copilot/types/copilot";
import { customerExplanationPrompt } from "@/features/copilot/prompts/customer-explanation";
import { diagnosticsPrompt } from "@/features/copilot/prompts/diagnostics";
import { intakeFrontdeskSummaryPrompt } from "@/features/copilot/prompts/intake-frontdesk-summary";
import { intakeServiceCategoryPrompt } from "@/features/copilot/prompts/intake-service-category";
import { workshopNotesPrompt } from "@/features/copilot/prompts/workshop-notes";

const KIND_PROMPTS: Record<CopilotPromptKind, string> = {
  diagnostics: diagnosticsPrompt,
  customer_explanation: customerExplanationPrompt,
  workshop_notes: workshopNotesPrompt,
  intake_frontdesk_summary: intakeFrontdeskSummaryPrompt,
  intake_service_category: intakeServiceCategoryPrompt,
};

export function buildCopilotSystemPrompt(kind: CopilotPromptKind): string {
  return [
    KIND_PROMPTS[kind],
    "",
    "--- Workshop context ---",
    formatGarageContextForPrompt(),
    "",
    "This tool is for internal staff only — not customer-facing chat.",
  ].join("\n");
}
