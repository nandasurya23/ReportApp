import { MAX_QUANTITY_KG, MIN_TRANSACTION_YEAR } from "@/lib/constants/limits";

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

export function normalizeRoomCodeForComparison(value: string): string {
  return compactText(value).toLowerCase();
}

export function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.includes("T") ? trimmed.slice(0, 10) : trimmed;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const [year, month, day] = normalized.split("-").map(Number);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const maxYear = new Date().getUTCFullYear() + 1;
  if (year < MIN_TRANSACTION_YEAR || year > maxYear) {
    return null;
  }

  return date;
}

export function parseMonthKey(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    return null;
  }
  const [year, month] = trimmed.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, 1));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) {
    return null;
  }
  return date;
}

export function getMonthBounds(monthKey: string): { start: Date; end: Date } | null {
  const start = parseMonthKey(monthKey);
  if (!start) {
    return null;
  }
  const end = new Date(start.getTime());
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export function getDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getTime());
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function getBusinessDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isValidOneDecimalQuantity(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0 || value > MAX_QUANTITY_KG) {
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
