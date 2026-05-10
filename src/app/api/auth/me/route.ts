import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCurrentUserFromAccessToken,
  issueAuthCookies,
  REFRESH_TOKEN_COOKIE,
  rotateRefreshToken,
  toPublicUser,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUserFromAccessToken();
  if (user) {
    return NextResponse.json({ user });
  }

  const cookieStore = await cookies();
  const refreshedUser = await rotateRefreshToken(cookieStore.get(REFRESH_TOKEN_COOKIE)?.value);
  if (!refreshedUser) {
    return NextResponse.json({ user: null });
  }

  const response = NextResponse.json({ user: toPublicUser(refreshedUser) });
  await issueAuthCookies(response, refreshedUser);
  return response;
}
