export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdminRoles } from "@/lib/admin/guard";
import { adminUsersService } from "@/lib/services/admin-users.service";
import { ADMIN_ROLES, type AdminRole } from "@/lib/types/admin-user";

type RouteContext = { params: Promise<{ id: string }> };

function validateRole(value: unknown): AdminRole | null {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value)
    ? (value as AdminRole)
    : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, unauthorized } = await requireAdminRoles(["owner", "admin"]);
  if (unauthorized || !session) return unauthorized;
  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      displayName?: string;
      role?: string;
      active?: boolean;
      resetPassword?: string;
    };

    if (body.resetPassword !== undefined) {
      const password = body.resetPassword.trim();
      if (password.length < 8) {
        return jsonError("New password must be at least 8 characters", 400);
      }
      const updated = await adminUsersService.resetPassword(id, password);
      if (!updated) return jsonError("User not found", 404);
      return jsonOk(updated);
    }

    const roleCandidate =
      body.role !== undefined ? validateRole(body.role) : undefined;
    if (body.role !== undefined && !roleCandidate) {
      return jsonError("Invalid role", 400);
    }
    const role: AdminRole | undefined = roleCandidate ?? undefined;

    const target = await adminUsersService.findById(id);
    if (!target) return jsonError("User not found", 404);
    if (target.login === session.login && body.active === false) {
      return jsonError("You cannot deactivate your own account", 400);
    }

    const updated = await adminUsersService.updateProfile(id, {
      displayName: body.displayName,
      role,
      active: body.active,
    });
    if (!updated) return jsonError("User not found", 404);
    return jsonOk(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return jsonError(message, 500);
  }
}

