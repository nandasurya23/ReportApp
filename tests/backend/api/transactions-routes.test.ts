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

describe("transactions API routes", () => {
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

  it("GET list returns expected shape for valid request", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.count.mockResolvedValue(1);
    prismaMock.transaction.findMany.mockResolvedValue([
      {
        id: "tx-1",
        date: new Date("2026-03-01T00:00:00.000Z"),
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 2,
        pricePerKg: 5000,
        createdAt: new Date("2026-03-01T01:00:00.000Z"),
        updatedAt: new Date("2026-03-01T02:00:00.000Z"),
      },
    ]);

    const request = new Request("http://localhost/api/transactions?page=1&limit=10") as never;
    const response = await getTransactions(request);
    const body = (await response.json()) as {
      transactions: Array<{ id: string; date: string }>;
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };

    expect(response.status).toBe(200);
    expect(body.transactions[0]).toEqual(
      expect.objectContaining({
        id: "tx-1",
        date: "2026-03-01",
      }),
    );
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
    expect(body.total).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("GET list returns unauthorized response when auth fails", async () => {
    getSessionUserMock.mockResolvedValue({
      unauthorizedResponse: new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401 }),
    });
    const request = new Request("http://localhost/api/transactions") as never;
    const response = await getTransactions(request);
    expect(response.status).toBe(401);
  });

  it("POST create returns 400 for invalid payload", async () => {
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
    expect(response.status).toBe(400);
  });

  it("POST create returns transaction shape for valid payload", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValue(null);
    prismaMock.transaction.create.mockResolvedValue({
      id: "tx-new",
      date: new Date("2026-03-02T00:00:00.000Z"),
      roomNumber: "A-02",
      clientName: "Client B",
      quantityKg: 1.5,
      pricePerKg: 7000,
      createdAt: new Date("2026-03-02T01:00:00.000Z"),
      updatedAt: new Date("2026-03-02T02:00:00.000Z"),
    });
    const request = new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-03-02",
        roomNumber: "A-02",
        clientName: "Client B",
        quantityKg: 1.5,
        pricePerKg: 7000,
      }),
    }) as never;

    const response = await postTransaction(request);
    const body = (await response.json()) as { transaction?: { id: string; roomNumber: string } };
    expect(response.status).toBe(201);
    expect(body.transaction).toEqual(
      expect.objectContaining({
        id: "tx-new",
        roomNumber: "A-02",
      }),
    );
  });

  it("PATCH update returns 400 for invalid route id", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    const request = new Request("http://localhost/api/transactions/ ", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber: "A-99" }),
    }) as never;
    const response = await patchTransaction(request, { params: Promise.resolve({ id: "" }) });
    expect(response.status).toBe(400);
  });

  it("PATCH update returns 404 when target is not found", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValue(null);
    const request = new Request("http://localhost/api/transactions/tx-missing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber: "A-99" }),
    }) as never;
    const response = await patchTransaction(request, { params: Promise.resolve({ id: "tx-missing" }) });
    expect(response.status).toBe(404);
  });

  it("PATCH update returns updated transaction for valid payload", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst
      .mockResolvedValueOnce({
        id: "tx-1",
        date: new Date("2026-03-01T00:00:00.000Z"),
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 2,
        pricePerKg: 5000,
      })
      .mockResolvedValueOnce(null);
    prismaMock.transaction.update.mockResolvedValue({
      id: "tx-1",
      date: new Date("2026-03-01T00:00:00.000Z"),
      roomNumber: "A-03",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
      createdAt: new Date("2026-03-01T01:00:00.000Z"),
      updatedAt: new Date("2026-03-01T02:00:00.000Z"),
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
  });

  it("DELETE by id returns 404 when not found", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValue(null);
    const request = new Request("http://localhost/api/transactions/tx-missing", {
      method: "DELETE",
    }) as never;
    const response = await deleteTransaction(request, { params: Promise.resolve({ id: "tx-missing" }) });
    expect(response.status).toBe(404);
  });

  it("DELETE by id returns success on valid request", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValue({ id: "tx-1" });
    prismaMock.transaction.delete.mockResolvedValue({});
    const request = new Request("http://localhost/api/transactions/tx-1", {
      method: "DELETE",
    }) as never;
    const response = await deleteTransaction(request, { params: Promise.resolve({ id: "tx-1" }) });
    const body = (await response.json()) as { success?: boolean };
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("DELETE reset returns success for authorized user", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.deleteMany.mockResolvedValue({ count: 2 });
    const request = new Request("http://localhost/api/transactions", {
      method: "DELETE",
    }) as never;
    const response = await resetTransactions(request);
    const body = (await response.json()) as { success?: boolean };
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 500 for safe mocked failure case", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.count.mockRejectedValue(new Error("db down"));
    const request = new Request("http://localhost/api/transactions") as never;
    const response = await getTransactions(request);
    const body = (await response.json()) as { error?: string };
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error.");
  });
});
