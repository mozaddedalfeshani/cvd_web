import { NextResponse } from "next/server";
import { getCurrentUserFromAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserFromAccessToken();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    await prisma.assessment.create({
      data: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        result: body.result,
        inputs: body.inputs,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[assessments]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
