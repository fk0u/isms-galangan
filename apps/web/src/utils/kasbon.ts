/* Kasbon karyawan dipotong otomatis lewat gaji bulanan (K17-HR-03, jawaban
   klien Q25). Nominal cicilan dipilih saat mencatat kasbon: Rp500.000 atau
   Rp1.000.000. Potongan = min(cicilan, sisa) per kasbon, jadi sisa tidak
   pernah minus, dan tiap potongan dicatat di `riwayat` kasbon itu. */

export const KASBON_CICILAN_OPTIONS = [500_000, 1_000_000] as const;

export interface KasbonPotongan {
  slip: string;
  period: string;
  tanggal: string;
  jumlah: number;
}

export interface KasbonEntry {
  id: string;
  tanggal: string;
  jumlah: number;
  cicilan: number;
  sisa: number;
  riwayat: KasbonPotongan[];
}

export function normKasbonList(v: unknown): KasbonEntry[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[])
    .filter((k): k is Record<string, unknown> => typeof k === "object" && k !== null)
    .map((k) => ({
      id: String(k.id ?? ""),
      tanggal: String(k.tanggal ?? ""),
      jumlah: Number(k.jumlah ?? 0),
      cicilan: Number(k.cicilan ?? 0),
      sisa: Number(k.sisa ?? 0),
      riwayat: Array.isArray(k.riwayat)
        ? (k.riwayat as unknown[])
            .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
            .map((r) => ({ slip: String(r.slip ?? ""), period: String(r.period ?? ""), tanggal: String(r.tanggal ?? ""), jumlah: Number(r.jumlah ?? 0) }))
        : [],
    }));
}

/** Potong semua kasbon yang masih bersisa untuk satu slip gaji. */
export function applyKasbonPotongan(
  entries: KasbonEntry[],
  slip: { id: string; period: string; tanggal: string },
): { next: KasbonEntry[]; pot: number } {
  let pot = 0;
  const next = entries.map((k) => {
    // Slip yang sama tidak boleh memotong dua kali (mis. bayar diulang).
    if (k.riwayat.some((r) => r.slip === slip.id)) return k;
    const inst = Math.min(Math.max(0, k.cicilan), Math.max(0, k.sisa));
    if (inst <= 0) return k;
    pot += inst;
    return { ...k, sisa: Math.max(0, k.sisa - inst), riwayat: [...k.riwayat, { slip: slip.id, period: slip.period, tanggal: slip.tanggal, jumlah: inst }] };
  });
  return { next, pot };
}
