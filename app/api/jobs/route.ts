/**
 * GET  /api/jobs?status=<status>&date=today|YYYY-MM-DD
 *   → list jobs (filtered). Defaults to all statuses, all dates.
 *
 * POST /api/jobs
 *   → create a walk-in job (or a job linked to a booking)
 *   Body: { registration, customerName, customerPhone, service,
 *           scheduledDate?, status?, symptomsText?, assignedTo?, bookingId? }
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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const JOB_STATUS_SET = new Set<string>(JOB_STATUSES);

export async function GET(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status") ?? undefined;
  const rawDate = searchParams.get("date") ?? undefined;
  const rawAssignedTo =
    searchParams.get("assigned_to") ?? searchParams.get("assignedTo") ?? undefined;
  const rawRegistration =
    searchParams.get("vehicle_reg") ??
    searchParams.get("registration") ??
    searchParams.get("reg") ??
    undefined;

  if (rawStatus && !JOB_STATUS_SET.has(rawStatus)) {
    return jsonError(
      `Invalid status "${rawStatus}". Valid: ${JOB_STATUSES.join(", ")}`,
      400
    );
  }

  if (rawDate && rawDate !== "today" && !ISO_DATE_RE.test(rawDate)) {
    return jsonError('date must be "today" or YYYY-MM-DD', 400);
  }

  try {
    const jobs = await jobService.list({
      status: rawStatus as JobStatus | undefined,
      date: rawDate,
      assignedTo: rawAssignedTo?.trim() || undefined,
      registration: rawRegistration?.trim() || undefined,
    });
    return jsonOk({ jobs });
  } catch (err) {
    console.error("[jobs] GET error:", err);
    return jsonError("Failed to fetch jobs", 500);
  }
}

export async function POST(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

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

  // Required fields
  const registration = typeof b.registration === "string" ? b.registration.trim() : "";
  const customerName = typeof b.customerName === "string" ? b.customerName.trim() : "";
  const customerPhone = typeof b.customerPhone === "string" ? b.customerPhone.trim() : "";
  const service = typeof b.service === "string" ? b.service.trim() : "";

  if (!registration) return jsonError("registration is required", 400);
  if (!customerName) return jsonError("customerName is required", 400);
  if (!customerPhone) return jsonError("customerPhone is required", 400);
  if (!service) return jsonError("service is required", 400);

  // Optional fields
  const scheduledDate =
    typeof b.scheduledDate === "string" && ISO_DATE_RE.test(b.scheduledDate)
      ? b.scheduledDate
      : undefined;

  const status =
    typeof b.status === "string" && JOB_STATUS_SET.has(b.status)
      ? (b.status as JobStatus)
      : undefined;

  const symptomsText =
    typeof b.symptomsText === "string" && b.symptomsText.trim()
      ? b.symptomsText.trim()
      : undefined;

  const assignedTo =
    typeof b.assignedTo === "string" && b.assignedTo.trim()
      ? b.assignedTo.trim()
      : undefined;

  const bookingId =
    typeof b.bookingId === "string" && b.bookingId.trim()
      ? b.bookingId.trim()
      : undefined;

  try {
    const job = await jobService.create({
      registration,
      customerName,
      customerPhone,
      service,
      scheduledDate,
      status,
      symptomsText,
      assignedTo,
      bookingId,
    });
    return jsonOk(job, 201);
  } catch (err) {
    console.error("[jobs] POST error:", err);
    return jsonError("Failed to create job", 500);
  }
}
