/* import-invoices.ts — #334: impor/koreksi invoice dari file JSON hasil
 * konversi Excel klien (INVOICE_2026.xlsx). File data TIDAK disimpan di repo
 * (repo publik); berikan path-nya sebagai argumen.
 *
 *   npm run import:invoices -- /home/user/invoice-rows.json            (dry-run)
 *   npm run import:invoices -- /home/user/invoice-rows.json --apply    (tulis)
 *
 * Format (sudah dipetakan penuh oleh konverter): [{ id, branch, data: { noInv,
 * client, due, grandTotal, status, payments: [{date, amount, ...}], paidTotal, ... } }].
 * Skrip ini TIDAK memetakan kolom Excel; ia menolak baris yang belum lengkap.
 * Upsert per id (idempoten); --apply membackup baris lama ber-id sama ke JSON
 * (mode 600, home/BACKUP_DIR) lalu menulis semuanya dalam satu transaksi dan
 * mencatat audit_log. */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { closeDb, exec, q, withTx } from "../src/db.js";

interface InRow { id: string; branch?: string; data: Record<string, unknown> }

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");
if (!file) { console.error("Pakai: import-invoices.ts <file.json> [--apply]"); process.exit(1); }

const rows = JSON.parse(readFileSync(file, "utf8")) as InRow[];
const problems: string[] = [];
const seen = new Set<string>();
for (const r of rows) {
  if (!/^INV[-A-Za-z0-9]+$/.test(String(r.id))) problems.push(`id tidak sah: ${r.id}`);
  if (seen.has(r.id)) problems.push(`id ganda: ${r.id}`);
  seen.add(r.id);
  const d = r.data ?? {};
  if (!String(d.noInv ?? "").trim() || !String(d.client ?? "").trim()) problems.push(`${r.id}: noInv/client kosong`);
  if (!(Number(d.grandTotal) > 0)) problems.push(`${r.id}: grandTotal tidak valid`);
  if (!["Lunas", "Belum Dibayar", "Terlambat", "Draft", "Diajukan", "Disetujui", "Ditolak", "Dihapusbukukan"].includes(String(d.status))) problems.push(`${r.id}: status ${String(d.status)}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.due ?? ""))) problems.push(`${r.id}: due wajib YYYY-MM-DD`);
  const pays = Array.isArray(d.payments) ? (d.payments as Array<Record<string, unknown>>) : null;
  if (!pays || pays.some((p) => !(Number(p.amount) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(String(p.date ?? "")))) problems.push(`${r.id}: payments wajib array {date, amount>0}`);
  else if (Math.abs(pays.reduce((s, p) => s + Number(p.amount), 0) - Number(d.paidTotal)) > 1) problems.push(`${r.id}: paidTotal ≠ jumlah payments`);
  if (d.status === "Lunas" && !String(d.paidAt ?? "")) problems.push(`${r.id}: Lunas wajib paidAt`);
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

await (APPLY ? withTx(run) : run());
await closeDb();

async function run(): Promise<void> {
  const existing = new Map((await q<{ id: string; branch: string; data: string; updated_at: string }>("SELECT * FROM invoices")).map((r) => [r.id, r]));
  const upd = rows.filter((r) => existing.has(r.id));
  const total = rows.reduce((s, r) => s + Number(r.data.grandTotal), 0);
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — ${rows.length} invoice (${rows.length - upd.length} baru, ${upd.length} ditimpa), total Rp ${total.toLocaleString("id-ID")}`);
  const perClient = new Map<string, number>();
  for (const r of rows) perClient.set(String(r.data.client), (perClient.get(String(r.data.client)) ?? 0) + 1);
  console.log(`Klien: ${perClient.size}, status: ${JSON.stringify(rows.reduce<Record<string, number>>((m, r) => ({ ...m, [String(r.data.status)]: (m[String(r.data.status)] ?? 0) + 1 }), {}))}`);
  if (!APPLY) return;
  if (upd.length) {
    const bfile = join(process.env.BACKUP_DIR ?? homedir(), `backup-import-invoices-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(bfile, JSON.stringify(upd.map((r) => existing.get(r.id))), { mode: 0o600 });
    console.log(`Backup baris lama: ${bfile}`);
  }
  const now = new Date().toISOString();
  for (const r of rows) {
    // Gabung dengan data lama: field yang tidak dibawa file (proyek, catatan, dll.) tetap; createdAt asli dipertahankan.
    const old = existing.has(r.id) ? (JSON.parse(existing.get(r.id)!.data) as Record<string, unknown>) : {};
    const next: Record<string, unknown> = { ...old, ...r.data, createdAt: old.createdAt ?? r.data.createdAt ?? now, updatedAt: now };
    const changed = Object.keys(next).filter((k) => k !== "updatedAt" && JSON.stringify(old[k] ?? null) !== JSON.stringify(next[k] ?? null));
    const diff = { source: String(r.data.source ?? file), before: Object.fromEntries(changed.map((k) => [k, old[k] ?? null])), after: Object.fromEntries(changed.map((k) => [k, next[k]])) };
    const data = JSON.stringify(next);
    if (existing.has(r.id)) await exec("UPDATE invoices SET data = ?, branch = ?, updated_at = ? WHERE id = ?", [data, r.branch ?? "Samarinda", now, r.id]);
    else await exec("INSERT INTO invoices (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [r.id, r.branch ?? "Samarinda", data, now]);
    await exec("INSERT INTO audit_log (id, actor, action, table_name, row_id, diff, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), "import:invoices", existing.has(r.id) ? "update" : "create", "invoices", r.id, JSON.stringify(diff), "-", now]);
  }
  console.log(`Selesai: ${rows.length} invoice ditulis.`);
}
