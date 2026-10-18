/* F3-L-06 (ADR-0017, diubah ADR-0019): pengajuan cuti/izin mandiri lewat QR.
 *
 * Halaman publik TIDAK memakai login akun. Sejak ADR-0019 (permintaan klien
 * 12 Okt) PIN tidak lagi diminta: karyawan dikenali dari token QR + NIK, dan
 * setelah NIK cocok hanya nama, jabatan, departemen yang ditampilkan untuk
 * verifikasi. Pengajuan selalu berstatus Diajukan - HR tetap yang memutuskan.
 * Token QR disimpan sebagai hash, kedaluwarsa 1 tahun, dan diganti saat HR
 * membuat QR baru. */
import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { hashPassword, requireAuth } from "../auth.js";
import { requestActor, requestIp, writeAudit } from "../audit.js";
import { exec, q } from "../db.js";
import { fail, ok } from "../envelope.js";
import { can } from "../policy.js";
import { createRateLimiter, getClientIp } from "../rateLimit.js";
import { hasMagic, scanContent, uploadsRoot } from "./files.js";

export const LEAVE_TYPES = ["Tahunan", "Sakit", "Izin"] as const;
const ipLimiter = createRateLimiter(10, 10 * 60_000);
const nikLimiter = createRateLimiter(5, 15 * 60_000);
// Pratinjau NIK dipisah dari kuota kirim: satu bengkel biasanya berbagi satu IP.
const lookupLimiter = createRateLimiter(30, 10 * 60_000);
/* 1 tahun (catatan klien 17 Okt, K17-HR-01; ADR-0019): QR tertempel di lokasi
   kerja dan mengganti cetakan tiap 90 hari terlalu sering. Batas lain tetap:
   NIK aktif, rate limit, pengajuan menunggu HR, dan QR baru mencabut yang lama. */
const QR_TTL_MS = 365 * 86_400_000;
const MAX_ATTACHMENT = 3 * 1024 * 1024;
const ATTACHMENT_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
const GONE = "Tautan sudah kedaluwarsa atau diganti. Pindai QR terbaru dari HR.";
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const realDate = (d: string): boolean => { const t = new Date(`${d}T00:00:00Z`); return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d; };

const SubmitSchema = z.object({
  token: z.string().min(16).max(128),
  nik: z.string().trim().min(1).max(64),
  type: z.enum(LEAVE_TYPES),
  from: z.string().regex(ISO).refine(realDate),
  to: z.string().regex(ISO).refine(realDate),
  note: z.string().trim().min(3).max(500),
  // Dokumen pendukung ikut dalam permintaan yang sama, jadi tidak ada unggahan yatim.
  attachment: z.object({ name: z.string().max(200), data: z.string().max(Math.ceil(MAX_ATTACHMENT * 1.4)) }).optional(),
});
const CheckSchema = z.object({ token: z.string().min(16).max(128), nik: z.string().trim().max(64).optional() });
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
const sha = (v: string): string => createHash("sha256").update(v).digest("hex");

