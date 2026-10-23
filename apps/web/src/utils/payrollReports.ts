/* Laporan payroll untuk Keuangan/Pajak/HR/Direktur (#278, #279). PPh 21
   gross-up dan iuran BPJS porsi perusahaan tidak tampil di slip karyawan,
   jadi angkanya dilaporkan di sini per periode. */
import type { StoreItem } from "../data/store";
import { exportExcel } from "./export";

const n = (v: unknown): number => Number(v) || 0;
const allowanceSum = (v: unknown): number =>
  Array.isArray(v) ? v.reduce((s: number, l) => s + n((l as { amount?: unknown })?.amount ?? l), 0) : n(v);

export function exportPphReport(rows: StoreItem[], nameOf: (id: string) => string, period: string): Promise<void> {
  const head = ["ID", "Karyawan", "Tipe", "Penghasilan Bruto", "PPh 21 (ditanggung perusahaan)", "Status"];
  const body = rows.map((p) => {
    const type = String(p.type ?? "Gaji");
    const bruto = type === "Gaji"
      ? n(p.basic) + allowanceSum(p.allowances) + n(p.overtimePay)
      : n(p.net) + (p.pphGrossUp ? 0 : n(p.pph21));
    return [p.id, nameOf(String(p.employeeId)), type, bruto, n(p.pph21), p.status];
  });
  const total = rows.reduce((s, p) => s + n(p.pph21), 0);
  return exportExcel([head, ...body, ["", "Total", "", "", total, ""]], `laporan-pph21-${period}`, "PPh 21");
}

export function exportBpjsCompanyReport(rows: StoreItem[], nameOf: (id: string) => string, period: string): Promise<void> {
  const gaji = rows.filter((p) => String(p.type ?? "Gaji") === "Gaji");
  const head = ["ID", "Karyawan", "Upah Dasar", "BPJS Kes Perusahaan", "BPJS TK Perusahaan", "Total Beban Perusahaan", "BPJS Kes Karyawan", "BPJS TK Karyawan", "Total Iuran Disetor"];
  const body = gaji.map((p) => {
    const kesPer = n(p.bpjsKesPer);
    const tkPer = n(p.bpjsTkPer);
    const kesKar = n(p.bpjsKesKar ?? p.bpjsKes);
    const tkKar = n(p.bpjsTkKar ?? p.bpjsTk);
    return [p.id, nameOf(String(p.employeeId)), n(p.basic), kesPer, tkPer, kesPer + tkPer, kesKar, tkKar, kesPer + tkPer + kesKar + tkKar];
  });
  const sum = (i: number): number => body.reduce((s, r) => s + n(r[i]), 0);
  return exportExcel(
    [head, ...body, ["", "Total", sum(2), sum(3), sum(4), sum(5), sum(6), sum(7), sum(8)]],
    `beban-bpjs-perusahaan-${period}`,
    "BPJS Perusahaan",
  );
}
