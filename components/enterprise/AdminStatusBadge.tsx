import type { BookingStatus } from "@/lib/types/booking";
import type { LeadStatus } from "@/lib/types/lead";
import type { JobStatus } from "@/lib/types/job";
import { WorkshopStatusBadge } from "@/components/workshop/WorkshopStatusBadge";

type StatusKind = "booking" | "lead" | "job";
type StatusValue = BookingStatus | LeadStatus | JobStatus;

export function AdminStatusBadge({
  kind,
  status,
}: {
  kind: StatusKind;
  status: StatusValue;
}) {
  return <WorkshopStatusBadge kind={kind} status={status} size="sm" />;
}
