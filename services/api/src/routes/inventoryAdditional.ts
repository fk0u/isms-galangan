/* POST /api/inventory/:id/additional — barang masuk/keluar di luar procurement
   dan di luar permintaan barang. Lihat src/inventoryAdditional.ts. */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { can } from "../policy.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { AdditionalError, additionalMovement } from "../inventoryAdditional.js";

const BodySchema = z.object({
  direction: z.enum(["in", "out"]),
  qty: z.number().finite().positive().max(1e9),
  reason: z.string().trim().min(3).max(300),
  warehouse: z.string().trim().max(128).optional(),
  projectId: z.string().trim().max(128).optional(),
});

export function registerInventoryAdditionalRoutes(app: FastifyInstance): void {
  app.post("/api/inventory/:id/additional", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "movements", "w") || !can(req.user?.role, "inventory", "w")) {
      return reply.status(403).send(fail("Hanya gudang yang boleh mencatat barang masuk/keluar tambahan", "FORBIDDEN"));
    }
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Isian tidak lengkap: jumlah > 0 dan alasan minimal 3 huruf", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const out = await additionalMovement(id, parsed.data, requestActor(req));
      await writeAudit({ actor: requestActor(req), action: `inventory_additional_${parsed.data.direction}`, table: "inventory", rowId: id, diff: { ...out, ...parsed.data }, ip: requestIp(req) });
      return ok(out);
    } catch (err) {
      if (err instanceof AdditionalError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });
}
