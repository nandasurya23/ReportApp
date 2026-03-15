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

  it("creates new transaction when no duplicate exists", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce(null);
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

  it("returns existing transaction when duplicate create payload is found", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: "tx-dup",
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

    expect(response.status).toBe(200);
    expect(body.transaction?.id).toBe("tx-dup");
    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
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
});
