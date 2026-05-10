import { NextResponse } from "next/server";
import {
  hashPassword,
  issueAuthCookies,
  toPublicUser,
  usersCollection,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
  } | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password || "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const users = await usersCollection();
  const existing = await users.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const result = await users.insertOne({
    name,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  });

  const user = {
    _id: result.insertedId,
    name,
    email,
    passwordHash: "",
    createdAt: new Date(),
  };

  const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  await issueAuthCookies(response, user);
  return response;
}
