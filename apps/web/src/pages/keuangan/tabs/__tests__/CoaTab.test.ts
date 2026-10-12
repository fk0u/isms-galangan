import { describe, it, expect } from "vitest";
import { buildCoaTree, resolveParentKode, determineCoaType, type CoaTreeNode } from "../CoaTab";
import { COA_EXCEL } from "../../../../data/financeExcel";
import type { StoreItem } from "../../../../data/store";

describe("CoaTab Hierarchical Tree Logic", () => {
  it("determines CoA type accurately according to Indonesian shipyard standards", () => {
    expect(determineCoaType("1-000", "-", "-")).toBe("Header");
    expect(determineCoaType("1-110", "D", "NR")).toBe("Aset");
    expect(determineCoaType("2-110", "K", "NR")).toBe("Liabilitas");
    expect(determineCoaType("3-100", "K", "NR")).toBe("Ekuitas");
    expect(determineCoaType("4-100", "K", "LR")).toBe("Pendapatan");
    expect(determineCoaType("5-100", "D", "LR")).toBe("Beban");
    expect(determineCoaType("6-001", "D", "LR")).toBe("Beban");
    expect(determineCoaType("7-100", "K", "LR")).toBe("Pendapatan");
    expect(determineCoaType("7-300", "D", "LR")).toBe("Beban");
  });

  it("resolves parent account codes properly", () => {
    const allKodes = new Set(COA_EXCEL.map((c) => c.kode));

    // Root accounts have no parent
    expect(resolveParentKode("1-000", allKodes)).toBeNull();
    expect(resolveParentKode("2-000", allKodes)).toBeNull();

    // Level 1 Sub-headers
    expect(resolveParentKode("1-100", allKodes)).toBe("1-000");
    expect(resolveParentKode("1-200", allKodes)).toBe("1-000");
    expect(resolveParentKode("2-100", allKodes)).toBe("2-000");
    expect(resolveParentKode("2-200", allKodes)).toBe("2-000");

    // Specific sub-parents
    expect(resolveParentKode("1-111", allKodes)).toBe("1-110"); // Kas - Kantor under Kas - Kecil
    expect(resolveParentKode("1-121", allKodes)).toBe("1-120"); // Bank Mandiri under BRI
    expect(resolveParentKode("1-124", allKodes)).toBe("1-120"); // Bank Kaltimtara under BRI
    expect(resolveParentKode("2-231", allKodes)).toBe("2-230"); // PPh 21 under Hutang Pajak PPh 25
    expect(resolveParentKode("6-021 A", allKodes)).toBe("6-021"); // Suffix letter child
  });

  it("builds a complete tree from COA_EXCEL data with correct levels and without duplicates", () => {
    const rows: StoreItem[] = COA_EXCEL.map((c) => ({
      id: `COA-${c.kode}`,
      kode: c.kode,
      nama: c.nama,
      dk: c.dk,
      nrlr: c.nrlr,
    }));

    const roots = buildCoaTree(rows);

    // Root groups: 1-000, 2-000, 3-000, 4-000, 5-000, 6-000, 7-000
    const rootKodes = roots.map((r) => r.kode);
    expect(rootKodes).toContain("1-000");
    expect(rootKodes).toContain("2-000");
    expect(rootKodes).toContain("3-000");
    expect(rootKodes).toContain("4-000");
    expect(rootKodes).toContain("5-000");
    expect(rootKodes).toContain("6-000");
    expect(rootKodes).toContain("7-000");

    // Count all nodes visited recursively to verify no duplicates
    const visitedKodes = new Set<string>();
    function countNodes(nodes: CoaTreeNode[]): number {
      let sum = 0;
      for (const n of nodes) {
        expect(visitedKodes.has(n.kode)).toBe(false); // No duplicates
        visitedKodes.add(n.kode);
        sum += 1 + countNodes(n.children);
      }
      return sum;
    }

    const totalNodes = countNodes(roots);
    expect(totalNodes).toBe(COA_EXCEL.length);

    // Verify sub-hierarchy for Aktiva Lancar
    const aktivaRoot = roots.find((r) => r.kode === "1-000");
    expect(aktivaRoot).toBeDefined();
    expect(aktivaRoot?.level).toBe(0);

    const aktivaLancar = aktivaRoot?.children.find((c) => c.kode === "1-100");
    expect(aktivaLancar).toBeDefined();
    expect(aktivaLancar?.level).toBe(1);

    const bri = aktivaLancar?.children.find((c) => c.kode === "1-120");
    expect(bri).toBeDefined();
    expect(bri?.level).toBe(2);

    const mandiri = bri?.children.find((c) => c.kode === "1-121");
    expect(mandiri).toBeDefined();
    expect(mandiri?.level).toBe(3);
  });

  it("handles empty and custom synthetic account dataset gracefully", () => {
    const emptyRoots = buildCoaTree([]);
    expect(emptyRoots).toEqual([]);

    const syntheticRows: StoreItem[] = [
      { id: "1", kode: "1-000", nama: "ASET TEST", dk: "-", nrlr: "-" },
      { id: "2", kode: "1-100", nama: "ASET LANCAR TEST", dk: "-", nrlr: "-" },
      { id: "3", kode: "1-110", nama: "KAS TEST", dk: "D", nrlr: "NR" },
    ];
    const tree = buildCoaTree(syntheticRows);
    expect(tree.length).toBe(1);
    expect(tree[0].kode).toBe("1-000");
    expect(tree[0].children[0].kode).toBe("1-100");
    expect(tree[0].children[0].children[0].kode).toBe("1-110");
  });
});
