export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import { jobService } from "@/lib/services/job.service";
import { isWorkshopMilestoneId } from "@/lib/workshop/job-milestones";

export async function POST(
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

  const milestone = (body as { milestone?: string }).milestone;
  if (!milestone || !isWorkshopMilestoneId(milestone)) {
    return jsonError(
      'Provide milestone: vehicle_checked_in | parts_ordered | customer_called | job_completed',
      400
    );
  }

  try {
    const event = await jobService.logMilestone(
      id,
      milestone,
      session.login ?? "admin"
    );
    if (!event) return jsonError("Job not found", 404);

    const details = await jobService.findByIdWithDetails(id);
    if (!details) return jsonError("Job not found", 404);

    const { notes, timeline, attachments, ...job } = details;
    return jsonOk({ job, event, timeline, notes, attachments });
  } catch (err) {
    console.error("[jobs/[id]/milestone] POST error:", err);
    return jsonError("Failed to log milestone", 500);
  }
}
