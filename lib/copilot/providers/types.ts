import type {
  CopilotAskResult,
  CopilotPromptKind,
  WorkshopKnowledgeChunk,
} from "@/features/copilot/types/copilot";

export type WorkshopKnowledgeQuery = {
  query: string;
  limit?: number;
};

export type CopilotAskParams = {
  message: string;
  promptKind: CopilotPromptKind;
  context?: string;
  knowledgeChunks?: WorkshopKnowledgeChunk[];
};

export type { CopilotAskResult, WorkshopKnowledgeChunk };
