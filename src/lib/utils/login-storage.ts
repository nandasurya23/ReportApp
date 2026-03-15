const DEFAULT_REMEMBER_USERNAME_KEY = "laundry.remembered_username";

export function getRememberedUsername(
  key: string = DEFAULT_REMEMBER_USERNAME_KEY,
) {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(key)?.trim() ?? "";
}

export function hasRememberedUsername(
  key: string = DEFAULT_REMEMBER_USERNAME_KEY,
) {
  return Boolean(getRememberedUsername(key));
}

export function persistRememberedUsername(params: {
  rememberMe: boolean;
  username: string;
  key?: string;
}) {
  if (typeof window === "undefined") {
    return;
  }
  const { rememberMe, username, key = DEFAULT_REMEMBER_USERNAME_KEY } = params;
  if (rememberMe) {
    window.localStorage.setItem(key, username.trim());
    return;
  }
  window.localStorage.removeItem(key);
}
