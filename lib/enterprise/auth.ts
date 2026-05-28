/**
 * Client-side admin display session only (name / role in the dashboard UI).
 * Security is enforced by the httpOnly `dan_admin_session` cookie + middleware.
 * Do not store passwords or verify credentials here.
 */

export type AdminRole = "owner" | "admin" | "mechanic";

export type AdminDisplayUser = {
  login: string;
  displayName: string;
  role: AdminRole;
};

/** @deprecated Use AdminDisplayUser — kept for existing admin UI imports. */
export type AuthUser = AdminDisplayUser;

const SESSION_KEY = "dan_admin_display";

export function saveAdminDisplay(user: AdminDisplayUser): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadAdminDisplay(): AdminDisplayUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminDisplayUser;
    if (
      (parsed.role !== "owner" && parsed.role !== "admin" && parsed.role !== "mechanic") ||
      !parsed.login
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAdminDisplay(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

/** @deprecated Use saveAdminDisplay */
export const saveSession = saveAdminDisplay;

/** @deprecated Use loadAdminDisplay */
export const loadSession = loadAdminDisplay;

/** @deprecated Use clearAdminDisplay */
export const clearSession = clearAdminDisplay;

export function canManageStaff(role: AdminRole): boolean {
  return role === "owner" || role === "admin";
}
