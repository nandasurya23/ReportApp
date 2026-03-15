import { STORAGE_KEYS } from "@/lib/constants/storage";
import { AuthSession } from "@/types/auth";
import { LaundryTransaction } from "@/types/laundry";
import { ReportPreferences } from "@/types/report";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

function readJSON<T>(key: string, fallback: T): T {
  const storage = getStorage();
  if (!storage) {
    return fallback;
  }

  const raw = storage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(key, JSON.stringify(value));
}

export function getAuthSession(): AuthSession | null {
  return readJSON<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
}

export function setAuthSession(session: AuthSession): void {
  writeJSON(STORAGE_KEYS.AUTH_SESSION, session);
}

export function clearAuthSession(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

export function getTransactions(): LaundryTransaction[] {
  return readJSON<LaundryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function setTransactions(transactions: LaundryTransaction[]): void {
  writeJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function getReportPreferences(): ReportPreferences {
  return readJSON<ReportPreferences>(STORAGE_KEYS.REPORT_PREFERENCES, {
    clientName: "",
    keterangan: "",
    startDate: null,
    endDate: null,
  });
}

export function setReportPreferences(preferences: ReportPreferences): void {
  writeJSON(STORAGE_KEYS.REPORT_PREFERENCES, preferences);
}
