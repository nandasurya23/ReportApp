import { safeJson } from "@/lib/utils/http";

interface TransactionApiRow {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: number | string;
  pricePerKg: number | string;
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

export async function getTransactionsRequest() {
  return fetch("/api/transactions", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
}

export async function getTransactionsPayload(response: Response) {
  return safeJson(response, {} as { transactions?: TransactionApiRow[] });
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

export async function getAuthMeRequest() {
  return fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
}

export async function getAuthMePayload(response: Response) {
  return safeJson(response, {} as { user?: { username?: string } });
}

export async function postAuthLogoutRequest() {
  return fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
