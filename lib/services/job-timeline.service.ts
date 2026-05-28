import { jobTimelineRepository } from "@/lib/repositories/job-timeline.repository";
import type { JobTimelineEvent } from "@/lib/types/job";
import type {
  CreateTimelineEventInput,
  CreateTimelineStatusEventInput,
} from "@/lib/types/workshop-data";

export const jobTimelineService = {
  listByJobId(jobId: string): Promise<JobTimelineEvent[]> {
    return jobTimelineRepository.listByJobId(jobId);
  },

  addStatusEvent(input: CreateTimelineStatusEventInput): Promise<JobTimelineEvent> {
    return jobTimelineRepository.addStatusEvent(input);
  },

  addEvent(input: CreateTimelineEventInput): Promise<JobTimelineEvent> {
    return jobTimelineRepository.addEvent(input);
  },
};
