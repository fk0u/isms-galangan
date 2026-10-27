import { describe, it, expect } from "vitest";
import {
  scopeList,
  scopeTotal,
  syncWbsWeightsWithScope,
  groupWbsByScope,
} from "./scope";
import type { WbsItem } from "../data/store";

describe("scope utils & WBS weight integration (#303 & #304)", () => {
  it("normalizes scope list and parses harga", () => {
    const raw = [
      { service: "Reparasi Lambung", harga: 50000000, deskripsi: "Plating" },
      { service: "Overhaul Mesin", price: 30000000 },
      { name: "Pengecatan", biaya: 20000000 },
      "Inspeksi BKI",
    ];
    const list = scopeList(raw);
    expect(list).toHaveLength(4);
    expect(list[0].harga).toBe(50000000);
    expect(list[1].harga).toBe(30000000);
    expect(list[2].harga).toBe(20000000);
    expect(list[3].service).toBe("Inspeksi BKI");
    expect(list[3].harga).toBeUndefined();
    expect(scopeTotal(raw)).toBe(100000000);
  });

  it("calculates WBS weights automatically from scope cost ratio", () => {
    const scopes = [
      { service: "Reparasi Lambung", harga: 60000000 }, // 60%
      { service: "Overhaul Mesin", harga: 40000000 },   // 40%
    ];

    const tasks: WbsItem[] = [
      { task: "Potong Plat", start: "2026-10-01", end: "2026-10-05", progress: 100, weight: 0, category: "Reparasi Lambung" },
      { task: "Pasang Plat Baru", start: "2026-10-06", end: "2026-10-10", progress: 50, weight: 0, category: "Reparasi Lambung" },
      { task: "Bongkar Mesin", start: "2026-10-02", end: "2026-10-08", progress: 20, weight: 0, category: "Overhaul Mesin" },
    ];

    const synced = syncWbsWeightsWithScope(tasks, scopes);
    expect(synced).toHaveLength(3);

    // Kategori Lambung bobot 60%, ada 2 task -> masing-masing 30%
    expect(synced[0].weight).toBe(30);
    expect(synced[1].weight).toBe(30);

    // Kategori Mesin bobot 40%, ada 1 task -> 40%
    expect(synced[2].weight).toBe(40);

    const totalWeight = synced.reduce((sum, w) => sum + w.weight, 0);
    expect(totalWeight).toBe(100);
  });

  it("groups WBS by scope category with average progress and cost", () => {
    const scopes = [
      { service: "Reparasi Lambung", harga: 60000000 },
      { service: "Overhaul Mesin", harga: 40000000 },
    ];

    const tasks: WbsItem[] = [
      { task: "Potong Plat", start: "2026-10-01", end: "2026-10-05", progress: 100, weight: 0, category: "Reparasi Lambung" },
      { task: "Pasang Plat Baru", start: "2026-10-06", end: "2026-10-10", progress: 50, weight: 0, category: "Reparasi Lambung" },
      { task: "Bongkar Mesin", start: "2026-10-02", end: "2026-10-08", progress: 20, weight: 0, category: "Overhaul Mesin" },
    ];

    const groups = groupWbsByScope(tasks, scopes);
    expect(groups).toHaveLength(2);

    expect(groups[0].category).toBe("Reparasi Lambung");
    expect(groups[0].cost).toBe(60000000);
    expect(groups[0].weight).toBe(60);
    expect(groups[0].tasks).toHaveLength(2);
    expect(groups[0].avgProgress).toBe(75); // (100 + 50) / 2

    expect(groups[1].category).toBe("Overhaul Mesin");
    expect(groups[1].cost).toBe(40000000);
    expect(groups[1].weight).toBe(40);
    expect(groups[1].tasks).toHaveLength(1);
    expect(groups[1].avgProgress).toBe(20);
  });
});
