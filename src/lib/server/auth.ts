import { createHash, randomBytes, timingSafeEqual } from "crypto";

import { AUTH_COOKIE_NAME } from "@/lib/constants/auth";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const normalized = storedHash.trim();
  if (!normalized) {
    return false;
  }

  // Compatibility path for existing local/dev seeded users.
  if (normalized === password) {
    return true;
  }

  const digest = hashPassword(password);
  const a = Buffer.from(digest);
  const b = Buffer.from(normalized);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export { AUTH_COOKIE_NAME };

