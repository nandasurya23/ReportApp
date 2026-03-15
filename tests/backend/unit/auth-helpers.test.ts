import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  clearAuthCookie,
  unauthorizedResponse,
  SESSION_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
} from "@/lib/server/auth";

describe("auth server helpers", () => {
  it("creates session token with expected length", () => {
    const token = createSessionToken();
    expect(typeof token).toBe("string");
    expect(token).toHaveLength(64);
  });

  it("hashes and verifies password", () => {
    const hash = hashPassword("@pelunk12");
    expect(hash).not.toBe("@pelunk12");
    expect(verifyPassword("@pelunk12", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("supports compatibility plain password path", () => {
    expect(verifyPassword("plain-pass", "plain-pass")).toBe(true);
  });

  it("returns unauthorized response with 401", async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("clears auth cookie on response", () => {
    const response = clearAuthCookie(unauthorizedResponse());
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain("max-age=0");
  });

  it("has positive session max age", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBeGreaterThan(0);
  });
});
