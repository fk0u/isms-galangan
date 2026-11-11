// Integritas referensi antar koleksi (ala Odoo many2one, versi generik).
// Semua relasi tersimpan sebagai string di kolom JSON `data` — peta ini
// mendeklarasikan field mana yang merujuk id tabel mana, dipakai untuk:
// - validasi tulis (422 bila target tidak ada),
// - delete-guard (409 + daftar pemakai bila baris masih dirujuk).
import { exec, getDialect, q } from "./db.js";
import { writeAudit } from "./audit.js";

export interface RefDef {
  /** tabel yang dirujuk (harus ada di COLLECTIONS atau tabel khusus). */
  target: string;
  /** nilai yang dikecualikan (sentinel sah: saldo awal, arsip umum, tanpa PR). */
  allow?: string[];
  /** wajib terisi saat CREATE (bukan impor seed). PATCH tidak dipaksa supaya
   *  baris impor lama yang kosong tetap bisa disunting. */
  required?: boolean;
}

// field data → definisi referensi, per tabel sumber.
// Join NAMA (sub, vendor, vessel, owner) sengaja TIDAK ditegakkan
// (perbandingan case/trim di FE via helper sameName).
// Sentinel sah (saldo awal "", arsip "-", tanpa PR) didaftarkan per field.
export const REFS: Record<string, Record<string, RefDef>> = {
  invoices: { project: { target: "projects", allow: ["", "-", "U/STOCK"] } },
  /* Mutasi tanpa itemId tidak menggerakkan stok mana pun (stok & kartu
     barang tidak sinkron) - wajib terisi untuk mutasi baru. */
  movements: { itemId: { target: "inventory", required: true } },
  termins: { woId: { target: "workOrders" } },
  purchaseOrders: { req: { target: "requisitions", allow: ["-"] } },
  services: { projectId: { target: "projects" }, vesselId: { target: "vessels" }, boqRef: { target: "boq", allow: ["", "-"] } },
  spareparts: { projectId: { target: "projects" }, vesselId: { target: "vessels" }, inventoryItemId: { target: "inventory", allow: [""] } },
  quotations: { requestId: { target: "requests" } },
  contracts: { quotationId: { target: "quotations" }, projectId: { target: "projects" } },
  communications: { quotationId: { target: "quotations" } },
  surveys: { linkedTrial: { target: "trials" } },
  timesheets: { woId: { target: "workOrders" }, employeeId: { target: "employees" } },
  calibrations: { equipmentId: { target: "equipment" } },
  /* Batch terakhir — relasi yang dijaga:
       maintenances.equipmentId  → equipment  (siklus servis equipment)
       maintenances.projectId     → projects   (biaya servis masuk HPP proyek)
       letters.employeeId         → employees  (surat SDM)
     Gudang sengaja TIDAK lewat REFS: kolom inventory.warehouse masih berisi
     NAMA gudang (bukan id) dan korpus seed ±19k baris movements + ±400 item
     semuanya nama - relasi lewat id akan memblokir semua write lama.
     Unik nama dijaga di sisi BE lewat checkNameUnique() (crud.ts). */
  maintenances: { equipmentId: { target: "equipment" }, projectId: { target: "projects", allow: ["", "-"] } },
  letters: { employeeId: { target: "employees" } },
  dockSlots: { project: { target: "projects" }, dockId: { target: "drydocks" } },
  documents: { project: { target: "projects", allow: ["-"] }, boqDocId: { target: "boqDocs", allow: ["", "-"] } },
  payroll: { employeeId: { target: "employees" } },
  attendance: { employeeId: { target: "employees" } },
  leaves: { employeeId: { target: "employees" } },
  projects: { plannedDockId: { target: "drydocks", allow: ["", "-"] } },
  vessels: {},
  drydocks: {},
  inventory: {},
  equipment: {},
  bookings: { equipId: { target: "equipment", allow: ["", "-"] } },
  subcontractors: {},
  workOrders: { project: { target: "projects" }, sub: { target: "__name__" } },
  employees: {},
  payables: {},
  ncr: { project: { target: "projects" } },
  incidents: {},
  inspections: { project: { target: "projects" } },
  requisitions: { itemId: { target: "inventory", allow: ["", "-"] }, projectId: { target: "projects", allow: ["", "-"] } },
  vendors: {},
  clients: {},
  activities: {},
  boq: { projectId: { target: "projects" }, boqDocId: { target: "boqDocs", allow: ["", "-"] } },
  checklistResponses: { templateId: { target: "checklistTemplates" }, projectId: { target: "projects", allow: ["", "-"] }, employeeId: { target: "employees", allow: ["", "-"] } },
  bomItems: { projectId: { target: "projects" }, itemId: { target: "inventory" } },
  materialRequests: {
    projectId: { target: "projects" }, itemId: { target: "inventory" },
    requisitionId: { target: "requisitions", allow: [""] }, sparepartId: { target: "spareparts", allow: [""] },
  },
  boqDocs: { projectId: { target: "projects" }, supersedes: { target: "boqDocs", allow: [""] } },
  branches: {},
  taxPeriods: {},
  rfqs: { prId: { target: "requisitions" } },
  changeOrders: { project: { target: "projects" }, boqDocId: { target: "boqDocs", allow: ["", "-"] } },
  risks: { project: { target: "projects" } },
  trainings: {},
  toolbox: { project: { target: "projects" } },
  drawings: { project: { target: "projects" } },
  warranties: { projectId: { target: "projects" } },
  bast: { projectId: { target: "projects" } },
  trials: { projectId: { target: "projects" } },
  requests: {},
  /* warehouses TIDAK punya relasi many2one: inventory.warehouse menyimpan
     NAMA gudang (bukan id) - lihat catatan panjang di blok maintenances di
     atas. Unik nama ditegakkan lewat checkNameUnique() di routes/crud.ts. */
  warehouses: {},
  clientPos: { contractId: { target: "contracts" }, projectId: { target: "projects" } },
  settings: {},
  coa: {},
  journals: {},
  assets: {},
};

