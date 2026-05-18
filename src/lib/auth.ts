import {
  createHash,
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const ACCESS_TOKEN_COOKIE = "cvd_access";
export const REFRESH_TOKEN_COOKIE = "cvd_refresh";

export type UserRole = "admin" | "doctor" | "assistant" | "user";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
};

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  verified: boolean;
  type: "access";
  iat: number;
  exp: number;
};

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// ── Crypto helpers ───────────────────────────────────────────────────────────

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Missing AUTH_SECRET (32+ chars required)");
  return secret;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function safeEqualString(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("base64url");
  return `pbkdf2_sha256$210000$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsValue, salt, hash] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsValue || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = pbkdf2Sync(password, salt, Number(iterationsValue), expected.length, "sha256");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ── JWT ──────────────────────────────────────────────────────────────────────

export function createAccessToken(payload: Pick<JwtPayload, "sub" | "email" | "name" | "role" | "verified">) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({ ...payload, type: "access", iat: now, exp: now + ACCESS_TOKEN_MAX_AGE_SECONDS } satisfies JwtPayload)
  );
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function readAccessToken(token: string | undefined): JwtPayload | null {
  if (!token) return null;
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;
  if (!safeEqualString(signature, sign(`${header}.${body}`))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as JwtPayload;
    if (p.type !== "access" || !p.sub || !p.email || !p.role || p.exp < Date.now() / 1000) return null;
    return p;
  } catch { return null; }
}

// ── Public user helper ───────────────────────────────────────────────────────

export function toPublicUser(u: { id: string; name: string; email: string; role: string; verified: boolean }): PublicUser {
  return { id: u.id, name: u.name, email: u.email, role: (u.role as UserRole) ?? "user", verified: u.verified ?? false };
}

// ── DB — users ───────────────────────────────────────────────────────────────

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  verified: boolean;
}) {
  return prisma.user.create({ data });
}

export async function listAllUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { assessments: true } } },
  });
}

export async function upsertUserForSetup(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: { role: data.role, verified: true, passwordHash: data.passwordHash },
    create: { ...data, verified: true },
  });
}

// ── DB — refresh tokens ──────────────────────────────────────────────────────

export async function createRefreshToken(userId: string) {
  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000);
  await prisma.refreshToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  return token;
}

export async function revokeRefreshToken(token: string | undefined) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function rotateRefreshToken(token: string | undefined) {
  if (!token) return null;
  const record = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!record) return null;
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  return record.user;
}

// ── Cookie helpers ───────────────────────────────────────────────────────────

export async function issueAuthCookies(
  response: NextResponse,
  user: { id: string; name: string; email: string; role: string; verified: boolean }
) {
  const refreshToken = await createRefreshToken(user.id);
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    createAccessToken({ sub: user.id, email: user.email, name: user.name, role: (user.role as UserRole) ?? "user", verified: user.verified ?? false }),
    accessCookieOptions
  );
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
}

export async function getCurrentUserFromAccessToken(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const access = readAccessToken(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!access) return null;
  return { id: access.sub, email: access.email, name: access.name ?? "", role: access.role, verified: access.verified ?? false };
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", clearCookieOptions);
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", clearCookieOptions);
}

export const accessCookieOptions = {
  httpOnly: true, sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/", maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
};

export const refreshCookieOptions = {
  httpOnly: true, sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth", maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
};

const clearCookieOptions = {
  httpOnly: true, sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/", maxAge: 0,
};
