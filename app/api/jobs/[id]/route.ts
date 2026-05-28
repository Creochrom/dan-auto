/**
 * GET   /api/jobs/[id]     → job + notes
 * PATCH /api/jobs/[id]     → update status, notesText, symptomsText, assignedTo
 *
 * Both require admin session.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import { jobService } from "@/lib/services/job.service";
import { JOB_STATUSES } from "@/lib/types/job";
import type { JobStatus } from "@/lib/types/job";

const JOB_STATUS_SET = new Set<string>(JOB_STATUSES);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const { id } = await params;

  try {
    const result = await jobService.findByIdWithDetails(id);
    if (!result) return jsonError("Job not found", 404);
    const { notes, timeline, attachments, ...job } = result;
    return jsonOk({ job, notes, timeline, attachments });
  } catch (err) {
    console.error("[jobs/[id]] GET error:", err);
    return jsonError("Failed to fetch job", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("Body must be an object", 400);
  }

  const b = body as Record<string, unknown>;

  // Validate status if provided
  if (b.status !== undefined) {
    if (typeof b.status !== "string" || !JOB_STATUS_SET.has(b.status)) {
      return jsonError(
        `Invalid status "${b.status}". Valid: ${JOB_STATUSES.join(", ")}`,
        400
      );
    }
  }

  const patch = {
    ...(b.status !== undefined ? { status: b.status as JobStatus } : {}),
    ...(typeof b.notesText === "string" ? { notesText: b.notesText } : {}),
    ...(typeof b.symptomsText === "string" ? { symptomsText: b.symptomsText } : {}),
    ...(typeof b.assignedTo === "string" ? { assignedTo: b.assignedTo } : {}),
  };

  // Optional inline note to append (used by the admin job detail page).
  const noteInput =
    typeof b.note === "object" &&
    b.note !== null &&
    typeof (b.note as Record<string, unknown>).body === "string"
      ? (b.note as { author?: string; body: string; source?: "human" | "ai" })
      : null;

  const attachmentsInput = Array.isArray(b.attachments)
    ? b.attachments
        .map((entry) => {
          if (typeof entry !== "object" || entry === null) return null;
          const a = entry as Record<string, unknown>;
          const fileName =
            typeof a.fileName === "string" && a.fileName.trim()
              ? a.fileName.trim()
              : "";
          if (!fileName) return null;
          const kind: "photo" | "document" =
            a.kind === "document" || a.kind === "photo" ? a.kind : "photo";
          return {
            uploadId:
              typeof a.uploadId === "string" && a.uploadId.trim()
                ? a.uploadId.trim()
                : undefined,
            kind,
            fileName,
            mimeType:
              typeof a.mimeType === "string" && a.mimeType.trim()
                ? a.mimeType.trim()
                : undefined,
            sizeBytes:
              typeof a.sizeBytes === "number" && Number.isFinite(a.sizeBytes)
                ? a.sizeBytes
                : undefined,
            storagePath:
              typeof a.storagePath === "string" && a.storagePath.trim()
                ? a.storagePath.trim()
                : undefined,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
    : [];

  if (Object.keys(patch).length === 0 && !noteInput && attachmentsInput.length === 0) {
    return jsonError(
      "Provide at least one of: status, notesText, symptomsText, assignedTo, note, attachments",
      400
    );
  }

  try {
    const updated = await jobService.update(id, patch, session.login);
    if (!updated) return jsonError("Job not found", 404);

    let note = null;
    if (noteInput) {
      note = await jobService.addNote({
        jobId: id,
        author: noteInput.author ?? session.login ?? "Technician",
        body: noteInput.body,
        source: noteInput.source ?? "human",
      });
    }

    if (attachmentsInput.length > 0) {
      for (const attachment of attachmentsInput) {
        await jobService.addAttachment({
          jobId: id,
          uploadId: attachment.uploadId,
          kind: attachment.kind,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          storagePath: attachment.storagePath,
          uploadedBy: session.login ?? "admin",
        });
      }
    }

    const withDetails = await jobService.findByIdWithDetails(id);
    if (!withDetails) return jsonError("Job not found", 404);

    return jsonOk({
      job: updated,
      note,
      timeline: withDetails.timeline,
      attachments: withDetails.attachments,
    });
  } catch (err) {
    console.error("[jobs/[id]] PATCH error:", err);
    return jsonError("Failed to update job", 500);
  }
}
