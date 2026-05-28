/**
 * Gemini provider for internal workshop copilot (plain text — not customer JSON intake).
 * Separate from lib/services/gemini.service.ts (service advisor contract).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { isGeminiConfigured } from "@/lib/config/advisor";

const DEFAULT_MODEL = "gemini-2.5-flash";

function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export async function askCopilotGemini(params: {
  systemPrompt: string;
  userMessage: string;
  knowledgeContext?: string;
}): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const apiKey = process.env.GEMINI_API_KEY!.trim();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getModelName(),
    systemInstruction: params.systemPrompt,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  });

  const parts: string[] = [];
  if (params.knowledgeContext?.trim()) {
    parts.push(`--- Retrieved workshop knowledge ---\n${params.knowledgeContext.trim()}\n---`);
  }
  parts.push(params.userMessage);

  const result = await model.generateContent(parts.join("\n\n"));
  const text = result.response.text()?.trim();
  if (!text) {
    throw new Error("Empty response from Gemini copilot");
  }
  return text;
}
