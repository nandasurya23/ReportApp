import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function getSessionUser(request: NextRequest): Promise<{
  userId: string;
  username: string;
  unauthorizedResponse?: undefined;
} | {
  userId?: undefined;
  username?: undefined;
  unauthorizedResponse: NextResponse;
}> {
  try {
    const retentionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: retentionCutoff,
        },
      },
    });
  } catch {
    // Best-effort cleanup only.
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return {
      unauthorizedResponse: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const session = await prisma.session.findFirst({
    where: {
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!session) {
    const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...authCookieOptions,
      maxAge: 0,
    });
    return { unauthorizedResponse: response };
  }

  return {
    userId: session.user.id,
    username: session.user.username,
  };
}
