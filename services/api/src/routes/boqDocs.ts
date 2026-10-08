/* Endpoint khusus surat BoQ (F3-C-01). CRUD dasar tetap lewat crud.ts;
   transisi status & revisi dipisah karena melibatkan banyak baris dalam
   satu transaksi dan tidak boleh dilakukan lewat PATCH biasa. */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requirePermission } from "../policy.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { BOQ_DOC_STATUSES, BoqError, reviseDoc, setDocStatus } from "../boqDocs.js";

const StatusSchema = z.object({ status: z.enum(BOQ_DOC_STATUSES as [string, ...string[]]), note: z.string().max(500).optional() });
const guards = [requireAuth, requirePermission("boqDocs", "w")];

export function registerBoqDocRoutes(app: FastifyInstance): void {
  app.post("/api/boqDocs/:id/status", { preHandler: guards }, async (req, reply) => {
    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const doc = await setDocStatus(id, parsed.data.status, requestActor(req), parsed.data.note ?? "");
      await writeAudit({ actor: requestActor(req), action: "boq_status", table: "boqDocs", rowId: id, diff: { status: parsed.data.status }, ip: requestIp(req) });
      return ok(doc);
    } catch (err) {
      if (err instanceof BoqError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });

  app.post("/api/boqDocs/:id/revise", { preHandler: guards }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const res = await reviseDoc(id);
      await writeAudit({ actor: requestActor(req), action: "boq_revise", table: "boqDocs", rowId: res.id, diff: { from: id, ...res }, ip: requestIp(req) });
      return reply.status(201).send(ok(res));
    } catch (err) {
      if (err instanceof BoqError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });
}
