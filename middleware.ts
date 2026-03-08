import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants/auth";

const LOGIN_PATH = "/login";
const REPORT_PATH = "/report";

export function middleware(request: NextRequest) {
  const isAuthed = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(REPORT_PATH) && !isAuthed) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (pathname.startsWith(LOGIN_PATH) && isAuthed) {
    return NextResponse.redirect(new URL(REPORT_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/report/:path*"],
};
