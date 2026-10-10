/* POST /api/inventory/:id/issue — barang keluar eceran/potongan (F3-G-03). */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { can } from "../policy.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { fail, ok } from "../envelope.js";
import { IssueError, issueInventory } from "../inventoryIssue.js";

const BodySchema = z.object({
  qty: z.number().finite().positive().max(1e9).optional(),
  cut: z.object({ lengthMm: z.number().finite().positive(), widthMm: z.number().finite().positive() }).optional(),
  projectId: z.string().max(128).optional(),
  note: z.string().trim().min(1).max(500),
}).refine((b) => (b.qty === undefined) !== (b.cut === undefined), { message: "Isi qty ATAU cut" });

export function registerInventoryIssueRoutes(app: FastifyInstance): void {
  app.post("/api/inventory/:id/issue", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "movements", "w")) return reply.status(403).send(fail("Peran ini tidak boleh mengeluarkan barang", "FORBIDDEN"));
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    try {
      const out = await issueInventory(id, parsed.data, requestActor(req));
      await writeAudit({ actor: requestActor(req), action: "inventory_issue", table: "inventory", rowId: id, diff: out, ip: requestIp(req) });
      return ok(out);
    } catch (err) {
      if (err instanceof IssueError) return reply.status(err.status).send(fail(err.message, err.code));
      throw err;
    }
  });
}
