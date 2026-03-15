/** @jest-environment jsdom */

import {
  getRememberedUsername,
  hasRememberedUsername,
  persistRememberedUsername,
} from "@/lib/utils/login-storage";

describe("login-storage utils", () => {
  const key = "test.remember.key";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty value when no remembered username exists", () => {
    expect(getRememberedUsername(key)).toBe("");
    expect(hasRememberedUsername(key)).toBe(false);
  });

  it("stores and reads remembered username when rememberMe is true", () => {
    persistRememberedUsername({
      rememberMe: true,
      username: " pelunk ",
      key,
    });
    expect(getRememberedUsername(key)).toBe("pelunk");
    expect(hasRememberedUsername(key)).toBe(true);
  });

  it("removes remembered username when rememberMe is false", () => {
    window.localStorage.setItem(key, "pelunk");
    persistRememberedUsername({
      rememberMe: false,
      username: "pelunk",
      key,
    });
    expect(getRememberedUsername(key)).toBe("");
    expect(hasRememberedUsername(key)).toBe(false);
  });
});
