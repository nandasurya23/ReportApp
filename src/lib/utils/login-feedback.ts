import { toast } from "sonner";

export function applyLoginError(
  setError: (message: string) => void,
  message: string,
) {
  setError(message);
  toast.error(message);
}

export function clearLoginError(setError: (message: string) => void) {
  setError("");
}

export function showLoginSuccess() {
  toast.success("Login berhasil.");
}
