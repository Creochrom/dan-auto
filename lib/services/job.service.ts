/**
 * Workshop job orchestration — Workshop OS v1.
 *
 * Creating a job from a booking:
 *   When a booking is confirmed (status → "confirmed"), the admin can create
 *   a linked job via POST /api/jobs with { bookingId }. The booking and job
 *   are kept as separate entities — bookings represent customer requests,
 *   jobs represent workshop work in progress.
 *
 *   Call pattern (done by the admin route, not automatic):
 *     jobService.create({
 *       bookingId:     booking.id,
 *       registration:  booking.registration,
 *       customerName:  booking.customerName,
 *       customerPhone: booking.customerPhone,
 *       service:       booking.service,
 *       scheduledDate: booking.preferredDate,
 *       symptomsText:  booking.notes,
 *       status:        "booked",
 *     })
 *
 * Status transitions are recorded as immutable audit events in job_status_events.
 * Notes are append-only; no note can be edited or deleted.
 */

import { jobsRepository } from "@/lib/repositories/jobs.repository";
import {
  WORKSHOP_MILESTONES,
  type WorkshopMilestoneId,
} from "@/lib/workshop/job-milestones";
import { vehicleTimelineService } from "@/lib/services/vehicle-timeline.service";
import type {
  JobAttachment,
  Job,
  JobNote,
  JobStatus,
  JobTimelineEvent,
  JobWithDetails,
  JobWithNotes,
  CreateJobInput,
  UpdateJobInput,
  AddJobNoteInput,
  JobListFilters,
} from "@/lib/types/job";

