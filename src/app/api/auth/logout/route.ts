import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...authCookieOptions,
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
