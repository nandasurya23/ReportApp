export function validateLoginCredentials(username: string, password: string) {
  if (!username.trim() || !password.trim()) {
    return "Data login belum lengkap atau belum valid.";
  }
  return null;
}
