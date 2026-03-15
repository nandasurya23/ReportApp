const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
  session: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  loginAttempt: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const verifyPasswordMock = jest.fn();
const createSessionTokenMock = jest.fn();
const clearAuthCookieMock = jest.fn((response: Response) => response);
const unauthorizedResponseMock = jest.fn(() => new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401 }));

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
  clearAuthCookie: (response: Response) => clearAuthCookieMock(response),
  unauthorizedResponse: () => unauthorizedResponseMock(),
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { GET as meGet } from "@/app/api/auth/me/route";

describe("auth API routes", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.session.create.mockReset();
    prismaMock.session.deleteMany.mockReset();
    prismaMock.session.findFirst.mockReset();
    prismaMock.loginAttempt.findUnique.mockReset();
    prismaMock.loginAttempt.upsert.mockReset();
    prismaMock.loginAttempt.deleteMany.mockReset();
    verifyPasswordMock.mockReset();
    createSessionTokenMock.mockReset();
    clearAuthCookieMock.mockClear();
    unauthorizedResponseMock.mockClear();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("login returns expected user shape for valid request", async () => {
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
    const response = await loginPost(request);
    const body = (await response.json()) as { user?: { id?: string; username?: string } };

    expect(response.status).toBe(200);
    expect(body.user).toEqual({
      id: "user-1",
      username: "pelunk",
    });
  });

  it("login returns invalid request error for malformed body", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad json",
    });
    const response = await loginPost(request);
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request body.");
  });

  it("me returns unauthorized when no token cookie exists", async () => {
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue(undefined),
      },
    } as never;
    const response = await meGet(request);
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized.");
  });

  it("me returns user shape when session is valid", async () => {
    prismaMock.session.findFirst.mockResolvedValue({
      user: {
        id: "user-1",
        username: "pelunk",
        createdAt: new Date("2026-03-15T00:00:00.000Z"),
      },
    });
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "token-123" }),
      },
    } as never;
    const response = await meGet(request);
    const body = (await response.json()) as { user?: { id?: string; username?: string } };

    expect(response.status).toBe(200);
    expect(body.user).toEqual({
      id: "user-1",
      username: "pelunk",
      createdAt: "2026-03-15T00:00:00.000Z",
    });
  });

  it("logout clears current session token and returns success", async () => {
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "token-123" }),
      },
    } as never;
    const response = await logoutPost(request);
    const body = (await response.json()) as { success?: boolean };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { token: "token-123" },
    });
    expect(clearAuthCookieMock).toHaveBeenCalled();
  });

  it("logout returns 500 on unexpected error", async () => {
    prismaMock.session.deleteMany.mockRejectedValue(new Error("db fail"));
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "token-123" }),
      },
    } as never;
    const response = await logoutPost(request);
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error.");
  });
});
