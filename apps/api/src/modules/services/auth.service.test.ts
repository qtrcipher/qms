import { HttpException, HttpStatus, UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { verify } from "argon2";
import { describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service.js";

vi.mock("argon2", () => ({
  verify: vi.fn()
}));

const user = {
  id: "user-1",
  organizationId: "org-1",
  email: "admin@example.com",
  name: "Admin",
  role: UserRole.OWNER,
  passwordHash: "hash",
  createdAt: new Date("2026-06-29T12:00:00.000Z")
};

describe("AuthService", () => {
  it("rate-limits repeated failed logins by email and client", async () => {
    vi.mocked(verify).mockResolvedValue(false);
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(user)
      }
    };
    const service = new AuthService(prisma as never);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(service.login("ADMIN@example.com", "wrong-password", "203.0.113.10")).rejects.toBeInstanceOf(UnauthorizedException);
    }

    let blockedError: unknown;
    await service.login("admin@example.com", "wrong-password", "203.0.113.10").catch((error: unknown) => {
      blockedError = error;
    });
    expect(blockedError).toBeInstanceOf(HttpException);
    expect((blockedError as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(5);
  });
});
