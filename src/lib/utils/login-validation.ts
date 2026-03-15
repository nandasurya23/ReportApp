export function validateLoginCredentials(username: string, password: string) {
  if (!username.trim() || !password.trim()) {
    return "Username dan password wajib diisi.";
  }
  return null;
}
