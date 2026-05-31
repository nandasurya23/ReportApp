import { NextRequest } from "next/server";

import { MAX_PRICE_PER_KG } from "@/lib/constants/limits";
import { prisma } from "@/lib/server/prisma";
import { getSessionUser } from "@/lib/server/session";
import {
  isJsonRequest,
  jsonNoStoreResponse,
  rejectCrossOriginRequest,
} from "@/lib/server/request-security";
import {
  compactText,
  getBusinessDateKey,
  getDayBounds,
  isValidOneDecimalQuantity,
  MAX_CLIENT_NAME_LENGTH,
  MAX_ROOM_NUMBER_LENGTH,
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
  return jsonNoStoreResponse(
    {
      error: payload.message,
      message: payload.message,
      code: payload.code,
      ...(payload.fieldErrors ? { fieldErrors: payload.fieldErrors } : {}),
    },
    { status },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const forbiddenResponse = rejectCrossOriginRequest(request);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    if (!isJsonRequest(request)) {
      return errorResponse(415, {
        message: "Format request harus JSON.",
        code: "UNSUPPORTED_MEDIA_TYPE",
        fieldErrors: {
          body: "Content-Type harus application/json.",
        },
      });
    }

    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    const { id } = await context.params;
    if (!id?.trim()) {
      return errorResponse(400, {
        message: "Data belum lengkap atau belum valid.",
        code: "VALIDATION_ERROR",
        fieldErrors: {
          id: "ID transaksi harus diisi.",
        },
      });
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
      select: {
        id: true,
        date: true,
        roomNumber: true,
      },
    });

    if (!existing) {
      return errorResponse(404, {
        message: "Transaksi yang ingin diubah tidak ditemukan.",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    const body = (await request.json().catch(() => null)) as TransactionInputBody | null;
    if (!body) {
      return errorResponse(400, {
        message: "Data belum lengkap atau belum valid.",
        code: "VALIDATION_ERROR",
      });
    }

    const hasRecognizedField = [
      "date",
      "roomNumber",
      "clientName",
      "quantityKg",
      "pricePerKg",
    ].some((key) => Object.prototype.hasOwnProperty.call(body, key));
    if (!hasRecognizedField) {
      return errorResponse(400, {
        message: "Tidak ada perubahan yang bisa disimpan.",
        code: "NO_UPDATABLE_FIELDS",
      });
    }

    const fieldErrors: Record<string, string> = {};
    const data: {
      date?: Date;
      roomNumber?: string;
      clientName?: string;
      quantityKg?: number;
      pricePerKg?: number;
    } = {};

    const hasDateField = Object.prototype.hasOwnProperty.call(body, "date");
    if (hasDateField) {
      if (typeof body.date !== "string") {
        fieldErrors.date = "Tanggal harus diisi dengan format yang valid.";
      } else {
        const parsedDate = parseDate(body.date);
        if (!parsedDate) {
          fieldErrors.date = "Tanggal harus diisi dengan format yang valid.";
        } else {
          data.date = parsedDate;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "roomNumber")) {
      if (typeof body.roomNumber !== "string") {
        fieldErrors.roomNumber = "Nomor kamar harus berupa teks.";
      } else {
        const roomNumber = compactText(body.roomNumber);
        if (!roomNumber) {
          fieldErrors.roomNumber = "Nomor kamar harus diisi.";
        } else if (roomNumber.length > MAX_ROOM_NUMBER_LENGTH) {
          fieldErrors.roomNumber = `Nomor kamar maksimal ${MAX_ROOM_NUMBER_LENGTH} karakter.`;
        } else {
          data.roomNumber = roomNumber;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "clientName")) {
      if (typeof body.clientName !== "string") {
        fieldErrors.clientName = "Nama client harus berupa teks.";
      } else {
        const clientName = compactText(body.clientName);
        if (!clientName) {
          fieldErrors.clientName = "Nama client harus diisi.";
        } else if (clientName.length > MAX_CLIENT_NAME_LENGTH) {
          fieldErrors.clientName = `Nama client maksimal ${MAX_CLIENT_NAME_LENGTH} karakter.`;
        } else {
          data.clientName = clientName;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "quantityKg")) {
      const quantityKg = Number(body.quantityKg);
      if (!isValidOneDecimalQuantity(quantityKg)) {
        fieldErrors.quantityKg = "Jumlah kg harus lebih dari 0 dan maksimal 1 angka desimal.";
      } else {
        data.quantityKg = normalizeOneDecimalQuantity(quantityKg);
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "pricePerKg")) {
      const pricePerKg = Number(body.pricePerKg);
      if (!Number.isFinite(pricePerKg) || pricePerKg < 0 || pricePerKg > MAX_PRICE_PER_KG) {
        fieldErrors.pricePerKg = "Harga per kg harus 0 atau lebih.";
      } else {
        data.pricePerKg = Math.round(pricePerKg);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(400, {
        message: "Data belum lengkap atau belum valid.",
        code: "VALIDATION_ERROR",
        fieldErrors,
      });
    }

    const finalDate = data.date ?? existing.date;
    const finalRoomNumber = data.roomNumber ?? existing.roomNumber;
    const finalBusinessDate = getBusinessDateKey(finalDate!);
    const { start, end } = getDayBounds(finalDate!);

    const candidateTransactions = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        id: {
          not: existing.id,
        },
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
        date: true,
        roomNumber: true,
      },
    });

    const normalizedFinalRoom = normalizeRoomCodeForComparison(finalRoomNumber);
    const conflictingTransaction = candidateTransactions.find(
      (transaction) =>
        transaction.date && getBusinessDateKey(transaction.date) === finalBusinessDate &&
        normalizeRoomCodeForComparison(transaction.roomNumber) === normalizedFinalRoom,
    );

    if (conflictingTransaction) {
      return errorResponse(409, {
        message: "Transaksi untuk tanggal dan kamar ini sudah ada. Silakan cek kembali tanggal atau nomor kamar.",
        code: "TRANSACTION_CONFLICT",
      });
    }

    const transaction = await prisma.transaction.update({
      where: { id: existing.id },
      data,
    });

    return jsonNoStoreResponse(
      {
        transaction: {
          ...toTransactionResponse(transaction),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[transactions/[id]] PATCH failed", error);
    return errorResponse(500, {
      message: "Terjadi kesalahan server. Coba lagi.",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const forbiddenResponse = rejectCrossOriginRequest(request);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const auth = await getSessionUser(request);
    if (auth.unauthorizedResponse) {
      return auth.unauthorizedResponse;
    }

    const { id } = await context.params;
    if (!id?.trim()) {
      return errorResponse(400, {
        message: "Data belum lengkap atau belum valid.",
        code: "VALIDATION_ERROR",
        fieldErrors: {
          id: "ID transaksi harus diisi.",
        },
      });
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return errorResponse(404, {
        message: "Transaksi yang ingin dihapus tidak ditemukan.",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    await prisma.transaction.delete({
      where: { id: existing.id },
    });

    return jsonNoStoreResponse({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[transactions/[id]] DELETE failed", error);
    return errorResponse(500, {
      message: "Terjadi kesalahan server. Coba lagi.",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}
