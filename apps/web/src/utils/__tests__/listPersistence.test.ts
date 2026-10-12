import { describe, expect, it, vi } from "vitest";
import {
  findItemPage,
  preserveScroll,
  reconcileListAfterEdit,
  stableSortRows,
} from "../listPersistence";
import type { SortState } from "../../components/ui";

interface TestPurchaseOrder {
  id: string;
  poNo: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt?: string;
  updated_at?: string;
}

interface TestInspection {
  id: string;
  title: string;
  status: "Pending" | "In Progress" | "Pass" | "Fail";
  inspector: string;
  date: string;
  createdAt?: string;
}

describe("Pola 1: Daftar Procurement (Purchase Orders) - Edit, Sort, Resync (#111)", () => {
  const initialOrders: TestPurchaseOrder[] = [
    { id: "PO-001", poNo: "PO/2026/01", vendor: "PT Baja Utama", category: "Pelat", amount: 150000000, date: "2026-10-01", createdAt: "2026-10-01T08:00:00Z" },
    { id: "PO-002", poNo: "PO/2026/02", vendor: "PT Cat Sejahtera", category: "Cat", amount: 25000000, date: "2026-10-02", createdAt: "2026-10-02T08:00:00Z" },
    { id: "PO-003", poNo: "PO/2026/03", vendor: "PT Mesin Samudra", category: "Mesin", amount: 500000000, date: "2026-10-03", createdAt: "2026-10-03T08:00:00Z" },
    { id: "PO-004", poNo: "PO/2026/04", vendor: "PT Pipa Mandiri", category: "Pipa", amount: 75000000, date: "2026-10-04", createdAt: "2026-10-04T08:00:00Z" },
    { id: "PO-005", poNo: "PO/2026/05", vendor: "PT Elektro Bahari", category: "Elektrikal", amount: 110000000, date: "2026-10-05", createdAt: "2026-10-05T08:00:00Z" },
  ];

  it("mempertahankan urutan dan halaman saat field non-sort diedit", () => {
    // Sort aktif berdasarkan tanggal asc
    const sort: SortState = { key: "date", dir: "asc" };
    const getVal = (r: TestPurchaseOrder, k: string) => (r as unknown as Record<string, unknown>)[k] as string | number;

    const sortedBefore = stableSortRows(initialOrders, sort, getVal);
    // Page size 2 -> PO-003 ada di halaman 2 (index ke-2)
    const initialPage = findItemPage(sortedBefore, "PO-003", 2);
    expect(initialPage).toBe(2);

    // Edit field non-sort: catatan/notes
    const editedPO: TestPurchaseOrder = {
      ...initialOrders[2]!,
      notes: "Diperbarui spesifikasi garansi mesin induk",
    };

    const result = reconcileListAfterEdit({
      prevList: sortedBefore,
      updatedItem: editedPO,
      currentPage: initialPage!,
      pageSize: 2,
      sort,
      getSortValue: getVal,
    });

    expect(result.pageChanged).toBe(false);
    expect(result.targetPage).toBe(2);
    expect(result.oldIndex).toBe(2);
    expect(result.newIndex).toBe(2);
    expect(result.reason).toBe("unchanged");
  });

  it("memindahkan posisi dan halaman secara konsisten saat field kunci sort diedit", () => {
    // Sort aktif berdasarkan amount asc
    const sort: SortState = { key: "amount", dir: "asc" };
    const getVal = (r: TestPurchaseOrder, k: string) => (r as unknown as Record<string, unknown>)[k] as string | number;

    const sortedBefore = stableSortRows(initialOrders, sort, getVal);
    // Urutan amount asc sebelum: PO-002 (25jt, idx 0), PO-004 (75jt, idx 1), PO-005 (110jt, idx 2, hal 2)
    expect(sortedBefore[2]?.id).toBe("PO-005");
    const initialPage = findItemPage(sortedBefore, "PO-005", 2);
    expect(initialPage).toBe(2);

    // Edit field kunci sort (amount): diskon besar dari 110jt jadi 10jt (paling murah -> harus jadi index 0 di hal 1)
    const editedPO: TestPurchaseOrder = {
      ...sortedBefore[2]!,
      amount: 10000000,
    };

    const result = reconcileListAfterEdit({
      prevList: sortedBefore,
      updatedItem: editedPO,
      currentPage: initialPage!,
      pageSize: 2,
      sort,
      getSortValue: getVal,
    });

    expect(result.pageChanged).toBe(true);
    expect(result.targetPage).toBe(1);
    expect(result.oldIndex).toBe(2);
    expect(result.newIndex).toBe(0);
    expect(result.reason).toBe("sort_moved");
  });

  it("tidak mengacak urutan baris dengan nilai sort identik saat resync timestamp internal", () => {
    const sort: SortState = { key: "category", dir: "asc" };
    const getVal = (r: TestPurchaseOrder, k: string) => (r as unknown as Record<string, unknown>)[k] as string | number;

    const listWithDuplicateCategory: TestPurchaseOrder[] = [
      { id: "PO-A", poNo: "PO/A", vendor: "V1", category: "Umum", amount: 100, date: "2026-10-01", createdAt: "2026-10-01T00:00:00Z" },
      { id: "PO-B", poNo: "PO/B", vendor: "V2", category: "Umum", amount: 200, date: "2026-10-02", createdAt: "2026-10-02T00:00:00Z" },
    ];

    const sorted1 = stableSortRows(listWithDuplicateCategory, sort, getVal);
    // PO-B createdAt lebih baru -> berada di atas PO-A jika tie
    expect(sorted1.map((p) => p.id)).toEqual(["PO-B", "PO-A"]);

    // Simulasi resync server dengan perubahan updated_at internal pada PO-A
    const resynced: TestPurchaseOrder[] = [
      { ...listWithDuplicateCategory[0]!, updated_at: "2026-10-12T12:00:00Z" },
      { ...listWithDuplicateCategory[1]!, updated_at: "2026-10-10T10:00:00Z" },
    ];

    const sorted2 = stableSortRows(resynced, sort, getVal);
    expect(sorted2.map((p) => p.id)).toEqual(["PO-B", "PO-A"]);
  });
});

