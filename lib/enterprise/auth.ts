export type Role = "owner" | "developer" | "admin" | "worker";

export type AuthUser = {
  id: string;
  login: string;
  displayName: string;
  role: Role;
};

const ACCOUNTS: { login: string; password: string; user: AuthUser }[] = [
  {
    login: "Dan",
    password: "Auto",
    user: { id: "owner-1", login: "Dan", displayName: "Dan (Owner)", role: "owner" },
  },
  {
    login: "Monochrome",
    password: "Design",
    user: {
      id: "dev-1",
      login: "Monochrome",
      displayName: "Monochrome (Developer)",
      role: "developer",
    },
  },
];

const SESSION_KEY = "dan_enterprise_session";

export function authenticate(login: string, password: string): AuthUser | null {
  const found = ACCOUNTS.find(
    (a) => a.login.toLowerCase() === login.trim().toLowerCase() && a.password === password
  );
  return found?.user ?? null;
}

export function saveSession(user: AuthUser) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function canAccessAdmin(role: Role) {
  return role === "owner" || role === "developer" || role === "admin";
}

export function canManageStaff(role: Role) {
  return role === "owner" || role === "admin";
}
