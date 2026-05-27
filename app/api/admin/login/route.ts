import { jsonError, jsonOk } from "@/lib/api/response";
import { getAdminUsername, verifyAdminPassword } from "@/lib/admin/credentials";
import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/admin/session";

/**
 * POST /api/admin/login — verify credentials, issue httpOnly session cookie.
 *
 * On success returns { login, displayName } so the client can store
 * a minimal user object in sessionStorage for display purposes.
 * The httpOnly cookie is the actual security boundary.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { login?: string; password?: string };
    const login = body.login?.trim();
    const password = body.password;

    if (!login || !password) {
      return jsonError("login and password are required", 400);
    }

    let valid = false;
    let authorisedLogin = "";

    try {
      const adminUsername = getAdminUsername();
      if (login.toLowerCase() === adminUsername.toLowerCase()) {
        valid = verifyAdminPassword(password);
        authorisedLogin = adminUsername;
      }
    } catch (configError) {
      // Env vars not configured — fail safe.
      const message =
        configError instanceof Error ? configError.message : "Configuration error";
      console.error("[admin/login]", message);
      return jsonError("Admin login is not configured on this server", 500);
    }

    if (!valid) {
      // Uniform delay makes timing-based user enumeration harder.
      await new Promise((r) => setTimeout(r, 400));
      return jsonError("Invalid credentials", 401);
    }

    const token = await signSessionToken(authorisedLogin);

    const response = jsonOk({
      login: authorisedLogin,
      displayName: `${authorisedLogin} (Admin)`,
      role: "admin" as const,
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, sessionCookieOptions(SESSION_TTL_SECONDS));

    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    return jsonError(message, 500);
  }
}
