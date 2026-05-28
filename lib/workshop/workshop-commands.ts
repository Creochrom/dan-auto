import type { ActiveJobContext } from "@/lib/workshop/active-job-context";
import { displayRegistration, looksLikeRegistration } from "@/lib/workshop/command-palette";

export type WorkshopCommandKind = "navigate" | "call" | "api";

export type WorkshopCommand = {
  id: string;
  label: string;
  subtitle?: string;
  keywords: string[];
  kind: WorkshopCommandKind;
  href?: string;
  phone?: string;
  api?: {
    method: "PATCH" | "POST";
    path: string;
    body: Record<string, unknown>;
  };
  group: "job" | "vehicle" | "navigation";
};

const NAV_COMMANDS: WorkshopCommand[] = [
  {
    id: "nav-today",
    label: "Today queue",
    subtitle: "Floor + MOT reminders",
    keywords: ["today", "queue", "mot"],
    kind: "navigate",
    href: "/admin/today",
    group: "navigation",
  },
  {
    id: "nav-mot-queue",
    label: "MOT queue",
    subtitle: "Due within 30 / 14 / 7 days",
    keywords: ["mot", "queue", "reminder", "expiry", "expiring", "due"],
    kind: "navigate",
    href: "/admin/today#mot",
    group: "navigation",
  },
  {
    id: "nav-jobs",
    label: "Jobs cockpit",
    keywords: ["jobs", "cockpit", "bay"],
    kind: "navigate",
    href: "/admin/jobs",
    group: "navigation",
  },
  {
    id: "nav-bookings",
    label: "Bookings",
    keywords: ["booking", "bookings"],
    kind: "navigate",
    href: "/admin/bookings",
    group: "navigation",
  },
  {
    id: "nav-assistant",
    label: "Workshop Assistant",
    keywords: ["ai", "assistant", "manual", "diagnose"],
    kind: "navigate",
    href: "/admin/workshop-assistant",
    group: "navigation",
  },
];

function jobCommands(job: ActiveJobContext): WorkshopCommand[] {
  const regEnc = encodeURIComponent(job.registration);
  return [
    {
      id: "job-mark-ready",
      label: "Mark ready for collection",
      subtitle: `${job.registration} · customer handover`,
      keywords: ["ready", "collection", "mark ready", "done", "complete"],
      kind: "api",
      api: {
        method: "PATCH",
        path: `/api/jobs/${job.id}`,
        body: { status: "ready_for_collection" },
      },
      group: "job",
    },
    {
      id: "job-call-customer",
      label: "Call customer",
      subtitle: `${job.customerName} · ${job.customerPhone}`,
      keywords: ["call", "phone", "customer", "ring"],
      kind: "call",
      phone: job.customerPhone,
      group: "job",
    },
    {
      id: "job-ask-ai",
      label: "Ask AI about this job",
      subtitle: "Diagnostics · drafts (human sends)",
      keywords: ["ai", "ask", "assistant", "diagnose", "help"],
      kind: "navigate",
      href: `/admin/workshop-assistant?jobId=${encodeURIComponent(job.id)}&reg=${regEnc}`,
      group: "job",
    },
    {
      id: "job-open-mot",
      label: "Open MOT & vehicle memory",
      subtitle: job.registration,
      keywords: ["mot", "dvla", "history", "vehicle", "memory"],
      kind: "navigate",
      href: `/admin/vehicle/${regEnc}`,
      group: "job",
    },
    {
      id: "job-parts-ordered",
      label: "Log: parts ordered",
      subtitle: "Timeline + awaiting parts",
      keywords: ["parts", "ordered", "order"],
      kind: "api",
      api: {
        method: "POST",
        path: `/api/jobs/${job.id}/milestone`,
        body: { milestone: "parts_ordered" },
      },
      group: "job",
    },
    {
      id: "job-customer-called",
      label: "Log: customer called",
      subtitle: "Timeline only",
      keywords: ["called", "customer called", "spoke"],
      kind: "api",
      api: {
        method: "POST",
        path: `/api/jobs/${job.id}/milestone`,
        body: { milestone: "customer_called" },
      },
      group: "job",
    },
    {
      id: "job-checked-in",
      label: "Log: vehicle checked in",
      subtitle: "Timeline + checked in status",
      keywords: ["checked in", "check in", "arrived"],
      kind: "api",
      api: {
        method: "POST",
        path: `/api/jobs/${job.id}/milestone`,
        body: { milestone: "vehicle_checked_in" },
      },
      group: "job",
    },
    {
      id: "job-open-cockpit",
      label: "Open in jobs cockpit",
      subtitle: job.service,
      keywords: ["cockpit", "open job"],
      kind: "navigate",
      href: `/admin/jobs?job=${encodeURIComponent(job.id)}`,
      group: "job",
    },
    {
      id: "job-draft-invoice",
      label: "Draft invoice",
      subtitle: "Internal pricing — not sent to customer",
      keywords: ["invoice", "draft invoice", "billing", "price", "total"],
      kind: "navigate",
      href: `/admin/jobs/${encodeURIComponent(job.id)}`,
      group: "job",
    },
  ];
}

function vehicleCommands(reg: string): WorkshopCommand[] {
  const encoded = encodeURIComponent(reg);
  return [
    {
      id: `veh-${reg}`,
      label: `Vehicle memory · ${reg}`,
      keywords: [reg.toLowerCase(), "vehicle", "memory"],
      kind: "navigate",
      href: `/admin/vehicle/${encoded}`,
      group: "vehicle",
    },
    {
      id: `mot-${reg}`,
      label: `Open MOT · ${reg}`,
      keywords: ["mot", "dvla", reg.toLowerCase()],
      kind: "navigate",
      href: `/admin/vehicle/${encoded}`,
      group: "vehicle",
    },
    {
      id: `ai-${reg}`,
      label: `Ask AI · ${reg}`,
      keywords: ["ai", "assistant", reg.toLowerCase()],
      kind: "navigate",
      href: `/admin/workshop-assistant?reg=${encoded}`,
      group: "vehicle",
    },
  ];
}

function matchesCommand(query: string, command: WorkshopCommand): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = [command.label, command.subtitle ?? "", ...command.keywords]
    .join(" ")
    .toLowerCase();
  return hay.includes(q) || command.keywords.some((k) => k.includes(q) || q.includes(k));
}

export function buildWorkshopCommands(
  query: string,
  activeJob: ActiveJobContext | null
): WorkshopCommand[] {
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();

  const jobRows = activeJob ? jobCommands(activeJob).filter((c) => matchesCommand(q, c)) : [];

  const reg = looksLikeRegistration(trimmed) ? displayRegistration(trimmed) : null;
  const vehicleRows = reg ? vehicleCommands(reg).filter((c) => matchesCommand(q, c)) : [];

  const navRows = NAV_COMMANDS.filter((c) => matchesCommand(q, c));

  if (!trimmed) {
    return [...jobRows, ...navRows];
  }

  return [...jobRows, ...vehicleRows, ...navRows];
}
