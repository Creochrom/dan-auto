/**
 * Workshop copilot provider facade.
 * askCopilot() — LLM reply (Gemini today; AnythingLLM chat later).
 * retrieveWorkshopKnowledge() — RAG chunks (AnythingLLM when enabled).
 */

import { buildCopilotSystemPrompt } from "@/features/copilot/prompts";
import { askCopilotGemini } from "@/lib/copilot/providers/gemini-copilot.provider";
import { retrieveWorkshopKnowledgeFromAnythingLlm } from "@/lib/copilot/providers/anythingllm.provider";
import type {
  CopilotAskParams,
  CopilotAskResult,
  WorkshopKnowledgeChunk,
  WorkshopKnowledgeQuery,
} from "@/lib/copilot/providers/types";

function formatKnowledgeContext(chunks: WorkshopKnowledgeChunk[]): string | undefined {
  if (!chunks.length) return undefined;
  return chunks
    .map((c, i) => {
      const src = c.source ? ` (${c.source})` : "";
      return `[${i + 1}]${src}\n${c.content}`;
    })
    .join("\n\n");
}

function buildUserMessage(params: CopilotAskParams): string {
  const lines = [`Technician request:\n${params.message.trim()}`];
  if (params.context?.trim()) {
    lines.push(`\nAdditional job context:\n${params.context.trim()}`);
  }
  return lines.join("");
}

/** RAG retrieval — AnythingLLM when enabled; otherwise empty (no-op). */
export async function retrieveWorkshopKnowledge(
  query: WorkshopKnowledgeQuery
): Promise<WorkshopKnowledgeChunk[]> {
  return retrieveWorkshopKnowledgeFromAnythingLlm(query);
}

/** Generate copilot reply using configured LLM provider. */
export async function askCopilot(params: CopilotAskParams): Promise<CopilotAskResult> {
  const systemPrompt = buildCopilotSystemPrompt(params.promptKind);
  const knowledgeContext = formatKnowledgeContext(params.knowledgeChunks ?? []);

  // Future: branch to AnythingLLM chat API when enabled and preferred.
  const reply = await askCopilotGemini({
    systemPrompt,
    userMessage: buildUserMessage(params),
    knowledgeContext,
  });

  return {
    reply,
    promptKind: params.promptKind,
    // Gemini generates replies until AnythingLLM chat path is wired.
    provider: "gemini",
    sources: params.knowledgeChunks ?? [],
  };
}
