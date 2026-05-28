import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { JobTimelineEvent } from "@/lib/types/job";
import type {
  CreateTimelineEventInput,
  CreateTimelineStatusEventInput,
} from "@/lib/types/workshop-data";

type TimelineRow = {
  id: string;
  job_id: string;
  event_type: JobTimelineEvent["eventType"];
  actor: string;
  from_status: JobTimelineEvent["fromStatus"] | null;
  to_status: JobTimelineEvent["toStatus"] | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function toTimelineEvent(row: TimelineRow): JobTimelineEvent {
  return {
    id: row.id,
    jobId: row.job_id,
    eventType: row.event_type,
    actor: row.actor,
    fromStatus: row.from_status ?? undefined,
    toStatus: row.to_status ?? undefined,
    note: row.note ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

function newId() {
  return `jte_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseJobTimelineRepository = {
  async listByJobId(jobId: string): Promise<JobTimelineEvent[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("job_timeline_events")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`[job_timeline] listByJobId failed: ${error.message}`);
    return (data as TimelineRow[]).map(toTimelineEvent);
  },

  async addStatusEvent(input: CreateTimelineStatusEventInput): Promise<JobTimelineEvent> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
      job_id: input.jobId,
      event_type: "status_change",
      actor: input.actor,
      from_status: input.fromStatus ?? null,
      to_status: input.toStatus,
      note: input.note ?? null,
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("job_timeline_events")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(`[job_timeline] addStatusEvent failed: ${error.message}`);
    return toTimelineEvent(data as TimelineRow);
  },

  async addEvent(input: CreateTimelineEventInput): Promise<JobTimelineEvent> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
      job_id: input.jobId,
      event_type: input.eventType,
      actor: input.actor,
      from_status: null,
      to_status: null,
      note: input.note ?? null,
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("job_timeline_events")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(`[job_timeline] addEvent failed: ${error.message}`);
    return toTimelineEvent(data as TimelineRow);
  },
};
