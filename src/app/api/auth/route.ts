import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyPassword } from "@/lib/auth";

const SEVEN_DAYS = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!password || !secret) {
    return NextResponse.json(
      { error: "Auth not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const input = body?.password;

  if (!input || typeof input !== "string") {
    return NextResponse.json(
      { error: "Password required" },
      { status: 400 }
    );
  }

  if (!verifyPassword(input, password)) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const token = await createSessionToken(secret);
  const response = NextResponse.json({ success: true });

  response.cookies.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
