import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { compareSync, hashSync } from "bcryptjs";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants/auth";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
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

  // Compatibility path for existing local/dev seeded users.
  if (normalized === password) {
    return true;
  }

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
  return response;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export { AUTH_COOKIE_NAME };
