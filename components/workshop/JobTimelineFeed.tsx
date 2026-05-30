"use client";

import {
  CheckCircle2,
  MessageSquare,
  Package,
  Paperclip,
  Phone,
  RefreshCw,
  Truck,
} from "lucide-react";
import {
  JOB_STATUS_LABELS,
  type JobTimelineEvent,
  type JobTimelineEventType,
} from "@/lib/types/job";
import type { WorkshopMilestoneId } from "@/lib/workshop/job-milestones";
import { WORKSHOP_MILESTONES } from "@/lib/workshop/job-milestones";

function compactDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function milestoneIcon(id: WorkshopMilestoneId) {
  switch (id) {
    case "vehicle_checked_in":
      return Truck;
    case "parts_ordered":
      return Package;
    case "customer_called":
      return Phone;
    case "job_completed":
      return CheckCircle2;
    case "vehicle_collected":
      return CheckCircle2;
    default:
      return RefreshCw;
  }
}

function eventIcon(event: JobTimelineEvent) {
  const milestone = event.metadata?.milestone;
  if (typeof milestone === "string" && milestone in WORKSHOP_MILESTONES) {
    return milestoneIcon(milestone as WorkshopMilestoneId);
  }
  switch (event.eventType as JobTimelineEventType) {
    case "attachment_added":
      return Paperclip;
    case "note":
      return MessageSquare;
    case "status_change":
      return RefreshCw;
    default:
      return RefreshCw;
  }
}

function eventTitle(event: JobTimelineEvent): string {
  const milestone = event.metadata?.milestone;
  if (typeof milestone === "string" && milestone in WORKSHOP_MILESTONES) {
    return WORKSHOP_MILESTONES[milestone as WorkshopMilestoneId].label;
  }
  if (event.eventType === "status_change" && event.toStatus) {
    const label = JOB_STATUS_LABELS[event.toStatus] ?? event.toStatus;
    return `Status → ${label}`;
  }
  if (event.eventType === "note") return "Note added";
  if (event.eventType === "attachment_added") return "Attachment added";
  if (event.note?.trim()) return event.note.trim();
  return "System";
}

type Props = {
  events: JobTimelineEvent[];
  emptyLabel?: string;
};

export function JobTimelineFeed({ events, emptyLabel = "No activity yet." }: Props) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return <p className="text-xs text-zinc-600">{emptyLabel}</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-[#d4a63c]/25 pl-4">
      {sorted.map((event) => {
        const Icon = eventIcon(event);
        return (
          <li key={event.id} className="relative pb-4 last:pb-0">
            <span
              className="absolute -left-[21px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0a0a0a] ring-2 ring-[#d4a63c]/40"
              aria-hidden
            >
              <Icon className="h-2.5 w-2.5 text-[#d4a63c]" />
            </span>
            <p className="text-[11px] text-zinc-500">
              {compactDate(event.createdAt)} · {event.actor}
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-100">{eventTitle(event)}</p>
            {event.note &&
              eventTitle(event) !== event.note.trim() &&
              event.eventType !== "note" && (
                <p className="mt-1 text-xs text-zinc-400">{event.note}</p>
              )}
            {event.eventType === "note" && event.note && (
              <p className="mt-1 text-sm text-zinc-300">{event.note}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
