const prismaMock = {
  transaction: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const getSessionUserMock = jest.fn();

jest.mock("@/lib/server/prisma", () => ({
  prisma: prismaMock,
}));

jest.mock("@/lib/server/session", () => ({
  getSessionUser: (...args: unknown[]) => getSessionUserMock(...args),
}));

import {
  GET as getTransactions,
  POST as postTransaction,
  DELETE as resetTransactions,
} from "@/app/api/transactions/route";
import {
  PATCH as patchTransaction,
  DELETE as deleteTransaction,
} from "@/app/api/transactions/[id]/route";

describe("transactions routes", () => {
  beforeEach(() => {
    prismaMock.transaction.count.mockReset();
    prismaMock.transaction.findMany.mockReset();
    prismaMock.transaction.findFirst.mockReset();
    prismaMock.transaction.create.mockReset();
    prismaMock.transaction.update.mockReset();
    prismaMock.transaction.delete.mockReset();
    prismaMock.transaction.deleteMany.mockReset();
    getSessionUserMock.mockReset();
  });

  it("lists transactions with mapped response and pagination", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.count.mockResolvedValue(2);
    prismaMock.transaction.findMany.mockResolvedValue([
      {
        id: "tx-1",
        date: new Date("2026-03-15T00:00:00.000Z"),
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 2,
        pricePerKg: 5000,
        createdAt: new Date("2026-03-15T01:00:00.000Z"),
        updatedAt: new Date("2026-03-15T02:00:00.000Z"),
      },
    ]);

    const request = new Request("http://localhost/api/transactions?page=1&limit=10") as never;
    const response = await getTransactions(request);
    const body = (await response.json()) as {
      transactions: Array<{ id: string; date: string }>;
      total: number;
      totalPages: number;
    };

    expect(response.status).toBe(200);
    expect(body.transactions[0]).toEqual(
      expect.objectContaining({
        id: "tx-1",
        date: "2026-03-15",
      }),
    );
    expect(body.total).toBe(2);
    expect(body.totalPages).toBe(1);
  });

  it("GET month scope skips the count query and returns the scoped dataset", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findMany.mockResolvedValue([
      {
        id: "tx-1",
        date: new Date("2026-03-15T00:00:00.000Z"),
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 2,
        pricePerKg: 5000,
        createdAt: new Date("2026-03-15T01:00:00.000Z"),
        updatedAt: new Date("2026-03-15T02:00:00.000Z"),
      },
    ]);

    const request = new Request(
      "http://localhost/api/transactions?month=2026-03&scope=month",
    ) as never;
    const response = await getTransactions(request);
    const body = (await response.json()) as {
      transactions: Array<{ id: string; date: string }>;
      total: number;
      limit: number;
      totalPages: number;
    };

    expect(response.status).toBe(200);
    expect(prismaMock.transaction.count).not.toHaveBeenCalled();
    expect(body.transactions[0]).toEqual(
      expect.objectContaining({
        id: "tx-1",
        date: "2026-03-15",
      }),
    );
    expect(body.total).toBe(1);
    expect(body.limit).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("creates new transaction when no duplicate exists", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findMany.mockResolvedValueOnce([]);
    prismaMock.transaction.create.mockResolvedValue({
      id: "tx-new",
      date: new Date("2026-03-16T00:00:00.000Z"),
      roomNumber: "A-02",
      clientName: "Client B",
      quantityKg: 1.5,
      pricePerKg: 7000,
      createdAt: new Date("2026-03-16T01:00:00.000Z"),
      updatedAt: new Date("2026-03-16T02:00:00.000Z"),
    });

    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-03-16",
        roomNumber: "A-02",
        clientName: "Client B",
        quantityKg: 1.5,
        pricePerKg: 7000,
      }),
    }) as never;

    const response = await postTransaction(request);
    const body = (await response.json()) as { transaction?: { id: string } };

    expect(response.status).toBe(201);
    expect(body.transaction?.id).toBe("tx-new");
    expect(prismaMock.transaction.create).toHaveBeenCalled();
  });

  it("returns conflict when create payload matches same date and room after normalization", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      {
        id: "tx-dup",
        date: new Date("2026-03-16T00:00:00.000Z"),
        roomNumber: " 8072   a ",
        clientName: "Client B",
        quantityKg: 1.5,
        pricePerKg: 7000,
        createdAt: new Date("2026-03-16T01:00:00.000Z"),
        updatedAt: new Date("2026-03-16T02:00:00.000Z"),
      },
    ]);

    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-03-16",
        roomNumber: "8072 A",
        clientName: "Client B",
        quantityKg: 1.5,
        pricePerKg: 7000,
      }),
    }) as never;

    const response = await postTransaction(request);
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(409);
    expect(body.code).toBe("TRANSACTION_CONFLICT");
    expect(body.message).toContain("tanggal dan kamar ini sudah ada");
  });

  it("allows same room code on a different date", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findMany.mockResolvedValueOnce([]);
    prismaMock.transaction.create.mockResolvedValue({
      id: "tx-new",
      date: new Date("2026-03-17T00:00:00.000Z"),
      roomNumber: "8072 A",
      clientName: "Client B",
      quantityKg: 1.5,
      pricePerKg: 7000,
      createdAt: new Date("2026-03-17T01:00:00.000Z"),
      updatedAt: new Date("2026-03-17T02:00:00.000Z"),
    });

    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-03-17",
        roomNumber: "8072 A",
        clientName: "Client B",
        quantityKg: 1.5,
        pricePerKg: 7000,
      }),
    }) as never;

    const response = await postTransaction(request);
    expect(response.status).toBe(201);
  });

  it("returns field-level validation errors for invalid create payload", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "",
        roomNumber: "",
        clientName: "",
        quantityKg: 0,
        pricePerKg: -1,
      }),
    }) as never;

    const response = await postTransaction(request);
    const body = (await response.json()) as { code?: string; fieldErrors?: Record<string, string> };

    expect(response.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.fieldErrors).toEqual(
      expect.objectContaining({
        date: expect.any(String),
        roomNumber: expect.any(String),
        clientName: expect.any(String),
        quantityKg: expect.any(String),
        pricePerKg: expect.any(String),
      }),
    );
  });

  it("POST create rejects non-json requests", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "date=2026-03-16",
    }) as never;

    const response = await postTransaction(request);
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(415);
    expect(body.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(body.message).toBe("Format request harus JSON.");
  });

  it("updates transaction when PATCH payload is valid", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst
      .mockResolvedValueOnce({
        id: "tx-1",
        date: new Date("2026-03-15T00:00:00.000Z"),
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 2,
        pricePerKg: 5000,
      })
      .mockResolvedValueOnce(null);
    prismaMock.transaction.findMany.mockResolvedValueOnce([]);
    prismaMock.transaction.update.mockResolvedValue({
      id: "tx-1",
      date: new Date("2026-03-15T00:00:00.000Z"),
      roomNumber: "A-03",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
      createdAt: new Date("2026-03-15T01:00:00.000Z"),
      updatedAt: new Date("2026-03-15T02:00:00.000Z"),
    });

    const request = new Request("http://localhost/api/transactions/tx-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber: "A-03" }),
    }) as never;

    const response = await patchTransaction(request, { params: Promise.resolve({ id: "tx-1" }) });
    const body = (await response.json()) as { transaction?: { roomNumber: string } };

    expect(response.status).toBe(200);
    expect(body.transaction?.roomNumber).toBe("A-03");
    expect(prismaMock.transaction.update).toHaveBeenCalled();
  });

  it("returns conflict when PATCH changes room to an existing same-day room", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "tx-1",
      date: new Date("2026-03-18T00:00:00.000Z"),
      roomNumber: "8072 A",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
    });
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      {
        id: "tx-other",
        date: new Date("2026-03-18T00:00:00.000Z"),
        roomNumber: " 8072   a ",
        clientName: "Client B",
        quantityKg: 1,
        pricePerKg: 6000,
        createdAt: new Date("2026-03-18T01:00:00.000Z"),
        updatedAt: new Date("2026-03-18T02:00:00.000Z"),
      },
    ]);

    const request = new Request("http://localhost/api/transactions/tx-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber: "8072 A" }),
    }) as never;

    const response = await patchTransaction(request, { params: Promise.resolve({ id: "tx-1" }) });
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(409);
    expect(body.code).toBe("TRANSACTION_CONFLICT");
    expect(body.message).toContain("tanggal dan kamar ini sudah ada");
  });

  it("returns conflict when PATCH changes date into an existing same-room day", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "tx-1",
      date: new Date("2026-03-18T00:00:00.000Z"),
      roomNumber: "8072 A",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
    });
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      {
        id: "tx-other",
        date: new Date("2026-03-19T00:00:00.000Z"),
        roomNumber: "8072 a",
        clientName: "Client B",
        quantityKg: 1,
        pricePerKg: 6000,
        createdAt: new Date("2026-03-19T01:00:00.000Z"),
        updatedAt: new Date("2026-03-19T02:00:00.000Z"),
      },
    ]);

    const request = new Request("http://localhost/api/transactions/tx-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-03-19" }),
    }) as never;

    const response = await patchTransaction(request, { params: Promise.resolve({ id: "tx-1" }) });
    expect(response.status).toBe(409);
  });

  it("returns 400 when PATCH body has no updatable fields", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "tx-1",
      date: new Date("2026-03-18T00:00:00.000Z"),
      roomNumber: "8072 A",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
    });

    const request = new Request("http://localhost/api/transactions/tx-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as never;

    const response = await patchTransaction(request, { params: Promise.resolve({ id: "tx-1" }) });
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(400);
    expect(body.code).toBe("NO_UPDATABLE_FIELDS");
  });

  it("returns 404 when PATCH target is not found", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/transactions/tx-missing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber: "A-99" }),
    }) as never;

    const response = await patchTransaction(request, { params: Promise.resolve({ id: "tx-missing" }) });
    expect(response.status).toBe(404);
  });

  it("PATCH update rejects non-json requests", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "tx-1",
      date: new Date("2026-03-18T00:00:00.000Z"),
      roomNumber: "8072 A",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
    });

    const request = new Request("http://localhost/api/transactions/tx-1", {
      method: "PATCH",
      headers: { "Content-Type": "text/plain" },
      body: "roomNumber=A-03",
    }) as never;

    const response = await patchTransaction(request, { params: Promise.resolve({ id: "tx-1" }) });
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(415);
    expect(body.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(body.message).toBe("Format request harus JSON.");
  });

  it("deletes transaction by id", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce({ id: "tx-1" });
    prismaMock.transaction.delete.mockResolvedValue({});

    const request = new Request("http://localhost/api/transactions/tx-1", {
      method: "DELETE",
    }) as never;

    const response = await deleteTransaction(request, { params: Promise.resolve({ id: "tx-1" }) });
    const body = (await response.json()) as { success?: boolean };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: "tx-1" } });
  });

  it("resets transactions for current user", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.deleteMany.mockResolvedValue({ count: 3 });

    const request = new Request("http://localhost/api/transactions", {
      method: "DELETE",
    }) as never;

    const response = await resetTransactions(request);
    const body = (await response.json()) as { success?: boolean };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prismaMock.transaction.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("resets transactions for a specific month", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.deleteMany.mockResolvedValue({ count: 3 });

    const request = new Request("http://localhost/api/transactions?month=2026-03", {
      method: "DELETE",
    }) as never;

    const response = await resetTransactions(request);
    const body = (await response.json()) as {
      success?: boolean;
      scope?: string;
      month?: string;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.scope).toBe("month");
    expect(body.month).toBe("2026-03");
    expect(prismaMock.transaction.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        date: {
          gte: new Date("2026-03-01T00:00:00.000Z"),
          lt: new Date("2026-04-01T00:00:00.000Z"),
        },
      },
    });
  });

  it("returns validation error for invalid month on reset", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });

    const request = new Request("http://localhost/api/transactions?month=bad-value", {
      method: "DELETE",
    }) as never;

    const response = await resetTransactions(request);
    const body = (await response.json()) as { code?: string; fieldErrors?: Record<string, string> };

    expect(response.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.fieldErrors).toEqual(
      expect.objectContaining({
        month: expect.any(String),
      }),
    );
  });

  it("returns 500 for safe mocked failure case", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.count.mockRejectedValue(new Error("db down"));
    const request = new Request("http://localhost/api/transactions") as never;
    const response = await getTransactions(request);
    const body = (await response.json()) as { code?: string; message?: string };
    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
