import { getLoginPayload, loginRequest } from "@/lib/services/auth/auth-api";

describe("auth-api service", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("builds login request payload correctly", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await loginRequest("pelunk", "@pelunk12");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "pelunk",
        password: "@pelunk12",
      }),
    });
  });

  it("maps login payload and handles invalid json safely", async () => {
    const okResponse = {
      json: async () => ({ user: { username: "pelunk" } }),
    } as unknown as Response;
    await expect(getLoginPayload(okResponse)).resolves.toEqual({
      user: { username: "pelunk" },
    });

    const brokenResponse = {
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Response;
    await expect(getLoginPayload(brokenResponse)).resolves.toEqual({});
  });
});
