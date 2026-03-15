import {
  getAuthMePayload,
  getAuthMeRequest,
  postAuthLogoutRequest,
} from "@/lib/services/auth/report-api";

describe("report auth service", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("builds auth me request correctly", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await getAuthMeRequest();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  });

  it("builds logout request correctly", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await postAuthLogoutRequest();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("maps auth me payload and handles invalid json safely", async () => {
    const okResponse = {
      json: async () => ({ user: { username: "pelunk" } }),
    } as unknown as Response;
    await expect(getAuthMePayload(okResponse)).resolves.toEqual({
      user: { username: "pelunk" },
    });

    const brokenResponse = {
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Response;
    await expect(getAuthMePayload(brokenResponse)).resolves.toEqual({});
  });
});