function titleCaseWords(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const jobService = {
  async list(filters: JobListFilters): Promise<Job[]> {
    return jobsRepository.list(filters);
  },

  async listByRegistration(registration: string): Promise<Job[]> {
    return jobsRepository.listByRegistration(registration);
  },

  async findById(id: string): Promise<Job | undefined> {
    return jobsRepository.findById(id);
  },

  async findByIdWithNotes(id: string): Promise<JobWithNotes | undefined> {
    return jobsRepository.findByIdWithNotes(id);
  },

  async findByIdWithDetails(id: string): Promise<JobWithDetails | undefined> {
    return jobsRepository.findByIdWithDetails(id);
  },

  async create(input: CreateJobInput): Promise<Job> {
    const created = await jobsRepository.create(input);
    await jobsRepository
      .addTimelineEvent({
        jobId: created.id,
        eventType: "system",
        actor: "system",
        note: input.bookingId
          ? "Job created from confirmed booking"
          : "Job created",
        metadata: input.bookingId ? { bookingId: input.bookingId } : {},
      })
      .catch((err) => {
        console.error("[job.service] addTimelineEvent(create) failed:", err);
      });
    return created;
  },

  /**
   * Update job fields. When status changes, writes an audit event.
   * changedBy defaults to "admin" (routes pass the session login when available).
   */
  async update(
    id: string,
    patch: UpdateJobInput,
    changedBy = "admin"
  ): Promise<Job | null> {
    const before = await jobsRepository.findById(id);
    if (!before) return null;

    const updated = await jobsRepository.update(id, patch);
    if (!updated) return null;

    const nonStatusChanges: string[] = [];
    if (patch.notesText !== undefined && patch.notesText !== before.notesText) {
      nonStatusChanges.push("notesText");
    }
    if (patch.symptomsText !== undefined && patch.symptomsText !== before.symptomsText) {
      nonStatusChanges.push("symptomsText");
    }
    if (patch.assignedTo !== undefined && patch.assignedTo !== before.assignedTo) {
      nonStatusChanges.push("assignedTo");
    }

    if (patch.status && patch.status !== before.status) {
      await jobsRepository
        .recordStatusEvent(id, before.status, patch.status, changedBy)
        .catch((err) => {
          // Status event failure must not block the update response.
          console.error("[job.service] recordStatusEvent failed:", err);
        });
      await jobsRepository
        .addTimelineEvent({
          jobId: id,
          eventType: "status_change",
          actor: changedBy,
          fromStatus: before.status,
          toStatus: patch.status,
          metadata: {},
        })
        .catch((err) => {
          console.error("[job.service] addTimelineEvent(status_change) failed:", err);
        });
      if (before.vehicleId) {
        await vehicleTimelineService
          .upsertEventBySourceRef({
            vehicleId: before.vehicleId,
            eventType: "job_status_change",
            source: "job_status_event",
            sourceRef: `job_status:${id}:${patch.status}:${updated.updatedAt}`,
            title: `Job status: ${titleCaseWords(patch.status)}`,
            description: `Job ${id} moved from ${titleCaseWords(before.status)} to ${titleCaseWords(patch.status)}.`,
            eventAt: updated.updatedAt,
            metadata: {
              jobId: id,
              actor: changedBy,
              fromStatus: before.status,
              toStatus: patch.status,
            },
          })
          .catch((err) => {
            console.error("[job.service] vehicleTimeline(status_change) failed:", err);
          });
      }
    }

    if (nonStatusChanges.length > 0) {
      await jobsRepository
        .addTimelineEvent({
          jobId: id,
          eventType: "system",
          actor: changedBy,
          note: `Job updated: ${nonStatusChanges.join(", ")}`,
          metadata: { changedFields: nonStatusChanges },
        })
        .catch((err) => {
          console.error("[job.service] addTimelineEvent(update_fields) failed:", err);
        });
    }

    return updated;
  },

  async addNote(input: AddJobNoteInput): Promise<JobNote> {
    const note = await jobsRepository.addNote(input);
    await jobsRepository
      .addTimelineEvent({
        jobId: input.jobId,
        eventType: "note",
        actor: input.author,
        note: input.body,
        metadata: { source: input.source ?? "human", noteId: note.id },
      })
      .catch((err) => {
        console.error("[job.service] addTimelineEvent(note) failed:", err);
      });
    return note;
  },

  async logMilestone(
    jobId: string,
    milestoneId: WorkshopMilestoneId,
    actor: string
  ): Promise<JobTimelineEvent | null> {
    const job = await jobsRepository.findById(jobId);
    if (!job) return null;

    const def = WORKSHOP_MILESTONES[milestoneId];
    if (def.setStatus && job.status !== def.setStatus) {
      await this.update(jobId, { status: def.setStatus }, actor);
    }

    return jobsRepository.addTimelineEvent({
      jobId,
      eventType: "system",
      actor,
      note: def.label,
      metadata: { milestone: milestoneId },
    });
  },

  async addAttachment(input: {
    jobId: string;
    uploadId?: string;
    kind: "photo" | "document";
    fileName: string;
    mimeType?: string;
    sizeBytes?: number;
    storagePath?: string;
    uploadedBy: string;
  }): Promise<JobAttachment> {
    const attachment = await jobsRepository.addAttachment(input);
    await jobsRepository
      .addTimelineEvent({
        jobId: input.jobId,
        eventType: "attachment_added",
        actor: input.uploadedBy,
        note: `${input.kind}: ${input.fileName}`,
        metadata: {
          attachmentId: attachment.id,
          uploadId: input.uploadId,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        },
      })
      .catch((err) => {
        console.error("[job.service] addTimelineEvent(attachment) failed:", err);
      });
    return attachment;
  },

  async ensureBookingJob(input: {
    bookingId: string;
    registration: string;
    customerName: string;
    customerPhone: string;
    service: string;
    scheduledDate?: string;
    symptomsText?: string;
    actor?: string;
  }): Promise<{ job: Job; created: boolean }> {
    const existing = await jobsRepository.findByBookingId(input.bookingId);
    if (existing) return { job: existing, created: false };

    const job = await this.create({
      bookingId: input.bookingId,
      registration: input.registration,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      service: input.service,
      scheduledDate: input.scheduledDate,
      symptomsText: input.symptomsText,
      status: "booked",
    });

    await jobsRepository
      .addTimelineEvent({
        jobId: job.id,
        eventType: "system",
        actor: input.actor ?? "system",
        note: "Booking confirmation linked to job",
        metadata: { bookingId: input.bookingId },
      })
      .catch((err) => {
        console.error("[job.service] addTimelineEvent(booking_confirm) failed:", err);
      });

    return { job, created: true };
  },

  async checkInFromBooking(input: {
    bookingId: string;
    photos?: Array<{
      uploadId?: string;
      fileName: string;
      mimeType?: string;
      sizeBytes?: number;
      storagePath?: string;
    }>;
    mileage?: number;
    damage?: string;
    notes?: string;
    actor: string;
  }): Promise<{ job: JobWithDetails; created: boolean; upgraded: boolean }> {
    const existing = await jobsRepository.findByBookingId(input.bookingId);
    if (!existing) {
      throw new Error("Booking has no linked job. Confirm booking before check-in.");
    }

    let upgraded = false;
    let current = existing;

    if (existing.status === "booked") {
      const updated = await this.update(existing.id, { status: "checked_in" }, input.actor);
      if (updated) {
        current = updated;
        upgraded = true;
      }
    }

    const noteBits: string[] = [];
    if (typeof input.mileage === "number" && Number.isFinite(input.mileage)) {
      noteBits.push(`Mileage: ${Math.max(0, Math.round(input.mileage))} miles`);
    }
    if (input.damage?.trim()) {
      noteBits.push(`Damage: ${input.damage.trim()}`);
    }
    if (input.notes?.trim()) {
      noteBits.push(`Check-in notes: ${input.notes.trim()}`);
    }
    if (noteBits.length > 0) {
      await this.addNote({
        jobId: current.id,
        author: input.actor,
        body: noteBits.join(" | "),
        source: "human",
      });
    }

    for (const photo of input.photos ?? []) {
      await this.addAttachment({
        jobId: current.id,
        uploadId: photo.uploadId,
        kind: "photo",
        fileName: photo.fileName,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        storagePath: photo.storagePath,
        uploadedBy: input.actor,
      });
    }

    await jobsRepository
      .addTimelineEvent({
        jobId: current.id,
        eventType: "system",
        actor: input.actor,
        note: "Vehicle checked in",
        metadata: {
          bookingId: input.bookingId,
          mileage: input.mileage,
          damage: input.damage,
          photoCount: input.photos?.length ?? 0,
        },
      })
      .catch((err) => {
        console.error("[job.service] addTimelineEvent(checkin) failed:", err);
      });

    const details = await jobsRepository.findByIdWithDetails(current.id);
    if (!details) {
      throw new Error("Check-in completed but job could not be reloaded");
    }

    return { job: details, created: false, upgraded };
  },
};
