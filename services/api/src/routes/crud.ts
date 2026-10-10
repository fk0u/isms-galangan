import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { requestActor, requestIp, shallowDiff, writeAudit, type AuditInput } from "../audit.js";
import { requirePermission, normalizeRole } from "../policy.js";
import { cursorOf, parseCursor } from "./crudCursor.js";
import { exec, getDialect, q, withTx } from "../db.js";
import { checkRefs, findUsages } from "../refs.js";
import { fail, ok } from "../envelope.js";
import { boqLockError, normalizeNewDoc } from "../boqDocs.js";
import { normalizeNewService, serviceGuardError } from "../serviceApproval.js";
import { spkLockError } from "../workOrderGuard.js";
import { loanOverlapError } from "../bookingGuard.js";
import { inventoryConversionError } from "../inventoryConversion.js";

// Cabang default sistem ISMS (ADR-0003 Jalur A: Satu cabang aktif Samarinda)
export const DEFAULT_BRANCH = "Samarinda";

const REQUIRED_AUDIT_TABLES = new Set([
  "invoices", "payables", "journals", "payroll", "users", "settings", "coa", "purchaseOrders",
]);

async function persistWithAudit(table: string, persist: () => Promise<unknown>, audit: AuditInput): Promise<void> {
  if (REQUIRED_AUDIT_TABLES.has(table)) {
    await withTx(async () => {
      await persist();
      await writeAudit(audit, { required: true });
    });
    return;
  }
  await persist();
  await writeAudit(audit);
}

// ID prefix per collection — disalin dari apps/web/src/data/store.tsx PREFIX
// (wajib sama; newId dipakai dua sisi). inventory=STK agar tak tabrakan
// dengan invoices=INV; vendors=VND beda dari vessels=V.
export const PREFIX: Record<string, string> = {
  projects: "PRJ",
  vessels: "V",
  drydocks: "DD",
  dockSlots: "DS",
  inventory: "STK",
  movements: "M",
  equipment: "EQ",
  bookings: "BK",
  subcontractors: "SUB",
  workOrders: "WO",
  termins: "TRM",
  employees: "EMP",
  invoices: "INV",
  payables: "AP",
  ncr: "NCR",
  incidents: "INC",
  inspections: "INS",
  purchaseOrders: "PO",
  requisitions: "PR",
  vendors: "VND",
  quotations: "QT",
  clients: "C",
  documents: "DOC",
  surveys: "S",
  activities: "A",
  services: "SRV",
  spareparts: "SP",
  boq: "BQ",
  branches: "BR",
  attendance: "ABS",
  payroll: "PAY",
  taxPeriods: "TAX",
  rfqs: "RFQ",
  changeOrders: "CO",
  risks: "RSK",
  leaves: "CUT",
  trainings: "TRN",
  timesheets: "TS",
  drawings: "DRW",
  toolbox: "TBM",
  warranties: "WRT",
  calibrations: "CAL",
  communications: "COM",
  contracts: "KTR",
  bast: "BAST",
  trials: "STL",
  requests: "REQ",
  clientPos: "CPO",
  walks: "SW",
  auditPlans: "AUD",
  warehouses: "GDG",
  maintenances: "MTE",
  letters: "SRT",
  settings: "SET",
  coa: "COA",
  journals: "JU",
  assets: "AST",
  boqDocs: "BQD",
  materialRequests: "MR",
};

// Every envelope table from migrations/001_init.sql except users
// (different schema: id/username/pass_hash/...) and the wbs/team side tables.
export const COLLECTIONS: string[] = [
  "projects", "vessels", "drydocks", "dockSlots", "inventory", "movements",
  "equipment", "bookings", "subcontractors", "workOrders", "termins",
  "employees", "invoices", "payables", "ncr", "incidents", "inspections",
  "purchaseOrders", "requisitions", "vendors", "quotations", "clients",
  "documents", "surveys", "activities", "services", "spareparts", "boq",
  "branches", "attendance", "payroll", "taxPeriods", "rfqs", "changeOrders",
  "risks", "leaves", "trainings", "timesheets", "drawings", "toolbox",
  "warranties", "calibrations", "communications", "contracts", "bast",
  "trials", "requests", "clientPos", "walks", "auditPlans", "warehouses", "maintenances", "letters", "settings", "coa", "journals", "assets", "boqDocs", "materialRequests",
];

