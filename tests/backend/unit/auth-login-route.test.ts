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
}));

import { POST } from "@/app/api/auth/login/route";

describe("auth login route", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.session.create.mockReset();
    prismaMock.loginAttempt.findUnique.mockReset();
    prismaMock.loginAttempt.upsert.mockReset();
    prismaMock.loginAttempt.deleteMany.mockReset();
    verifyPasswordMock.mockReset();
    createSessionTokenMock.mockReset();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
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
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid username or password.");
    expect(prismaMock.loginAttempt.upsert).toHaveBeenCalled();
  });

  it("returns 400 when credentials are missing", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pelunk" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Username and password are required.");
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
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to login.");
  });
});
