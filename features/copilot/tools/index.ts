/**
 * Future tool-calling surface for workshop copilot.
 * Examples: torque lookup, MOT rules, parts catalogue — wired via AnythingLLM or local APIs.
 *
 * Not implemented in foundation phase.
 */

export type CopilotToolId =
  | "torque_lookup"
  | "mot_rules"
  | "repair_manual_search"
  | "workshop_notes_save";

export type CopilotToolDefinition = {
  id: CopilotToolId;
  description: string;
};

/** Placeholder registry — extend when tool calling lands. */
export const COPILOT_TOOLS: CopilotToolDefinition[] = [
  {
    id: "repair_manual_search",
    description: "Search workshop manuals and bulletins (AnythingLLM retrieval).",
  },
  {
    id: "torque_lookup",
    description: "Look up tightening torques for a given fastener / component.",
  },
  {
    id: "mot_rules",
    description: "UK MOT inspection rules and advisories reference.",
  },
  {
    id: "workshop_notes_save",
    description: "Persist generated notes to a job record (future CRM).",
  },
];
