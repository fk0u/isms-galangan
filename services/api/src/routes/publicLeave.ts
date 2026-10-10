/* F3-L-06 (ADR-0017): pengajuan cuti/izin mandiri lewat QR di bengkel.
 *
 * Halaman publik TIDAK memakai login akun. Karyawan dikenali dari NIK + PIN
 * khusus cuti (hash bcrypt di tabel access_secrets, bukan password akun), dan
 * endpoint ini hanya bisa MEMBUAT pengajuan berstatus Diajukan - tidak ada
 * satu pun data yang bisa dibaca dari sini. Jawaban gagal selalu sama
 * ("NIK atau PIN salah") supaya tidak membocorkan NIK mana yang terdaftar. */
import type { FastifyInstance } from "fastify";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { comparePassword, hashPassword, requireAuth } from "../auth.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { exec, q } from "../db.js";
import { fail, ok } from "../envelope.js";
import { can } from "../policy.js";
import { createRateLimiter, getClientIp } from "../rateLimit.js";

export const LEAVE_TYPES = ["Tahunan", "Sakit", "Izin"] as const;
const ipLimiter = createRateLimiter(10, 10 * 60_000);
const nikLimiter = createRateLimiter(5, 15 * 60_000);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const realDate = (d: string): boolean => { const t = new Date(`${d}T00:00:00Z`); return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d; };

const SubmitSchema = z.object({
  token: z.string().min(16).max(128),
  nik: z.string().trim().min(1).max(64),
  pin: z.string().regex(/^\d{6}$/),
  type: z.enum(LEAVE_TYPES),
  from: z.string().regex(ISO).refine(realDate),
  to: z.string().regex(ISO).refine(realDate),
  note: z.string().trim().min(3).max(500),
});
const PinSchema = z.object({ pin: z.string().regex(/^\d{6}$/) });

async function getValue(key: string): Promise<string | null> {
  const rows = await q<{ value: string }>("SELECT value FROM access_secrets WHERE access_key = ?", [key]);
  return rows[0]?.value ?? null;
}
async function setValue(key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  const res = await exec("UPDATE access_secrets SET value = ?, updated_at = ? WHERE access_key = ?", [value, now, key]);
  if (res.changes === 0) await exec("INSERT INTO access_secrets (access_key, value, updated_at) VALUES (?, ?, ?)", [key, value, now]);
}
function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
let dummy: Promise<string> | null = null;
const dummyHash = (): Promise<string> => (dummy ??= hashPassword(randomBytes(12).toString("hex")));

