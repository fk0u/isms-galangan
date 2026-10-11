import { describe, expect, it } from "vitest";
import { createSessionFence } from "../sessionFence";

describe("createSessionFence", () => {
  it("keeps an operation valid only while the complete session scope is unchanged", () => {
    let currentScope = JSON.stringify([2, "jwt-A", "owner-A", "owner-A"]);
    const fence = createSessionFence(currentScope, () => currentScope);

    expect(fence.isCurrent()).toBe(true);
    expect(() => fence.assertCurrent()).not.toThrow();

    currentScope = JSON.stringify([3, "jwt-B", "owner-B", "owner-B"]);
    expect(fence.isCurrent()).toBe(false);
    expect(() => fence.assertCurrent()).toThrow("Sesi berubah; operasi dibatalkan");
  });
});
