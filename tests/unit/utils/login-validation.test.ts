import { validateLoginCredentials } from "@/lib/utils/login-validation";

describe("login-validation utils", () => {
  it("returns error when username is empty", () => {
    expect(validateLoginCredentials("   ", "password")).toBe("Username dan password wajib diisi.");
  });

  it("returns error when password is empty", () => {
    expect(validateLoginCredentials("pelunk", "   ")).toBe("Username dan password wajib diisi.");
  });

  it("returns null when username and password are valid", () => {
    expect(validateLoginCredentials("pelunk", "@pelunk12")).toBeNull();
  });
});
