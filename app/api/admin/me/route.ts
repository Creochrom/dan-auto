import { requireAdminSession } from "@/lib/admin/guard";
import { jsonOk } from "@/lib/api/response";

/**
 * GET /api/admin/me — current session (for admin UI display after refresh).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { session, unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  return jsonOk({
    login: session.login,
    displayName: `${session.login} (Admin)`,
    role: "admin" as const,
  });
}
