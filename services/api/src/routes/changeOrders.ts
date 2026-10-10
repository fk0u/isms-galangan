/* Endpoint change order (F3-C-05). Lihat src/changeOrders.ts. */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { can } from "../policy.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { BoqError } from "../boqDocs.js";
import { applyChangeOrder, CoError, decideChangeOrder } from "../changeOrders.js";

const DecisionSchema = z.object({ decision: z.enum(["Disetujui", "Ditolak"]), note: z.string().max(500).optional() });

export function registerChangeOrderRoutes(app: FastifyInstance): void {
  app.post("/api/changeOrders/:id/decision", { preHandler: [requireAuth] }, async (req, reply) => {
    const parsed = DecisionSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const co = await decideChangeOrder(id, parsed.data.decision, req.user?.role, requestActor(req), parsed.data.note ?? "");
      await writeAudit({ actor: requestActor(req), action: "co_owner_decision", table: "changeOrders", rowId: id, diff: parsed.data, ip: requestIp(req) });
      return ok(co);
    } catch (err) {
      if (err instanceof CoError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });

  app.post("/api/changeOrders/:id/apply", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "changeOrders", "w")) return reply.status(403).send(fail("Peran ini tidak boleh menerapkan change order", "FORBIDDEN"));
    const { id } = req.params as { id: string };
    try {
      const res = await applyChangeOrder(id, requestActor(req));
      await writeAudit({ actor: requestActor(req), action: "co_apply", table: "changeOrders", rowId: id, diff: res, ip: requestIp(req) });
      return ok(res);
    } catch (err) {
      if (err instanceof CoError || err instanceof BoqError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });
}
