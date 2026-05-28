import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseJobTimelineRepository } from "@/lib/repositories/supabase/job-timeline.repository";
import type { JobTimelineEvent } from "@/lib/types/job";
import type {
  CreateTimelineEventInput,
  CreateTimelineStatusEventInput,
} from "@/lib/types/workshop-data";

const mockTimeline = new Map<string, JobTimelineEvent[]>();

function newId() {
  return `jte_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const jobTimelineRepository = {
  async listByJobId(jobId: string): Promise<JobTimelineEvent[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobTimelineRepository.listByJobId(jobId);
    }
    return (mockTimeline.get(jobId) ?? []).slice().sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  },

  async addStatusEvent(input: CreateTimelineStatusEventInput): Promise<JobTimelineEvent> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobTimelineRepository.addStatusEvent(input);
    }
    const event: JobTimelineEvent = {
      id: newId(),
      jobId: input.jobId,
      eventType: "status_change",
      actor: input.actor,
      fromStatus: input.fromStatus ?? undefined,
      toStatus: input.toStatus,
      note: input.note,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };
    const existing = mockTimeline.get(input.jobId) ?? [];
    mockTimeline.set(input.jobId, [...existing, event]);
    return event;
  },

  async addEvent(input: CreateTimelineEventInput): Promise<JobTimelineEvent> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobTimelineRepository.addEvent(input);
    }
    const event: JobTimelineEvent = {
      id: newId(),
      jobId: input.jobId,
      eventType: input.eventType,
      actor: input.actor,
      note: input.note,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };
    const existing = mockTimeline.get(input.jobId) ?? [];
    mockTimeline.set(input.jobId, [...existing, event]);
    return event;
  },
};
