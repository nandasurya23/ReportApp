import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";
const MAX_FAILED_LOGIN_ATTEMPTS_PER_DAY = 5;

function getDayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isMissingLoginAttemptTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybeCode = (error as { code?: unknown }).code;
  return maybeCode === "P2021";
}

function getLoginAttemptDelegate() {
  const client = prisma as unknown as {
    loginAttempt?: {
      findUnique: (...args: unknown[]) => Promise<unknown>;
      upsert: (...args: unknown[]) => Promise<unknown>;
      deleteMany: (...args: unknown[]) => Promise<unknown>;
    };
  };
  return client.loginAttempt;
}

export async function POST(request: Request) {
  try {
    console.log("[auth/login] step=request-received");

    let body: {
      username?: string;
      password?: string;
    };
    try {
      body = (await request.json()) as {
        username?: string;
        password?: string;
      };
    } catch (error) {
      console.error("[auth/login] step=parse-body-failed", error);
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    console.log("[auth/login] step=parsed-body", {
      keys: Object.keys(body ?? {}),
    });

    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      console.log("[auth/login] step=invalid-input");
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const dayKey = getDayKey(new Date());
    let attempt: { failedCount: number } | null = null;
    const loginAttemptDelegate = getLoginAttemptDelegate();
    try {
      if (loginAttemptDelegate) {
        attempt = (await loginAttemptDelegate.findUnique({
          where: {
            username_dayKey: {
              username,
              dayKey,
            },
          },
          select: {
            failedCount: true,
          },
        })) as { failedCount: number } | null;
      }
    } catch (error) {
      if (!isMissingLoginAttemptTableError(error)) {
        throw error;
      }
    }
    if ((attempt?.failedCount ?? 0) >= MAX_FAILED_LOGIN_ATTEMPTS_PER_DAY) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Try again tomorrow." },
        { status: 429 },
      );
    }

    let user:
      | {
          id: string;
          username: string;
          passwordHash: string;
        }
      | null
      | undefined;
    try {
      user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          passwordHash: true,
        },
      });
      console.log("[auth/login] step=user-lookup", { found: Boolean(user) });
    } catch (error) {
      console.error("[auth/login] step=user-lookup-failed", error);
      throw error;
    }

    const passwordMatched = Boolean(user && verifyPassword(password, user.passwordHash));
    console.log("[auth/login] step=password-compare", {
      matched: passwordMatched,
    });

    if (!user || !passwordMatched) {
      try {
        if (loginAttemptDelegate) {
          await loginAttemptDelegate.upsert({
            where: {
              username_dayKey: {
                username,
                dayKey,
              },
            },
            update: {
              failedCount: {
                increment: 1,
              },
            },
            create: {
              username,
              dayKey,
              failedCount: 1,
            },
          });
        }
      } catch (error) {
        if (!isMissingLoginAttemptTableError(error)) {
          throw error;
        }
      }
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    try {
      if (loginAttemptDelegate) {
        await loginAttemptDelegate.deleteMany({
          where: {
            username,
            dayKey,
          },
        });
      }
    } catch (error) {
      if (!isMissingLoginAttemptTableError(error)) {
        throw error;
      }
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    try {
      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });
      console.log("[auth/login] step=session-created");
    } catch (error) {
      console.error("[auth/login] step=session-create-failed", error);
      throw error;
    }

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
        },
      },
      { status: 200 },
    );

    try {
      response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
      console.log("[auth/login] step=cookie-set");
    } catch (error) {
      console.error("[auth/login] step=cookie-set-failed", error);
      throw error;
    }

    console.log("[auth/login] step=success");
    return response;
  } catch (error) {
    console.error("[auth/login] step=unhandled-failed", error);
    return NextResponse.json({ error: "Failed to login." }, { status: 500 });
  }
}
