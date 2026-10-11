import { describe, expect, it } from "vitest";
import { cacheOwnerAction } from "../cacheOwner";

describe("offline cache owner boundary", () => {
  it("defers hydration before authentication", () => {
    expect(cacheOwnerAction(null, "user-a")).toBe("defer");
  });

  it("hydrates only the matching account cache", () => {
    expect(cacheOwnerAction("user-a", "user-a")).toBe("hydrate");
    expect(cacheOwnerAction("user-b", "user-a")).toBe("purge");
    expect(cacheOwnerAction("user-a", null)).toBe("purge");
  });
});
