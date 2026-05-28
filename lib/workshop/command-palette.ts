import { stripPlate } from "@/lib/format-plate";

export type CommandPaletteAction = {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  group: "navigation" | "vehicle" | "job";
};

const NAV_ACTIONS: CommandPaletteAction[] = [
  {
    id: "today",
    label: "Today queue",
    subtitle: "Floor + MOT reminders",
    href: "/admin/today",
    group: "navigation",
  },
  {
    id: "jobs",
    label: "Jobs cockpit",
    subtitle: "Queue · timeline · attachments",
    href: "/admin/jobs",
    group: "navigation",
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/admin/bookings",
    group: "navigation",
  },
  {
    id: "assistant",
    label: "Workshop Assistant",
    subtitle: "Manuals + diagnostics (draft only)",
    href: "/admin/workshop-assistant",
    group: "navigation",
  },
  {
    id: "knowledge",
    label: "Service manuals",
    href: "/admin/knowledge",
    group: "navigation",
  },
];

/** UK-style plate heuristic (2–7 alphanumeric after normalisation). */
export function looksLikeRegistration(input: string): boolean {
  const canon = stripPlate(input);
  return canon.length >= 4 && canon.length <= 8 && /^[A-Z0-9]+$/.test(canon);
}

export function displayRegistration(input: string): string {
  const canon = stripPlate(input);
  return canon || input.trim().toUpperCase();
}

export function buildCommandPaletteActions(query: string): CommandPaletteAction[] {
  const trimmed = query.trim();
  if (!trimmed) return NAV_ACTIONS;

  const reg = displayRegistration(trimmed);
  const encoded = encodeURIComponent(reg);
  const q = trimmed.toLowerCase();

  const vehicleActions: CommandPaletteAction[] = looksLikeRegistration(trimmed)
    ? [
        {
          id: `vehicle-${reg}`,
          label: `Open vehicle · ${reg}`,
          subtitle: "DVLA + workshop memory",
          href: `/admin/vehicle/${encoded}`,
          group: "vehicle",
        },
        {
          id: `assistant-${reg}`,
          label: `Ask assistant · ${reg}`,
          subtitle: "Pre-fill registration context",
          href: `/admin/workshop-assistant?reg=${encoded}`,
          group: "vehicle",
        },
        {
          id: `walkin-${reg}`,
          label: `Create walk-in job · ${reg}`,
          subtitle: "New job card for this plate",
          href: `/admin/jobs?walkIn=1&reg=${encoded}`,
          group: "job",
        },
        {
          id: `cockpit-${reg}`,
          label: `Find in jobs cockpit · ${reg}`,
          subtitle: "Filter today's queue",
          href: `/admin/jobs?reg=${encoded}`,
          group: "job",
        },
      ]
    : [];

  const navFiltered = NAV_ACTIONS.filter((action) => {
    const hay = `${action.label} ${action.subtitle ?? ""}`.toLowerCase();
    return hay.includes(q);
  });

  return [...vehicleActions, ...navFiltered];
}
