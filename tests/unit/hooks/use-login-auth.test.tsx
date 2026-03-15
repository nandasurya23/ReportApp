/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormEvent } from "react";

const routerPushMock = jest.fn();
const loginRequestMock = jest.fn();
const getLoginPayloadMock = jest.fn();
const persistRememberedUsernameMock = jest.fn();
const setAuthSessionFromUsernameMock = jest.fn();
const applyLoginErrorMock = jest.fn((setError: (msg: string) => void, msg: string) => setError(msg));
const clearLoginErrorMock = jest.fn((setError: (msg: string) => void) => setError(""));
const showLoginSuccessMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

jest.mock("@/lib/services/auth/auth-api", () => ({
  loginRequest: (...args: unknown[]) => loginRequestMock(...args),
  getLoginPayload: (...args: unknown[]) => getLoginPayloadMock(...args),
}));

jest.mock("@/lib/utils/login-storage", () => ({
  persistRememberedUsername: (...args: unknown[]) => persistRememberedUsernameMock(...args),
}));

jest.mock("@/lib/storage/local-storage", () => ({
  setAuthSessionFromUsername: (...args: unknown[]) => setAuthSessionFromUsernameMock(...args),
}));

jest.mock("@/lib/utils/login-feedback", () => ({
  applyLoginError: (setError: (msg: string) => void, msg: string) => applyLoginErrorMock(setError, msg),
  clearLoginError: (setError: (msg: string) => void) => clearLoginErrorMock(setError),
  showLoginSuccess: () => showLoginSuccessMock(),
}));

import { useLoginAuth } from "@/app/login/use-login-auth";

function Harness(props: {
  username: string;
  password: string;
  rememberMe: boolean;
  rememberUsernameKey: string;
  getValidationError: () => string | null;
}) {
  const { error, isSubmitting, onSubmit } = useLoginAuth(props);

  return (
    <div>
      <span data-testid="error">{error}</span>
      <span data-testid="submitting">{String(isSubmitting)}</span>
      <button
        type="button"
        onClick={() =>
          onSubmit({
            preventDefault: () => undefined,
          } as unknown as FormEvent<HTMLFormElement>)
        }
      >
        submit
      </button>
    </div>
  );
}

describe("useLoginAuth", () => {
  beforeEach(() => {
    routerPushMock.mockReset();
    loginRequestMock.mockReset();
    getLoginPayloadMock.mockReset();
    persistRememberedUsernameMock.mockReset();
    setAuthSessionFromUsernameMock.mockReset();
    applyLoginErrorMock.mockClear();
    clearLoginErrorMock.mockClear();
    showLoginSuccessMock.mockReset();
  });

  it("handles validation error and stops request", async () => {
    render(
      <Harness
        username=""
        password=""
        rememberMe={false}
        rememberUsernameKey="remember-key"
        getValidationError={() => "Username dan password wajib diisi."}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(applyLoginErrorMock).toHaveBeenCalledWith(expect.any(Function), "Username dan password wajib diisi.");
    });
    expect(loginRequestMock).not.toHaveBeenCalled();
  });

  it("runs successful auth flow and remember-me persistence", async () => {
    loginRequestMock.mockResolvedValue({ ok: true });
    getLoginPayloadMock.mockResolvedValue({ user: { username: "pelunk" } });

    render(
      <Harness
        username=" pelunk "
        password=" @pelunk12 "
        rememberMe
        rememberUsernameKey="remember-key"
        getValidationError={() => null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(loginRequestMock).toHaveBeenCalledWith("pelunk", "@pelunk12");
    });
    expect(clearLoginErrorMock).toHaveBeenCalled();
    expect(persistRememberedUsernameMock).toHaveBeenCalledWith({
      rememberMe: true,
      username: " pelunk ",
      key: "remember-key",
    });
    expect(setAuthSessionFromUsernameMock).toHaveBeenCalledWith("pelunk");
    expect(showLoginSuccessMock).toHaveBeenCalled();
    expect(routerPushMock).toHaveBeenCalledWith("/report");
  });

  it("handles failed auth payload with error message", async () => {
    loginRequestMock.mockResolvedValue({ ok: false });
    getLoginPayloadMock.mockResolvedValue({ error: "Invalid username or password." });

    render(
      <Harness
        username="pelunk"
        password="wrong"
        rememberMe={false}
        rememberUsernameKey="remember-key"
        getValidationError={() => null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(applyLoginErrorMock).toHaveBeenCalledWith(expect.any(Function), "Invalid username or password.");
    });
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("handles request exceptions safely", async () => {
    loginRequestMock.mockRejectedValue(new Error("network"));

    render(
      <Harness
        username="pelunk"
        password="@pelunk12"
        rememberMe={false}
        rememberUsernameKey="remember-key"
        getValidationError={() => null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(applyLoginErrorMock).toHaveBeenCalledWith(expect.any(Function), "Login gagal. Coba lagi.");
    });
  });
});
