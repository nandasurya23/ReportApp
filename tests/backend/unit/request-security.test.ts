import { rejectCrossOriginRequest } from "@/lib/server/request-security";

describe("request security helper", () => {
  it("allows requests without an origin header", () => {
    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
    });

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });

  it("allows same-origin requests", () => {
    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: {
        origin: "http://localhost",
      },
    });

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });

  it("rejects cross-origin requests", async () => {
    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
      },
    });

    const response = rejectCrossOriginRequest(request);
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual(
      expect.objectContaining({
        code: "FORBIDDEN_ORIGIN",
      }),
    );
  });
});
