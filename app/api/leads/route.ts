import { requireAdminSession } from "@/lib/admin/guard";
import { leadService } from "@/lib/services/lead.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { CreateLeadInput } from "@/lib/types/lead";
import { parseBody, updateLeadStatusSchema } from "@/lib/validation/schemas";

/**
 * GET /api/leads — list leads (admin session required).
 * POST /api/leads — capture lead from forms or assistant (public).
 */
export const runtime = "nodejs";

export async function GET() {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;
  return jsonOk(await leadService.list());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateLeadInput;

    if (!body.name?.trim()) return jsonError("name is required");
    if (!body.phone?.trim()) return jsonError("phone is required");

    const lead = await leadService.create({
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim(),
      registration: body.registration?.trim(),
      vehicleModel: body.vehicleModel?.trim(),
      problemDescription: body.problemDescription?.trim(),
      preferredDate: body.preferredDate?.trim(),
      source: body.source ?? "website",
      aiSummary: body.aiSummary?.trim(),
    });

    return jsonOk(lead, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lead capture failed";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const raw = await request.json();
    const { data, error } = parseBody(updateLeadStatusSchema, raw);
    if (error) return error;

    const lead = await leadService.updateStatus(data.id, data.status);
    if (!lead) {
      return jsonError("Lead not found", 404);
    }
    return jsonOk(lead);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not update lead status";
    return jsonError(message, 500);
  }
}
