import { safeJson } from "@/lib/utils/http";

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