/* Relasi LUNAK: anak menyimpan NAMA induk (bukan id) sejak modul awal
   (kapal, klien, subkon, vendor, equipment, manajer proyek). Tidak divalidasi
   saat tulis (data lama berisi nama), tetapi dijaga di dua titik:
   - delete-guard: induk yang namanya masih dipakai tidak boleh dihapus;
   - ganti nama induk: semua anak ikut diganti di server dalam satu transaksi,
     supaya tautan antar-modul tidak putus diam-diam. */
export interface SoftRef { child: string; field: string; target: string; nameField: string }
export const SOFT_REFS: ReadonlyArray<SoftRef> = [
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

/** Kunci pembanding nama (sama dengan helper sameName di FE: trim + abaikan huruf besar). */
export const nameKey = (v: unknown): string => String(v ?? "").trim().toLowerCase();

function parseData(raw: string): Record<string, unknown> {
  try {
    const d = JSON.parse(raw) as unknown;
    return typeof d === "object" && d !== null && !Array.isArray(d) ? d as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

/** Baris lain di tabel induk yang memakai nama yang sama (nama kembar). */
async function nameTwin(table: string, nameField: string, key: string, selfId: string): Promise<string | null> {
  const rows = await q<{ id: string; data: string }>(`SELECT id, data FROM ${table}`);
  for (const r of rows) if (r.id !== selfId && nameKey(parseData(r.data)[nameField]) === key) return r.id;
  return null;
}

/** Pemakai lunak sebuah induk (lewat nama ATAU id). Nama kembar di induk lain
 *  membuat tautan tetap hidup, jadi tidak dihitung sebagai pemakai. */
async function softUsages(table: string, id: string, limit: number): Promise<string[]> {
  const links = SOFT_REFS.filter((l) => l.target === table);
  if (links.length === 0 || limit <= 0) return [];
  const parent = (await q<{ data: string }>(`SELECT data FROM ${table} WHERE id = ?`, [id]))[0];
  if (!parent) return [];
  const pd = parseData(parent.data);
  const out: string[] = [];
  const byField = new Map<string, string>();
  for (const l of links) byField.set(l.nameField, nameKey(pd[l.nameField]));
  for (const l of links) {
    const key = byField.get(l.nameField) ?? "";
    if (key !== "" && await nameTwin(table, l.nameField, key, id)) continue;
    let rows: { id: string; data: string }[];
    try {
      rows = await q<{ id: string; data: string }>(`SELECT id, data FROM ${l.child}`);
    } catch {
      continue; // tabel anak belum ada
    }
    for (const r of rows) {
      const v = parseData(r.data)[l.field];
      if ((key !== "" && nameKey(v) === key) || String(v ?? "") === id) {
        out.push(`${l.child} ${r.id}`);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export interface SoftRename { nameField: string; from: string; to: string }

/** Perubahan nama induk relasi lunak pada PATCH, atau null. */
export function softRenameOf(table: string, before: Record<string, unknown>, after: Record<string, unknown>): SoftRename | null {
  const link = SOFT_REFS.find((l) => l.target === table);
  if (!link) return null;
  const from = String(before[link.nameField] ?? "").trim();
  const to = String(after[link.nameField] ?? "").trim();
  if (from === "" || to === "" || from === to) return null;
  return { nameField: link.nameField, from, to };
}

/** Ganti nama ke nama yang sudah dipakai induk lain akan MENGGABUNG tautan
 *  kedua induk (anak keduanya tak bisa dibedakan lagi) - tolak. */
export async function softRenameConflict(table: string, id: string, rename: SoftRename): Promise<string | null> {
  if (nameKey(rename.from) === nameKey(rename.to)) return null; // hanya beda huruf besar/spasi
  const twin = await nameTwin(table, rename.nameField, nameKey(rename.to), id);
  return twin ? `nama "${rename.to}" sudah dipakai ${table} ${twin}; tautan data akan tercampur` : null;
}

/** Terapkan nama baru ke semua anak relasi lunak. WAJIB dipanggil di dalam
 *  transaksi yang sama dengan PATCH induk. Tiap baris anak diaudit. */
export async function cascadeSoftRename(
  table: string,
  rename: SoftRename,
  audit: { actor: string; ip: string; parentId: string },
): Promise<number> {
  const key = nameKey(rename.from);
  /* Kalau masih ada induk lain bernama lama (nama kembar), anak tidak bisa
     dipastikan milik induk yang diganti - biarkan, tautan ke kembarannya tetap hidup. */
  if (await nameTwin(table, rename.nameField, key, audit.parentId)) return 0;
  const now = new Date().toISOString();
  let n = 0;
  for (const l of SOFT_REFS.filter((x) => x.target === table && x.nameField === rename.nameField)) {
    let rows: { id: string; data: string; updated_at: string }[];
    try {
      rows = await q<{ id: string; data: string; updated_at: string }>(`SELECT id, data, updated_at FROM ${l.child}`);
    } catch {
      continue;
    }
    for (const r of rows) {
      const d = parseData(r.data);
      if (nameKey(d[l.field]) !== key) continue;
      const before = d[l.field];
      d[l.field] = rename.to;
      await exec(`UPDATE ${l.child} SET data = ?, updated_at = ? WHERE id = ?`, [JSON.stringify(d), now, r.id]);
      await writeAudit({
        actor: audit.actor,
        action: "update",
        table: l.child,
        rowId: r.id,
        diff: { [l.field]: { before, after: rename.to }, _cascade: `${table} ${audit.parentId}` },
        ip: audit.ip,
      }, { required: true });
      n++;
    }
  }
  return n;
}

// Tabel yang dikecualikan dari delete-guard (tabel konfigurasi/admin).
const NO_DELETE_GUARD = new Set(["settings", "coa", "branches", "activities", "users"]);

function idColumn(table: string): string {
  return table === "wbs_by_project" || table === "team_by_project" ? "project_id" : "id";
}

/** Predikat kesetaraan field JSON `data.<field>`. Nama field WAJIB sudah
 *  divalidasi pemanggil (SAFE_FIELD) karena disisipkan ke path JSON. */
export const SAFE_FIELD = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
export function jsonEq(field: string): string {
  // MySQL JSON_EXTRACT mengembalikan string ber-quote → UNQUOTE dulu.
  // SQLite json_extract mengembalikan teks polos.
  if (getDialect() === "mysql") return `JSON_UNQUOTE(JSON_EXTRACT(data, '$.${field}')) = ?`;
  return `json_extract(data, '$.${field}') = ?`;
}

/** Validasi referensi data baris. Return pesan error atau null bila OK.
 *  `requireFilled` (CREATE non-seed): field `required` tidak boleh kosong. */
export async function checkRefs(
  table: string,
  data: Record<string, unknown>,
  opts: { requireFilled?: boolean } = {},
): Promise<string | null> {
  const defs = REFS[table];
  if (!defs) return null;
  for (const [field, def] of Object.entries(defs)) {
    if (def.target === "__name__") continue; // join nama — tidak ditegakkan
    const raw = data[field];
    const empty = raw === undefined || raw === null || String(raw).trim() === "";
    if (empty) {
      if (def.required && opts.requireFilled) return `${field} wajib diisi (relasi ke ${def.target})`;
      continue;
    }
    const value = String(raw);
    if ((def.allow ?? []).includes(value)) continue;
    let rows: unknown[];
    try {
      rows = await q(`SELECT ${idColumn(def.target)} FROM ${def.target} WHERE ${idColumn(def.target)} = ?`, [value]);
    } catch {
      continue; // tabel target belum ada (DB lama) — jangan blokir tulis
    }
    if (rows.length === 0) {
      return `${field} "${value}" tidak ada di ${def.target}`;
    }
  }
  // Jurnal: akun db/kr wajib terdaftar di CoA (id COA-<kode>).
  if (table === "journals") {
    for (const side of ["db", "kr"] as const) {
      const kode = String(data[side] ?? "");
      if (kode === "") continue;
      let rows: unknown[];
      try {
        rows = await q("SELECT id FROM coa WHERE id = ?", [`COA-${kode}`]);
      } catch {
        continue;
      }
      if (rows.length === 0) return `akun ${side} "${kode}" tidak ada di CoA`;
    }
  }
  return null;
}

/** Cari pemakai baris (table:id) di koleksi lain. Max 5 label "Tabel ID". */
export async function findUsages(table: string, id: string): Promise<string[]> {
  if (NO_DELETE_GUARD.has(table)) return [];
  const out: string[] = [];
  for (const [src, defs] of Object.entries(REFS)) {
    if (src === table) continue;
    for (const [field, def] of Object.entries(defs)) {
      if (def.target !== table || def.target === "__name__") continue;
      try {
        const rows = await q<{ id: string }>(`SELECT id FROM ${src} WHERE ${jsonEq(field)}`, [id]);
        for (const r of rows) {
          // Baris register Dokumen milik surat BoQ (DOC-<id>) dibuat & dihapus otomatis bersama suratnya.
          if (table === "boqDocs" && src === "documents" && r.id === `DOC-${id}`) continue;
          out.push(`${src} ${r.id}`);
          if (out.length >= 5) return out;
        }
      } catch {
        // tabel/kolom belum ada — abaikan
      }
    }
  }
  // WBS/team memakai project_id kolom (bukan JSON) — cek khusus proyek.
  if (table === "projects") {
    for (const t of ["wbs_by_project", "team_by_project"] as const) {
      try {
        const rows = await q<{ project_id: string }>(`SELECT project_id FROM ${t} WHERE project_id = ?`, [id]);
        for (const r of rows) {
          out.push(`${t} ${r.project_id}`);
          if (out.length >= 5) return out;
        }
      } catch {
        // abaikan
      }
    }
  }
  if (out.length < 5) out.push(...await softUsages(table, id, 5 - out.length));
  return out;
}
