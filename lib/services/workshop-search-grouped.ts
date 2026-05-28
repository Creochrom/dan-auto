import { stripPlate } from "@/lib/format-plate";
import {
  workshopSearch,
  type WorkshopSearchResult,
  type WorkshopSearchResultKind,
} from "@/lib/services/workshop-search.service";

export type WorkshopSearchGroup = {
  kind: WorkshopSearchResultKind;
  label: string;
  results: WorkshopSearchResult[];
};

const GROUP_LABEL: Record<WorkshopSearchResultKind, string> = {
  job: "Jobs",
  booking: "Bookings",
  lead: "Leads",
  vehicle: "Vehicle",
  invoice: "Invoices",
  manual: "Manuals",
  attachment: "Attachments",
};

const DEFAULT_GROUP_ORDER: WorkshopSearchResultKind[] = [
  "job",
  "booking",
  "vehicle",
  "invoice",
  "attachment",
  "manual",
  "lead",
];

/** Heuristic: UK-style reg (alphanumeric, optional single space, includes a digit). */
export function looksLikeRegistration(raw: string): boolean {
  const trimmed = raw.trim();
  const canon = stripPlate(trimmed);
  if (canon.length < 2 || canon.length > 8) return false;
  if (!/^[A-Za-z0-9\s]+$/.test(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length > 2) return false;
  if (tokens.length === 2 && stripPlate(tokens[0]).length !== 4) return false;
  if (tokens.length >= 2 && !/\d/.test(trimmed)) return false;

  return /\d/.test(canon);
}

export function groupWorkshopSearchResults(
  results: WorkshopSearchResult[],
  rawQuery: string
): { groups: WorkshopSearchGroup[]; results: WorkshopSearchResult[] } {
  if (!looksLikeRegistration(rawQuery)) {
    return { groups: [], results };
  }

  const queryCanon = stripPlate(rawQuery);
  const byKind = new Map<WorkshopSearchResultKind, WorkshopSearchResult[]>();

  for (const row of results) {
    const list = byKind.get(row.kind) ?? [];
    list.push(row);
    byKind.set(row.kind, list);
  }

  let vehicles = byKind.get("vehicle") ?? [];
  const exactIdx = vehicles.findIndex((v) => stripPlate(v.title) === queryCanon);
  if (exactIdx > 0) {
    const exact = vehicles[exactIdx];
    vehicles = [exact, ...vehicles.filter((_, i) => i !== exactIdx)];
    byKind.set("vehicle", vehicles);
  }
  const hasExactVehicle = exactIdx >= 0;

  const order: WorkshopSearchResultKind[] = hasExactVehicle
    ? ["vehicle", "job", "booking", "invoice", "attachment", "manual", "lead"]
    : DEFAULT_GROUP_ORDER;

  const groups: WorkshopSearchGroup[] = [];
  const flat: WorkshopSearchResult[] = [];

  for (const kind of order) {
    const kindResults = byKind.get(kind);
    if (!kindResults?.length) continue;
    groups.push({ kind, label: GROUP_LABEL[kind], results: kindResults });
    flat.push(...kindResults);
  }

  return { groups, results: flat };
}

export async function workshopSearchGrouped(rawQuery: string): Promise<{
  results: WorkshopSearchResult[];
  groups: WorkshopSearchGroup[];
}> {
  const results = await workshopSearch(rawQuery);
  const grouped = groupWorkshopSearchResults(results, rawQuery);
  return {
    results: grouped.groups.length > 0 ? grouped.results : results,
    groups: grouped.groups,
  };
}
