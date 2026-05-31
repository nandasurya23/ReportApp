import { NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export function jsonNoStoreResponse(
  body: unknown,
  init: { status: number; headers?: HeadersInit },
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...init.headers,
      ...NO_STORE_HEADERS,
    },
  });
}

export function isJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.toLowerCase().includes("application/json");
}

export function rejectCrossOriginRequest(request: Request): NextResponse | null {
  const origin = request.headers?.get?.("origin");
  if (!origin) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) {
    return null;
  }

  return jsonNoStoreResponse(
    {
      error: "Forbidden.",
      message: "Forbidden.",
      code: "FORBIDDEN_ORIGIN",
    },
    { status: 403 },
  );
}
