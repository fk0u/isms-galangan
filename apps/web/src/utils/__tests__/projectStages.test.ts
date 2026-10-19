import { describe, expect, it } from "vitest";
import { TAHAP_V1, TAHAP_V2, tahapAkhirOf, tahapKolom, tahapLabel, tahapListOf, tahapOf } from "../projectStages";
import type { StoreItem } from "../../data/store";

const p = (o: Record<string, unknown>): StoreItem => ({ id: "P", ...o }) as StoreItem;

describe("tahap Progress proyek (K17-PM-10, Q20)", () => {
  it("urutan baru 8 tahap", () => expect(TAHAP_V2).toEqual(["Quotation", "Estimasi", "Kontrak", "Produksi", "Bill", "Invoice", "Sea Trial + Dock Report", "Pelunasan + Handover"]));
  it("proyek lama tetap skema lama, tahapnya tidak dipetakan ulang", () => {
    const lama = p({ tahap: "Desain" });
    expect(tahapListOf(lama)).toBe(TAHAP_V1);
    expect(tahapOf(lama)).toBe("Desain");
    expect(tahapAkhirOf(lama)).toBe("Handover");
  });
  it("proyek baru (tahapVersi 2) memakai skema baru", () => {
    const baru = p({ tahap: "Bill", tahapVersi: 2 });
    expect(tahapOf(baru)).toBe("Bill");
    expect(tahapAkhirOf(baru)).toBe("Pelunasan + Handover");
  });
  it("kolom kanban: skema baru + tahap lama yang masih dipakai, berurutan", () => {
    expect(tahapKolom([p({ tahap: "Bill", tahapVersi: 2 })])).toEqual(TAHAP_V2);
    expect(tahapKolom([p({ tahap: "Desain" }), p({ tahap: "Handover" })])).toEqual(
      ["Quotation", "Estimasi", "Kontrak", "Desain", "Produksi", "Bill", "Invoice", "Sea Trial + Dock Report", "Handover", "Pelunasan + Handover"],
    );
  });
  it("label EN", () => expect(tahapLabel("Pelunasan + Handover", "en")).toBe("Final Payment + Handover"));
});
