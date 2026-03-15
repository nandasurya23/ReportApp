"use client";

import { useState } from "react";

import {
  getRememberedUsername,
  hasRememberedUsername,
} from "@/lib/utils/login-storage";
import { validateLoginCredentials } from "@/lib/utils/login-validation";

interface UseLoginFormParams {
  rememberUsernameKey: string;
}

export function useLoginForm({ rememberUsernameKey }: UseLoginFormParams) {
  const [username, setUsername] = useState(() => getRememberedUsername(rememberUsernameKey));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => hasRememberedUsername(rememberUsernameKey));

  const getValidationError = () => validateLoginCredentials(username, password);

  return {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    getValidationError,
  };
}
