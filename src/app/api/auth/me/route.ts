import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  unauthorizedResponse,
} from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return unauthorizedResponse();
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
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return clearAuthCookie(unauthorizedResponse());
    }

    return NextResponse.json(
      {
        user: session.user,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
