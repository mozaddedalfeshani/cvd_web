import { NextResponse } from "next/server";
import { createUser, hashPassword, issueAuthCookies, toPublicUser, type UserRole } from "@/lib/auth";

export const runtime = "nodejs";

const VALID_ROLES: UserRole[] = ["doctor", "assistant", "user"];

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      name?: string; email?: string; password?: string; role?: string;
    } | null;

    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password || "";
    const role: UserRole = VALID_ROLES.includes(body?.role as UserRole) ? (body!.role as UserRole) : "user";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const user = await createUser({ name, email, passwordHash: hashPassword(password), role, verified: false });

    const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    await issueAuthCookies(response, user);
    return response;
  } catch (err: unknown) {
    console.error("[signup]", err);
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
