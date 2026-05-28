/** Session-scoped active job for ⌘K commands (cockpit + job detail). */

export type ActiveJobContext = {
  id: string;
  registration: string;
  customerName: string;
  customerPhone: string;
  service: string;
  status: string;
};

const STORAGE_KEY = "workshop:activeJob";

export function setActiveJobContext(job: ActiveJobContext): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
  } catch {
    // ignore quota
  }
}

export function getActiveJobContext(): ActiveJobContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveJobContext;
    if (!parsed?.id || !parsed.registration) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveJobContext(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
