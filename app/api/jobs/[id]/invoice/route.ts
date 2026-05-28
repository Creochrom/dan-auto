/**
 * GET   /api/jobs/[id]/invoice  → draft invoice or null
 * PATCH /api/jobs/[id]/invoice  → upsert draft (create or update)
 *
 * Draft only — nothing is sent to the customer automatically.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import { jobService } from "@/lib/services/job.service";
import { invoicesService } from "@/lib/services/invoices.service";
import type { UpdateDraftInvoiceInput } from "@/lib/types/workshop-data";

function parsePenceField(value: unknown): number | undefined | "invalid" {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return "invalid";
  }
  if (value > 99_999_999) return "invalid";
  return value;
}

function parseDraftBody(body: Record<string, unknown>):
  | { ok: true; patch: UpdateDraftInvoiceInput }
  | { ok: false; error: string } {
  const patch: UpdateDraftInvoiceInput = {};

  if (body.invoiceNumber !== undefined) {
    if (body.invoiceNumber !== null && typeof body.invoiceNumber !== "string") {
      return { ok: false, error: "invoiceNumber must be a string" };
    }
    patch.invoiceNumber =
      typeof body.invoiceNumber === "string" ? body.invoiceNumber.trim() : undefined;
  }

  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== "string") {
      return { ok: false, error: "notes must be a string" };
    }
    patch.notes = typeof body.notes === "string" ? body.notes.trim() : undefined;
  }

  for (const field of ["subtotalPence", "vatPence", "totalPence"] as const) {
    if (body[field] === undefined) continue;
    const parsed = parsePenceField(body[field]);
    if (parsed === "invalid") {
      return { ok: false, error: `${field} must be a non-negative integer (pence)` };
    }
    patch[field] = parsed;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Provide at least one invoice field to save" };
  }

  return { ok: true, patch };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const { id } = await params;

  try {
    const job = await jobService.findById(id);
    if (!job) return jsonError("Job not found", 404);

    const invoice = await invoicesService.findByJobId(id);
    return jsonOk({ invoice: invoice ?? null });
  } catch (err) {
    console.error("[jobs/[id]/invoice] GET error:", err);
    return jsonError("Failed to fetch invoice", 500);
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

  const parsed = parseDraftBody(body as Record<string, unknown>);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const job = await jobService.findById(id);
    if (!job) return jsonError("Job not found", 404);

    const invoice = await invoicesService.upsertDraft(
      id,
      parsed.patch,
      session.login ?? "admin"
    );
    return jsonOk({ invoice });
  } catch (err) {
    console.error("[jobs/[id]/invoice] PATCH error:", err);
    return jsonError("Failed to save invoice draft", 500);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}
