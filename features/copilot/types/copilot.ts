/**
 * Workshop copilot — shared types (internal admin tool).
 * Server logic lives in lib/services/copilot.service.ts.
 */

export const COPILOT_PROMPT_KINDS = [
  "diagnostics",
  "customer_explanation",
  "workshop_notes",
  "intake_frontdesk_summary",
  "intake_service_category",
] as const;

export type CopilotPromptKind = (typeof COPILOT_PROMPT_KINDS)[number];

export type CopilotJobSnapshot = {
  registration: string;
  symptoms: string;
  notes?: string;
  recentTimeline?: string[];
  vehicleHistory?: string[];
};

export type CopilotAskInput = {
  message: string;
  promptKind: CopilotPromptKind;
  /** Optional technician context (symptoms, reg, job notes). */
  context?: string;
  /** Optional linked workshop job (preferred when available). */
  jobId?: string;
  /** Optional fallback context when no jobId is available. */
  jobSnapshot?: CopilotJobSnapshot;
};

export type WorkshopKnowledgeChunk = {
  content: string;
  source?: string;
  score?: number;
};

export type CopilotAskResult = {
  reply: string;
  promptKind: CopilotPromptKind;
  provider: "gemini" | "anythingllm";
  sources: WorkshopKnowledgeChunk[];
};
