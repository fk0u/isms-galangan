/* Fee proyek untuk pihak ketiga (K17-PM-15, jawaban klien Q22). Dasar hitung
   persen dari nilai proyek ATAU nominal; ditagihkan setelah proyek Selesai.
   Aturan yang sama ditegakkan server (domainGuards.projectFeeError). */
export interface ProjectFee {
  id: string;
  penerima: string;
  basis: "persen" | "nominal";
  nilai: number;
  catatan?: string;
  status: "Belum" | "Ditagihkan";
  apId?: string;
  tagihAt?: string;
}

export function normFees(v: unknown): ProjectFee[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[])
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({
      id: String(f.id ?? ""),
      penerima: String(f.penerima ?? ""),
      basis: f.basis === "nominal" ? "nominal" : "persen",
      nilai: Number(f.nilai ?? 0) || 0,
      ...(f.catatan ? { catatan: String(f.catatan) } : {}),
      status: f.status === "Ditagihkan" ? "Ditagihkan" : "Belum",
      ...(f.apId ? { apId: String(f.apId) } : {}),
      ...(f.tagihAt ? { tagihAt: String(f.tagihAt) } : {}),
    }));
}

/** Nilai rupiah fee: persen × nilai proyek, atau nominal apa adanya. */
export function feeAmount(f: Pick<ProjectFee, "basis" | "nilai">, projectValue: number): number {
  return f.basis === "nominal" ? Math.round(f.nilai) : Math.round((Math.max(0, projectValue) * f.nilai) / 100);
}