describe("Pola 2: Daftar QC Inspeksi - Filter, Paginasi, dan Edit (#111)", () => {
  const inspections: TestInspection[] = [
    { id: "INS-01", title: "Welding Joint Hull", status: "Pending", inspector: "Budi", date: "2026-10-01", createdAt: "2026-10-01T08:00:00Z" },
    { id: "INS-02", title: "Blasting SA 2.5", status: "Pass", inspector: "Dewi", date: "2026-10-02", createdAt: "2026-10-02T08:00:00Z" },
    { id: "INS-03", title: "Primer DFT Check", status: "Pending", inspector: "Budi", date: "2026-10-03", createdAt: "2026-10-03T08:00:00Z" },
    { id: "INS-04", title: "Alignment Shaft", status: "In Progress", inspector: "Eko", date: "2026-10-04", createdAt: "2026-10-04T08:00:00Z" },
    { id: "INS-05", title: "Megger Test Generator", status: "Pending", inspector: "Siti", date: "2026-10-05", createdAt: "2026-10-05T08:00:00Z" },
  ];

  it("mendeteksi item keluar dari filter aktif saat field kriteria filter diedit", () => {
    // Filter aktif: hanya yang status === 'Pending'
    const filterPending = (i: TestInspection) => i.status === "Pending";
    const pendingList = inspections.filter(filterPending);
    expect(pendingList.length).toBe(3); // INS-01, INS-03, INS-05

    // Edit INS-03 menjadi 'Pass'
    const updated: TestInspection = { ...inspections[2]!, status: "Pass" };

    const result = reconcileListAfterEdit({
      prevList: pendingList,
      updatedItem: updated,
      currentPage: 1,
      pageSize: 2,
      sort: { key: "id", dir: "asc" },
      getSortValue: (r, k) => (r as unknown as Record<string, unknown>)[k] as string,
      filterPredicate: filterPending,
    });

    expect(result.inFilter).toBe(false);
    expect(result.reason).toBe("filtered_out");
  });

  it("mempertahankan paginasi di halaman 2 ketika item halaman 2 diedit tanpa mengubah filter", () => {
    const sort: SortState = { key: "id", dir: "asc" };
    const sorted = stableSortRows(inspections, sort, (r, k) => (r as unknown as Record<string, unknown>)[k] as string);
    // Page size 2: hal 1 = [INS-01, INS-02], hal 2 = [INS-03, INS-04], hal 3 = [INS-05]
    const curPage = findItemPage(sorted, "INS-04", 2);
    expect(curPage).toBe(2);

    const updated: TestInspection = { ...inspections[3]!, inspector: "Eko Prasetyo (Lead)" };
    const result = reconcileListAfterEdit({
      prevList: sorted,
      updatedItem: updated,
      currentPage: curPage!,
      pageSize: 2,
      sort,
      getSortValue: (r, k) => (r as unknown as Record<string, unknown>)[k] as string,
    });

    expect(result.pageChanged).toBe(false);
    expect(result.targetPage).toBe(2);
    expect(result.newIndex).toBe(3); // index 3 di array = baris ke-2 pada halaman 2
  });
});

describe("preserveScroll utility (#111)", () => {
  it("mengembalikan posisi scroll setelah aksi simpan dijalankan", async () => {
    const scrollToMock = vi.fn();
    const rafMock = vi.fn((cb: () => void) => cb());

    vi.stubGlobal("window", {
      scrollX: 120,
      scrollY: 450,
      scrollTo: scrollToMock,
      requestAnimationFrame: rafMock,
    });

    let saved = false;
    await preserveScroll(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      saved = true;
    });

    expect(saved).toBe(true);
    expect(rafMock).toHaveBeenCalledTimes(1);
    expect(scrollToMock).toHaveBeenCalledWith({ left: 120, top: 450, behavior: "instant" });

    vi.unstubAllGlobals();
  });
});
