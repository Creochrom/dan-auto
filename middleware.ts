/**
 * Edge middleware — admin page guard + protected admin list APIs.
 *
 * - /admin/login — public
 * - Other /admin/* — valid signed session cookie required
 * - GET /api/leads, GET /api/bookings — valid session required (POST stays public)
 *
 * Edge runtime only — imports must be Edge-safe (no Node.js APIs).
 */

import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin/session";

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await verifySessionToken(token);
  return session !== null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    if (await hasValidAdminSession(request)) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    request.method === "GET" &&
    (pathname === "/api/leads" || pathname === "/api/bookings")
  ) {
    if (await hasValidAdminSession(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/leads", "/api/bookings"],
};
