import { NextResponse } from "next/server";
import { hashPassword, upsertUserForSetup, type UserRole } from "@/lib/auth";

export const runtime = "nodejs";

const DEMO_ACCOUNTS: { name: string; email: string; role: UserRole }[] = [
  { name: "Admin", email: "imurad2020@gmail.com", role: "admin" },
  { name: "Demo Patient", email: "patiend@cvd.com", role: "user" },
  { name: "Demo Assistant", email: "assistance@cvd.com", role: "assistant" },
  { name: "Demo Doctor", email: "doctor@cvd.com", role: "doctor" },
];

const DEFAULT_PASSWORD = "Test@123";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-setup-secret");
    if (secret !== (process.env.SETUP_SECRET ?? "cvd-setup-2025")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results: string[] = [];
    for (const account of DEMO_ACCOUNTS) {
      await upsertUserForSetup({ ...account, passwordHash: hashPassword(DEFAULT_PASSWORD) });
      results.push(`upserted: ${account.email}`);
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[setup]", err);
    return NextResponse.json({ error: "Setup failed." }, { status: 500 });
  }
}
