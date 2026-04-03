const replaceMock = jest.fn();
const getAuthMeRequestMock = jest.fn();
const getAuthMePayloadMock = jest.fn();
const postAuthLogoutRequestMock = jest.fn();
const clearAuthSessionMock = jest.fn();
const getReportPreferencesMock = jest.fn();
const setAuthSessionFromUsernameMock = jest.fn();

jest.mock("react", () => ({
  useCallback: (fn: (...args: unknown[]) => unknown) => fn,
  useEffect: (fn: () => void | (() => void)) => {
    fn();
  },
  useRef: () => ({ current: null }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock("@/lib/services/auth/report-api", () => ({
  getAuthMeRequest: () => getAuthMeRequestMock(),
  getAuthMePayload: (response: unknown) => getAuthMePayloadMock(response),
  postAuthLogoutRequest: () => postAuthLogoutRequestMock(),
}));

jest.mock("@/lib/storage/local-storage", () => ({
  clearAuthSession: () => clearAuthSessionMock(),
  getReportPreferences: () => getReportPreferencesMock(),
  setAuthSessionFromUsername: (username: string) => setAuthSessionFromUsernameMock(username),
}));

import { useReportAuth } from "@/app/report/use-report-auth";

const flushPromises = async () => {
  await new Promise<void>((resolve) => {
    setImmediate(() => resolve());
  });
};

describe("useReportAuth", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    getAuthMeRequestMock.mockReset();
    getAuthMePayloadMock.mockReset();
    postAuthLogoutRequestMock.mockReset();
    clearAuthSessionMock.mockReset();
    getReportPreferencesMock.mockReset();
    setAuthSessionFromUsernameMock.mockReset();
  });

  it("bootstraps auth state and report preferences", async () => {
    getAuthMeRequestMock.mockResolvedValue({ ok: true });
    getAuthMePayloadMock.mockResolvedValue({ user: { username: "pelunk" } });
    getReportPreferencesMock.mockReturnValue({
      clientName: "Client A",
      keterangan: "Catatan",
      startDate: null,
      endDate: null,
    });
    const setIsInitializing = jest.fn();
    const setUsername = jest.fn();
    const setReportClientName = jest.fn();
    const setReportKeterangan = jest.fn();

    useReportAuth({
      isInitializing: true,
      setIsInitializing,
      setUsername,
      setReportClientName,
      setReportKeterangan,
    });

    await flushPromises();
    await flushPromises();

    expect(setAuthSessionFromUsernameMock).toHaveBeenCalledWith("pelunk");
    expect(setUsername).toHaveBeenCalledWith("pelunk");
    expect(setReportClientName).toHaveBeenCalledWith("Client A");
    expect(setReportKeterangan).toHaveBeenCalledWith("Catatan");
    expect(setIsInitializing).toHaveBeenCalledWith(false);
  });

  it("redirects to login when auth check fails", async () => {
    getAuthMeRequestMock.mockResolvedValue({ ok: false });
    getAuthMePayloadMock.mockResolvedValue({});
    const setIsInitializing = jest.fn();

    useReportAuth({
      isInitializing: true,
      setIsInitializing,
      setUsername: jest.fn(),
      setReportClientName: jest.fn(),
      setReportKeterangan: jest.fn(),
    });

    await flushPromises();
    await flushPromises();

    expect(clearAuthSessionMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login");
    expect(setIsInitializing).toHaveBeenCalledWith(false);
  });

  it("logout action clears session and redirects", async () => {
    getAuthMeRequestMock.mockResolvedValue({ ok: false });
    getAuthMePayloadMock.mockResolvedValue({});
    postAuthLogoutRequestMock.mockResolvedValue(undefined);

    const result = useReportAuth({
      isInitializing: true,
      setIsInitializing: jest.fn(),
      setUsername: jest.fn(),
      setReportClientName: jest.fn(),
      setReportKeterangan: jest.fn(),
    });

    await result.onLogout();

    expect(postAuthLogoutRequestMock).toHaveBeenCalled();
    expect(clearAuthSessionMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
