import {
  LaundryTransaction,
  LaundryTransactionInput,
  TransactionMonthFilter,
  TransactionWithTotal,
} from "@/types/laundry";

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
  return transaction.quantityKg * transaction.pricePerKg;
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
