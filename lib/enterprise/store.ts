import { SEED_ENTERPRISE } from "./seed";
import type { BugReport, EnterpriseStore, RepairQuote, WorkshopJob } from "./types";

const KEY = "dan_enterprise_v1";

export function loadEnterprise(): EnterpriseStore {
  if (typeof window === "undefined") return SEED_ENTERPRISE;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...SEED_ENTERPRISE, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...SEED_ENTERPRISE };
}

export function saveEnterprise(store: EnterpriseStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function updateJob(
  store: EnterpriseStore,
  jobId: string,
  patch: Partial<WorkshopJob>
): EnterpriseStore {
  return {
    ...store,
    jobs: store.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
  };
}

export function respondQuote(
  store: EnterpriseStore,
  quoteId: string,
  status: RepairQuote["status"],
  customerMessage?: string
): EnterpriseStore {
  return {
    ...store,
    quotes: store.quotes.map((q) =>
      q.id === quoteId ? { ...q, status, customerMessage } : q
    ),
  };
}

export function addBug(store: EnterpriseStore, bug: Omit<BugReport, "id" | "createdAt">) {
  return {
    ...store,
    bugs: [
      {
        ...bug,
        id: `bug-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      ...store.bugs,
    ],
  };
}
