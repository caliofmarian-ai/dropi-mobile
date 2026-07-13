import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSessionToken: vi.fn(),
}));

vi.mock("../lib/_core/auth", () => authMock);

const { getTrpcAuthHeaders } = await import("../lib/_core/trpc-auth");

describe("getTrpcAuthHeaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the canonical mobile session token store for Authorization", async () => {
    authMock.getSessionToken.mockResolvedValue("jwt-session-token");

    await expect(getTrpcAuthHeaders()).resolves.toEqual({
      Authorization: ["Bearer", "jwt-session-token"].join(" "),
    });
  });

  it("omits Authorization when there is no authenticated mobile session", async () => {
    authMock.getSessionToken.mockResolvedValue(null);

    await expect(getTrpcAuthHeaders()).resolves.toEqual({});
  });
});
