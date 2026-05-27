import { jsonOk } from "@/lib/api/response";
import { ADMIN_COOKIE_NAME, sessionCookieOptions } from "@/lib/admin/session";

/**
 * POST /api/admin/logout — clears the admin session cookie.
 * The client is responsible for clearing any sessionStorage state
 * and redirecting to /admin/login.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  const response = jsonOk({ loggedOut: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", sessionCookieOptions(0));
  return response;
}
