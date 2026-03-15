import { safeJson } from "@/lib/utils/http";

interface LoginApiPayload {
  user?: {
    username?: string;
  };
  error?: string;
}

export async function loginRequest(username: string, password: string) {
  return fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function getLoginPayload(response: Response) {
  return safeJson(response, {} as LoginApiPayload);
}