// Tulis settings/coa dibatasi di registerCrud (requireSettingsWrite).
// "users" bukan koleksi envelope — diatur routes/users.ts.
const CreateSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  branch: z.string().max(64).optional(),
  data: z.record(z.unknown()),
});

const PatchSchema = z.object({
  branch: z.string().max(64).optional(),
  data: z.record(z.unknown()).refine((v) => Object.keys(v).length > 0, {
    message: "data kosong tidak mengubah apa pun",
  }).optional(),
  baseUpdatedAt: z.string().optional(),
}).refine((v) => v.branch !== undefined || v.data !== undefined, {
  message: "Nothing to update",
});

// Validasi domain minimal saat CREATE (422, bukan 400, agar FE melempar
// bukan menyimpan lokal): data harus objek + field kunci koleksi kritis.
// PATCH parsial tidak divalidasi isi (sengaja).
const REQUIRED_DATA: Record<string, string[]> = {
  boqDocs: ["projectId", "number"],
  projects: ["vessel", "client"],
  vessels: ["name"],
  invoices: ["client"],
  payables: ["v", "amt"],
  purchaseOrders: ["vendor"],
  requisitions: ["item"],
  employees: ["name"],
  payroll: ["employeeId", "period"],
  inventory: ["name"],
  vendors: ["name"],
  clients: ["name"],
  quotations: ["client", "vessel"],
  /* Koleksi batch terakhir. Wajib isi nama/tanggal supaya baris yang lolos
     validasi tetap punya isi meaningful di UI (label kartu, sorting tanggal). */
  warehouses: ["name"],
  maintenances: ["equipmentId", "tanggal"],
  letters: ["employeeId", "jenis", "tanggal"],
};

function assertDomain(table: string, data: unknown): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return "data harus objek";
  }
  const need = REQUIRED_DATA[table] ?? [];
  const rec = data as Record<string, unknown>;
  const missing = need.filter((k) => {
    const v = rec[k];
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  });
  if (missing.length > 0) return `field wajib kosong: ${missing.join(", ")}`;
  return null;
}

interface Row {
  id: string;
  branch: string;
  data: string;
  updated_at: string;
}

/* Koleksi yang field "name"-nya jadi kunci relasi (inventory.warehouse,
   movements.fromWh/toWh masih menyimpan NAMA, bukan id). Kalau dua gudang
   boleh bernama sama, kartu "Stok per Gudang" menggabung keduanya dan kolom
   "Dari Gudang" di mutasi menunjuk entri yang ambigu.
   taxPeriods masuk daftar serupa dengan field "period": kolom "Bulan" di
   laporan PPN menampilkan satu baris per nilai, dan periode ganda membuat
   total PPN terhitung dua kali. */
const UNIQUE_FIELD: Record<string, { field: string; label: string }> = {
  warehouses: { field: "name", label: "nama" },
  taxPeriods: { field: "period", label: "periode" },
};

/* Field unik ini hidup di dalam kolom `data` (TEXT berisi JSON), bukan sebagai
   kolom nyata. Versi lama menulis "SELECT id FROM warehouses WHERE LOWER(name)
   = ?". Kolom `name` tidak pernah ada di tabel mana pun - 001_init.sql dan
   006_batch_akhir.sql sama-sama hanya punya id/branch/data/updated_at - jadi
   MySQL selalu melempar Unknown column, dan catch lama menelan errornya lalu
   mengembalikan null. Guard gudang itu karena itu tidak pernah menolak apa pun
   di server; hanya pemeriksaan di FE yang bekerja, dan FE bisa dilewati lewat
   API langsung.

   Perbandingan sekarang dilakukan di JS dari `data` yang sudah di-parse, jadi
   benar-benar bekerja pada MySQL maupun sqlite. Hanya untuk koleksi kecil
   (gudang, periode pajak) - bukan untuk movements atau payroll yang berisi
   ribuan baris. */
