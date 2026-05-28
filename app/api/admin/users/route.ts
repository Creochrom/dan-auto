export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdminRoles } from "@/lib/admin/guard";
import { adminUsersService } from "@/lib/services/admin-users.service";
import { ADMIN_ROLES, type AdminRole } from "@/lib/types/admin-user";

function validateRole(value: unknown): AdminRole | null {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value)
    ? (value as AdminRole)
    : null;
}

export async function GET() {
  const { unauthorized } = await requireAdminRoles(["owner", "admin"]);
  if (unauthorized) return unauthorized;

  try {
    const users = await adminUsersService.list();
    return jsonOk(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminRoles(["owner", "admin"]);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as {
      login?: string;
      displayName?: string;
      role?: string;
      password?: string;
    };

    const login = body.login?.trim().toLowerCase();
    const displayName = body.displayName?.trim();
    const role = validateRole(body.role);
    const password = body.password?.trim();

    if (!login || !displayName || !role || !password) {
      return jsonError("login, displayName, role and password are required", 400);
    }
    if (password.length < 8) {
      return jsonError("Password must be at least 8 characters", 400);
    }

    const created = await adminUsersService.create({ login, displayName, role, password });
    return jsonOk(created, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    return jsonError(message, 500);
  }
}

