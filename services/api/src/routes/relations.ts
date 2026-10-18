/* REST relasi antar-koleksi (revisi 18 Okt: "aplikasi tidak dapat GET/POST data
 * dari model lain ke model utama").
 *
 *   GET  /api/:koleksi/:id/related            - data koleksi lain yang merujuk baris ini
 *   GET  /api/:koleksi/:id/expand?fields=a,b  - baris + data induk yang dirujuk (fields=* semua)
 *   POST /api/:koleksi/:id/related/:anak      - buat data anak, field relasinya terisi otomatis
 *
 * Dua jenis relasi:
 *  - KERAS: peta REFS (refs.ts) - nilai = id induk, divalidasi saat tulis.
 *  - LUNAK: SOFT_REFS di bawah - join lewat NAMA yang dipakai modul sejak awal
 *    (kapal, klien, subkon, vendor, equipment). Sengaja tidak divalidasi saat tulis
 *    (data lama berisi nama), tetapi dibaca dengan mencocokkan id ATAU nama induk.
 * Setiap baca/tulis didelegasikan ke rute CRUD yang sudah ada lewat app.inject
 * dengan token pemanggil: izin per koleksi, lingkup cabang/tim, validasi, audit,
 * dan cache berlaku persis seperti panggilan langsung. */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { REFS } from "../refs.js";
import { COLLECTIONS } from "./crud.js";
import { fail, ok } from "../envelope.js";

type Json = Record<string, unknown>;
interface Link { child: string; field: string; target: string; soft: boolean; nameField?: string }
const RELATED_LIMIT = 500;

export const SOFT_REFS: ReadonlyArray<Omit<Link, "soft">> = [
  { child: "projects", field: "vessel", target: "vessels", nameField: "name" },
  { child: "dockSlots", field: "vessel", target: "vessels", nameField: "name" },
  { child: "surveys", field: "vessel", target: "vessels", nameField: "name" },
  { child: "warranties", field: "vessel", target: "vessels", nameField: "name" },
  { child: "invoices", field: "vessel", target: "vessels", nameField: "name" },
  { child: "quotations", field: "vessel", target: "vessels", nameField: "name" },
  { child: "projects", field: "client", target: "clients", nameField: "name" },
  { child: "invoices", field: "client", target: "clients", nameField: "name" },
  { child: "quotations", field: "client", target: "clients", nameField: "name" },
  { child: "contracts", field: "client", target: "clients", nameField: "name" },
  { child: "vessels", field: "owner", target: "clients", nameField: "name" },
  { child: "workOrders", field: "sub", target: "subcontractors", nameField: "name" },
  { child: "termins", field: "sub", target: "subcontractors", nameField: "name" },
  { child: "purchaseOrders", field: "vendor", target: "vendors", nameField: "name" },
  { child: "payables", field: "v", target: "vendors", nameField: "name" },
  { child: "bookings", field: "equip", target: "equipment", nameField: "name" },
  { child: "projects", field: "manager", target: "employees", nameField: "name" },
];

/** Semua relasi (keras + lunak), tanpa join nama generik `__name__`. */
export function allLinks(): Link[] {
  const hard: Link[] = [];
  for (const [child, defs] of Object.entries(REFS)) {
    if (!COLLECTIONS.includes(child)) continue;
    for (const [field, def] of Object.entries(defs)) {
      if (def.target !== "__name__" && COLLECTIONS.includes(def.target)) hard.push({ child, field, target: def.target, soft: false });
    }
  }
  return [...hard, ...SOFT_REFS.map((s) => ({ ...s, soft: true }))];
}

/** Relasi yang merujuk `table` (dipakai /related dan POST related). */
export function reverseRefs(table: string): Link[] {
  return allLinks().filter((l) => l.target === table);
}

const authOf = (req: FastifyRequest): Record<string, string> =>
  req.headers.authorization ? { authorization: String(req.headers.authorization) } : {};

