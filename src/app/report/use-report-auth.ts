"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthSession,
  getReportPreferences,
  setAuthSessionFromUsername,
} from "@/lib/storage/local-storage";
import {
  getAuthMePayload,
  getAuthMeRequest,
  postAuthLogoutRequest,
} from "@/lib/services/report-api";
import { LaundryTransaction } from "@/types/laundry";

const INACTIVITY_LOGOUT_MS = 60 * 60 * 1000;

interface UseReportAuthParams {
  isInitializing: boolean;
  setIsInitializing: (value: boolean) => void;
  setIsLoadingTransactions: (value: boolean) => void;
  setTransactionError: (value: string) => void;
  setUsername: (value: string) => void;
  setTransactionState: (value: LaundryTransaction[]) => void;
  setReportClientName: (value: string) => void;
  setReportKeterangan: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  fetchTransactionsList: () => Promise<LaundryTransaction[] | null>;
}

export function useReportAuth({
  isInitializing,
  setIsInitializing,
  setIsLoadingTransactions,
  setTransactionError,
  setUsername,
  setTransactionState,
  setReportClientName,
  setReportKeterangan,
  setStartDate,
  setEndDate,
  fetchTransactionsList,
}: UseReportAuthParams) {
  const router = useRouter();
  const inactivityTimeoutRef = useRef<number | null>(null);

  const redirectToLogin = useCallback(() => {
    clearAuthSession();
    router.replace("/login");
  }, [router]);

  const logoutFromBackendAndRedirect = useCallback(async () => {
    try {
      await postAuthLogoutRequest();
    } catch {
      // no-op: client-side cleanup still runs
    } finally {
      redirectToLogin();
    }
  }, [redirectToLogin]);

  useEffect(() => {
    let cancelled = false;

    const loadTransactionsFromBackend = async (): Promise<LaundryTransaction[] | null> => {
      setIsLoadingTransactions(true);
      setTransactionError("");
      try {
        const nextTransactions = await fetchTransactionsList();
        if (!nextTransactions) {
          setTransactionError("Gagal memuat transaksi dari server.");
          return null;
        }
        return nextTransactions;
      } catch {
        setTransactionError("Gagal memuat transaksi dari server.");
        return null;
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    const bootstrap = async () => {
      try {
        const response = await getAuthMeRequest();
        const payload = await getAuthMePayload(response);

        if (!response.ok || !payload.user?.username) {
          if (!cancelled) {
            redirectToLogin();
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setAuthSessionFromUsername(payload.user.username);
        const preferences = getReportPreferences();
        const backendTransactions = await loadTransactionsFromBackend();
        setUsername(payload.user.username);
        const nextTransactions = backendTransactions ?? [];
        setTransactionState(nextTransactions);
        setReportClientName(preferences.clientName);
        setReportKeterangan(preferences.keterangan);
        setStartDate(preferences.startDate ?? "");
        setEndDate(preferences.endDate ?? "");
      } catch {
        if (!cancelled) {
          redirectToLogin();
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [
    fetchTransactionsList,
    redirectToLogin,
    setEndDate,
    setIsInitializing,
    setIsLoadingTransactions,
    setReportClientName,
    setReportKeterangan,
    setStartDate,
    setTransactionError,
    setTransactionState,
    setUsername,
  ]);

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    let isLoggingOut = false;
    const clearTimer = () => {
      if (inactivityTimeoutRef.current !== null) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }
      inactivityTimeoutRef.current = null;
    };

    const logoutForInactivity = async () => {
      if (isLoggingOut) {
        return;
      }
      isLoggingOut = true;
      await logoutFromBackendAndRedirect();
    };

    const resetInactivityTimer = () => {
      clearTimer();
      inactivityTimeoutRef.current = window.setTimeout(() => {
        void logoutForInactivity();
      }, INACTIVITY_LOGOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      clearTimer();
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [isInitializing, logoutFromBackendAndRedirect]);

  return { onLogout: logoutFromBackendAndRedirect };
}
