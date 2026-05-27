/**
 * Next.js Edge middleware — admin route guard.
 *
 * Runs before every request to /admin/*.
 * Allows /admin/login through unconditionally (login page must be reachable unauthenticated).
 * All other /admin/* paths require a valid signed session cookie.
 * Invalid or missing session → redirect to /admin/login.
 *
 * Edge runtime only — imports must be Edge-safe (no Node.js APIs).
 */

import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let the login page through — it's the unauthenticated entry point.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return NextResponse.next();
    }
  }

  // No valid session — redirect to login, preserving the intended destination.
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
