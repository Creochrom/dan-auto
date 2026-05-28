import { EMPTY_ENTERPRISE } from "./seed";
import type { BugReport, EnterpriseStore, RepairQuote, WorkshopJob } from "./types";

const KEY = "dan_enterprise_v1";

/** Remove prototype demo blob from localStorage (admin hub calls on mount). */
export function clearEnterprisePrototypeStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function loadEnterprise(): EnterpriseStore {
  if (typeof window === "undefined") return EMPTY_ENTERPRISE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_ENTERPRISE };
    const parsed = JSON.parse(raw) as Partial<EnterpriseStore>;
    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
      staff: Array.isArray(parsed.staff) ? parsed.staff : [],
      bugs: Array.isArray(parsed.bugs) ? parsed.bugs : [],
    };
  } catch {
    return { ...EMPTY_ENTERPRISE };
  }
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
