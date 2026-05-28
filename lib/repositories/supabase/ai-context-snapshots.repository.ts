import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AiContextSnapshot,
  CreateAiContextSnapshotInput,
} from "@/lib/types/workshop-data";

type SnapshotRow = {
  id: string;
  job_id: string;
  source: "workshop_copilot";
  model: string | null;
  prompt: string | null;
  response: string | null;
  context_json: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
};

function toSnapshot(row: SnapshotRow): AiContextSnapshot {
  return {
    id: row.id,
    jobId: row.job_id,
    source: row.source,
    model: row.model ?? undefined,
    prompt: row.prompt ?? undefined,
    response: row.response ?? undefined,
    contextJson: row.context_json ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function newId() {
  return `aics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseAiContextSnapshotsRepository = {
  async listByJobId(jobId: string): Promise<AiContextSnapshot[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_context_snapshots")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(`[ai_context_snapshots] listByJobId failed: ${error.message}`);
    }
    return (data as SnapshotRow[]).map(toSnapshot);
  },

  async create(input: CreateAiContextSnapshotInput): Promise<AiContextSnapshot> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
      job_id: input.jobId,
      source: input.source ?? "workshop_copilot",
      model: input.model ?? null,
      prompt: input.prompt ?? null,
      response: input.response ?? null,
      context_json: input.contextJson ?? {},
      created_by: input.createdBy,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("ai_context_snapshots")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(`[ai_context_snapshots] create failed: ${error.message}`);
    return toSnapshot(data as SnapshotRow);
  },
};
