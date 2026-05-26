/**
 * Service advisor engine selection.
 * Default: Gemini. Set ADVISOR_ENGINE=rules only for local testing without an API key.
 */

export type AdvisorEngine = "gemini" | "rules";

export function getAdvisorEngine(): AdvisorEngine {
  const mode = process.env.ADVISOR_ENGINE?.trim().toLowerCase();
  if (mode === "rules") return "rules";
  return "gemini";
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
