import { NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        db: "up",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        db: "down",
      },
      { status: 503 },
    );
  }
}
