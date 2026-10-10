/* POST /api/projects/:id/material-requests — alur material transaksional
   (F3-D-01, ADR-0007). Lihat src/materialRequests.ts. */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { can } from "../policy.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { MaterialError, fulfillMaterialRequest, requestMaterial } from "../materialRequests.js";

const BodySchema = z.object({
  itemId: z.string().min(1).max(128),
  qty: z.number().positive().max(1_000_000),
  purpose: z.enum(["wbs", "sparepart"]).default("sparepart"),
  wbsTask: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  sparepart: z.object({
    category: z.string().max(64).optional(),
    technician: z.string().max(128).optional(),
    notes: z.string().max(500).optional(),
    warrantyUntil: z.string().max(32).optional(),
  }).optional(),
});

export function registerMaterialRequestRoutes(app: FastifyInstance): void {
  app.post("/api/projects/:id/material-requests", { preHandler: [requireAuth] }, async (req, reply) => {
    /* Peminta barang cukup punya hak tulis pergerakan barang (mekanik, gudang,
       manager…) atau sparepart proyek (peran proyek). Hak ubah stok inventori
       TIDAK dibutuhkan — justru server yang mengurangi stok secara terkontrol. */
    if (!can(req.user?.role, "movements", "w") && !can(req.user?.role, "spareparts", "w")) {
      return reply.status(403).send(fail("Peran ini tidak boleh meminta barang dari gudang", "FORBIDDEN"));
    }
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const result = await requestMaterial({ ...parsed.data, projectId: id, actor: requestActor(req) });
      await writeAudit({
        actor: requestActor(req), action: "material_request",
        // Tanpa barang keluar (stok habis) yang tercipta hanya PR.
        table: result.movementId ? "movements" : "requisitions",
        rowId: result.movementId ?? result.requisitionId ?? "-", diff: { projectId: id, ...result }, ip: requestIp(req),
      });
      return reply.status(201).send(ok(result));
    } catch (err) {
      if (err instanceof MaterialError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });

  /* Penuhi sisa permintaan dari stok — tugas gudang (hak tulis movements). */
  app.post("/api/material-requests/:id/fulfill", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "movements", "w")) {
      return reply.status(403).send(fail("Hanya gudang yang boleh mengeluarkan barang", "FORBIDDEN"));
    }
    const { id } = req.params as { id: string };
    try {
      const result = await fulfillMaterialRequest(id, requestActor(req));
      await writeAudit({
        actor: requestActor(req), action: "material_fulfill", table: "materialRequests",
        rowId: id, diff: result, ip: requestIp(req),
      });
      return ok(result);
    } catch (err) {
      if (err instanceof MaterialError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });
}
