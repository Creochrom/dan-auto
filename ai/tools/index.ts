/**
 * AI tool definitions for future Gemini function calling.
 * Core chat uses JSON structured intake today; wire tools when CRM actions need function calls.
 */

export type AiToolName =
  | "lookup_vehicle"
  | "create_lead"
  | "create_booking"
  | "request_callback"
  | "handoff_human";

export const aiToolDefinitions = [
  {
    name: "lookup_vehicle" as const,
    description: "Look up UK registration via DVLA/workshop data",
    parameters: { registration: "string" },
  },
  {
    name: "create_lead" as const,
    description: "Save a qualified lead for workshop callback",
    parameters: {
      name: "string",
      phone: "string",
      registration: "string?",
      vehicleModel: "string?",
      problemDescription: "string?",
      preferredDate: "string?",
    },
  },
  {
    name: "create_booking" as const,
    description: "Create a booking request with status 'new'",
    parameters: {
      service: "string",
      registration: "string",
      preferredDate: "string",
      preferredTime: "string",
      customerName: "string",
      customerPhone: "string",
    },
  },
  {
    name: "request_callback" as const,
    description: "Flag customer for urgent human phone callback",
    parameters: { phone: "string", reason: "string" },
  },
  {
    name: "handoff_human" as const,
    description: "End AI flow and notify staff",
    parameters: { summary: "string" },
  },
] as const;
