/** @jest-environment jsdom */

import { renderHook } from "@testing-library/react";

const getRememberedUsernameMock = jest.fn();
const hasRememberedUsernameMock = jest.fn();

jest.mock("@/lib/utils/login-storage", () => ({
  getRememberedUsername: (key: string) => getRememberedUsernameMock(key),
  hasRememberedUsername: (key: string) => hasRememberedUsernameMock(key),
}));

import { useLoginForm } from "@/app/login/use-login-form";

describe("useLoginForm", () => {
  beforeEach(() => {
    getRememberedUsernameMock.mockReset();
    hasRememberedUsernameMock.mockReset();
  });

  it("initializes from remembered username and remember flag", () => {
    getRememberedUsernameMock.mockReturnValue("pelunk");
    hasRememberedUsernameMock.mockReturnValue(true);

    const { result } = renderHook(() =>
      useLoginForm({ rememberUsernameKey: "remember-key" }),
    );

    expect(getRememberedUsernameMock).toHaveBeenCalledWith("remember-key");
    expect(hasRememberedUsernameMock).toHaveBeenCalledWith("remember-key");
    expect(result.current.username).toBe("pelunk");
    expect(result.current.rememberMe).toBe(true);
  });

  it("returns validation error from current username/password state", () => {
    getRememberedUsernameMock.mockReturnValue("");
    hasRememberedUsernameMock.mockReturnValue(false);

    const { result } = renderHook(() =>
      useLoginForm({ rememberUsernameKey: "remember-key" }),
    );

    expect(result.current.getValidationError()).toBe("Data login belum lengkap atau belum valid.");
  });
});
