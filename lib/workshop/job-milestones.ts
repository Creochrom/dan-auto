import type { JobStatus } from "@/lib/types/job";

/** One-tap workshop milestones — logged as timeline system events. */
export const WORKSHOP_MILESTONE_IDS = [
  "vehicle_checked_in",
  "parts_ordered",
  "customer_called",
  "job_completed",
  "vehicle_collected",
] as const;

export type WorkshopMilestoneId = (typeof WORKSHOP_MILESTONE_IDS)[number];

export type WorkshopMilestoneDef = {
  id: WorkshopMilestoneId;
  label: string;
  shortLabel: string;
  /** Optional status bump when logging this milestone. */
  setStatus?: JobStatus;
};

export const WORKSHOP_MILESTONES: Record<WorkshopMilestoneId, WorkshopMilestoneDef> = {
  vehicle_checked_in: {
    id: "vehicle_checked_in",
    label: "Vehicle checked in",
    shortLabel: "Checked in",
    setStatus: "checked_in",
  },
  parts_ordered: {
    id: "parts_ordered",
    label: "Parts ordered",
    shortLabel: "Parts ordered",
    setStatus: "awaiting_parts",
  },
  customer_called: {
    id: "customer_called",
    label: "Customer called",
    shortLabel: "Called customer",
  },
  job_completed: {
    id: "job_completed",
    label: "Job completed",
    shortLabel: "Job completed",
    setStatus: "ready_for_collection",
  },
  vehicle_collected: {
    id: "vehicle_collected",
    label: "Vehicle collected by customer",
    shortLabel: "Collected",
  },
};

export function isWorkshopMilestoneId(value: string): value is WorkshopMilestoneId {
  return (WORKSHOP_MILESTONE_IDS as readonly string[]).includes(value);
}
