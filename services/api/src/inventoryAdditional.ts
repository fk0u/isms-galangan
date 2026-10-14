/* Penerimaan & pengeluaran "additional" - di luar procurement / di luar
 * permintaan barang (catatan CTO 14 Okt). Stok dan movement ditulis dalam
 * satu transaksi oleh server; browser tidak lagi mengubah stok lewat CRUD.
 * Material wajib sudah ada di katalog - barang baru didaftarkan dulu. */
import { randomUUID } from "node:crypto";
import { exec, q, withTx } from "./db.js";
import { DEFAULT_BRANCH } from "./routes/crud.js";

type Data = Record<string, unknown>;
interface Row { id: string; branch: string; data: string; updated_at: string }

export class AdditionalError extends Error {
  constructor(public status: 404 | 409 | 422, message: string, public code: string) { super(message); }
}

export interface AdditionalInput {
  direction: "in" | "out";
  qty: number;
  /** Asal barang (masuk) atau keperluan (keluar). Wajib, tercatat di movement. */
  reason: string;
  warehouse?: string;
  projectId?: string;
}

export async function additionalMovement(id: string, input: AdditionalInput, actor: string): Promise<{ itemId: string; stock: number; movementId: string }> {
  return withTx(async () => {
    const row = (await q<Row>("SELECT id, branch, data, updated_at FROM inventory WHERE id = ?", [id]))[0];
    if (!row) throw new AdditionalError(404, `Material ${id} belum ada di katalog`, "NOT_FOUND");
    if (input.projectId && (await q<{ id: string }>("SELECT id FROM projects WHERE id = ?", [input.projectId])).length === 0) {
      throw new AdditionalError(422, `Proyek ${input.projectId} tidak ada`, "UNPROCESSABLE");
    }
    const item = JSON.parse(row.data) as Data;
    const stock = Math.max(0, Number(item.stock ?? 0) || 0);
    const qty = input.qty;
    if (input.direction === "out" && qty > stock) {
      throw new AdditionalError(409, `Stok ${String(item.name ?? id)} tidak cukup (tersedia ${stock} ${String(item.unit ?? "")})`, "INSUFFICIENT");
    }
    const next: Data = { ...item, stock: input.direction === "in" ? stock + qty : stock - qty };
    // Lokasi simpan ditetapkan saat barang masuk.
    if (input.direction === "in" && input.warehouse) next.warehouse = input.warehouse;
    const now = new Date().toISOString();
    const res = await exec("UPDATE inventory SET data = ?, updated_at = ? WHERE id = ? AND updated_at = ? AND data = ?", [
      JSON.stringify(next), now, row.id, row.updated_at, row.data,
    ]);
    if (res.changes !== 1) throw new AdditionalError(409, "Stok berubah oleh pengguna lain, silakan coba lagi", "STALE");
    const movementId = `M-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const wh = input.warehouse || String(item.warehouse ?? "");
    await exec("INSERT INTO movements (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      movementId, row.branch || DEFAULT_BRANCH, JSON.stringify({
        item: String(item.name ?? id), itemId: id, type: input.direction === "in" ? "Penerimaan" : "Pengeluaran",
        qty, unit: String(item.unit ?? ""), by: `Additional: ${input.reason}`, category: "additional",
        date: now.slice(0, 10), tone: input.direction,
        fromWh: input.direction === "out" ? wh : "", toWh: input.direction === "in" ? wh : (input.projectId ? `Proyek ${input.projectId}` : "Pengeluaran Langsung"),
        ...(input.projectId ? { ref: { projectId: input.projectId } } : {}), note: `Dicatat oleh ${actor}`,
      }), now,
    ]);
    return { itemId: id, stock: Number(next.stock), movementId };
  });
}
