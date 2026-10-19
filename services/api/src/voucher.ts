/* Voucher jurnal (K17-FIN-08, jawaban klien Q24: voucher terbit untuk semua
 * transaksi yang berdampak ke Keuangan & Billing).
 *
 * Setiap baris `journals` yang dibuat lewat API mendapat nomor voucher urut
 * per bulan: VJ/YYYY/MM/NNNN. Baris dengan `dokumen` yang sama (satu
 * transaksi bisa lebih dari satu baris) berbagi satu nomor. Karena semua jurnal
 * (pelunasan invoice, bayar hutang, gaji, jurnal manual, dst.) lewat rute CRUD
 * ini, semua transaksi keuangan otomatis punya voucher. */
import { q } from "./db.js";
import { jsonEq } from "./refs.js";

type Data = Record<string, unknown>;

export function voucherPrefix(date: unknown): string {
  const d = /^\d{4}-\d{2}/.test(String(date ?? "")) ? String(date) : new Date().toISOString();
  return `VJ/${d.slice(0, 4)}/${d.slice(5, 7)}/`;
}

/** Nomor berikutnya untuk bulan tanggal jurnal (ponytail: pindai jurnal bulan
 *  itu; cukup selama jurnal per bulan ribuan - beri kolom/indeks bila lebih). */
export async function nextVoucherNo(date: unknown, taken: Iterable<string> = []): Promise<string> {
  const prefix = voucherPrefix(date);
  const rows = await q<{ data: string }>("SELECT data FROM journals", []);
  let max = 0;
  const seen = [...rows.map((r) => String((JSON.parse(r.data) as Data).voucherNo ?? "")), ...taken];
  for (const no of seen) {
    if (!no.startsWith(prefix)) continue;
    const n = Number(no.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/** Isi `voucherNo` jurnal baru: pakai nomor transaksi yang sama bila ada. */
export async function withVoucherNo(data: Data): Promise<Data> {
  if (String(data.voucherNo ?? "").trim() !== "") return data;
  const dokumen = String(data.dokumen ?? "").trim();
  if (dokumen !== "") {
    const same = await q<{ data: string }>(`SELECT data FROM journals WHERE ${jsonEq("dokumen")}`, [dokumen]);
    const existing = same.map((r) => String((JSON.parse(r.data) as Data).voucherNo ?? "")).find((v) => v !== "");
    if (existing) return { ...data, voucherNo: existing };
  }
  return { ...data, voucherNo: await nextVoucherNo(data.date) };
}
