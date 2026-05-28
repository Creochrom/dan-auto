/**
 * AnythingLLM retrieval provider.
 *
 * Calls the workspace vector-search API to retrieve semantically relevant
 * chunks from the Dan Auto workshop knowledge base (manuals, service guides,
 * MOT procedures, etc.) and maps them to WorkshopKnowledgeChunk[].
 *
 * The retrieved chunks are passed to Gemini copilot as grounding context —
 * no LLM call is made against AnythingLLM itself (retrieval-only path).
 *
 * Env vars (all required when ANYTHINGLLM_ENABLED=true):
 *   ANYTHINGLLM_BASE_URL       e.g. http://localhost:3001
 *   ANYTHINGLLM_API_KEY        generated in AnythingLLM → Settings → API keys
 *   ANYTHINGLLM_WORKSPACE_SLUG e.g. dan-auto-workshop
 *
 * @see lib/copilot/config.ts
 * @see docs/ANYTHINGLLM_SETUP.md
 */

import { getAnythingLlmConfig, isAnythingLlmConfigured } from "@/lib/copilot/config";
import type {
  WorkshopKnowledgeChunk,
  WorkshopKnowledgeQuery,
} from "@/lib/copilot/providers/types";

/** Default minimum similarity score (0–1). Tune up to reduce noise. */
const DEFAULT_SCORE_THRESHOLD = 0.25;
const FALLBACK_SCORE_THRESHOLD = 0;

/** Shape AnythingLLM returns for each matched chunk. */
type AnythingLlmChunk = {
  text?: string;
  pageContent?: string; // older builds use pageContent instead of text
  source?: string;
  metadata?: {
    source?: string;
    title?: string;
    docAuthor?: string;
  };
  score?: number;
  dist?: number; // some vector-db backends return distance instead of score
};

/**
 * Parse whichever response envelope AnythingLLM returns.
 * Confirmed shapes across releases:
 *   { vectorSearchResults: [...] }  — current
 *   { result: [...] }               — seen in some self-hosted builds
 */
function extractChunks(body: unknown): AnythingLlmChunk[] {
  if (!body || typeof body !== "object") return [];
  const b = body as Record<string, unknown>;

  const raw =
    Array.isArray(b.vectorSearchResults)
      ? b.vectorSearchResults
      : Array.isArray(b.result)
        ? b.result
        : [];

  return raw as AnythingLlmChunk[];
}

function toWorkshopChunk(raw: AnythingLlmChunk): WorkshopKnowledgeChunk | null {
  const content = (raw.text ?? raw.pageContent ?? "").trim();
  if (!content) return null;

  // Prefer explicit source, fall back to metadata fields.
  const source =
    raw.source ??
    raw.metadata?.source ??
    raw.metadata?.title ??
    undefined;

  // AnythingLLM returns score (higher = more similar).
  // Some backends return `dist` (lower = more similar); invert so callers
  // can treat score consistently as "higher is better".
  let score: number | undefined;
  if (typeof raw.score === "number") {
    score = raw.score;
  } else if (typeof raw.dist === "number") {
    score = 1 - raw.dist;
  }

  return { content, source, score };
}

/**
 * Retrieve workshop knowledge chunks from AnythingLLM vector workspace.
 * Returns [] when not configured — Gemini copilot still works without RAG.
 */
export async function retrieveWorkshopKnowledgeFromAnythingLlm(
  query: WorkshopKnowledgeQuery
): Promise<WorkshopKnowledgeChunk[]> {
  if (!isAnythingLlmConfigured()) {
    return [];
  }

  const config = getAnythingLlmConfig();
  const topN = query.limit ?? 5;
  const url = `${config.baseUrl.replace(/\/$/, "")}/api/v1/workspace/${config.workspaceSlug}/vector-search`;

  async function runVectorSearch(scoreThreshold: number): Promise<unknown | null> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        query: query.query,
        topN,
        scoreThreshold,
      }),
      // Prevent hanging copilot requests if AnythingLLM is slow/unavailable.
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[anythingllm] vector-search HTTP ${response.status}: ${text.slice(0, 200)}`
      );
      return null;
    }

    return response.json();
  }

  async function searchAndMap(scoreThreshold: number): Promise<WorkshopKnowledgeChunk[]> {
    const body = await runVectorSearch(scoreThreshold);
    const rawChunks = extractChunks(body);
    return rawChunks.flatMap((c) => {
      const chunk = toWorkshopChunk(c);
      return chunk ? [chunk] : [];
    });
  }

  try {
    let chunks = await searchAndMap(DEFAULT_SCORE_THRESHOLD);
    if (chunks.length === 0) {
      chunks = await searchAndMap(FALLBACK_SCORE_THRESHOLD);
    }

    if (chunks.length > 0) {
      console.log(
        `[anythingllm] retrieved ${chunks.length} chunk(s) for query: "${query.query.slice(0, 60)}"`
      );
    }
    return chunks;
  } catch (err) {
    // Network failure, timeout, or JSON parse error — log and degrade gracefully.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[anythingllm] vector-search failed: ${msg}`);
    return [];
  }
}
