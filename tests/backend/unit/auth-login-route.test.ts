const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
  session: {
    create: jest.fn(),
  },
  loginAttempt: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const verifyPasswordMock = jest.fn();
const createSessionTokenMock = jest.fn();
const consoleWarnMock = jest.fn();

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
  getAuthThrottleDayKey: () => "2026-03-15",
  isLoginAttemptLimiterUnavailable: (error: unknown) =>
    Boolean(error && typeof error === "object" && (error as { code?: string }).code === "P2021"),
}));

import { POST } from "@/app/api/auth/login/route";

describe("auth login route", () => {
  const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.findUnique.mockResolvedValue(undefined);
    prismaMock.session.create.mockReset();
    prismaMock.loginAttempt.findUnique.mockReset();
    prismaMock.loginAttempt.upsert.mockReset();
    prismaMock.loginAttempt.deleteMany.mockReset();
    verifyPasswordMock.mockReset();
    createSessionTokenMock.mockReset();
    consoleWarnMock.mockReset();
    jest.spyOn(console, "warn").mockImplementation(consoleWarnMock);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns success and creates session on valid login", async () => {
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

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk", password: "@pelunk12" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { user?: { username?: string } };

    expect(response.status).toBe(200);
    expect(body.user?.username).toBe("pelunk");
    expect(prismaMock.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          token: "token-123",
          userId: "user-1",
        }),
      }),
    );
    expect(response.headers.get("set-cookie")).toContain("auth_token=token-123");
  });

  it("returns 401 and records failed attempt for invalid credentials", async () => {
    prismaMock.loginAttempt.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      username: "pelunk",
      passwordHash: "hashed",
    });
    verifyPasswordMock.mockReturnValue(false);
    prismaMock.loginAttempt.upsert.mockResolvedValue({});

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk", password: "wrong" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(401);
    expect(body.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(body.message).toBe("Username atau password salah.");
    expect(prismaMock.loginAttempt.upsert).toHaveBeenCalled();
  });

  it("returns 400 when credentials are missing", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as {
      code?: string;
      message?: string;
      fieldErrors?: Record<string, string>;
    };

    expect(response.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("Data login belum lengkap atau belum valid.");
    expect(body.fieldErrors).toEqual(
      expect.objectContaining({
        password: expect.any(String),
      }),
    );
  });

  it("returns 429 when login attempts exceed the daily limit", async () => {
    prismaMock.loginAttempt.findUnique.mockResolvedValue({ failedCount: 5 });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk", password: "@pelunk12" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(429);
    expect(body.code).toBe("AUTH_RATE_LIMITED");
    expect(body.message).toBe("Terlalu banyak percobaan login. Coba lagi nanti.");
  });

  it("fails closed in production when limiter dependency is unavailable", async () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
    });
    prismaMock.loginAttempt.findUnique.mockRejectedValue({ code: "P2021" });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk", password: "@pelunk12" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(503);
    expect(body.code).toBe("AUTH_RATE_LIMITER_UNAVAILABLE");
    expect(body.message).toBe("Login sedang tidak bisa diproses sementara. Coba lagi sebentar lagi.");
  });

  it("continues in non-production when limiter dependency is unavailable", async () => {
    prismaMock.loginAttempt.findUnique.mockRejectedValue({ code: "P2021" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      username: "pelunk",
      passwordHash: "hashed",
    });
    verifyPasswordMock.mockReturnValue(true);
    createSessionTokenMock.mockReturnValue("token-123");
    prismaMock.session.create.mockResolvedValue({});

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk", password: "@pelunk12" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { user?: { username?: string } };

    expect(response.status).toBe(200);
    expect(body.user?.username).toBe("pelunk");
    expect(consoleWarnMock).toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors", async () => {
    prismaMock.loginAttempt.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockRejectedValue(new Error("db down"));

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk", password: "@pelunk12" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { code?: string; message?: string };

    expect(response.status).toBe(500);
    expect(body.code).toBe("AUTH_INTERNAL_ERROR");
    expect(body.message).toBe("Terjadi kendala pada sistem. Coba lagi.");
  });
});
