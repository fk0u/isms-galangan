/* Barang keluar eceran & potongan (F3-G-03). Server memvalidasi stok dalam
 * satuan dasar dan menulis stok + movement OUT dalam satu transaksi.
 * Logika sama dengan apps/web/src/utils/stockIssue.ts (dijaga dua probe). */
import { randomUUID } from "node:crypto";
import { exec, q, withTx } from "./db.js";
import { DEFAULT_BRANCH } from "./routes/crud.js";

type Data = Record<string, unknown>;
interface Row { id: string; branch: string; data: string; updated_at: string }

export class IssueError extends Error {
  constructor(public status: 404 | 409 | 422, message: string, public code: string) { super(message); }
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

export interface IssueInput {
  /** Jumlah satuan dasar (liter/kg/meter). */
  qty?: number;
  /** Potongan plat dalam mm (dikonversi ke kg). */
  cut?: { lengthMm: number; widthMm: number };
  projectId?: string;
  note: string;
}

export interface IssueOutput { itemId: string; baseQty: number; baseUnit: string; stock: number; openBase: number; opened: number; movementId: string }

export async function issueInventory(id: string, input: IssueInput, actor: string): Promise<IssueOutput> {
  return withTx(async () => {
    const rows = await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [id]);
    const row = rows[0];
    if (!row) throw new IssueError(404, `Item ${id} tidak ada`, "NOT_FOUND");
    const item = JSON.parse(row.data) as Data;
    const conv = (item.conversion ?? null) as { baseUnit?: string; perUnit?: number; dims?: Data } | null;
    const perUnit = Number(conv?.perUnit ?? 0);
    if (!conv || !(perUnit > 0)) throw new IssueError(422, "Item belum punya konversi satuan", "NO_CONVERSION");

    let qty = Number(input.qty ?? 0);
    if (input.cut) {
      const L = Number(conv.dims?.lengthMm ?? 0);
      const W = Number(conv.dims?.widthMm ?? 0);
      const kg = Number(conv.dims?.weightKg ?? perUnit);
      const { lengthMm, widthMm } = input.cut;
      if (!(L > 0 && W > 0 && kg > 0) || !(lengthMm > 0 && widthMm > 0) || lengthMm > L || widthMm > W) {
        throw new IssueError(422, "Ukuran potongan tidak valid untuk lembar ini", "BAD_CUT");
      }
      qty = round3(((lengthMm * widthMm) / (L * W)) * kg);
    }
    if (!(qty > 0)) throw new IssueError(422, "Jumlah harus lebih dari 0", "UNPROCESSABLE");

    const stock = Math.max(0, Number(item.stock ?? 0));
    const open = Math.max(0, Number(item.openBase ?? 0));
    const available = round3(stock * perUnit + open);
    if (qty > available + 1e-9) throw new IssueError(409, `Stok tidak cukup (tersedia ${available} ${conv.baseUnit})`, "INSUFFICIENT");
    let nextStock = stock;
    let nextOpen = round3(open - qty);
    let opened = 0;
    if (qty > open + 1e-9) {
      const need = qty - open;
      opened = Math.ceil(round3(need / perUnit));
      nextStock = stock - opened;
      nextOpen = round3(opened * perUnit - need);
    }
    const now = new Date().toISOString();
    const res = await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
      JSON.stringify({ ...item, stock: nextStock, openBase: nextOpen }), now, row.id, row.updated_at, row.data,
    ]);
    if (res.changes !== 1) throw new IssueError(409, "Stok berubah oleh pengguna lain — coba lagi", "STALE");
    const movementId = `M-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    await exec("INSERT INTO movements (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      movementId, DEFAULT_BRANCH, JSON.stringify({
        item: String(item.name ?? id), itemId: id, type: "Pengeluaran", qty, unit: String(conv.baseUnit ?? ""),
        by: actor, date: now.slice(0, 10), tone: "out", note: input.note,
        ...(input.cut ? { cut: input.cut } : {}), ...(input.projectId ? { ref: { projectId: input.projectId } } : {}),
      }), now,
    ]);
    return { itemId: id, baseQty: qty, baseUnit: String(conv.baseUnit ?? ""), stock: nextStock, openBase: nextOpen, opened, movementId };
  });
}
