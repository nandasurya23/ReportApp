"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { setAuthSessionFromUsername } from "@/lib/storage/local-storage";
import { getLoginPayload, loginRequest } from "@/lib/services/auth/auth-api";
import {
  applyLoginError,
  clearLoginError,
  showLoginSuccess,
} from "@/lib/utils/login-feedback";
import { persistRememberedUsername } from "@/lib/utils/login-storage";

interface UseLoginAuthParams {
  username: string;
  password: string;
  rememberMe: boolean;
  rememberUsernameKey: string;
  getValidationError: () => string | null;
}

export function useLoginAuth({
  username,
  password,
  rememberMe,
  rememberUsernameKey,
  getValidationError,
}: UseLoginAuthParams) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = getValidationError();
    if (validationError) {
      applyLoginError(setError, validationError);
      return;
    }
    clearLoginError(setError);
    setIsSubmitting(true);

    try {
      const response = await loginRequest(username.trim(), password.trim());
      const payload = await getLoginPayload(response);
      const message =
        payload.message ||
        payload.error ||
        (payload.code === "AUTH_RATE_LIMITED"
          ? "Terlalu banyak percobaan login. Coba lagi nanti."
          : payload.code === "AUTH_RATE_LIMITER_UNAVAILABLE"
            ? "Login sedang tidak bisa diproses sementara. Coba lagi sebentar lagi."
            : payload.code === "AUTH_INVALID_CREDENTIALS"
              ? "Username atau password salah."
              : payload.code === "VALIDATION_ERROR"
                ? "Data login belum lengkap atau belum valid."
                : payload.code === "AUTH_INTERNAL_ERROR"
                  ? "Terjadi kendala pada sistem. Coba lagi."
                  : "Login gagal. Cek kembali kredensial.");

      if (!response.ok || !payload.user?.username) {
        applyLoginError(setError, message);
        return;
      }

      persistRememberedUsername({
        rememberMe,
        username,
        key: rememberUsernameKey,
      });

      setAuthSessionFromUsername(payload.user.username);
      showLoginSuccess();
      router.push("/report");
    } catch {
      applyLoginError(setError, "Login gagal. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    error,
    isSubmitting,
    onSubmit,
  };
}
