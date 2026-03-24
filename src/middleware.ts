import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for the "auth" cookie that acts as our session
  const authCookie = request.cookies.get("auth");
  const { pathname } = request.nextUrl;

  // 1. Kick unauthenticated users away from the dashboard
  if (!authCookie && pathname === "/") {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 2. Hide the login page from users who are already authenticated
  if (authCookie && pathname === "/login") {
     return NextResponse.redirect(new URL('/', request.url))
  }
  
  // We explicitly bypass /api/* paths so Twilio Webhooks still hit the server!
  return NextResponse.next();
}

export const config = {
  // Only execute this middleware on the root and login page
  matcher: ['/', '/login'],
}
