import { safeJson } from "@/lib/utils/http";

describe("http utils", () => {
  it("returns parsed JSON when response json is valid", async () => {
    const response = {
      json: async () => ({ ok: true, value: 123 }),
    } as unknown as Response;
    await expect(safeJson(response, { ok: false, value: 0 })).resolves.toEqual({
      ok: true,
      value: 123,
    });
  });

  it("returns fallback when response json throws", async () => {
    const response = {
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Response;
    await expect(safeJson(response, { ok: false })).resolves.toEqual({ ok: false });
  });
});
