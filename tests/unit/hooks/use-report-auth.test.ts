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
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });
    const setIsInitializing = jest.fn();
    const setIsLoadingTransactions = jest.fn();
    const setTransactionError = jest.fn();
    const setUsername = jest.fn();
    const setTransactionState = jest.fn();
    const setReportClientName = jest.fn();
    const setReportKeterangan = jest.fn();
    const setStartDate = jest.fn();
    const setEndDate = jest.fn();
    const fetchTransactionsList = jest.fn().mockResolvedValue([
      {
        id: "1",
        date: "2026-03-01",
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 1,
        pricePerKg: 1000,
      },
    ]);

    useReportAuth({
      isInitializing: true,
      setIsInitializing,
      setIsLoadingTransactions,
      setTransactionError,
      setUsername,
      setTransactionState,
      setReportClientName,
      setReportKeterangan,
      setStartDate,
      setEndDate,
      fetchTransactionsList,
    });

    await flushPromises();
    await flushPromises();

    expect(setAuthSessionFromUsernameMock).toHaveBeenCalledWith("pelunk");
    expect(setUsername).toHaveBeenCalledWith("pelunk");
    expect(setTransactionState).toHaveBeenCalledWith([
      {
        id: "1",
        date: "2026-03-01",
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 1,
        pricePerKg: 1000,
      },
    ]);
    expect(setReportClientName).toHaveBeenCalledWith("Client A");
    expect(setReportKeterangan).toHaveBeenCalledWith("Catatan");
    expect(setStartDate).toHaveBeenCalledWith("2026-03-01");
    expect(setEndDate).toHaveBeenCalledWith("2026-03-31");
    expect(setIsInitializing).toHaveBeenCalledWith(false);
  });

  it("redirects to login when auth check fails", async () => {
    getAuthMeRequestMock.mockResolvedValue({ ok: false });
    getAuthMePayloadMock.mockResolvedValue({});
    const setIsInitializing = jest.fn();

    useReportAuth({
      isInitializing: true,
      setIsInitializing,
      setIsLoadingTransactions: jest.fn(),
      setTransactionError: jest.fn(),
      setUsername: jest.fn(),
      setTransactionState: jest.fn(),
      setReportClientName: jest.fn(),
      setReportKeterangan: jest.fn(),
      setStartDate: jest.fn(),
      setEndDate: jest.fn(),
      fetchTransactionsList: jest.fn(),
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
      setIsLoadingTransactions: jest.fn(),
      setTransactionError: jest.fn(),
      setUsername: jest.fn(),
      setTransactionState: jest.fn(),
      setReportClientName: jest.fn(),
      setReportKeterangan: jest.fn(),
      setStartDate: jest.fn(),
      setEndDate: jest.fn(),
      fetchTransactionsList: jest.fn(),
    });

    await result.onLogout();

    expect(postAuthLogoutRequestMock).toHaveBeenCalled();
    expect(clearAuthSessionMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
