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

      if (!response.ok || !payload.user?.username) {
        const message = payload.error || "Login gagal. Cek kembali kredensial.";
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
