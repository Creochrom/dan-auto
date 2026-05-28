/**
 * Server-side admin session checks for API routes (Node.js).
 * Uses the httpOnly session cookie — never sessionStorage.
 */

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/response";
import {
  ADMIN_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/admin/session";

export async function getAdminSessionFromCookies(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAdminSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Returns 401 jsonError response when unauthenticated. */
export async function requireAdminSession(): Promise<
  | { session: SessionPayload; unauthorized: null }
  | { session: null; unauthorized: ReturnType<typeof jsonError> }
> {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return { session: null, unauthorized: jsonError("Unauthorized", 401) };
  }
  return { session, unauthorized: null };
}

export async function requireAdminRoles(
  roles: Array<SessionPayload["role"]>
): Promise<
  | { session: SessionPayload; unauthorized: null }
  | { session: null; unauthorized: ReturnType<typeof jsonError> }
> {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return { session: null, unauthorized: unauthorized! };
  if (!roles.includes(session.role)) {
    return { session: null, unauthorized: jsonError("Forbidden", 403) };
  }
  return { session, unauthorized: null };
}
