/* Endpoint tutup buku (#283). Lihat closing.ts untuk aturannya. */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { exec, q } from "../db.js";
import { requireAuth } from "../auth.js";
import { ok, fail } from "../envelope.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { normalizeRole } from "../policy.js";
import { CLOSING_ID, loadClosed, stockValue, type ClosedPeriods } from "../closing.js";
import { withVoucherNo } from "../voucher.js";
import { jsonEq } from "../refs.js";

const CLOSERS = ["finance", "pajak", "direktur", "developer"];
const REOPENERS = ["direktur", "developer"];

async function saveClosed(c: ClosedPeriods): Promise<void> {
  const data = { key: "TUTUP_BUKU", value: JSON.stringify(c), label: "Periode tutup buku", group: "Sistem" };
  const now = new Date().toISOString();
  const exists = await q("SELECT id FROM settings WHERE id = ?", [CLOSING_ID]);
  if (exists.length) await exec("UPDATE settings SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(data), now, CLOSING_ID]);
  else await exec("INSERT INTO settings (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [CLOSING_ID, "Samarinda", JSON.stringify(data), now]);
}

export function registerClosingRoutes(app: FastifyInstance): void {
  const roleIn = (roles: string[], msg: string) => async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!roles.includes(normalizeRole(req.user?.role))) await reply.status(403).send(fail(msg, "FORBIDDEN"));
  };

  app.get("/api/closing", { preHandler: [requireAuth] }, async () => ok({ ...(await loadClosed()), stockValue: await stockValue() }));

  app.post("/api/closing", { preHandler: [requireAuth, roleIn(CLOSERS, "Tutup buku hanya oleh Keuangan atau pimpinan")] }, async (req, reply) => {
    const period = String((req.body as { period?: unknown } | null)?.period ?? "").trim();
    const c = await loadClosed();
    const now = new Date().toISOString();
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      if (c.months.includes(period) || c.years.includes(period.slice(0, 4))) return reply.status(409).send(fail(`Periode ${period} sudah tutup buku`, "CONFLICT"));
      c.months = [...c.months, period].sort();
      await saveClosed(c);
      await writeAudit({ actor: requestActor(req), action: "closing.month", table: "settings", rowId: CLOSING_ID, diff: { period }, ip: requestIp(req) });
      return ok({ ...c, journal: null });
    }
    if (/^\d{4}$/.test(period)) {
      if (c.years.includes(period)) return reply.status(409).send(fail(`Tahun ${period} sudah tutup buku`, "CONFLICT"));
      /* Jurnal persediaan dicatat SEBELUM tahun dikunci (penjaga jurnal akan
         menolaknya setelah dikunci). Idempoten lewat dokumen unik. */
      const dokumen = `TUTUP-${period}-PERSEDIAAN`;
      const value = await stockValue();
      let journal: Record<string, unknown> | null = null;
      const dup = await q("SELECT id FROM journals WHERE " + jsonEq("dokumen"), [dokumen]);
      if (value > 0 && dup.length === 0) {
        journal = await withVoucherNo({
          date: `${period}-12-31`, kodePembantu: "", dokumen,
          uraian: `Tutup buku ${period}: stok Inventori & Material menjadi Persediaan`,
          db: "1-161", kr: "5-101", amount: value, sumber: "Penyesuaian", status: "Posted", createdAt: now,
        });
        const id = `JU-${randomUUID().slice(0, 8).toUpperCase()}`;
        await exec("INSERT INTO journals (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, "Samarinda", JSON.stringify(journal), now]);
        journal = { id, ...journal };
      }
      c.years = [...c.years, period].sort();
      c.months = c.months.filter((m) => !m.startsWith(`${period}-`));
      await saveClosed(c);
      await writeAudit({ actor: requestActor(req), action: "closing.year", table: "settings", rowId: CLOSING_ID, diff: { period, stockValue: value }, ip: requestIp(req) });
      return ok({ ...c, journal });
    }
    return reply.status(400).send(fail("period wajib YYYY-MM (bulanan) atau YYYY (tahunan)", "VALIDATION_ERROR"));
  });

  app.delete("/api/closing/:period", { preHandler: [requireAuth, roleIn(REOPENERS, "Membuka kembali periode hanya oleh direktur/developer")] }, async (req, reply) => {
    const period = String((req.params as { period: string }).period);
    const c = await loadClosed();
    if (!c.months.includes(period) && !c.years.includes(period)) return reply.status(404).send(fail(`Periode ${period} belum tutup buku`, "NOT_FOUND"));
    c.months = c.months.filter((m) => m !== period);
    c.years = c.years.filter((y) => y !== period);
    await saveClosed(c);
    await writeAudit({ actor: requestActor(req), action: "closing.reopen", table: "settings", rowId: CLOSING_ID, diff: { period }, ip: requestIp(req) });
    return ok(c);
  });
}
