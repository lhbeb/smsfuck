import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Validates the "auth" cookie on the server side.
 * Returns null if authenticated, or a 401 NextResponse if not.
 * Usage:
 *   const unauth = requireAuth();
 *   if (unauth) return unauth;
 */
export function requireAuth(): NextResponse | null {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("auth");

  if (!authCookie || authCookie.value !== "secured") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
