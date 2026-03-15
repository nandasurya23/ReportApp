import { formatISODateToLongID } from "@/lib/utils/date";
import { LaundryTransaction } from "@/types/laundry";

export interface TransactionApiRow {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: number | string;
  pricePerKg: number | string;
}

export interface ExportRow {
  no: number;
  tanggal: string;
  jumlahNota: number;
  noKamar: string;
  satuan: number;
  harga: number;
  totalHarian: number;
  totalKeseluruhan: number | "";
  keterangan: string;
}

export function mapTransactionRows(rows: TransactionApiRow[] | undefined): LaundryTransaction[] {
  return (rows ?? []).map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    roomNumber: transaction.roomNumber,
    clientName: transaction.clientName,
    quantityKg: Number(transaction.quantityKg),
    pricePerKg: Number(transaction.pricePerKg),
  }));
}

export function formatThousands(value: number): string {
  return value.toLocaleString("id-ID");
}

export function sanitizeNumberInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function formatPriceInput(raw: string): string {
  const digits = sanitizeNumberInput(raw);
  if (!digits) {
    return "";
  }
  return formatThousands(Number(digits));
}

export function parsePriceInput(raw: string): number {
  const digits = sanitizeNumberInput(raw);
  if (!digits) {
    return 0;
  }
  return Number(digits);
}

export function parseQuantityInput(raw: string): number {
  const normalized = raw.trim();
  if (!normalized) {
    return 0;
  }
  if (!/^\d+(\.\d)?$/.test(normalized)) {
    return Number.NaN;
  }
  return Number(normalized);
}

export function buildExportRows(params: {
  sortedTransactions: LaundryTransaction[];
  noteCountByDate: Map<string, number>;
  dailySubtotalByDate: Map<string, number>;
  getDailyTotal: (tx: LaundryTransaction) => number;
}): ExportRow[] {
  const { sortedTransactions, noteCountByDate, dailySubtotalByDate, getDailyTotal } = params;

  return sortedTransactions.map((transaction, index) => {
    const isFirstDateRow =
      index === 0 || sortedTransactions[index - 1].date !== transaction.date;
    return {
      no: index + 1,
      tanggal: formatISODateToLongID(transaction.date),
      jumlahNota: noteCountByDate.get(transaction.id) ?? 0,
      totalKeseluruhan: isFirstDateRow ? dailySubtotalByDate.get(transaction.date) ?? 0 : "",
      noKamar: transaction.roomNumber,
      satuan: transaction.quantityKg,
      harga: transaction.pricePerKg,
      totalHarian: getDailyTotal(transaction),
      keterangan: isFirstDateRow ? transaction.clientName : "",
    };
  });
}
