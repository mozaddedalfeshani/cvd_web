import { NextResponse } from "next/server";
import { findUserByEmail, issueAuthCookies, toPublicUser, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({ user: toPublicUser(user) });
    await issueAuthCookies(response, user);
    return response;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
