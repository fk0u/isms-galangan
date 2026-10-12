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

describe("remoteRepository list - urutan stabil (#111)", () => {
  const row = (id: string, createdAt: string | undefined, updated_at: string) => ({ id, branch: "Samarinda", data: createdAt ? { createdAt } : {}, updated_at });
  const listWith = async (rows: unknown[]): Promise<string[]> => {
    const request = vi.fn(async () => ({ rows, total: rows.length, limit: 5000, offset: 0 }));
    const repo = remoteRepository("workOrders", request as unknown as NonNullable<Parameters<typeof remoteRepository>[1]>);
    return (await repo.list()).map((r) => String(r.id));
  };

  it("baris yang diedit tidak berpindah saat data ditarik ulang", async () => {
    // Server mengurutkan menurut updated_at: setelah WO-1 diedit ia pindah ke akhir.
    const before = await listWith([row("WO-1", "2026-10-01T00:00:00.000Z", "2026-10-01"), row("WO-2", "2026-10-02T00:00:00.000Z", "2026-10-02"), row("WO-3", "2026-10-03T00:00:00.000Z", "2026-10-03")]);
    const after = await listWith([row("WO-2", "2026-10-02T00:00:00.000Z", "2026-10-02"), row("WO-3", "2026-10-03T00:00:00.000Z", "2026-10-03"), row("WO-1", "2026-10-01T00:00:00.000Z", "2026-10-12")]);
    expect(before).toEqual(["WO-3", "WO-2", "WO-1"]);
    expect(after).toEqual(before);
  });

  it("baris lama tanpa tanggal buat urut id dan tetap di tempatnya", async () => {
    const before = await listWith([row("A-1", undefined, "2026-01-01"), row("A-2", undefined, "2026-01-02"), row("A-3", "2026-10-03T00:00:00.000Z", "2026-10-03")]);
    const after = await listWith([row("A-2", undefined, "2026-01-02"), row("A-3", "2026-10-03T00:00:00.000Z", "2026-10-03"), row("A-1", undefined, "2026-10-12")]);
    expect(before).toEqual(["A-3", "A-2", "A-1"]);
    expect(after).toEqual(before);
  });
});
