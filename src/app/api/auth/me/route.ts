import { NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  unauthorizedResponse,
} from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { jsonNoStoreResponse } from "@/lib/server/request-security";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return unauthorizedResponse();
    }

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
            createdAt: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      return clearAuthCookie(unauthorizedResponse());
    }

    return jsonNoStoreResponse(
      {
        user: session.user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[auth/me] GET failed", error);
    return jsonNoStoreResponse(
      {
        error: "Internal server error.",
        message: "Internal server error.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
