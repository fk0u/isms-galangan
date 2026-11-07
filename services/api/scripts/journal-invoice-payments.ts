/* journal-invoice-payments.ts — backfill jurnal kas untuk pembayaran invoice
 * yang masuk tanpa lewat UI (mis. impor Excel #334). Meniru alur "Catat
 * Pembayaran" di Finance.tsx: tiap payments[n] → Dr kas/bank, Kr 1-130 Piutang,
 * dokumen CASH-<id> (ke-1) / CASH-<id>-<n>; kelebihan di atas grandTotal → Kr 2-150.
 * Idempoten via dokumen: jurnal yang sudah ada dilewati.
 *
 *   npm run journal:invoice-payments              (dry-run)
 *   npm run journal:invoice-payments -- --apply   (tulis, satu transaksi + audit_log)
 *
 * Periode tutup buku tidak ditulis (dilaporkan). */
import { randomUUID } from "node:crypto";
import { closeDb, exec, q, withTx } from "../src/db.js";
import { withVoucherNo } from "../src/voucher.js";
import { isClosed, loadClosed } from "../src/closing.js";

type Data = Record<string, unknown>;
const APPLY = process.argv.includes("--apply");

/** Sama dengan kasKodeOf di apps/web/src/services/autoJournal.ts. */
export function kasKodeOf(method: unknown): string {
  const m = String(method ?? "").toLowerCase();
  if (m.includes("tunai") || m.includes("kas")) return "1-111";
  if (m.includes("mandiri")) return "1-121";
  if (m.includes("bni")) return "1-122";
  return "1-120";
}

export interface JLine { dokumen: string; date: string; uraian: string; db: string; kr: string; amount: number }

/** Baris jurnal yang seharusnya ada untuk satu invoice. */
export function linesFor(id: string, d: Data): JLine[] {
  const pays = Array.isArray(d.payments) ? (d.payments as Data[]) : [];
  let sisa = Math.round(Number(d.grandTotal) || 0);
  const out: JLine[] = [];
  pays.forEach((p, i) => {
    const amt = Math.round(Number(p.amount) || 0);
    if (amt <= 0) return;
    const dok = i === 0 ? `CASH-${id}` : `CASH-${id}-${i + 1}`;
    const kas = kasKodeOf(p.method);
    const ke = Math.min(amt, Math.max(0, sisa));
    const lebih = amt - ke;
    sisa -= ke;
    const ref = String(p.ref ?? "").trim();
    if (ke > 0) out.push({ dokumen: dok, date: String(p.date), uraian: `${sisa <= 0 ? "Pelunasan" : "Pembayaran sebagian"} ${id} via ${String(p.method ?? "Transfer")} ${ref}`.trim(), db: kas, kr: "1-130", amount: ke });
    if (lebih > 0) out.push({ dokumen: `${dok}-LEBIH`, date: String(p.date), uraian: `Kelebihan bayar ${id} ${ref}`.trim(), db: kas, kr: "2-150", amount: lebih });
  });
  return out;
}

if (process.argv[1]?.endsWith("journal-invoice-payments.ts")) {
  await (APPLY ? withTx(run) : run());
  await closeDb();
}

async function run(): Promise<void> {
  const invoices = await q<{ id: string; branch: string; data: string }>("SELECT id, branch, data FROM invoices");
  const have = new Set((await q<{ data: string }>("SELECT data FROM journals")).map((r) => String((JSON.parse(r.data) as Data).dokumen ?? "")));
  const coa = new Set((await q<{ id: string }>("SELECT id FROM coa")).map((r) => r.id));
  const closed = await loadClosed();
  const todo: Array<JLine & { branch: string }> = [];
  const skippedClosed: string[] = [];
  for (const inv of invoices) {
    const d = JSON.parse(inv.data) as Data;
    if (["Draft", "Ditolak"].includes(String(d.status))) continue;
    for (const l of linesFor(inv.id, d)) {
      if (have.has(l.dokumen)) continue;
      if (isClosed(l.date, closed)) { skippedClosed.push(l.dokumen); continue; }
      todo.push({ ...l, branch: inv.branch });
    }
  }
  const missingCoa = [...new Set(todo.flatMap((l) => [l.db, l.kr]))].filter((k) => !coa.has(`COA-${k}`));
  if (missingCoa.length) throw new Error(`Akun belum ada di CoA: ${missingCoa.join(", ")}`);
  const total = todo.reduce((s, l) => s + l.amount, 0);
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — ${todo.length} jurnal baru, total Rp ${total.toLocaleString("id-ID")}, ${have.size} dokumen jurnal sudah ada`);
  if (skippedClosed.length) console.log(`Dilewati (periode tutup buku): ${skippedClosed.join(", ")}`);
  if (!APPLY) return;
  const now = new Date().toISOString();
  for (const l of todo) {
    const id = `JU-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const data = await withVoucherNo({ date: l.date, kodePembantu: "", dokumen: l.dokumen, uraian: l.uraian, db: l.db, kr: l.kr, amount: l.amount, sumber: l.db.startsWith("1-11") ? "Kas" : "Bank", status: "Posted", branch: l.branch, createdAt: now, updatedAt: now });
    await exec("INSERT INTO journals (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, l.branch, JSON.stringify(data), now]);
    await exec("INSERT INTO audit_log (id, actor, action, table_name, row_id, diff, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), "journal:invoice-payments", "create", "journals", id, JSON.stringify({ after: data }), "-", now]);
  }
  console.log(`Selesai: ${todo.length} jurnal ditulis.`);
}
