import {
  createTransactionRequest,
  deleteTransactionRequest,
  getTransactionsPayload,
  getTransactionsRequest,
  readApiError,
  resetTransactionsRequest,
  updateTransactionRequest,
} from "@/lib/services/report-api";

describe("report-api service", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("builds GET transactions request with pagination params", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await getTransactionsRequest({ page: 2, limit: 100 });
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions?page=2&limit=100", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  });

  it("builds GET transactions request without params", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await getTransactionsRequest();
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  });

  it("builds create/update/delete/reset requests correctly", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const payload = {
      date: "2026-03-15",
      roomNumber: "A-01",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
    };

    await createTransactionRequest(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await updateTransactionRequest("tx-1", payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions/tx-1", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await deleteTransactionRequest("tx-1");
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions/tx-1", {
      method: "DELETE",
      credentials: "include",
    });

    await resetTransactionsRequest();
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions", {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("maps list payload and error payload safely", async () => {
    const responseWithJson = {
      json: async () => ({ transactions: [{ id: "1" }], totalPages: 3 }),
    } as unknown as Response;
    await expect(getTransactionsPayload(responseWithJson)).resolves.toEqual({
      transactions: [{ id: "1" }],
      totalPages: 3,
    });

    const brokenResponse = {
      json: async () => {
        throw new Error("bad json");
      },
    } as unknown as Response;
    await expect(getTransactionsPayload(brokenResponse)).resolves.toEqual({});
    await expect(readApiError(brokenResponse)).resolves.toEqual({});
  });
});
