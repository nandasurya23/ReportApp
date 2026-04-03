import { validateLoginCredentials } from "@/lib/utils/login-validation";

describe("login-validation utils", () => {
  it("returns error when username is empty", () => {
    expect(validateLoginCredentials("   ", "password")).toBe("Data login belum lengkap atau belum valid.");
  });

  it("returns error when password is empty", () => {
    expect(validateLoginCredentials("pelunk", "   ")).toBe("Data login belum lengkap atau belum valid.");
  });

  it("returns null when username and password are valid", () => {
    expect(validateLoginCredentials("pelunk", "@pelunk12")).toBeNull();
  });
});