export function registerRelations(app: FastifyInstance): void {
  const getRow = async (req: FastifyRequest, table: string, id: string) =>
    app.inject({ method: "GET", url: `/api/${table}/${encodeURIComponent(id)}`, headers: authOf(req) });
  const listWhere = async (req: FastifyRequest, table: string, field: string, value: string) =>
    app.inject({ method: "GET", url: `/api/${table}?where.${field}=${encodeURIComponent(value)}&limit=${RELATED_LIMIT}`, headers: authOf(req) });

  for (const table of COLLECTIONS) {
    const base = `/api/${table}/:id`;

    app.get(`${base}/related`, async (req, reply) => {
      const { id } = req.params as { id: string };
      // Induk harus ada & terlihat oleh pemanggil (izin + cabang dicek rute asal).
      const parent = await getRow(req, table, id);
      if (parent.statusCode !== 200) return reply.status(parent.statusCode).type("application/json").send(parent.body);
      const parentData = (parent.json() as { data: { data: Json } }).data.data ?? {};
      const related: Record<string, Json> = {};
      for (const link of reverseRefs(table)) {
        const name = link.nameField ? String(parentData[link.nameField] ?? "").trim() : "";
        const values = [...new Set([id, ...(link.soft && name ? [name] : [])])];
        const rows = new Map<string, Json>();
        let forbidden = false;
        for (const value of values) {
          const res = await listWhere(req, link.child, link.field, value);
          if (res.statusCode === 403) { forbidden = true; break; }
          if (res.statusCode !== 200) continue;
          for (const row of (res.json() as { data: { rows: Json[] } }).data.rows) rows.set(String(row.id), row);
        }
        const key = `${link.child}.${link.field}`;
        if (forbidden) related[key] = { collection: link.child, field: link.field, forbidden: true };
        else if (rows.size > 0) related[key] = { collection: link.child, field: link.field, match: link.soft ? "id-atau-nama" : "id", total: rows.size, rows: [...rows.values()] };
      }
      return ok({ collection: table, id, related });
    });

    app.get(`${base}/expand`, async (req, reply) => {
      const { id } = req.params as { id: string };
      const wanted = String((req.query as { fields?: string }).fields ?? "*").split(",").map((f) => f.trim()).filter(Boolean);
      const own = await getRow(req, table, id);
      if (own.statusCode !== 200) return reply.status(own.statusCode).type("application/json").send(own.body);
      const row = (own.json() as { data: { data: Json } }).data;
      const links = new Map(allLinks().filter((l) => l.child === table).map((l) => [l.field, l]));
      const fields = wanted.includes("*") ? [...links.keys()] : wanted;
      const unknown = fields.filter((f) => !links.has(f));
      if (unknown.length > 0) return reply.status(400).send(fail(`Field tanpa relasi pada ${table}: ${unknown.join(", ")}`, "VALIDATION_ERROR"));
      const expand: Record<string, Json | null> = {};
      for (const field of fields) {
        const link = links.get(field) as Link;
        const value = String(row.data?.[field] ?? "").trim();
        const allow = (REFS[table]?.[field]?.allow ?? []) as string[];
        if (value === "" || allow.includes(value)) { expand[field] = null; continue; }
        const byId = await getRow(req, link.target, value);
        if (byId.statusCode === 200) { expand[field] = (byId.json() as { data: Json }).data; continue; }
        if (link.soft && link.nameField) {
          const byName = await listWhere(req, link.target, link.nameField, value);
          const hit = byName.statusCode === 200 ? (byName.json() as { data: { rows: Json[] } }).data.rows[0] : undefined;
          if (hit) { expand[field] = hit; continue; }
        }
        expand[field] = { error: byId.statusCode, target: link.target, value };
      }
      return ok({ ...row, expand });
    });

    app.post(`${base}/related/:child`, async (req, reply) => {
      const { id, child } = req.params as { id: string; child: string };
      const links = reverseRefs(table).filter((r) => r.child === child);
      const wantField = (req.query as { field?: string }).field;
      const link = wantField ? links.find((l) => l.field === wantField) : links.length === 1 ? links[0] : undefined;
      if (!link) {
        return reply.status(400).send(fail(
          links.length === 0
            ? `${child} tidak berelasi ke ${table}`
            : `${child} punya beberapa relasi ke ${table} (${links.map((l) => l.field).join(", ")}); sebutkan ?field=`,
          "VALIDATION_ERROR",
        ));
      }
      // Induk harus ada & terlihat oleh pemanggil sebelum anak dibuat.
      const parent = await getRow(req, table, id);
      if (parent.statusCode !== 200) return reply.status(parent.statusCode).type("application/json").send(parent.body);
      const parentData = (parent.json() as { data: { data: Json } }).data.data ?? {};
      // Relasi lunak memakai NAMA induk, sesuai cara modul menyimpannya.
      const value = link.soft && link.nameField ? String(parentData[link.nameField] ?? id) : id;
      const body = (req.body ?? {}) as { data?: Json; branch?: string };
      const res = await app.inject({
        method: "POST",
        url: `/api/${child}`,
        headers: { ...authOf(req), "content-type": "application/json" },
        payload: { ...body, data: { ...(body.data ?? {}), [link.field]: value } },
      });
      return reply.status(res.statusCode).type("application/json").send(res.body);
    });
  }
}