export function registerPublicLeaveRoutes(app: FastifyInstance): void {
  /* HR: ambil token QR (dibuat saat pertama diminta). */
  app.get("/api/leave-qr", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "leaves", "w") || !can(req.user?.role, "employees", "w")) return reply.status(403).send(fail("Hanya HR yang boleh mengelola QR cuti", "FORBIDDEN"));
    let token = await getValue("qr:token");
    if (!token) { token = randomBytes(24).toString("hex"); await setValue("qr:token", token); }
    return ok({ token });
  });

  /* HR: ganti token - QR lama yang tertempel langsung tidak berlaku. */
  app.post("/api/leave-qr/rotate", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "leaves", "w") || !can(req.user?.role, "employees", "w")) return reply.status(403).send(fail("Hanya HR yang boleh mengelola QR cuti", "FORBIDDEN"));
    const token = randomBytes(24).toString("hex");
    await setValue("qr:token", token);
    await writeAudit({ actor: requestActor(req), action: "leave_qr_rotate", table: "leaves", rowId: "-", diff: {}, ip: requestIp(req) });
    return ok({ token });
  });

  /* HR: set/ganti PIN cuti seorang karyawan. PIN tidak pernah dikembalikan. */
  app.post("/api/employees/:id/leave-pin", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "employees", "w")) return reply.status(403).send(fail("Peran ini tidak boleh mengatur PIN cuti", "FORBIDDEN"));
    const parsed = PinSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("PIN harus 6 angka", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    const emp = await q<{ id: string }>("SELECT id FROM employees WHERE id = ?", [id]);
    if (emp.length === 0) return reply.status(404).send(fail("Karyawan tidak ditemukan", "NOT_FOUND"));
    await setValue(`pin:${id}`, await hashPassword(parsed.data.pin));
    await writeAudit({ actor: requestActor(req), action: "leave_pin_set", table: "employees", rowId: id, diff: {}, ip: requestIp(req) });
    return ok({ id, pinSet: true });
  });

  /* PUBLIK: buat pengajuan. Tanpa auth - dijaga token QR + NIK + PIN + rate limit. */
  app.post("/api/public/leave", async (req, reply) => {
    const ip = getClientIp(req);
    const byIp = ipLimiter(ip);
    if (!byIp.allowed) {
      reply.header("Retry-After", String(byIp.retryAfterSec));
      return reply.status(429).send(fail("Terlalu banyak percobaan, coba lagi nanti", "RATE_LIMITED"));
    }
    const parsed = SubmitSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Isian tidak lengkap atau tidak valid", "VALIDATION_ERROR"));
    const b = parsed.data;
    if (b.to < b.from) return reply.status(400).send(fail("Tanggal selesai tidak boleh sebelum tanggal mulai", "VALIDATION_ERROR"));
    const token = await getValue("qr:token");
    if (!token || !sameToken(token, b.token)) return reply.status(404).send(fail("Tautan tidak berlaku lagi. Pindai ulang QR terbaru.", "NOT_FOUND"));
    const byNik = nikLimiter(b.nik.toLowerCase());
    if (!byNik.allowed) {
      reply.header("Retry-After", String(byNik.retryAfterSec));
      return reply.status(429).send(fail("Terlalu banyak percobaan, coba lagi nanti", "RATE_LIMITED"));
    }
    const emps = await q<{ id: string; branch: string; data: string }>("SELECT id, branch, data FROM employees", []);
    const emp = emps.find((e) => {
      try {
        const d = JSON.parse(e.data) as Record<string, unknown>;
        return String(d.username ?? "").trim() === b.nik && String(d.status ?? "Aktif") === "Aktif";
      } catch { return false; }
    });
    const hash = emp ? await getValue(`pin:${emp.id}`) : null;
    // Selalu bandingkan (hash palsu bila tak ada) supaya waktu respons tidak membedakan NIK.
    const okPin = await comparePassword(b.pin, hash ?? (await dummyHash()));
    if (!emp || !hash || !okPin) {
      await writeAudit({ actor: "anonymous", action: "public_leave_denied", table: "leaves", rowId: "-", diff: {}, ip: requestIp(req) });
      return reply.status(401).send(fail("NIK atau PIN salah", "UNAUTHORIZED"));
    }
    const days = Math.round((Date.parse(`${b.to}T00:00:00Z`) - Date.parse(`${b.from}T00:00:00Z`)) / 86400000) + 1;
    if (days > 60) return reply.status(400).send(fail("Rentang cuti terlalu panjang; ajukan lewat HR", "VALIDATION_ERROR"));
    const id = `CUT-${b.from.slice(0, 4)}-Q${randomBytes(4).toString("hex").toUpperCase()}`;
    const now = new Date().toISOString();
    const data = { employeeId: emp.id, type: b.type, from: b.from, to: b.to, days, status: "Diajukan", note: b.note, source: "QR", createdAt: now };
    await exec("INSERT INTO leaves (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, emp.branch, JSON.stringify(data), now]);
    await writeAudit({ actor: `qr:${emp.id}`, action: "public_leave_create", table: "leaves", rowId: id, diff: { type: b.type, from: b.from, to: b.to }, ip: requestIp(req) });
    // Hanya nomor pengajuan yang dikembalikan - tidak ada data karyawan.
    return reply.status(201).send(ok({ id, status: "Diajukan" }));
  });
}
