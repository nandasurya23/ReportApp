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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Transaction id is required." }, { status: 400 });
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as TransactionInputBody | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const data: {
      date?: Date;
      roomNumber?: string;
      clientName?: string;
      quantityKg?: number;
      pricePerKg?: number;
    } = {};

    if (typeof body.date === "string") {
      const parsedDate = parseDate(body.date);
      if (!parsedDate) {
        return NextResponse.json({ error: "Invalid date." }, { status: 400 });
      }
      data.date = parsedDate;
    }

    if (typeof body.roomNumber === "string") {
      const roomNumber = compactText(body.roomNumber);
      if (!roomNumber) {
        return NextResponse.json({ error: "roomNumber cannot be empty." }, { status: 400 });
      }
      if (roomNumber.length > MAX_ROOM_NUMBER_LENGTH) {
        return NextResponse.json(
          { error: `roomNumber max length is ${MAX_ROOM_NUMBER_LENGTH}.` },
          { status: 400 },
        );
      }
      data.roomNumber = roomNumber;
    }

    if (typeof body.clientName === "string") {
      const clientName = compactText(body.clientName);
      if (!clientName) {
        return NextResponse.json({ error: "clientName cannot be empty." }, { status: 400 });
      }
      if (clientName.length > MAX_CLIENT_NAME_LENGTH) {
        return NextResponse.json(
          { error: `clientName max length is ${MAX_CLIENT_NAME_LENGTH}.` },
          { status: 400 },
        );
      }
      data.clientName = clientName;
    }

    if (body.quantityKg !== undefined) {
      const quantityKg = Number(body.quantityKg);
      if (!isValidOneDecimalQuantity(quantityKg)) {
        return NextResponse.json({ error: "quantityKg must be > 0 with max 1 decimal." }, { status: 400 });
      }
      data.quantityKg = normalizeOneDecimalQuantity(quantityKg);
    }

    if (body.pricePerKg !== undefined) {
      const pricePerKg = Number(body.pricePerKg);
      if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
        return NextResponse.json({ error: "pricePerKg must be >= 0." }, { status: 400 });
      }
      data.pricePerKg = Math.round(pricePerKg);
    }

    const nextDate = data.date ?? existing.date;
    const nextRoomNumber = data.roomNumber ?? existing.roomNumber;
    const nextClientName = data.clientName ?? existing.clientName;
    const nextQuantityKg = data.quantityKg ?? Number(existing.quantityKg);
    const nextPricePerKg = data.pricePerKg ?? existing.pricePerKg;

    const duplicate = await prisma.transaction.findFirst({
      where: {
        userId: auth.userId,
        id: {
          not: existing.id,
        },
        date: nextDate,
        roomNumber: nextRoomNumber,
        clientName: nextClientName,
        quantityKg: nextQuantityKg,
        pricePerKg: nextPricePerKg,
      },
    });
    if (duplicate) {
      return NextResponse.json(
        {
          transaction: {
            ...toTransactionResponse(duplicate),
          },
        },
        { status: 200 },
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json(
      {
        transaction: {
          ...toTransactionResponse(transaction),
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Transaction id is required." }, { status: 400 });
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
