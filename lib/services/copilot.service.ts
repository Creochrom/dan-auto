/**
 * Workshop copilot orchestration (internal admin tool).
 * Does not replace customer service advisor (chat.service / gemini.service).
 */

import { askCopilot, retrieveWorkshopKnowledge } from "@/lib/copilot/providers";
import { jobsRepository } from "@/lib/repositories/jobs.repository";
import { vehicleHistoryService } from "@/lib/services/vehicle-history.service";
import { formatVehicleTimelineForAi } from "@/lib/vehicle/build-vehicle-timeline-display";
import type { Job, JobTimelineEvent } from "@/lib/types/job";
import type {
  CopilotAskInput,
  CopilotAskResult,
} from "@/features/copilot/types/copilot";

const RECENT_TIMELINE_LIMIT = 6;
const VEHICLE_HISTORY_LIMIT = 5;
const RETRIEVAL_LIMIT = 8;

function safeText(value?: string): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

function formatTimelineEvent(event: JobTimelineEvent): string {
  const date = event.createdAt.slice(0, 10);
  const statusTransition =
    event.fromStatus || event.toStatus
      ? ` (${event.fromStatus ?? "?"} -> ${event.toStatus ?? "?"})`
      : "";
  const note = event.note ? `: ${event.note}` : "";
  return `${date} | ${event.eventType}${statusTransition} | ${event.actor}${note}`;
}

function formatVehicleHistoryItem(job: Job): string {
  const symptoms = safeText(job.symptomsText);
  return [
    `${job.scheduledDate} | ${job.service} | ${job.status}`,
    symptoms ? `symptoms: ${symptoms}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

async function buildVehicleHistory(job: Job): Promise<string[] | undefined> {
  const lines: string[] = [];

  const vehicleHistory = await vehicleHistoryService
    .getByRegistration(job.registration)
    .catch(() => null);

  if (vehicleHistory?.displayTimeline.length) {
    const block = formatVehicleTimelineForAi(vehicleHistory.displayTimeline);
    if (block) {
      lines.push("Vehicle workshop timeline (MOT, repairs, intakes):");
      lines.push(...block.split("\n").map((line) => `- ${line}`));
    }
  }

  const history = await jobsRepository.listByRegistration(job.registration);
  const otherJobs = history.filter((item) => item.id !== job.id).slice(0, VEHICLE_HISTORY_LIMIT);
  for (const item of otherJobs) {
    lines.push(`- ${formatVehicleHistoryItem(item)}`);
  }

  return lines.length ? lines : undefined;
}

async function buildJobGroundingContext(input: CopilotAskInput): Promise<string | undefined> {
  if (input.jobId?.trim()) {
    const job = await jobsRepository.findByIdWithDetails(input.jobId.trim());
    if (job) {
      const notes = safeText(job.notesText);
      const symptoms = safeText(job.symptomsText);
      const recentTimeline = job.timeline.slice(-RECENT_TIMELINE_LIMIT).map(formatTimelineEvent);
      const vehicleHistory = await buildVehicleHistory(job);
      const lines = [
        `Job ID: ${job.id}`,
        `Registration: ${job.registration}`,
        `Service: ${job.service}`,
        `Customer: ${job.customerName}`,
        `Status: ${job.status}`,
        symptoms ? `Symptoms: ${symptoms}` : null,
        notes ? `Workshop notes: ${notes}` : null,
        vehicleHistory?.length
          ? ["Vehicle workshop memory:", ...vehicleHistory].join("\n")
          : null,
        recentTimeline.length
          ? [
              "Recent timeline:",
              ...recentTimeline.map((item) => `- ${item}`),
            ].join("\n")
          : null,
      ].filter(Boolean);
      return lines.join("\n");
    }
  }

  if (input.jobSnapshot) {
    const timelineLines =
      input.jobSnapshot.recentTimeline && input.jobSnapshot.recentTimeline.length
        ? ["Recent timeline:", ...input.jobSnapshot.recentTimeline.map((line) => `- ${line}`)].join("\n")
        : null;
    const historyLines =
      input.jobSnapshot.vehicleHistory && input.jobSnapshot.vehicleHistory.length
        ? ["Vehicle history (recent previous jobs):", ...input.jobSnapshot.vehicleHistory.map((line) => `- ${line}`)].join("\n")
        : null;
    return [
      "Job snapshot (no jobId linked):",
      `Registration: ${input.jobSnapshot.registration}`,
      `Symptoms: ${input.jobSnapshot.symptoms}`,
      input.jobSnapshot.notes?.trim() ? `Workshop notes: ${input.jobSnapshot.notes.trim()}` : null,
      historyLines,
      timelineLines,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return undefined;
}

function mergeCopilotContext(base?: string, grounded?: string): string | undefined {
  const parts = [grounded?.trim(), base?.trim()].filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.join("\n\n---\n\n");
}

export const copilotService = {
  async ask(input: CopilotAskInput): Promise<CopilotAskResult> {
    const groundedContext = await buildJobGroundingContext(input);
    const mergedContext = mergeCopilotContext(input.context, groundedContext);
    const messageWithContext = mergedContext
      ? [
          input.message,
          "",
          "Grounding context:",
          mergedContext,
        ].join("\n")
      : input.message;

    // Retrieval strategy:
    // 1) message + job context
    // 2) message + a compact canonical retrieval query (query resilience for BMW/MOT checks)
    // 3) message only fallback
    let knowledgeChunks = await retrieveWorkshopKnowledge({
      query: messageWithContext,
      limit: RETRIEVAL_LIMIT,
    });

    if (knowledgeChunks.length === 0 && mergedContext) {
      const retrievalContext = mergedContext
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          return (
            trimmed.startsWith("Registration:") ||
            trimmed.startsWith("Service:") ||
            trimmed.startsWith("Symptoms:") ||
            trimmed.startsWith("Workshop notes:")
          );
        })
        .join("\n");
      knowledgeChunks = await retrieveWorkshopKnowledge({
        query: retrievalContext
          ? `${input.message}\n${retrievalContext}`
          : input.message,
        limit: RETRIEVAL_LIMIT,
      });
    }

    if (knowledgeChunks.length === 0) {
      knowledgeChunks = await retrieveWorkshopKnowledge({
        query: input.message,
        limit: RETRIEVAL_LIMIT,
      });
    }

    return askCopilot({
      message: input.message,
      promptKind: input.promptKind,
      context: mergedContext,
      knowledgeChunks,
    });
  },
};
