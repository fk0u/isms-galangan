import { describe, it, expect } from "vitest";
import { sortRows, rowMatches } from "../../../../components/ui";

describe("Finance Structured Tables Sorting and Filtering", () => {
  describe("Project P&L Table (#108)", () => {
    const mockPlProjects = [
      {
        id: "PRJ-001",
        vessel: "TB Nusantara 01",
        client: "PT Pelayaran Bahari",
        rev: 1500000000,
        actualCost: 1200000000,
        margin: 300000000,
        marginPct: 20,
        status: "Dikerjakan",
        hasAdvance: false,
      },
      {
        id: "PRJ-002",
        vessel: "TB Mahakam Star",
        client: "PT Energi Maritim",
        rev: 2000000000,
        actualCost: 2200000000,
        margin: -200000000,
        marginPct: -10,
        status: "Selesai",
        hasAdvance: true,
      },
      {
        id: "PRJ-003",
        vessel: "TB Borneo Jaya",
        client: "PT Mitra Samudera",
        rev: 800000000,
        actualCost: 600000000,
        margin: 200000000,
        marginPct: 25,
        status: "Dikerjakan",
        hasAdvance: false,
      },
    ];

    it("filters project P&L list by search query correctly", () => {
      const matchVessel = mockPlProjects.filter((p) =>
        rowMatches(p, "Mahakam", ["id", "vessel", "client", "status"])
      );
      expect(matchVessel).toHaveLength(1);
      expect(matchVessel[0].id).toBe("PRJ-002");

      const matchClient = mockPlProjects.filter((p) =>
        rowMatches(p, "Mitra", ["id", "vessel", "client", "status"])
      );
      expect(matchClient).toHaveLength(1);
      expect(matchClient[0].id).toBe("PRJ-003");
    });

    it("sorts project P&L list by margin ascending and descending", () => {
      const sortedDesc = sortRows(mockPlProjects, { key: "margin", dir: "desc" }, (p, k) =>
        k === "margin" ? p.margin : String(p.id)
      );
      expect(sortedDesc.map((p) => p.id)).toEqual(["PRJ-001", "PRJ-003", "PRJ-002"]);

      const sortedAsc = sortRows(mockPlProjects, { key: "margin", dir: "asc" }, (p, k) =>
        k === "margin" ? p.margin : String(p.id)
      );
      expect(sortedAsc.map((p) => p.id)).toEqual(["PRJ-002", "PRJ-003", "PRJ-001"]);
    });

    it("sorts project P&L list by margin percentage correctly", () => {
      const sortedPctDesc = sortRows(mockPlProjects, { key: "marginPct", dir: "desc" }, (p, k) =>
        k === "marginPct" ? p.marginPct : String(p.id)
      );
      expect(sortedPctDesc.map((p) => p.id)).toEqual(["PRJ-003", "PRJ-001", "PRJ-002"]);
    });
  });

  describe("Jadwal Bayar Table (#108)", () => {
    const mockSchedItems = [
      { key: "AP:1", kind: "AP" as const, id: "PAY-01", ref: "PO-001", desc: "Vendor Cat", due: "2026-10-20", amount: 50000000, age: 8 },
      { key: "AR:1", kind: "AR" as const, id: "INV-01", ref: "PRJ-001", desc: "PT Bahari", due: "2026-10-15", amount: 150000000, age: 3 },
      { key: "AP:2", kind: "AP" as const, id: "PAY-02", ref: "PO-002", desc: "Baja Plat", due: "2026-10-25", amount: 80000000, age: 13 },
    ];

    it("filters schedule items across kind, id, ref, desc, and due date", () => {
      const matchAP = mockSchedItems.filter((r) =>
        rowMatches(r as unknown as Record<string, unknown>, "Vendor", ["kind", "id", "ref", "desc", "due"])
      );
      expect(matchAP).toHaveLength(1);
      expect(matchAP[0].id).toBe("PAY-01");
    });

    it("sorts schedule items by due date or amount", () => {
      const sortedByDueAsc = sortRows(mockSchedItems, { key: "due", dir: "asc" }, (r, k) =>
        k === "due" ? String(r.due) : Number(r.amount)
      );
      expect(sortedByDueAsc.map((r) => r.id)).toEqual(["INV-01", "PAY-01", "PAY-02"]);

      const sortedByAmtDesc = sortRows(mockSchedItems, { key: "amount", dir: "desc" }, (r, k) =>
        k === "amount" ? Number(r.amount) : String(r.id)
      );
      expect(sortedByAmtDesc.map((r) => r.id)).toEqual(["INV-01", "PAY-02", "PAY-01"]);
    });
  });

  describe("Aset Tetap Table (#108)", () => {
    const mockAssets = [
      { id: "AST-01", nama: "Mesin Bubut", kelompok: "1", bulan: "03", tahun: "2023", nilai: 120000000, metode: "GL", susutTahun: 30000000 },
      { id: "AST-02", nama: "Kendaraan Pick-Up", kelompok: "2", bulan: "06", tahun: "2022", nilai: 180000000, metode: "GL", susutTahun: 22500000 },
      { id: "AST-03", nama: "Bangunan Workshop", kelompok: "B", bulan: "01", tahun: "2020", nilai: 850000000, metode: "GL", susutTahun: 42500000 },
    ];

    it("filters assets by name and group", () => {
      const filtered = mockAssets.filter((a) =>
        rowMatches(a as unknown as Record<string, unknown>, "Kendaraan", ["nama", "kelompok", "bulan", "tahun", "metode"])
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("AST-02");
    });

    it("sorts assets by acquisition value (nilai perolehan)", () => {
      const sortedDesc = sortRows(mockAssets, { key: "nilai", dir: "desc" }, (a, k) =>
        k === "nilai" ? Number(a.nilai) : String(a.id)
      );
      expect(sortedDesc.map((a) => a.id)).toEqual(["AST-03", "AST-02", "AST-01"]);
    });
  });
});
