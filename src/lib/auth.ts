import {
  createHash,
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { ObjectId, type WithId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const ACCESS_TOKEN_COOKIE = "cvd_access";
export const REFRESH_TOKEN_COOKIE = "cvd_refresh";

export type AuthUser = {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type RefreshTokenRecord = {
  userId: ObjectId;
  email: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  type: "access";
  iat: number;
  exp: number;
};

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Missing AUTH_SECRET environment variable with at least 32 characters");
  }
  return secret;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function safeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
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
  if (algorithm !== "pbkdf2_sha256" || !iterationsValue || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = pbkdf2Sync(password, salt, Number(iterationsValue), expected.length, "sha256");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAccessToken(payload: Pick<JwtPayload, "sub" | "email">) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      ...payload,
      type: "access",
      iat: now,
      exp: now + ACCESS_TOKEN_MAX_AGE_SECONDS,
    } satisfies JwtPayload)
  );
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function readAccessToken(token: string | undefined): JwtPayload | null {
  if (!token) return null;

  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;

  const unsigned = `${header}.${body}`;
  if (!safeEqualString(signature, sign(unsigned))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as JwtPayload;
    if (
      payload.type !== "access" ||
      !payload.sub ||
      !payload.email ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function usersCollection() {
  const db = await getDb();
  const collection = db.collection<AuthUser>("users");
  await collection.createIndex({ email: 1 }, { unique: true });
  return collection;
}

async function refreshTokensCollection() {
  const db = await getDb();
  const collection = db.collection<RefreshTokenRecord>("refresh_tokens");
  await collection.createIndex({ tokenHash: 1 }, { unique: true });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ userId: 1 });
  return collection;
}

export function toPublicUser(user: WithId<AuthUser>): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

export async function createRefreshToken(userId: ObjectId, email: string) {
  const token = randomBytes(48).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000);
  const refreshTokens = await refreshTokensCollection();

  await refreshTokens.insertOne({
    userId,
    email,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt,
  });

  return token;
}

export async function issueAuthCookies(response: NextResponse, user: WithId<AuthUser>) {
  const refreshToken = await createRefreshToken(user._id, user.email);

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    createAccessToken({ sub: user._id.toString(), email: user.email }),
    accessCookieOptions
  );
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
}

export async function revokeRefreshToken(token: string | undefined) {
  if (!token) return;
  const refreshTokens = await refreshTokensCollection();
  await refreshTokens.updateOne(
    { tokenHash: hashToken(token), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}

export async function rotateRefreshToken(token: string | undefined) {
  if (!token) return null;

  const refreshTokens = await refreshTokensCollection();
  const tokenHash = hashToken(token);
  const existing = await refreshTokens.findOne({
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!existing) return null;

  const users = await usersCollection();
  const user = await users.findOne({ _id: existing.userId });
  if (!user) return null;

  await refreshTokens.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  return user;
}

export async function getCurrentUserFromAccessToken() {
  const cookieStore = await cookies();
  const access = readAccessToken(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!access) return null;

  const users = await usersCollection();
  const user = await users.findOne({ _id: new ObjectId(access.sub) });
  return user ? toPublicUser(user) : null;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", clearCookieOptions);
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", clearCookieOptions);
}

export const accessCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
};

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
};

const clearCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 0,
};
