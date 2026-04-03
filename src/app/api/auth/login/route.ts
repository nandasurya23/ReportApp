import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  createSessionToken,
  getAuthThrottleDayKey,
  hashPassword,
  isLoginAttemptLimiterUnavailable,
  needsPasswordRehash,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";
const MAX_FAILED_LOGIN_ATTEMPTS_PER_DAY = 5;

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

function authResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  return NextResponse.json(
    {
      error: message,
      message,
      code,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
    { status },
  );
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function logLimiterUnavailable(stage: string, error?: unknown) {
  console.warn("[auth/login] limiter-unavailable", { stage, error });
}

async function runLimiterOp<T>(
  op: () => Promise<T>,
  stage: string,
): Promise<
  | { ok: true; value: T }
  | { ok: false; unavailable: true; response?: ReturnType<typeof authResponse> }
> {
  try {
    return { ok: true, value: await op() };
  } catch (error) {
    if (!isLoginAttemptLimiterUnavailable(error)) {
      throw error;
    }

    logLimiterUnavailable(stage, error);
    if (isProduction()) {
      return {
        ok: false,
        unavailable: true,
        response: authResponse(
          503,
          "AUTH_RATE_LIMITER_UNAVAILABLE",
          "Login sedang tidak bisa diproses sementara. Coba lagi sebentar lagi.",
        ),
      };
    }

    return { ok: false, unavailable: true };
  }
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
      return authResponse(
        400,
        "VALIDATION_ERROR",
        "Data login belum lengkap atau belum valid.",
        {
          body: "Format data login tidak valid.",
        },
      );
    }

    console.log("[auth/login] step=parsed-body", {
      keys: Object.keys(body ?? {}),
    });

    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      console.log("[auth/login] step=invalid-input");
      return authResponse(
        400,
        "VALIDATION_ERROR",
        "Data login belum lengkap atau belum valid.",
        {
          ...(username ? {} : { username: "Username harus diisi." }),
          ...(password ? {} : { password: "Password harus diisi." }),
        },
      );
    }

    const loginAttemptDelegate = getLoginAttemptDelegate();
    const dayKey = getAuthThrottleDayKey(new Date());
    let limiterUnavailable = false;

    if (!loginAttemptDelegate) {
      logLimiterUnavailable("delegate-missing");
      if (isProduction()) {
        return authResponse(
          503,
          "AUTH_RATE_LIMITER_UNAVAILABLE",
          "Login sedang tidak bisa diproses sementara. Coba lagi sebentar lagi.",
        );
      }
      limiterUnavailable = true;
    }

    let attempt: { failedCount: number } | null = null;
    if (loginAttemptDelegate && !limiterUnavailable) {
      const result = await runLimiterOp(
        async () =>
          ((await loginAttemptDelegate.findUnique({
            where: {
              username_dayKey: {
                username,
                dayKey,
              },
            },
            select: {
              failedCount: true,
            },
          })) as { failedCount: number } | null),
        "findUnique",
      );

      if (!result.ok) {
        if (result.response) {
          return result.response;
        }
        limiterUnavailable = true;
      } else {
        attempt = result.value;
      }
    }

    if ((attempt?.failedCount ?? 0) >= MAX_FAILED_LOGIN_ATTEMPTS_PER_DAY) {
      return authResponse(
        429,
        "AUTH_RATE_LIMITED",
        "Terlalu banyak percobaan login. Coba lagi nanti.",
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
      if (loginAttemptDelegate && !limiterUnavailable) {
        const result = await runLimiterOp(
          async () =>
            loginAttemptDelegate.upsert({
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
            }),
          "upsert",
        );

        if (!result.ok) {
          if (result.response) {
            return result.response;
          }
          limiterUnavailable = true;
        }
      }
      if (limiterUnavailable && isProduction()) {
        return authResponse(
          503,
          "AUTH_RATE_LIMITER_UNAVAILABLE",
          "Login sedang tidak bisa diproses sementara. Coba lagi sebentar lagi.",
        );
      }
      return authResponse(
        401,
        "AUTH_INVALID_CREDENTIALS",
        "Username atau password salah.",
      );
    }

    if (
      typeof needsPasswordRehash === "function" &&
      typeof hashPassword === "function" &&
      needsPasswordRehash(user.passwordHash)
    ) {
      console.warn("[auth/login] step=legacy-password-rehash", {
        userId: user.id,
      });
      try {
        const userDelegate = prisma.user as unknown as {
          update?: (...args: unknown[]) => Promise<unknown>;
        };
        if (userDelegate.update) {
          await userDelegate.update({
            where: { id: user.id },
            data: {
              passwordHash: hashPassword(password),
            },
          });
        }
      } catch (error) {
        console.error("[auth/login] step=password-rehash-failed", error);
      }
    }

    if (loginAttemptDelegate && !limiterUnavailable) {
      const result = await runLimiterOp(
        async () =>
          loginAttemptDelegate.deleteMany({
            where: {
              username,
              dayKey,
            },
          }),
        "deleteMany",
      );

      if (!result.ok) {
        if (result.response) {
          return result.response;
        }
        limiterUnavailable = true;
      }
    }

    if (limiterUnavailable && isProduction()) {
      return authResponse(
        503,
        "AUTH_RATE_LIMITER_UNAVAILABLE",
        "Login sedang tidak bisa diproses sementara. Coba lagi sebentar lagi.",
      );
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
    return authResponse(
      500,
      "AUTH_INTERNAL_ERROR",
      "Terjadi kendala pada sistem. Coba lagi.",
    );
  }
}
