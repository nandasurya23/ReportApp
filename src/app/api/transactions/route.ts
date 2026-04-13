import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { getSessionUser } from "@/lib/server/session";
import { MAX_MONTH_ROWS, MAX_PRICE_PER_KG } from "@/lib/constants/limits";
import {
  compactText,
  getBusinessDateKey,
  getDayBounds,
  isValidOneDecimalQuantity,
  MAX_CLIENT_NAME_LENGTH,
  MAX_ROOM_NUMBER_LENGTH,
  getMonthBounds,
  normalizeOneDecimalQuantity,
  normalizeRoomCodeForComparison,
  parseDate,
  TransactionInputBody,
  toTransactionResponse,
} from "@/app/api/transactions/shared";

export const runtime = "nodejs";

function errorResponse(
  status: number,
  payload: {
    message: string;
    code: string;
    fieldErrors?: Record<string, string>;
  },
) {
  return NextResponse.json(
    {
      error: payload.message,
      message: payload.message,
      code: payload.code,
      ...(payload.fieldErrors ? { fieldErrors: payload.fieldErrors } : {}),
    },
    { status },
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month")?.trim() || "";
    const scope = searchParams.get("scope")?.trim() || "";
    const pageParam = Number(searchParams.get("page"));
    const limitParam = Number(searchParams.get("limit"));
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 100) : 50;
    const skip = (page - 1) * limit;

    const monthBounds = month ? getMonthBounds(month) : null;
    if (month && !monthBounds) {
      return errorResponse(400, {
        message: "Data belum lengkap atau belum valid.",
        code: "VALIDATION_ERROR",
        fieldErrors: {
          month: "Bulan harus diisi dengan format YYYY-MM.",
        },
      });
    }

    const where = monthBounds
      ? {
          userId: auth.userId,
          date: {
            gte: monthBounds.start,
            lt: monthBounds.end,
          },
        }
      : { userId: auth.userId };

    const shouldReturnFullMonth = Boolean(monthBounds && scope === "month");
    const orderBy = [{ date: "desc" as const }, { createdAt: "desc" as const }];
    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      shouldReturnFullMonth
        ? prisma.transaction.findMany({ where, orderBy, take: MAX_MONTH_ROWS })
        : prisma.transaction.findMany({ where, orderBy, skip, take: limit }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const effectivePage = shouldReturnFullMonth ? 1 : page;
    const effectiveLimit = shouldReturnFullMonth ? Math.max(total, transactions.length) : limit;
    const effectiveTotalPages = shouldReturnFullMonth ? 1 : totalPages;

    return NextResponse.json(
      {
        transactions: transactions.map((transaction) => ({
          ...toTransactionResponse(transaction),
        })),
        page: effectivePage,
        limit: effectiveLimit,
        total,
        totalPages: effectiveTotalPages,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[transactions/route] GET failed", error);
    return errorResponse(500, {
      message: "Terjadi kesalahan server. Coba lagi.",
      code: "INTERNAL_SERVER_ERROR",
    });
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
      return errorResponse(400, {
        message: "Data belum lengkap atau belum valid.",
        code: "VALIDATION_ERROR",
      });
    }

    const fieldErrors: Record<string, string> = {};

    const date = typeof body.date === "string" ? parseDate(body.date) : null;
    const roomNumber = typeof body.roomNumber === "string" ? compactText(body.roomNumber) : "";
    const clientName = typeof body.clientName === "string" ? compactText(body.clientName) : "";
    const quantityKg = Number(body.quantityKg);
    const pricePerKg = Number(body.pricePerKg);

    if (!date || !roomNumber || !clientName) {
      if (!date) {
        fieldErrors.date = "Tanggal harus diisi dengan format yang valid.";
      }
      if (!roomNumber) {
        fieldErrors.roomNumber = "Nomor kamar harus diisi.";
      }
      if (!clientName) {
        fieldErrors.clientName = "Nama client harus diisi.";
      }
    }
    if (roomNumber.length > MAX_ROOM_NUMBER_LENGTH) {
      fieldErrors.roomNumber = `Nomor kamar maksimal ${MAX_ROOM_NUMBER_LENGTH} karakter.`;
    }
    if (clientName.length > MAX_CLIENT_NAME_LENGTH) {
      fieldErrors.clientName = `Nama client maksimal ${MAX_CLIENT_NAME_LENGTH} karakter.`;
    }
    if (!isValidOneDecimalQuantity(quantityKg)) {
      fieldErrors.quantityKg = "Jumlah kg harus lebih dari 0 dan maksimal 1 angka desimal.";
    }
    if (!Number.isFinite(pricePerKg) || pricePerKg < 0 || pricePerKg > MAX_PRICE_PER_KG) {
      fieldErrors.pricePerKg = "Harga per kg harus 0 atau lebih.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(400, {
        message: "Data belum lengkap atau belum valid.",
        code: "VALIDATION_ERROR",
        fieldErrors,
      });
    }

    const normalizedQuantityKg = normalizeOneDecimalQuantity(quantityKg);
    const normalizedPricePerKg = Math.round(pricePerKg);
    const businessDate = getBusinessDateKey(date!);
    const { start, end } = getDayBounds(date!);

    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    const normalizedIncomingRoom = normalizeRoomCodeForComparison(roomNumber);
    const conflictingTransaction = existingTransactions.find(
      (transaction) =>
        transaction.date && getBusinessDateKey(transaction.date) === businessDate &&
        normalizeRoomCodeForComparison(transaction.roomNumber) === normalizedIncomingRoom,
    );

    if (conflictingTransaction) {
      return errorResponse(409, {
        message: "Transaksi untuk tanggal dan kamar ini sudah ada. Silakan cek kembali tanggal atau nomor kamar.",
        code: "TRANSACTION_CONFLICT",
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: auth.userId,
        date: date!,
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
  } catch (error) {
    console.error("[transactions/route] POST failed", error);
    return errorResponse(500, {
      message: "Terjadi kesalahan server. Coba lagi.",
      code: "INTERNAL_SERVER_ERROR",
    });
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
  } catch (error) {
    console.error("[transactions/route] DELETE failed", error);
    return errorResponse(500, {
      message: "Terjadi kesalahan server. Coba lagi.",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}
