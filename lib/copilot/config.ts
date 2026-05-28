/**
 * AnythingLLM integration config (foundation placeholders).
 * AnythingLLM is expected to run separately (e.g. Docker) — not embedded in Next.js.
 *
 * Env vars (optional until integration):
 *   ANYTHINGLLM_ENABLED=true
 *   ANYTHINGLLM_BASE_URL=http://localhost:3001
 *   ANYTHINGLLM_API_KEY=
 *   ANYTHINGLLM_WORKSPACE_SLUG=dan-auto-workshop
 */

export type AnythingLlmConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  workspaceSlug: string;
};

export function getAnythingLlmConfig(): AnythingLlmConfig {
  return {
    enabled: process.env.ANYTHINGLLM_ENABLED?.trim().toLowerCase() === "true",
    baseUrl: process.env.ANYTHINGLLM_BASE_URL?.trim() ?? "",
    apiKey: process.env.ANYTHINGLLM_API_KEY?.trim() ?? "",
    workspaceSlug:
      process.env.ANYTHINGLLM_WORKSPACE_SLUG?.trim() || "dan-auto-workshop",
  };
}

export function isAnythingLlmConfigured(): boolean {
  const c = getAnythingLlmConfig();
  return c.enabled && Boolean(c.baseUrl) && Boolean(c.apiKey);
}
