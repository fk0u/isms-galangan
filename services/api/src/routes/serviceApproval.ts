/* POST /api/services/:id/approval — persetujuan service oleh procurement
   (F3-D-02, F3-J-04). Lihat src/serviceApproval.ts. */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { can } from "../policy.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { SERVICE_APPROVALS, ServiceError, setServiceApproval } from "../serviceApproval.js";

const BodySchema = z.object({
  approval: z.enum(SERVICE_APPROVALS),
  note: z.string().max(500).optional(),
});

export function registerServiceApprovalRoutes(app: FastifyInstance): void {
  app.post("/api/services/:id/approval", { preHandler: [requireAuth] }, async (req, reply) => {
    // Minimal bisa membaca service; aturan peran approver dicek di setServiceApproval.
    if (!can(req.user?.role, "services", "r")) {
      return reply.status(403).send(fail("Peran ini tidak boleh mengakses service", "FORBIDDEN"));
    }
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const svc = await setServiceApproval(id, parsed.data.approval, req.user?.role, requestActor(req), parsed.data.note ?? "", () => writeAudit({
        actor: requestActor(req), action: "service_approval", table: "services",
        rowId: id, diff: { approval: parsed.data.approval, note: parsed.data.note ?? "" }, ip: requestIp(req),
      }, { required: true }));
      return ok(svc);
    } catch (err) {
      if (err instanceof ServiceError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });
}
