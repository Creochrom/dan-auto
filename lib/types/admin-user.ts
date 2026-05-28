export const ADMIN_ROLES = ["owner", "admin", "mechanic"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminUser = {
  id: string;
  login: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastPasswordChangeAt?: string;
};

