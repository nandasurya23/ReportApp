import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, clearAuthCookie } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    return clearAuthCookie(NextResponse.json({ success: true }, { status: 200 }));
  } catch (error) {
    console.error("[auth/logout] POST failed", error);
    return NextResponse.json({ error: "Internal server error.", message: "Internal server error.", code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