async function checkUniqueField(
  table: string,
  field: string,
  label: string,
  value: string,
  selfId: string | null,
): Promise<string | null> {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const target = trimmed.toLowerCase();
  try {
    const rows = await q<Row>(`SELECT id, branch, data, updated_at FROM ${table}`);
    for (const r of rows) {
      if (String(r.id) === String(selfId ?? "")) continue;
      const parsed = toJson(r).data;
      if (typeof parsed !== "object" || parsed === null) continue;
      const current = String((parsed as Record<string, unknown>)[field] ?? "")
        .trim()
        .toLowerCase();
      if (current === target) return `${label} "${trimmed}" sudah dipakai`;
    }
  } catch (e) {
    /* Gagal membaca tabel tidak boleh memblokir penulisan. Aturan ini
       safety net, bukan sumber kebenaran. */
    console.error("[crud] unique check gagal:", e);
  }
  return null;
}

function toJson(row: Row): { id: string; branch: string; data: unknown; updated_at: string } {
  let data: unknown = {};
  try {
    data = JSON.parse(row.data) as unknown;
  } catch {
    // Satu baris korup tidak boleh menumbangkan seluruh halaman (RAGU-28).
    data = { _corrupt: true, _raw: String(row.data ?? "").slice(0, 200) };
  }
  return { id: row.id, branch: row.branch, data, updated_at: row.updated_at };
}

const DRYDOCK_DAY_MS = 86_400_000;
interface DrydockRange { start: number; end: number }

function drydockDay(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return Math.floor(time / DRYDOCK_DAY_MS);
}

