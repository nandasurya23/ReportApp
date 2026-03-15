export const MAX_ROOM_NUMBER_LENGTH = 64;
export const MAX_CLIENT_NAME_LENGTH = 160;

export interface TransactionInputBody {
  date?: string;
  roomNumber?: string;
  clientName?: string;
  quantityKg?: number | string;
  pricePerKg?: number | string;
}

export function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function isValidOneDecimalQuantity(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0) {
    return false;
  }
  const scaled = Math.round(value * 10);
  return Math.abs(value * 10 - scaled) < 1e-9;
}

export function normalizeOneDecimalQuantity(value: number): number {
  return Math.round(value * 10) / 10;
}

export function toTransactionResponse(transaction: {
  id: string;
  date: Date;
  roomNumber: string;
  clientName: string;
  quantityKg: number | { toString(): string } | { valueOf(): number };
  pricePerKg: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: transaction.id,
    date: transaction.date.toISOString().slice(0, 10),
    roomNumber: transaction.roomNumber,
    clientName: transaction.clientName,
    quantityKg: Number(transaction.quantityKg),
    pricePerKg: transaction.pricePerKg,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}