interface QrRecord { hash: string; createdAt: string; createdBy: string; expiresAt: string }
/** Baris `qr:token`: JSON berisi hash (baru) atau token polos (sebelum ADR-0019). */
async function readQr(): Promise<{ record: QrRecord | null; legacy: string | null }> {
  const raw = await getValue("qr:token");
  if (!raw) return { record: null, legacy: null };
  if (!raw.startsWith("{")) return { record: null, legacy: raw };
  return { record: JSON.parse(raw) as QrRecord, legacy: null };
}
async function tokenValid(token: string): Promise<boolean> {
  const { record, legacy } = await readQr();
  if (legacy) return sameToken(legacy, token);
  return record !== null && sameToken(record.hash, sha(token)) && Date.parse(record.expiresAt) > Date.now();
}
async function issueQr(actor: string): Promise<{ token: string; meta: Omit<QrRecord, "hash"> }> {
  const token = randomBytes(24).toString("hex");
  const meta = { createdAt: new Date().toISOString(), createdBy: actor, expiresAt: new Date(Date.now() + QR_TTL_MS).toISOString() };
  await setValue("qr:token", JSON.stringify({ hash: sha(token), ...meta }));
  return { token, meta };
}
async function activeEmployee(nik: string): Promise<{ id: string; branch: string; d: Record<string, unknown> } | null> {
  // ponytail: memindai seluruh karyawan per permintaan; beri kolom NIK berindeks bila ribuan.
  const emps = await q<{ id: string; branch: string; data: string }>("SELECT id, branch, data FROM employees", []);
  for (const e of emps) {
    try {
      const d = JSON.parse(e.data) as Record<string, unknown>;
      if (String(d.username ?? "").trim() === nik && String(d.status ?? "Aktif") === "Aktif") return { id: e.id, branch: e.branch, d };
    } catch { /* baris rusak dilewati */ }
  }
  return null;
}
/** Simpan dokumen pendukung; mengembalikan URL atau pesan penolakan. */
function saveAttachment(att: { name: string; data: string }): { url: string; file: string } | { error: string } {
  const ext = path.extname(att.name).toLowerCase();
  if (!ATTACHMENT_EXT.has(ext)) return { error: "Dokumen pendukung harus PDF, JPG, atau PNG" };
  const buf = Buffer.from(att.data.replace(/^data:[^,]*,/, ""), "base64");
  if (buf.length === 0 || buf.length > MAX_ATTACHMENT) return { error: "Dokumen pendukung kosong atau lebih dari 3 MB" };
  if (!hasMagic(buf, ext)) return { error: "Isi dokumen tidak sesuai jenis berkasnya" };
  const bad = scanContent(buf, ext);
  if (bad) return { error: bad };
  const month = new Date().toISOString().slice(0, 7);
  const dir = path.join(uploadsRoot(), month);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${randomUUID().replace(/-/g, "")}${ext}`;
  const file = path.join(dir, name);
  fs.writeFileSync(file, buf);
  return { url: `/files/${month}/${name}`, file };
}

export function registerPublicLeaveRoutes(app: FastifyInstance): void {
  /* HR: status QR aktif. Token tidak bisa diambil ulang (hanya hash yang
     disimpan) - QR ditampilkan sekali saat dibuat. */
  app.get("/api/leave-qr", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "leaves", "w") || !can(req.user?.role, "employees", "w")) return reply.status(403).send(fail("Hanya HR yang boleh mengelola QR cuti", "FORBIDDEN"));
    const { record, legacy } = await readQr();
    if (legacy) return ok({ active: true, createdAt: null, createdBy: null, expiresAt: null });
    if (!record) return ok({ active: false, createdAt: null, createdBy: null, expiresAt: null });
    return ok({ active: Date.parse(record.expiresAt) > Date.now(), createdAt: record.createdAt, createdBy: record.createdBy, expiresAt: record.expiresAt });
  });

  /* HR: buat QR baru - QR lama yang tertempel langsung tidak berlaku.
     Pengajuan cuti yang sudah masuk tidak disentuh. */
  app.post("/api/leave-qr/rotate", { preHandler: [requireAuth] }, async (req, reply) => {
    if (!can(req.user?.role, "leaves", "w") || !can(req.user?.role, "employees", "w")) return reply.status(403).send(fail("Hanya HR yang boleh mengelola QR cuti", "FORBIDDEN"));
    const { token, meta } = await issueQr(requestActor(req));
    await writeAudit({ actor: requestActor(req), action: "leave_qr_rotate", table: "leaves", rowId: "-", diff: { expiresAt: meta.expiresAt }, ip: requestIp(req) });
    return ok({ token, active: true, ...meta });
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

  /* PUBLIK: cek tautan saat halaman dibuka, dan pratinjau NIK (nama, jabatan,
     departemen saja). NIK tak dikenal dijawab 200 tanpa data - sama seperti
     NIK kosong - sehingga tidak ada kode status yang membedakannya. */
  app.post("/api/public/leave/check", async (req, reply) => {
    const lim = lookupLimiter(getClientIp(req));
    if (!lim.allowed) {
      reply.header("Retry-After", String(lim.retryAfterSec));
      return reply.status(429).send(fail("Terlalu banyak percobaan, coba lagi nanti", "RATE_LIMITED"));
    }
    const parsed = CheckSchema.safeParse(req.body);
    if (!parsed.success || !(await tokenValid(parsed.data.token))) return reply.status(404).send(fail(GONE, "NOT_FOUND"));
    const emp = parsed.data.nik ? await activeEmployee(parsed.data.nik) : null;
    return ok({ employee: emp ? { name: String(emp.d.name ?? ""), role: String(emp.d.role ?? ""), dept: String(emp.d.dept ?? "") } : null });
  });

  /* PUBLIK: buat pengajuan. Tanpa auth - dijaga token QR + NIK + rate limit. */
  app.post("/api/public/leave", { bodyLimit: 5 * 1024 * 1024 }, async (req, reply) => {
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
    if (!(await tokenValid(b.token))) return reply.status(404).send(fail(GONE, "NOT_FOUND"));
    const byNik = nikLimiter(b.nik.toLowerCase());
    if (!byNik.allowed) {
      reply.header("Retry-After", String(byNik.retryAfterSec));
      return reply.status(429).send(fail("Terlalu banyak percobaan, coba lagi nanti", "RATE_LIMITED"));
    }
    const emp = await activeEmployee(b.nik);
    if (!emp) {
      await writeAudit({ actor: "anonymous", action: "public_leave_denied", table: "leaves", rowId: "-", diff: {}, ip: requestIp(req) });
      return reply.status(401).send(fail("NIK tidak dikenali. Periksa kembali atau hubungi HR.", "UNAUTHORIZED"));
    }
    const days = Math.round((Date.parse(`${b.to}T00:00:00Z`) - Date.parse(`${b.from}T00:00:00Z`)) / 86400000) + 1;
    if (days > 60) return reply.status(400).send(fail("Rentang cuti terlalu panjang; ajukan lewat HR", "VALIDATION_ERROR"));
    const saved = b.attachment ? saveAttachment(b.attachment) : null;
    if (saved && "error" in saved) return reply.status(400).send(fail(saved.error, "VALIDATION_ERROR"));
    const id = `CUT-${b.from.slice(0, 4)}-Q${randomBytes(4).toString("hex").toUpperCase()}`;
    const now = new Date().toISOString();
    const data = { employeeId: emp.id, type: b.type, from: b.from, to: b.to, days, status: "Diajukan", note: b.note, source: "QR", createdAt: now, ...(saved ? { fileUrl: saved.url } : {}) };
    try {
      await exec("INSERT INTO leaves (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, emp.branch, JSON.stringify(data), now]);
    } catch (err) {
      // Berkas tidak boleh tertinggal tanpa pengajuan yang menautkannya.
      if (saved) fs.rmSync(saved.file, { force: true });
      throw err;
    }
    await writeAudit({ actor: `qr:${emp.id}`, action: "public_leave_create", table: "leaves", rowId: id, diff: { type: b.type, from: b.from, to: b.to, attachment: Boolean(saved) }, ip: requestIp(req) });
    // Hanya nomor pengajuan yang dikembalikan - tidak ada data karyawan.
    return reply.status(201).send(ok({ id, status: "Diajukan" }));
  });
}
