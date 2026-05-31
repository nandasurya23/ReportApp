import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { compareSync, hashSync } from "bcryptjs";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants/auth";
import { jsonNoStoreResponse } from "@/lib/server/request-security";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const AUTH_RATE_LIMIT_TIME_ZONE = "Asia/Makassar";
const BCRYPT_ROUNDS = 12;

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPassword(password: string): string {
  return hashSync(password, BCRYPT_ROUNDS);
}

function hashPasswordLegacySha256(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const normalized = storedHash.trim();
  if (!normalized) {
    return false;
  }

  if (isBcryptHash(normalized)) {
    return compareSync(password, normalized);
  }

  // Legacy migration path: SHA-256 hashed passwords (no plain-text accepted).
  // On successful login the caller re-hashes to bcrypt via needsPasswordRehash().
  const digest = hashPasswordLegacySha256(password);
  const a = Buffer.from(digest);
  const b = Buffer.from(normalized);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function needsPasswordRehash(storedHash: string): boolean {
  return !isBcryptHash(storedHash.trim());
}

export function getAuthThrottleDayKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AUTH_RATE_LIMIT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function isLoginAttemptLimiterUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  return code === "P2021";
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...authCookieOptions,
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function unauthorizedResponse(): NextResponse {
  return jsonNoStoreResponse({ error: "Unauthorized." }, { status: 401 });
}

export { AUTH_COOKIE_NAME };
