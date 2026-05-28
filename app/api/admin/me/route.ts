import { requireAdminSession } from "@/lib/admin/guard";
import { jsonOk } from "@/lib/api/response";
import { adminUsersService } from "@/lib/services/admin-users.service";

/**
 * GET /api/admin/me — current session (for admin UI display after refresh).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { session, unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  let displayName = `${session.login} (${session.role})`;
  try {
    const dbUser = await adminUsersService.findByLogin(session.login);
    if (dbUser) displayName = dbUser.displayName;
  } catch {
    // Keep fallback display name when DB unavailable.
  }

  return jsonOk({
    login: session.login,
    displayName,
    role: session.role,
  });
}
