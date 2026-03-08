export type TransactionId = string;

export interface LaundryTransaction {
  id: TransactionId;
  date: string; // ISO date: YYYY-MM-DD
  roomNumber: string;
  clientName: string;
  quantityKg: number;
  pricePerKg: number; // Stored as integer rupiah
}

export interface LaundryTransactionInput {
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: number;
  pricePerKg: number;
}

export interface TransactionMonthFilter {
  month: number; // 1-12
  year: number;
}

export interface TransactionWithTotal extends LaundryTransaction {
  dailyTotal: number;
}
