import { NextResponse } from "next/server";
import {
  issueAuthCookies,
  toPublicUser,
  usersCollection,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const users = await usersCollection();
  const user = await users.findOne({ email });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ user: toPublicUser(user) });
  await issueAuthCookies(response, user);
  return response;
}
