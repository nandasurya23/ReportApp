import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getSessionUser } from "@/lib/server/session";
import {
  compactText,
  isValidOneDecimalQuantity,
  MAX_CLIENT_NAME_LENGTH,
  MAX_ROOM_NUMBER_LENGTH,
  normalizeOneDecimalQuantity,
  parseDate,
  TransactionInputBody,
  toTransactionResponse,
} from "@/app/api/transactions/shared";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page"));
    const limitParam = Number(searchParams.get("limit"));
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 100) : 50;
    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({
        where: { userId: auth.userId },
      }),
      prisma.transaction.findMany({
        where: { userId: auth.userId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        transactions: transactions.map((transaction) => ({
          ...toTransactionResponse(transaction),
        })),
        page,
        limit,
        total,
        totalPages,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    const body = (await request.json().catch(() => null)) as TransactionInputBody | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const date = typeof body.date === "string" ? parseDate(body.date) : null;
    const roomNumber = typeof body.roomNumber === "string" ? compactText(body.roomNumber) : "";
    const clientName = typeof body.clientName === "string" ? compactText(body.clientName) : "";
    const quantityKg = Number(body.quantityKg);
    const pricePerKg = Number(body.pricePerKg);

    if (!date || !roomNumber || !clientName) {
      return NextResponse.json(
        { error: "date, roomNumber, and clientName are required." },
        { status: 400 },
      );
    }
    if (roomNumber.length > MAX_ROOM_NUMBER_LENGTH) {
      return NextResponse.json(
        { error: `roomNumber max length is ${MAX_ROOM_NUMBER_LENGTH}.` },
        { status: 400 },
      );
    }
    if (clientName.length > MAX_CLIENT_NAME_LENGTH) {
      return NextResponse.json(
        { error: `clientName max length is ${MAX_CLIENT_NAME_LENGTH}.` },
        { status: 400 },
      );
    }
    if (!isValidOneDecimalQuantity(quantityKg)) {
      return NextResponse.json({ error: "quantityKg must be > 0 with max 1 decimal." }, { status: 400 });
    }
    if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
      return NextResponse.json({ error: "pricePerKg must be >= 0." }, { status: 400 });
    }

    const normalizedQuantityKg = normalizeOneDecimalQuantity(quantityKg);
    const normalizedPricePerKg = Math.round(pricePerKg);
    const existing = await prisma.transaction.findFirst({
      where: {
        userId: auth.userId,
        date,
        roomNumber,
        clientName,
        quantityKg: normalizedQuantityKg,
        pricePerKg: normalizedPricePerKg,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
        transaction: {
          ...toTransactionResponse(existing),
        },
        },
        { status: 200 },
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: auth.userId,
        date,
        roomNumber,
        clientName,
        quantityKg: normalizedQuantityKg,
        pricePerKg: normalizedPricePerKg,
      },
    });

    return NextResponse.json(
      {
        transaction: {
          ...toTransactionResponse(transaction),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    await prisma.transaction.deleteMany({
      where: { userId: auth.userId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