function witaTodayDay(): number {
  const parts = new Map(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return drydockDay(`${parts.get("year")}-${parts.get("month")}-${parts.get("day")}`) ?? Math.floor(Date.now() / DRYDOCK_DAY_MS);
}

function drydockDateError(data: Record<string, unknown>): string | null {
  const hasStart = typeof data.startDate === "string" && data.startDate.trim() !== "";
  const hasEnd = typeof data.endDate === "string" && data.endDate.trim() !== "";
  if (!hasStart && !hasEnd) return null;
  if (!hasStart || !hasEnd) return "Tanggal mulai dan tanggal selesai harus diisi bersama";
  const start = drydockDay(data.startDate);
  const end = drydockDay(data.endDate);
  if (start === null || end === null) return "Tanggal drydock harus memakai format YYYY-MM-DD yang valid";
  if (end < start) return "Tanggal selesai harus sama dengan atau setelah tanggal mulai";
  return null;
}

/* Data lama hanya punya indeks hari relatif, jadi rentangnya dipetakan dari
   hari WITA saat ini; booking baru memakai tanggal ISO yang stabil. */
function drydockRange(data: Record<string, unknown>, today: number): DrydockRange | null {
  const start = drydockDay(data.startDate);
  const end = drydockDay(data.endDate);
  if (start !== null && end !== null) return { start, end: end + 1 };
  const from = Number(data.from);
  const to = Number(data.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  return { start: today + from, end: today + to };
}

function normalizeDrydockOffsets(data: Record<string, unknown>): Record<string, unknown> {
  const start = drydockDay(data.startDate);
  const end = drydockDay(data.endDate);
  if (start === null || end === null) return data;
  const today = witaTodayDay();
  return { ...data, from: start - today, to: end - today + 1 };
}

async function drydockOverlapError(
  data: Record<string, unknown>,
  branch: string,
  selfId: string | null,
): Promise<string | null> {
  const dockId = String(data.dockId ?? "").trim();
  const today = witaTodayDay();
  const requested = drydockRange(data, today);
  if (!dockId || !requested) return null;
  const rows = await q<Row>("SELECT id, branch, data, updated_at FROM dockSlots WHERE branch = ?", [branch]);
  for (const row of rows) {
    if (row.id === selfId) continue;
    const parsed = toJson(row).data;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) continue;
    const existing = parsed as Record<string, unknown>;
    if (String(existing.dockId ?? "").trim() !== dockId) continue;
    const occupied = drydockRange(existing, today);
    if (occupied && requested.start < occupied.end && occupied.start < requested.end) {
      return `Rentang tanggal bertumpang tindih dengan slot ${row.id} pada fasilitas ${dockId}`;
    }
  }
  return null;
}

async function persistDrydockWithOverlap(
  data: Record<string, unknown>,
  branch: string,
  selfId: string | null,
  persist: () => Promise<void>,
): Promise<string | null> {
  return withTx(async () => {
    const dockId = String(data.dockId ?? "").trim();
    /* SQLite memakai BEGIN IMMEDIATE dari withTx; MySQL mengunci baris fasilitas
       agar dua booking serentak pada dock yang sama diperiksa berurutan. */
    if (getDialect() === "mysql" && dockId !== "") {
      await q<{ id: string }>("SELECT id FROM drydocks WHERE id = ? FOR UPDATE", [dockId]);
    }
    const overlapError = await drydockOverlapError(data, branch, selfId);
    if (overlapError) return overlapError;
    await persist();
    return null;
  });
}

function newId(table: string): string {
  const prefix = PREFIX[table] ?? "X";
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function parseLimit(raw: unknown): number {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return 200;
  // Cap 5000: sync awal FE menarik tabel besar (movements ±19k) — halaman
  // 1000 berarti 19 round-trip; 5000 memangkas jadi 4x tanpa beban berarti.
  return Math.min(5000, Math.max(1, n));
}

function parseOffset(raw: unknown): number {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n);
}

export function registerCrud(app: FastifyInstance, table: string): void {
  if (!COLLECTIONS.includes(table)) throw new Error(`Unknown collection: ${table}`);
  const base = `/api/${table}`;
  const readGuards = [requireAuth, requirePermission(table, "r")];
  const writeGuards = [requireAuth, requirePermission(table, "w")];
  const deleteGuards = [requireAuth, requirePermission(table, "d")];

  app.get(base, { preHandler: readGuards }, async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.branch !== undefined && query.branch !== "") {
      where.push("branch = ?");
      params.push(query.branch);
    }
    if (query.q !== undefined && query.q !== "") {
      where.push(getDialect() === "mysql" ? "LOCATE(?, data) > 0" : "instr(data, ?) > 0");
      params.push(query.q);
    }
    const limit = parseLimit(query.limit);
    const offset = parseOffset(query.offset);
    const cursor = parseCursor(query.after);
    /* Cursor dan offset itu dua mode pagination yang BERBEDA, bukan dua cara
       menulis hal yang sama. Cursor (keyset) wajib untuk sync: ia menandai
       "sudah baca sampai baris ini", jadi baris yang diperbarui SAAT
       pagination berjalan tidak pernah hopong melewati jendela dan hilang.
       Offset tetap dipertahankan untuk pager UI yang 보여kan nomor halaman. */
    if (cursor !== null) {
      where.push("(updated_at > ? OR (updated_at = ? AND id > ?))");
      params.push(cursor.updatedAt, cursor.updatedAt, cursor.id);
    }
    const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
    const countRows = await q<{ cnt: number }>(`SELECT COUNT(*) AS cnt FROM ${table}${whereSql}`, params);
    const total = Number((countRows[0] as { cnt: number } | undefined)?.cnt ?? 0);
    /* Urutan WAJIB stabil DAN temporally koheren.
     *
     * Versi lama memakai `ORDER BY id ASC`. Id dibuat dari randomUUID8, jadi
     * urutannya acak: saat ada INSERT di tengah paginasi OFFSET, satu baris
     * bergeser melewati batas dan TIDAK PERNAH dikembalikan, sementara baris
     * lain mengembalikan dua kali. Kerugiannya senyap - tidak ada error, hanya
     * baris yang hilang di tengah-tengah proses sync. Dengan banyak pengguna
     * menulis bersamaan, itu sering terjadi.
     *
     * `updated_at, id` memberi dua jaminan sekaligus: id sebagai tie-breaker
     * membuat urutan deterministik (tidak ada baris yang hilang atau kembar), dan
     * updated_at membuat baris yang baru diubah muncul dekat halaman depan.
     * Kolom updated_at sudah dipakai sebagai concurrency token (PATCH) dan
     * selalu terisi. */
    const sql = cursor !== null
      ? `SELECT id, branch, data, updated_at FROM ${table}${whereSql} ORDER BY updated_at ASC, id ASC LIMIT ?`
      : `SELECT id, branch, data, updated_at FROM ${table}${whereSql} ORDER BY updated_at ASC, id ASC LIMIT ? OFFSET ?`;
    const rows = await q<Row>(sql, cursor !== null ? [...params, limit] : [...params, limit, offset]);
    /* Cursor halaman berikutnya = baris terakhir yang benar-benar dikirim.
       Kalau halaman kosong tidak ada cursor lanjutan - pemanggil berhenti. */
    const last = rows[rows.length - 1];
    return ok({
      rows: rows.map(toJson),
      total,
      limit,
      offset,
      nextCursor: rows.length === limit && last !== undefined ? cursorOf(last) : null,
    });
  });

  app.get(`${base}/:id`, { preHandler: readGuards }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const rows = await q<Row>(`SELECT id, branch, data, updated_at FROM ${table} WHERE id = ?`, [id]);
    if (rows.length === 0) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    return ok(toJson(rows[0] as Row));
  });

  app.post(base, { preHandler: writeGuards }, async (req, reply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    let id = parsed.data.id;
    if (id) {
      const dup = await q<Row>(`SELECT id FROM ${table} WHERE id = ?`, [id]);
      if (dup.length > 0) return reply.status(409).send(fail(`Duplicate id: ${id}`, "CONFLICT"));
    } else {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = newId(table);
        const dup = await q<Row>(`SELECT id FROM ${table} WHERE id = ?`, [candidate]);
        if (dup.length === 0) { id = candidate; break; }
      }
      if (!id) return reply.status(500).send(fail("Could not generate unique id", "INTERNAL_ERROR"));
    }
    // ADR-0003 Jalur A: Satu cabang aktif (Samarinda). Server memaksa branch = DEFAULT_BRANCH
    // pada create kecuali akun privileged (direktur/developer) secara spesifik menentukan cabang lain.
    const userRole = normalizeRole(req.user?.role);
    const isPrivileged = userRole === "direktur" || userRole === "developer";
    const requestedBranch = parsed.data.branch?.trim();
    const branch = isPrivileged && requestedBranch ? requestedBranch : DEFAULT_BRANCH;
    const now = new Date().toISOString();
    // 5. activities: actor diisi dari token; tolak pemalsuan nama aktor
    let rowData: Record<string, unknown> = { ...parsed.data.data };
    if (table === "boqDocs") rowData = normalizeNewDoc(rowData);
    if (table === "services") rowData = normalizeNewService(rowData);
    if (table === "activities") {
      rowData.user = requestActor(req);
    }
    // ADR-0006: surat BoQ terkunci & unik (projectId, number, revision).
    const createLock = await boqLockError(table, null, rowData);
    if (createLock) return reply.status(409).send(fail(createLock, "LOCKED"));
    // F3-D-02: service wajib WBS & persetujuan; materialRequests hanya lewat endpoint.
    const createGuard = await serviceGuardError(table, null, rowData);
    if (createGuard) return reply.status(422).send(fail(createGuard, "UNPROCESSABLE"));
    const spkCreate = spkLockError(table, null, rowData, req.user?.role);
    if (spkCreate) return reply.status(403).send(fail(spkCreate, "FORBIDDEN"));
    const loanCreate = await loanOverlapError(table, null, rowData);
    if (loanCreate) return reply.status(409).send(fail(loanCreate, "CONFLICT"));
    const domainError = assertDomain(table, rowData);
    if (domainError) return reply.status(422).send(fail(domainError, "UNPROCESSABLE"));
    const drydockDateValidation = table === "dockSlots" ? drydockDateError(rowData) : null;
    if (drydockDateValidation) return reply.status(422).send(fail(drydockDateValidation, "UNPROCESSABLE"));
    if (table === "dockSlots") rowData = normalizeDrydockOffsets(rowData);
    if (table === "inventory") {
      const conversionError = inventoryConversionError(rowData);
      if (conversionError) return reply.status(422).send(fail(conversionError, "UNPROCESSABLE"));
    }
    const uniq = UNIQUE_FIELD[table];
    if (uniq) {
      const fieldError = await checkUniqueField(
        table, uniq.field, uniq.label, String((rowData as Record<string, unknown>)[uniq.field] ?? ""), null,
      );
      if (fieldError) return reply.status(409).send(fail(fieldError, "CONFLICT"));
    }
    const refError = await checkRefs(table, rowData as Record<string, unknown>);
    if (refError) return reply.status(422).send(fail(refError, "UNPROCESSABLE"));
    const persist = () => persistWithAudit(table, () => exec(`INSERT INTO ${table} (id, branch, data, updated_at) VALUES (?, ?, ?, ?)`, [
      id, branch, JSON.stringify(rowData), now,
    ]), {
      actor: requestActor(req),
      action: "create",
      table,
      rowId: id as string,
      diff: { branch, data: rowData },
      ip: requestIp(req),
    });
    if (table === "dockSlots") {
      const overlapError = await persistDrydockWithOverlap(rowData, branch, null, persist);
      if (overlapError) return reply.status(409).send(fail(overlapError, "CONFLICT"));
    } else {
      await persist();
    }
    return reply.status(201).send(ok({ id, branch, data: rowData, updated_at: now }));
  });

  app.patch(`${base}/:id`, { preHandler: writeGuards }, async (req, reply) => {
    // 5. activities: PATCH ditolak (append-only)
    if (table === "activities") {
      return reply.status(403).send(fail("Aktivitas tidak dapat diubah", "FORBIDDEN"));
    }
    const parsed = PatchSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(fail("Validation failed", "VALIDATION_ERROR"));
    const { id } = req.params as { id: string };
    const rows = await q<Row>(`SELECT id, branch, data, updated_at FROM ${table} WHERE id = ?`, [id]);
    if (rows.length === 0) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const current = rows[0] as Row;
    if (parsed.data.baseUpdatedAt !== undefined && parsed.data.baseUpdatedAt !== current.updated_at) {
      return reply.status(409).send({
        ok: false,
        error: { message: "Stale data: row was modified by another user", code: "STALE" },
        data: toJson(current),
      });
    }
    const oldData = (() => {
      try {
        return JSON.parse(current.data) as Record<string, unknown>;
      } catch {
        return {};
      }
    })();
    let merged = parsed.data.data ? { ...oldData, ...parsed.data.data } : oldData;
    // ADR-0003 Jalur A: PATCH tidak boleh mengubah branch kecuali direktur/developer
    const requestedBranch = parsed.data.branch !== undefined ? parsed.data.branch.trim() : undefined;
    if (requestedBranch !== undefined && requestedBranch !== current.branch) {
      const userRole = normalizeRole(req.user?.role);
      const isPrivileged = userRole === "direktur" || userRole === "developer";
      if (!isPrivileged) {
        return reply.status(403).send(fail("Hanya direktur atau developer yang dapat mengubah cabang", "FORBIDDEN"));
      }
    }
    const branch = requestedBranch !== undefined ? (requestedBranch || DEFAULT_BRANCH) : current.branch;
    const now = new Date().toISOString();
    /* PATCH juga wajib menjaga field kunci. checkRefs() sengaja MENGLEWATI
       nilai kosong/null (kolom opsional boleh kosong), jadi tanpa baris ini
       PATCH {vessel:""} pada sebuah proyek lolos begitu saja dan barisnya
       jadi tidak valid - padahal POST kekotak yang sama ditolak 422. */
    const domainError = assertDomain(table, merged);
    if (domainError) return reply.status(422).send(fail(domainError, "UNPROCESSABLE"));
    const changedDates = parsed.data.data !== undefined && (
      Object.hasOwn(parsed.data.data, "startDate") || Object.hasOwn(parsed.data.data, "endDate")
    );
    const drydockDateValidation = table === "dockSlots" && changedDates ? drydockDateError(merged) : null;
    if (drydockDateValidation) return reply.status(422).send(fail(drydockDateValidation, "UNPROCESSABLE"));
    if (table === "inventory") {
      const conversionError = inventoryConversionError(merged, oldData);
      if (conversionError) return reply.status(422).send(fail(conversionError, "UNPROCESSABLE"));
    }
    const uniq = UNIQUE_FIELD[table];
    if (uniq) {
      const fieldError = await checkUniqueField(
        table, uniq.field, uniq.label, String((merged as Record<string, unknown>)[uniq.field] ?? ""), id,
      );
      if (fieldError) return reply.status(409).send(fail(fieldError, "CONFLICT"));
    }
    const patchLock = await boqLockError(table, oldData, merged);
    if (patchLock) return reply.status(409).send(fail(patchLock, "LOCKED"));
    const patchGuard = await serviceGuardError(table, oldData, merged);
    if (patchGuard) return reply.status(422).send(fail(patchGuard, "UNPROCESSABLE"));
    const spkLock = spkLockError(table, oldData, merged, req.user?.role);
    if (spkLock) return reply.status(403).send(fail(spkLock, "FORBIDDEN"));
    const loanPatch = await loanOverlapError(table, id, merged);
    if (loanPatch) return reply.status(409).send(fail(loanPatch, "CONFLICT"));
    const refError = await checkRefs(table, merged);
    if (refError) return reply.status(422).send(fail(refError, "UNPROCESSABLE"));
    const changedRange = table === "dockSlots" && (
      (parsed.data.data !== undefined && ["dockId", "from", "to", "startDate", "endDate"]
        .some((field) => Object.hasOwn(parsed.data.data as Record<string, unknown>, field))) ||
      branch !== current.branch
    );
    if (changedRange) merged = normalizeDrydockOffsets(merged);
    const persist = () => persistWithAudit(table, () => exec(`UPDATE ${table} SET branch = ?, data = ?, updated_at = ? WHERE id = ?`, [
      branch, JSON.stringify(merged), now, id,
    ]), {
      actor: requestActor(req),
      action: "update",
      table,
      rowId: id,
      diff: {
        ...(current.branch !== branch ? { branch: { before: current.branch, after: branch } } : {}),
        ...shallowDiff(oldData, merged),
      },
      ip: requestIp(req),
    });
    if (changedRange) {
      const overlapError = await persistDrydockWithOverlap(merged, branch, id, persist);
      if (overlapError) return reply.status(409).send(fail(overlapError, "CONFLICT"));
    } else {
      await persist();
    }
    return ok({ id, branch, data: merged, updated_at: now });
  });

  app.delete(`${base}/:id`, { preHandler: deleteGuards }, async (req, reply) => {
    // 5. activities: DELETE ditolak (append-only)
    if (table === "activities") {
      return reply.status(403).send(fail("Aktivitas tidak dapat dihapus", "FORBIDDEN"));
    }
    const { id } = req.params as { id: string };
    const rows = await q<Row>(`SELECT id, branch, data, updated_at FROM ${table} WHERE id = ?`, [id]);
    if (rows.length === 0) return reply.status(404).send(fail("Not found", "NOT_FOUND"));
    const doomed = rows[0] as Row;
    const deleteLock = await boqLockError(table, toJson(doomed).data as Record<string, unknown>, null);
    const deleteGuard = await serviceGuardError(table, toJson(doomed).data as Record<string, unknown>, null);
    if (deleteGuard) return reply.status(409).send(fail(deleteGuard, "LOCKED"));
    const spkDelete = spkLockError(table, toJson(doomed).data as Record<string, unknown>, null, req.user?.role);
    if (spkDelete) return reply.status(403).send(fail(spkDelete, "FORBIDDEN"));
    if (deleteLock) return reply.status(409).send(fail(deleteLock, "LOCKED"));
    const usages = await findUsages(table, id);
    if (usages.length > 0) {
      return reply
        .status(409)
        .send(fail(`Tidak dapat menghapus: masih dipakai oleh ${usages.join(", ")}`, "REFERENCED"));
    }
    await persistWithAudit(table, () => exec(`DELETE FROM ${table} WHERE id = ?`, [id]), {
      actor: requestActor(req),
      action: "delete",
      table,
      rowId: id,
      /* Baris sudah terhapus sebelum audit ditulis; JSON.parse tanpa
         try/catch di sini membuat DELETE kelihatan gagal (500) padahal
         datanya SUDAH hilang, lalu FE mencoba ulang dan mendapat 404.
         toJson() sudah menangani JSON korup - pakai helper yang sama. */
      diff: { branch: doomed.branch, data: toJson(doomed).data },
      ip: requestIp(req),
    });
    return ok({ id, deleted: true });
  });
}
