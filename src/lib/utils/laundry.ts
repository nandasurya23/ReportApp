import {
  LaundryTransaction,
  LaundryTransactionInput,
  TransactionMonthFilter,
  TransactionWithTotal,
} from "@/types/laundry";

const QUANTITY_SCALE = 10;

function toScaledInteger(value: number, scale: number): number {
  return Math.round(value * scale);
}

export function isValidQuantityOneDecimal(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0) {
    return false;
  }
  const scaled = toScaledInteger(value, QUANTITY_SCALE);
  return Math.abs(value * QUANTITY_SCALE - scaled) < 1e-9;
}

export function getDailyTotalFromValues(
  quantityKg: number,
  pricePerKg: number,
): number {
  if (!Number.isFinite(quantityKg) || !Number.isFinite(pricePerKg)) {
    return 0;
  }
  const scaledQuantity = toScaledInteger(quantityKg, QUANTITY_SCALE);
  const normalizedPrice = Math.round(pricePerKg);
  const scaledTotal = scaledQuantity * normalizedPrice;
  return Math.round(scaledTotal / QUANTITY_SCALE);
}

export function createTransaction(
  input: LaundryTransactionInput,
): LaundryTransaction {
  return {
    id: crypto.randomUUID(),
    date: input.date,
    roomNumber: input.roomNumber.trim(),
    clientName: input.clientName.trim(),
    quantityKg: input.quantityKg,
    pricePerKg: input.pricePerKg,
  };
}

export function getDailyTotal(transaction: LaundryTransaction): number {
  return getDailyTotalFromValues(transaction.quantityKg, transaction.pricePerKg);
}

export function withDailyTotal(
  transaction: LaundryTransaction,
): TransactionWithTotal {
  return {
    ...transaction,
    dailyTotal: getDailyTotal(transaction),
  };
}

export function getMonthlyTransactions(
  transactions: LaundryTransaction[],
  filter: TransactionMonthFilter,
): LaundryTransaction[] {
  return transactions.filter((transaction) => {
    const [yearStr, monthStr] = transaction.date.split("-");
    return Number(yearStr) === filter.year && Number(monthStr) === filter.month;
  });
}

export function getMonthlyTotal(transactions: LaundryTransaction[]): number {
  return transactions.reduce((sum, transaction) => {
    return sum + getDailyTotal(transaction);
  }, 0);
}
