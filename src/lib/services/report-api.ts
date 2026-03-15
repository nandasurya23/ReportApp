import { safeJson } from "@/lib/utils/http";

interface TransactionApiRow {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: number | string;
  pricePerKg: number | string;
}

export interface TransactionsListPayload {
  transactions?: TransactionApiRow[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface TransactionInputPayload {
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: number;
  pricePerKg: number;
}

export interface TransactionApiError {
  error?: string;
}

export async function getTransactionsRequest(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (params?.limit && params.limit > 0) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();
  const url = queryString ? `/api/transactions?${queryString}` : "/api/transactions";
  return fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
}

export async function getTransactionsPayload(response: Response) {
  return safeJson(response, {} as TransactionsListPayload);
}

export async function createTransactionRequest(payload: TransactionInputPayload) {
  return fetch("/api/transactions", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateTransactionRequest(id: string, payload: TransactionInputPayload) {
  return fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteTransactionRequest(id: string) {
  return fetch(`/api/transactions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function resetTransactionsRequest() {
  return fetch("/api/transactions", {
    method: "DELETE",
    credentials: "include",
  });
}

export async function readApiError(response: Response) {
  return safeJson(response, {} as TransactionApiError);
}
