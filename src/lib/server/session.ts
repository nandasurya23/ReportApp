import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, clearAuthCookie, unauthorizedResponse } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const SESSION_CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

let lastSessionCleanupAt = 0;

function scheduleExpiredSessionCleanup(now: number) {
  if (now - lastSessionCleanupAt < SESSION_CLEANUP_INTERVAL_MS) {
    return;
  }

  lastSessionCleanupAt = now;
  void prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(now - SESSION_CLEANUP_INTERVAL_MS),
      },
    },
  }).catch(() => {
    // Best-effort cleanup only.
  });
}

export async function getSessionUser(request: NextRequest): Promise<{
  userId: string;
  username: string;
  unauthorizedResponse?: undefined;
} | {
  userId?: undefined;
  username?: undefined;
  unauthorizedResponse: NextResponse;
}> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return {
      unauthorizedResponse: unauthorizedResponse(),
    };
  }

  const now = Date.now();
  scheduleExpiredSessionCleanup(now);

  const session = await prisma.session.findUnique({
    where: {
      token,
    },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date(now)) {
    return { unauthorizedResponse: clearAuthCookie(unauthorizedResponse()) };
  }

  return {
    userId: session.user.id,
    username: session.user.username,
  };
}
