import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));
vi.mock("../db.js", () => ({ q: queryMock, exec: vi.fn() }));

import { branchAllowed, branchOfUser, BranchScopeResolutionError, requireAuth, signToken } from "../auth.js";

process.env.JWT_SECRET ||= "unit-test-branch-scope-secret-for-regressions";

beforeEach(() => vi.clearAllMocks());

describe("employee-derived branch scope", () => {
  it("keeps the explicit no-employee global identity path and rejects empty row scope", async () => {
    await expect(branchOfUser({ employee_id: null })).resolves.toBe("SEMUA");
    expect(queryMock).not.toHaveBeenCalled();

    queryMock.mockResolvedValueOnce([{ branch: "  " }]);
    await expect(branchOfUser({ employee_id: "EMP-EMPTY" })).rejects.toBeInstanceOf(BranchScopeResolutionError);

    queryMock.mockResolvedValueOnce([]);
    await expect(branchOfUser({ employee_id: "EMP-MISSING" })).rejects.toBeInstanceOf(BranchScopeResolutionError);
  });

  it("throws on employee lookup failure instead of granting SEMUA", async () => {
    queryMock.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(branchOfUser({ employee_id: "EMP-1" })).rejects.toBeInstanceOf(BranchScopeResolutionError);
  });

  it("denies requireAuth with a retryable error when the branch lookup fails", async () => {
    const userId = `branch-scope-${Date.now()}`;
    queryMock
      .mockResolvedValueOnce([{
        id: userId,
        username: `${userId}@test.invalid`,
        role: "proyek",
        is_active: 1,
        token_version: 0,
        employee_id: "EMP-1",
      }])
      .mockRejectedValueOnce(new Error("database unavailable"));
    const token = signToken({ id: userId, username: `${userId}@test.invalid`, role: "proyek", branch: "SEMUA", v: 0 });
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as FastifyRequest;
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    await requireAuth(req, reply);

    expect(reply.status).toHaveBeenCalledWith(503);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: "BRANCH_SCOPE_UNAVAILABLE" }),
    }));
    expect(req.user).toBeUndefined();
  });

  it("preserves legacy helper behavior for missing claims and explicit global scope", () => {
    expect(branchAllowed(undefined, "SEMUA")).toBe(true);
    expect(branchAllowed({ id: "u", username: "u", role: "proyek", branch: "", v: 0 }, "Samarinda")).toBe(true);
    expect(branchAllowed({ id: "g", username: "g", role: "direktur", branch: "SEMUA", v: 0 }, "Samarinda")).toBe(true);
  });
});
