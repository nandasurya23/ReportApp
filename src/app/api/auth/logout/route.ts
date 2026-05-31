import { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, clearAuthCookie } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import {
  jsonNoStoreResponse,
  rejectCrossOriginRequest,
} from "@/lib/server/request-security";

export async function POST(request: NextRequest) {
  try {
    const forbiddenResponse = rejectCrossOriginRequest(request);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    return clearAuthCookie(jsonNoStoreResponse({ success: true }, { status: 200 }));
  } catch (error) {
    console.error("[auth/logout] POST failed", error);
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
