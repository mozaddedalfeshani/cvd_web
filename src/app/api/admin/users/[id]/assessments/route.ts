import { NextResponse } from "next/server";
import { getCurrentUserFromAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCurrentUserFromAccessToken();
    if (!caller || caller.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const assessments = await prisma.assessment.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ assessments });
  } catch (err) {
    console.error("[admin/assessments]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
