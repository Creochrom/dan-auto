import { requireAdminSession } from "@/lib/admin/guard";
import { jsonOk } from "@/lib/api/response";
import { vehicleMemoryRepository } from "@/lib/repositories/vehicle-memory.repository";
import { buildMotQueue, type MotQueueByBucket } from "@/lib/workshop/mot-queue";

export const runtime = "nodejs";

type MotQueueResponse = {
  buckets: MotQueueByBucket;
};

export async function GET() {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const records = await vehicleMemoryRepository.list();
  const buckets = buildMotQueue(records);
  return jsonOk<MotQueueResponse>({ buckets });
}
