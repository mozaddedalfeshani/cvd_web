import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  issueAuthCookies,
  REFRESH_TOKEN_COOKIE,
  rotateRefreshToken,
  toPublicUser,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const user = await rotateRefreshToken(cookieStore.get(REFRESH_TOKEN_COOKIE)?.value);

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 401 });
  }

  const response = NextResponse.json({ user: toPublicUser(user) });
  await issueAuthCookies(response, user);
  return response;
}
