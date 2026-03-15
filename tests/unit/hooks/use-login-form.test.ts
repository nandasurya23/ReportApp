const mockedStateQueue: unknown[] = [];
const useStateMock = jest.fn((initial: unknown) => {
  const value =
    typeof initial === "function" ? (initial as () => unknown)() : initial;
  const setter = jest.fn();
  return [value, setter];
});

jest.mock("react", () => ({
  useState: (...args: unknown[]) => {
    const next = mockedStateQueue.shift();
    if (next !== undefined) {
      return next;
    }
    return useStateMock(args[0]);
  },
}));

const getRememberedUsernameMock = jest.fn();
const hasRememberedUsernameMock = jest.fn();

jest.mock("@/lib/utils/login-storage", () => ({
  getRememberedUsername: (key: string) => getRememberedUsernameMock(key),
  hasRememberedUsername: (key: string) => hasRememberedUsernameMock(key),
}));

import { useLoginForm } from "@/app/login/use-login-form";

describe("useLoginForm", () => {
  beforeEach(() => {
    mockedStateQueue.length = 0;
    useStateMock.mockClear();
    getRememberedUsernameMock.mockReset();
    hasRememberedUsernameMock.mockReset();
  });

  it("initializes from remembered username and remember flag", () => {
    getRememberedUsernameMock.mockReturnValue("pelunk");
    hasRememberedUsernameMock.mockReturnValue(true);

    const result = useLoginForm({ rememberUsernameKey: "remember-key" });

    expect(getRememberedUsernameMock).toHaveBeenCalledWith("remember-key");
    expect(hasRememberedUsernameMock).toHaveBeenCalledWith("remember-key");
    expect(result.username).toBe("pelunk");
    expect(result.rememberMe).toBe(true);
  });

  it("returns validation error from current username/password state", () => {
    getRememberedUsernameMock.mockReturnValue("");
    hasRememberedUsernameMock.mockReturnValue(false);
    mockedStateQueue.push(["", jest.fn()], ["", jest.fn()], [false, jest.fn()], [false, jest.fn()]);

    const result = useLoginForm({ rememberUsernameKey: "remember-key" });
    expect(result.getValidationError()).toBe("Username dan password wajib diisi.");
  });
});
