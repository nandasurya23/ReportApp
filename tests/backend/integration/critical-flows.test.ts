const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
  transaction: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  loginAttempt: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const verifyPasswordMock = jest.fn();
const createSessionTokenMock = jest.fn();
const getSessionUserMock = jest.fn();

jest.mock("@/lib/server/prisma", () => ({
  prisma: prismaMock,
}));

jest.mock("@/lib/server/auth", () => ({
  AUTH_COOKIE_NAME: "auth_token",
  authCookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60,
  },
  createSessionToken: () => createSessionTokenMock(),
  SESSION_MAX_AGE_SECONDS: 60,
  verifyPassword: (...args: unknown[]) => verifyPasswordMock(...args),
  clearAuthCookie: (response: Response) => response,
  unauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401 }),
}));

jest.mock("@/lib/server/session", () => ({
  getSessionUser: (...args: unknown[]) => getSessionUserMock(...args),
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as createTransaction } from "@/app/api/transactions/route";
import { PATCH as updateTransaction, DELETE as deleteTransaction } from "@/app/api/transactions/[id]/route";

describe("backend integration critical flows", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.session.create.mockReset();
    prismaMock.session.findFirst.mockReset();
    prismaMock.session.deleteMany.mockReset();
    prismaMock.transaction.findFirst.mockReset();
    prismaMock.transaction.create.mockReset();
    prismaMock.transaction.update.mockReset();
    prismaMock.transaction.delete.mockReset();
    prismaMock.loginAttempt.findUnique.mockReset();
    prismaMock.loginAttempt.upsert.mockReset();
    prismaMock.loginAttempt.deleteMany.mockReset();
    verifyPasswordMock.mockReset();
    createSessionTokenMock.mockReset();
    getSessionUserMock.mockReset();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("auth flow: login -> me -> logout", async () => {
    prismaMock.loginAttempt.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      username: "pelunk",
      passwordHash: "hashed",
    });
    verifyPasswordMock.mockReturnValue(true);
    createSessionTokenMock.mockReturnValue("token-123");
    prismaMock.session.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({});

    const loginResponse = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "pelunk", password: "@pelunk12" }),
      }),
    );
    expect(loginResponse.status).toBe(200);

    prismaMock.session.findFirst.mockResolvedValue({
      user: {
        id: "user-1",
        username: "pelunk",
        createdAt: new Date("2026-03-15T00:00:00.000Z"),
      },
    });
    const meResponse = await meGet({
      cookies: { get: jest.fn().mockReturnValue({ value: "token-123" }) },
    } as never);
    expect(meResponse.status).toBe(200);

    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
    const logoutResponse = await logoutPost({
      cookies: { get: jest.fn().mockReturnValue({ value: "token-123" }) },
    } as never);
    expect(logoutResponse.status).toBe(200);
  });

  it("transaction flow: create -> update -> delete", async () => {
    getSessionUserMock.mockResolvedValue({ userId: "user-1", username: "pelunk" });

    prismaMock.transaction.findFirst.mockResolvedValueOnce(null);
    prismaMock.transaction.create.mockResolvedValue({
      id: "tx-1",
      date: new Date("2026-03-15T00:00:00.000Z"),
      roomNumber: "A-01",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
      createdAt: new Date("2026-03-15T01:00:00.000Z"),
      updatedAt: new Date("2026-03-15T02:00:00.000Z"),
    });
    const createResponse = await createTransaction(
      new Request("http://localhost/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-03-15",
          roomNumber: "A-01",
          clientName: "Client A",
          quantityKg: 2,
          pricePerKg: 5000,
        }),
      }) as never,
    );
    expect(createResponse.status).toBe(201);

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
      roomNumber: "A-02",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
      createdAt: new Date("2026-03-15T01:00:00.000Z"),
      updatedAt: new Date("2026-03-15T03:00:00.000Z"),
    });
    const updateResponse = await updateTransaction(
      new Request("http://localhost/api/transactions/tx-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber: "A-02" }),
      }) as never,
      { params: Promise.resolve({ id: "tx-1" }) },
    );
    expect(updateResponse.status).toBe(200);

    prismaMock.transaction.findFirst.mockResolvedValueOnce({ id: "tx-1" });
    prismaMock.transaction.delete.mockResolvedValue({});
    const deleteResponse = await deleteTransaction(
      new Request("http://localhost/api/transactions/tx-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "tx-1" }) },
    );
    expect(deleteResponse.status).toBe(200);
  });
});
