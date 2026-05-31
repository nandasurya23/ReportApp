import { AUTH_COOKIE_NAME } from "@/lib/server/auth";
import { getSessionUser } from "@/lib/server/session";

jest.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: {
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const prismaMock = jest.requireMock("@/lib/server/prisma").prisma as {
  session: {
    deleteMany: jest.Mock;
    findUnique: jest.Mock;
  };
};

describe("session helper", () => {
  beforeEach(() => {
    prismaMock.session.deleteMany.mockReset();
    prismaMock.session.findUnique.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("schedules expired session cleanup at most once within the cooldown window", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.session.findUnique.mockResolvedValue({
      expiresAt: new Date(1_700_000_000_000 + 60_000),
      user: {
        id: "user-1",
        username: "pelunk",
      },
    });

    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "token-123" }),
      },
    } as never;

    const first = await getSessionUser(request);
    const second = await getSessionUser(request);

    expect(first).toEqual({
      userId: "user-1",
      username: "pelunk",
    });
    expect(second).toEqual({
      userId: "user-1",
      username: "pelunk",
    });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          lt: new Date(1_700_000_000_000 - 30 * 60 * 1000),
        },
      },
    });
  });

  it("returns unauthorized and clears the cookie for expired sessions", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000 + 30 * 60 * 1000 + 1);
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.session.findUnique.mockResolvedValue({
      expiresAt: new Date(1_700_000_000_000),
      user: {
        id: "user-1",
        username: "pelunk",
      },
    });

    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "token-123" }),
      },
    } as never;

    const result = await getSessionUser(request);

    if (!("unauthorizedResponse" in result) || !result.unauthorizedResponse) {
      throw new Error("Expected unauthorized response");
    }

    expect(result.unauthorizedResponse.status).toBe(401);
    const setCookie = result.unauthorizedResponse.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain("max-age=0");
  });
});
