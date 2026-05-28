import { attachmentsRepository } from "@/lib/repositories/attachments.repository";
import type { CreateJobAttachmentInput, JobAttachment } from "@/lib/types/workshop-data";

export const attachmentsService = {
  listByJobId(jobId: string): Promise<JobAttachment[]> {
    return attachmentsRepository.listByJobId(jobId);
  },

  create(input: CreateJobAttachmentInput): Promise<JobAttachment> {
    return attachmentsRepository.create(input);
  },
};
