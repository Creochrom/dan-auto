import { aiContextSnapshotsRepository } from "@/lib/repositories/ai-context-snapshots.repository";
import type {
  AiContextSnapshot,
  CreateAiContextSnapshotInput,
} from "@/lib/types/workshop-data";

export const aiContextSnapshotsService = {
  listByJobId(jobId: string): Promise<AiContextSnapshot[]> {
    return aiContextSnapshotsRepository.listByJobId(jobId);
  },

  create(input: CreateAiContextSnapshotInput): Promise<AiContextSnapshot> {
    return aiContextSnapshotsRepository.create(input);
  },
};
