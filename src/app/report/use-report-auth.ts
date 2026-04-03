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
} from "@/lib/services/auth/report-api";

const INACTIVITY_LOGOUT_MS = 60 * 60 * 1000;

interface UseReportAuthParams {
  isInitializing: boolean;
  setIsInitializing: (value: boolean) => void;
  setUsername: (value: string) => void;
  setReportClientName: (value: string) => void;
  setReportKeterangan: (value: string) => void;
}

export function useReportAuth({
  isInitializing,
  setIsInitializing,
  setUsername,
  setReportClientName,
  setReportKeterangan,
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
        setUsername(payload.user.username);
        setReportClientName(preferences.clientName);
        setReportKeterangan(preferences.keterangan);
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
    redirectToLogin,
    setIsInitializing,
    setReportClientName,
    setReportKeterangan,
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
