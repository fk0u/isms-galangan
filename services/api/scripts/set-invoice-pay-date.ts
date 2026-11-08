/* set-invoice-pay-date.ts — ganti tanggal bayar invoice (#342: tanggal bayar
 * hasil impor sementara = tanggal terbit, diganti saat tanggal uang masuk
 * dikonfirmasi klien). Mengubah payments[n].date dan tanggal jurnal kasnya
 * (CASH-<id>, CASH-<id>-<n>, beserta -LEBIH); voucher diberi nomor baru bila
 * bulannya berubah (voucher urut per bulan).
 *
 *   npm run invoice:pay-date -- "007/INV-SB/SMD/I/2026=2026-02-10" ["013/...#2=2026-03-01"] [--apply]
 *
 * Kunci = nomor invoice (noInv) atau id; "#n" = pembayaran ke-n (default 1).
 * Dry-run default; --apply satu transaksi + audit_log. Tanggal lama/baru di
 * periode tutup buku → ditolak (buka periode dulu, jalankan, tutup lagi). */
import { randomUUID } from "node:crypto";
import { closeDb, exec, q, withTx } from "../src/db.js";
import { nextVoucherNo } from "../src/voucher.js";
import { isClosed, loadClosed } from "../src/closing.js";

type Data = Record<string, unknown>;
const APPLY = process.argv.includes("--apply");

export interface Change { key: string; n: number; date: string }

/** Parse argumen "kunci[#n]=YYYY-MM-DD". */
export function parseArg(a: string): Change {
  const m = /^(.+?)(?:#(\d+))?=(\d{4}-\d{2}-\d{2})$/.exec(a.trim());
  if (!m) throw new Error(`Format salah: ${a} (harus "no-invoice[#n]=YYYY-MM-DD")`);
  return { key: m[1].trim(), n: m[2] ? Number(m[2]) : 1, date: m[3] };
}

/** Dokumen jurnal untuk pembayaran ke-n (sama dengan journal-invoice-payments.ts). */
export const dokumenOf = (id: string, n: number): string => (n === 1 ? `CASH-${id}` : `CASH-${id}-${n}`);

if (process.argv[1]?.endsWith("set-invoice-pay-date.ts")) {
  const changes = process.argv.slice(2).filter((a) => a !== "--apply").map(parseArg);
  if (!changes.length) throw new Error("Tidak ada perubahan. Contoh: npm run invoice:pay-date -- \"007/INV-SB/SMD/I/2026=2026-02-10\"");
  await (APPLY ? withTx(() => run(changes)) : run(changes));
  await closeDb();
}

async function run(changes: Change[]): Promise<void> {
  const P = (s: string): Data => JSON.parse(s) as Data;
  const invoices = (await q<{ id: string; data: string }>("SELECT id, data FROM invoices")).map((r) => ({ id: r.id, data: P(r.data) }));
  const journals = (await q<{ id: string; data: string }>("SELECT id, data FROM journals")).map((r) => ({ id: r.id, data: P(r.data) }));
  const closed = await loadClosed();
  const now = new Date().toISOString();
  const audit = (table: string, id: string, diff: unknown) =>
    exec("INSERT INTO audit_log (id, actor, action, table_name, row_id, diff, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), "invoice:pay-date", "update", table, id, JSON.stringify(diff), "-", now]);
  const taken: string[] = [];
  console.log(APPLY ? "APPLY" : "DRY-RUN");
  for (const c of changes) {
    const inv = invoices.find((i) => i.id === c.key || String(i.data.noInv ?? "").trim() === c.key);
    if (!inv) throw new Error(`Invoice tidak ditemukan: ${c.key}`);
    const pays = Array.isArray(inv.data.payments) ? (inv.data.payments as Data[]) : [];
    const pay = pays[c.n - 1];
    if (!pay) throw new Error(`${c.key}: pembayaran ke-${c.n} tidak ada (ada ${pays.length})`);
    const old = String(pay.date ?? "");
    if (isClosed(old, closed) || isClosed(c.date, closed)) throw new Error(`${c.key}: ${old} atau ${c.date} di periode tutup buku — buka periodenya dulu`);
    const dok = dokumenOf(inv.id, c.n);
    const js = journals.filter((j) => [dok, `${dok}-LEBIH`].includes(String(j.data.dokumen ?? "")));
    console.log(`${c.key} #${c.n}: ${old} → ${c.date}, ${js.length} jurnal`);
    if (!APPLY || old === c.date) continue;
    const newPays = pays.map((p, i) => (i === c.n - 1 ? { ...p, date: c.date } : p));
    await exec("UPDATE invoices SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify({ ...inv.data, payments: newPays, updatedAt: now }), now, inv.id]);
    await audit("invoices", inv.id, { before: { [`payments[${c.n - 1}].date`]: old }, after: { [`payments[${c.n - 1}].date`]: c.date } });
    // Bulan berubah → satu voucher baru untuk semua baris dokumen ini.
    const voucher = old.slice(0, 7) === c.date.slice(0, 7) ? null : await nextVoucherNo(c.date, taken);
    if (voucher) taken.push(voucher);
    for (const j of js) {
      const after = { ...j.data, date: c.date, ...(voucher ? { voucherNo: voucher } : {}), updatedAt: now };
      await exec("UPDATE journals SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(after), now, j.id]);
      await audit("journals", j.id, { before: { date: j.data.date, voucherNo: j.data.voucherNo }, after: { date: c.date, voucherNo: after.voucherNo } });
    }
  }
  if (APPLY) console.log("Selesai.");
}
