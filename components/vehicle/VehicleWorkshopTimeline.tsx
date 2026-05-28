"use client";

import Link from "next/link";
import { AlertTriangle, Calendar, ClipboardList, Wrench } from "lucide-react";
import type { VehicleTimelineDisplayItem } from "@/lib/vehicle/build-vehicle-timeline-display";

function compactDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function iconForCategory(category: VehicleTimelineDisplayItem["category"]) {
  switch (category) {
    case "mot":
      return ClipboardList;
    case "repair":
      return Wrench;
    case "booking":
      return Calendar;
    case "intake":
      return AlertTriangle;
    default:
      return Wrench;
  }
}

const CATEGORY_LABEL: Record<VehicleTimelineDisplayItem["category"], string> = {
  mot: "MOT",
  repair: "Repair",
  job: "Workshop",
  booking: "Booking",
  intake: "Intake",
  system: "System",
};

type Props = {
  items: VehicleTimelineDisplayItem[];
  emptyLabel?: string;
};

export function VehicleWorkshopTimeline({
  items,
  emptyLabel = "No workshop history yet — jobs and MOT events will appear here.",
}: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <ol className="relative border-l border-[#d4a63c]/25 pl-4">
      {items.map((item) => {
        const Icon = iconForCategory(item.category);
        const inner = (
          <>
            <span
              className="absolute -left-[21px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0a0a0a] ring-2 ring-[#d4a63c]/40"
              aria-hidden
            >
              <Icon className="h-2.5 w-2.5 text-[#d4a63c]" />
            </span>
            <p className="text-[11px] text-zinc-500">
              {compactDate(item.at)} · {CATEGORY_LABEL[item.category]}
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-100">{item.title}</p>
            {item.description && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.description}</p>
            )}
          </>
        );

        return (
          <li key={item.id} className="relative pb-5 last:pb-0">
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-lg pr-2 transition hover:bg-white/[0.04]"
              >
                {inner}
              </Link>
            ) : (
              <div className="pr-2">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
