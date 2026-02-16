import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth not configured — pass everything through
  if (!process.env.DASHBOARD_PASSWORD) {
    return NextResponse.next();
  }

  // Public routes
  if (pathname === "/api/auth") {
    return NextResponse.next();
  }

  const token = request.cookies.get("session_token")?.value;
  const secret = process.env.SESSION_SECRET || "";
  const isValid = token ? await verifySessionToken(token, secret) : false;

  // Login page: redirect home if already authenticated
  if (pathname === "/login") {
    if (isValid) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes: redirect to login if not authenticated
  if (!isValid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
