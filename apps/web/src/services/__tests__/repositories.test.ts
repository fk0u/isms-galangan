import { describe, expect, it, vi } from "vitest";
import { remoteRepository } from "../repositories";

describe("remoteRepository listPaged exact-name query", () => {
  it("sends an exact inventory name and branch as bounded server-side filters", async () => {
    let requestedUrl = "";
    const request = vi.fn(async (url: string) => {
      requestedUrl = url;
      return { rows: [], total: 0, limit: 2, offset: 0 };
    });
    const repository = remoteRepository(
      "inventory",
      request as unknown as NonNullable<Parameters<typeof remoteRepository>[1]>,
    );

    await repository.listPaged?.({
      exactName: "Probe Pump & Seal",
      branch: "Samarinda",
      page: 1,
      size: 2,
    });

    const query = new URLSearchParams(requestedUrl.split("?")[1]);
    expect(query.get("exactName")).toBe("Probe Pump & Seal");
    expect(query.get("branch")).toBe("Samarinda");
    expect(query.get("limit")).toBe("2");
    expect(query.get("offset")).toBe("0");
    expect(query.has("q")).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
