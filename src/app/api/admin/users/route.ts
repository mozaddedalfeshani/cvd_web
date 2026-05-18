import { NextResponse } from "next/server";
import { getCurrentUserFromAccessToken, listAllUsers } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const caller = await getCurrentUserFromAccessToken();
    if (!caller || caller.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await listAllUsers();
    const userList = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      verified: u.verified,
      createdAt: u.createdAt,
      assessmentCount: u._count.assessments,
    }));

    return NextResponse.json({ users: userList });
  } catch (err) {
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
