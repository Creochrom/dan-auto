import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseAiContextSnapshotsRepository } from "@/lib/repositories/supabase/ai-context-snapshots.repository";
import type {
  AiContextSnapshot,
  CreateAiContextSnapshotInput,
} from "@/lib/types/workshop-data";

const mockSnapshots = new Map<string, AiContextSnapshot[]>();

function newId() {
  return `aics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const aiContextSnapshotsRepository = {
  async listByJobId(jobId: string): Promise<AiContextSnapshot[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseAiContextSnapshotsRepository.listByJobId(jobId);
    }
    return (mockSnapshots.get(jobId) ?? []).slice().sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  },

  async create(input: CreateAiContextSnapshotInput): Promise<AiContextSnapshot> {
    if (getStorageBackend() === "supabase") {
      return supabaseAiContextSnapshotsRepository.create(input);
    }
    const snapshot: AiContextSnapshot = {
      id: newId(),
      jobId: input.jobId,
      source: input.source ?? "workshop_copilot",
      model: input.model,
      prompt: input.prompt,
      response: input.response,
      contextJson: input.contextJson,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    const existing = mockSnapshots.get(input.jobId) ?? [];
    mockSnapshots.set(input.jobId, [snapshot, ...existing]);
    return snapshot;
  },
};
