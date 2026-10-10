/* Endpoint PO terpenuhi sebagian & pengalihan vendor (F3-J-02).
   Lihat src/poFulfillment.ts. */
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { can } from "../policy.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { MaterialError } from "../materialRequests.js";
import { PoError, reassignPo, receivePo, vendorCannotFulfill } from "../poFulfillment.js";

const ReceiveSchema = z.object({
  qty: z.number().positive().max(1_000_000),
  itemId: z.string().max(128).optional(),
  noFaktur: z.string().max(100).optional(),
  tglFaktur: z.string().max(32).optional(),
  dendaRp: z.number().min(0).optional(),
});
const CancelSchema = z.object({ qty: z.number().positive().max(1_000_000), reason: z.string().min(1).max(500) });
const ReassignSchema = z.object({ vendor: z.string().min(1).max(200), unitPrice: z.number().positive().optional(), eta: z.string().max(32).optional() });

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof PoError || err instanceof MaterialError) return reply.status(err.status).send(fail(err.message, err.code));
  throw err;
}

export function registerPoFulfillmentRoutes(app: FastifyInstance): void {
  const canPo = (req: FastifyRequest) => can(req.user?.role, "purchaseOrders", "w");

  // Penerimaan barang: procurement (pemilik PO) atau gudang (pemilik stok).
  app.post("/api/purchaseOrders/:id/receive", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!canPo(req) && !can(req.user?.role, "movements", "w")) return reply.status(403).send(fail("Peran ini tidak boleh menerima barang", "FORBIDDEN"));
    const parsed = ReceiveSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const res = await receivePo(id, parsed.data, requestActor(req));
      await writeAudit({ actor: requestActor(req), action: "po_receive", table: "purchaseOrders", rowId: id, diff: { qty: parsed.data.qty, status: res.po.status, fulfilled: res.fulfilled.map((f) => f.id) }, ip: requestIp(req) });
      return ok(res);
    } catch (err) { return handleError(err, reply); }
  });

  app.post("/api/purchaseOrders/:id/vendor-cannot-fulfill", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!canPo(req)) return reply.status(403).send(fail("Hanya procurement yang mengelola PO", "FORBIDDEN"));
    const parsed = CancelSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const po = await vendorCannotFulfill(id, parsed.data.qty, parsed.data.reason, requestActor(req));
      await writeAudit({ actor: requestActor(req), action: "po_vendor_cannot_fulfill", table: "purchaseOrders", rowId: id, diff: parsed.data, ip: requestIp(req) });
      return ok(po);
    } catch (err) { return handleError(err, reply); }
  });

  app.post("/api/purchaseOrders/:id/reassign", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!canPo(req)) return reply.status(403).send(fail("Hanya procurement yang mengelola PO", "FORBIDDEN"));
    const parsed = ReassignSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const res = await reassignPo(id, parsed.data, requestActor(req));
      await writeAudit({ actor: requestActor(req), action: "po_reassign", table: "purchaseOrders", rowId: id, diff: { to: res.to.id, vendor: parsed.data.vendor, qty: res.to.qty }, ip: requestIp(req) });
      return reply.status(201).send(ok(res));
    } catch (err) { return handleError(err, reply); }
  });
}
