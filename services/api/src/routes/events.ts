/* GET /api/events — Server-Sent Events perubahan data (F4-03).
 * Payload hanya NAMA koleksi yang berubah, tidak pernah isi baris: klien
 * menarik ulang lewat endpoint biasa sehingga izin & lingkup cabang tetap
 * ditegakkan di satu tempat. Koleksi yang tidak boleh dibaca peran ini
 * tidak dikirim sama sekali. */
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth.js";
import { dbEvents } from "../db.js";
import { can } from "../policy.js";
import { COLLECTIONS } from "./crud.js";

/* Jeda sebelum kirim: (1) menggabungkan rentetan tulis jadi satu event,
   (2) memberi waktu transaksi commit supaya klien tidak menarik data lama. */
const FLUSH_MS = 400;
const HEARTBEAT_MS = 25000;
const KNOWN = new Set(COLLECTIONS);

export function registerEventRoutes(app: FastifyInstance): void {
  app.get("/api/events", { preHandler: [requireAuth] }, async (req, reply) => {
    const role = req.user?.role;
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      ...(reply.getHeaders() as Record<string, string>),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx: jangan di-buffer
    });
    res.write(": ok\n\n");

    const pending = new Set<string>();
    let timer: NodeJS.Timeout | null = null;
    const flush = (): void => {
      timer = null;
      if (pending.size === 0) return;
      res.write(`data: ${JSON.stringify({ tables: [...pending] })}\n\n`);
      pending.clear();
    };
    const onWrite = (table: string): void => {
      if (!KNOWN.has(table) || !can(role, table, "r")) return;
      pending.add(table);
      timer ??= setTimeout(flush, FLUSH_MS);
    };
    const beat = setInterval(() => res.write(": hb\n\n"), HEARTBEAT_MS);
    dbEvents.on("write", onWrite);
    req.raw.on("close", () => {
      dbEvents.off("write", onWrite);
      clearInterval(beat);
      if (timer) clearTimeout(timer);
    });
  });
}
