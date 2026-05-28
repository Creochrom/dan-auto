/**
 * Edge middleware — admin page guard + protected admin/workshop APIs.
 *
 * Pages:
 * - /admin/login — public
 * - Other /admin/* — valid signed session cookie (redirect if missing)
 *
 * APIs (401 JSON when session missing):
 * - /api/jobs, /api/admin/* (except login/logout), /api/vehicle-history,
 *   /api/health/dvla, /api/health/storage, /api/knowledge/*
 * - GET /api/leads, GET/PATCH /api/bookings (POST public)
 * - POST /api/copilot
 *
 * Public APIs (not matched or excluded in logic):
 * - POST /api/bookings, POST /api/leads
 * - GET /api/health/supabase
 * - /api/chat, /api/vehicle-lookup
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

function isPublicAdminApi(pathname: string): boolean {
  return pathname === "/api/admin/login" || pathname === "/api/admin/logout";
}

/** Returns true when this API request must have a valid admin session cookie. */
function apiRequiresAdminSession(pathname: string, method: string): boolean {
  if (isPublicAdminApi(pathname)) return false;

  if (pathname === "/api/jobs" || pathname.startsWith("/api/jobs/")) return true;

  if (pathname.startsWith("/api/admin/") || pathname === "/api/admin") return true;

  if (pathname === "/api/vehicle-history") return true;

  if (pathname === "/api/health/dvla" || pathname === "/api/health/storage") return true;

  if (pathname === "/api/knowledge" || pathname.startsWith("/api/knowledge/")) return true;

  if (pathname === "/api/leads" || pathname === "/api/bookings") {
    return method !== "POST";
  }

  if (pathname === "/api/copilot" && method === "POST") return true;

  return false;
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

  if (apiRequiresAdminSession(pathname, request.method)) {
    if (await hasValidAdminSession(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/jobs",
    "/api/jobs/:path*",
    "/api/admin/:path*",
    "/api/vehicle-history",
    "/api/health/dvla",
    "/api/health/storage",
    "/api/knowledge/:path*",
    "/api/leads",
    "/api/bookings",
    "/api/copilot",
  ],
};
