import type { FastifyReply, FastifyRequest } from "fastify";
import { fail } from "./envelope.js";
import type { ModuleAccess, ModuleKey } from "./moduleAccess.js";

// Daftar peran resmi sistem ISMS sesuai ADR-0004 & keputusan Q2 (7 Okt 2026).
export const ROLES = [
  "developer",
  "direktur",
  "manager",
  "finance",
  "hr",
  "procurement",
  "gudang",
  "proyek",
  "mekanik",
  "qc",
  "subkon",
  "equipment",
  "drydock",
  // Notulen 23 Okt (#289): Commercial (CRM/penawaran/invoice) dan Pajak.
  "commercial",
  "pajak",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

export type Action = "r" | "w" | "d";

// Pangkat peran untuk hierarki manajemen pengguna (F2-03)
export const ROLE_RANK: Record<Role, number> = {
  developer: 100,
  direktur: 90,
  manager: 70,
  finance: 50,
  hr: 50,
  procurement: 50,
  gudang: 50,
  proyek: 50,
  mekanik: 50,
  qc: 50,
  subkon: 50,
  equipment: 50,
  drydock: 50,
  commercial: 50,
  pajak: 50,
  viewer: 10,
};

/**
 * Normalisasi string peran (termasuk peran legacy teks bebas) ke enum Role.
 * Default fail-closed: peran tidak dikenal dipetakan ke "viewer".
 */
export function normalizeRole(raw: unknown): Role {
  const r = String(raw ?? "").toLowerCase().trim();
  if (ROLES.includes(r as Role)) return r as Role;
  if (r === "admin" || r === "direksi" || r.includes("direktur")) return "direktur";
  if (r.includes("developer") || r === "dev") return "developer";
  if (r.includes("manager") || r.includes("manajer")) return "manager";
  if (/qc|hse|inspector|quality|safety/i.test(r)) return "qc";
  if (/gudang|warehouse|inventory|logistik/i.test(r)) return "gudang";
  if (/procurement|purchasing|pengadaan/i.test(r)) return "procurement";
  if (/pajak|tax/i.test(r)) return "pajak";
  if (/finance|keuangan|account/i.test(r)) return "finance";
  if (/\bhr\b|sdm|payroll|absensi|hc\b|personalia/i.test(r)) return "hr";
  if (/sales|crm|marketing|commercial|komersial/i.test(r)) return "commercial";
  if (/subkon|subcontractor/i.test(r)) return "subkon";
  if (/drydock|dock|docking|galangan/i.test(r)) return "drydock";
  if (/equipment|alat|utility/i.test(r)) return "equipment";
  if (/mekanik|mechanic|bengkel/i.test(r)) return "mekanik";
  if (/project|proyek|foreman|tim\b|teknisi|engineer|produksi|operation/i.test(r)) return "proyek";
  if (/viewer|client|tamu/i.test(r)) return "viewer";
  return "viewer";
}

export function roleRank(role: unknown): number {
  const norm = normalizeRole(role);
  return ROLE_RANK[norm] ?? 10;
}

const RWD: Action[] = ["r", "w", "d"];
const RW: Action[] = ["r", "w"];
const R_ONLY: Action[] = ["r"];

// Semua koleksi envelope standar ISMS (57 koleksi)
const ALL_ENVELOPE_COLLECTIONS = [
  "projects", "vessels", "drydocks", "dockSlots", "inventory", "movements",
  "equipment", "bookings", "subcontractors", "workOrders", "termins",
  "employees", "invoices", "payables", "ncr", "incidents", "inspections",
  "purchaseOrders", "requisitions", "vendors", "quotations", "clients",
  "documents", "surveys", "activities", "services", "spareparts", "boq", "boqDocs", "materialRequests", "checklistTemplates", "checklistResponses", "bomItems", "rabItems",
  "branches", "attendance", "payroll", "taxPeriods", "rfqs", "changeOrders",
  "risks", "leaves", "trainings", "timesheets", "drawings", "toolbox",
  "warranties", "calibrations", "communications", "contracts", "bast",
  "trials", "requests", "clientPos", "walks", "auditPlans", "warehouses", "maintenances", "letters", "settings", "coa", "journals", "assets",
  "wbs_by_project", "team_by_project",
];

// Koleksi operasional non-sensitif
const ALL_OPERATIONAL_COLLECTIONS = ALL_ENVELOPE_COLLECTIONS.filter(
  (c) => !["payroll", "employees", "journals", "coa", "settings", "invoices", "payables", "taxPeriods"].includes(c),
);

/** Pemetaan setiap koleksi sistem ISMS ke modul induknya */
export const COLLECTION_TO_MODULE: Record<string, ModuleKey> = {
  // CRM
  clients: "crm",
  quotations: "crm",
  contracts: "crm",
  termins: "crm",
  clientPos: "crm",

  // Procurement
  purchaseOrders: "procurement",
  requisitions: "procurement",
  vendors: "procurement",
  rfqs: "procurement",

  // Keuangan
  invoices: "keuangan",
  payables: "keuangan",
  journals: "keuangan",
  taxPeriods: "keuangan",
  coa: "keuangan",
  assets: "keuangan",
  rabItems: "keuangan",

  // Proyek
  projects: "proyek",
  boq: "proyek",
  boqDocs: "proyek",
  materialRequests: "proyek",
  changeOrders: "proyek",
  risks: "proyek",
  drawings: "proyek",
  bast: "proyek",
  trials: "proyek",
  requests: "proyek",
  wbs_by_project: "proyek",
  team_by_project: "proyek",

  // Monitoring
  activities: "monitoring",
  timesheets: "monitoring",

  // Drydock
  drydocks: "drydock",
  dockSlots: "drydock",
  surveys: "drydock",

  // Inventori
  inventory: "inventori",
  movements: "inventori",
  warehouses: "inventori",
  spareparts: "inventori",
  bomItems: "inventori",

  // Equipment
  equipment: "equipment",
  bookings: "equipment",
  maintenances: "equipment",
  calibrations: "equipment",

  // Subkontraktor
  subcontractors: "subkontraktor",
  workOrders: "subkontraktor",

  // QC
  ncr: "qc",
  incidents: "qc",
  inspections: "qc",
  checklistTemplates: "qc",
  checklistResponses: "qc",
  toolbox: "qc",
  warranties: "qc",
  walks: "qc",
  auditPlans: "qc",

  // SDM
  employees: "sdm",
  leaves: "sdm",
  trainings: "sdm",

  // Absensi
  attendance: "absensi",

  // Payroll
  payroll: "payroll",

  // Kapal
  vessels: "kapal",
  services: "kapal",

  // Dokumen
  documents: "dokumen",
  letters: "dokumen",

  // Pengaturan & Sistem
  settings: "pengaturan",
  branches: "pengaturan",
  communications: "pengaturan",
  users: "pengaturan",

  // Audit
  audit: "audit",
};

function makeDeveloperMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {};
  for (const c of ALL_ENVELOPE_COLLECTIONS) {
    m[c] = [...RWD];
  }
  m.users = [...RWD];
  m.audit = [...R_ONLY];
  return m;
}

function makeDirekturMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {};
  for (const c of ALL_ENVELOPE_COLLECTIONS) {
    m[c] = [...RWD];
  }
  m.users = [...RWD];
  m.audit = [...R_ONLY];
  return m;
}

function makeManagerMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {};
  // Semua operasional dapat dibaca, ditulis, dan dihapus
  for (const c of ALL_OPERATIONAL_COLLECTIONS) {
    m[c] = [...RWD];
  }
  // Keuangan dibaca saja (Q2: "Keuangan: finance, direktur, manager (baca)")
  m.invoices = [...R_ONLY];
  m.payables = [...R_ONLY];
  m.journals = [...R_ONLY];
  m.taxPeriods = [...R_ONLY];
  m.settings = [...R_ONLY];
  // Manajemen pengguna (terbatas rank)
  m.users = [...RW];
  // payroll, employees, coa, audit TERTUTUP untuk manager
  return m;
}

function makeFinanceMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    invoices: [...RWD],
    payables: [...RWD],
    journals: [...RWD],
    taxPeriods: [...RWD],
    assets: [...RWD],
    coa: [...R_ONLY],
    documents: [...RWD],
    activities: [...RW],
    branches: [...R_ONLY],
    purchaseOrders: [...R_ONLY],
    requisitions: [...R_ONLY],
    vendors: [...R_ONLY],
    rfqs: [...R_ONLY],
    projects: [...R_ONLY],
    clients: [...R_ONLY],
    quotations: [...R_ONLY],
    contracts: [...R_ONLY],
    termins: [...R_ONLY],
    // #281: membayar gaji; field yang boleh diubah dibatasi payrollGuard.ts.
    payroll: [...RW],
    employees: [...RW],
    // #285: RAB belanja rutin dikelola Keuangan.
    rabItems: [...RWD],
  };
  return m;
}

function makeHrMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    employees: [...RWD],
    attendance: [...RWD],
    payroll: [...RWD],
    leaves: [...RWD],
    trainings: [...RWD],
    timesheets: [...RWD],
    letters: [...RWD],
    documents: [...RWD],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeProcurementMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    bomItems: [...RW],
    requisitions: [...RWD],
    materialRequests: [...R_ONLY],
    services: [...R_ONLY],
    // F3-I-04: procurement penerbit/pengubah SPK & termin subkon.
    workOrders: [...RW],
    subcontractors: [...R_ONLY],
    termins: [...RW],
    rfqs: [...RWD],
    purchaseOrders: [...RWD],
    vendors: [...RWD],
    documents: [...RWD],
    inventory: [...R_ONLY],
    projects: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeGudangMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    bomItems: [...RWD],
    inventory: [...RWD],
    movements: [...RWD],
    materialRequests: [...R_ONLY],
    warehouses: [...RWD],
    documents: [...RWD],
    purchaseOrders: [...R_ONLY],
    requisitions: [...R_ONLY],
    equipment: [...R_ONLY],
    projects: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeProyekMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    bomItems: [...RWD],
    projects: [...RWD],
    vessels: [...RWD],
    workOrders: [...RWD],
    wbs_by_project: [...RWD],
    team_by_project: [...RWD],
    dockSlots: [...RWD],
    documents: [...RWD],
    services: [...RWD],
    spareparts: [...RWD],
    boq: [...RWD],
    boqDocs: [...RWD],
    materialRequests: [...R_ONLY],
    requisitions: [...R_ONLY],
    surveys: [...RWD],
    trials: [...RWD],
    warranties: [...RWD],
    bast: [...RWD],
    changeOrders: [...RWD],
    risks: [...RWD],
    drawings: [...RWD],
    inventory: [...R_ONLY],
    equipment: [...R_ONLY],
    subcontractors: [...R_ONLY],
    clients: [...R_ONLY],
    quotations: [...R_ONLY],
    contracts: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeMekanikMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    bomItems: [...R_ONLY],
    equipment: [...RWD],
    calibrations: [...RWD],
    maintenances: [...RWD],
    movements: [...RWD],
    materialRequests: [...R_ONLY],
    documents: [...RWD],
    inventory: [...R_ONLY],
    projects: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeQcMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    ncr: [...RWD],
    incidents: [...RWD],
    inspections: [...RWD],
    checklistTemplates: [...RWD],
    checklistResponses: [...RWD],
    wbs_by_project: [...R_ONLY],
    drawings: [...RWD],
    toolbox: [...RWD],
    calibrations: [...RWD],
    documents: [...RWD],
    walks: [...RWD],
    auditPlans: [...RWD],
    maintenances: [...RWD],
    projects: [...R_ONLY],
    vessels: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeSubkonMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    subcontractors: [...RWD],
    workOrders: [...RWD],
    termins: [...RWD],
    timesheets: [...RWD],
    documents: [...RWD],
    projects: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeEquipmentMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    equipment: [...RWD],
    bookings: [...RWD],
    calibrations: [...RWD],
    documents: [...RWD],
    maintenances: [...RWD],
    movements: [...RWD],
    inventory: [...RWD],
    projects: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

function makeDrydockMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    drydocks: [...RWD],
    dockSlots: [...RWD],
    vessels: [...RWD],
    bookings: [...RWD],
    documents: [...RWD],
    projects: [...R_ONLY],
    branches: [...R_ONLY],
    activities: [...RW],
  };
  return m;
}

/* Commercial (#289): CRM, penawaran, kontrak, dan invoice. Modul lain cukup
   baca data rujukan (proyek, kapal) untuk mengisi form. */
function makeCommercialMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {};
  for (const c of ["clients", "quotations", "requests", "communications", "contracts", "clientPos", "surveys"]) m[c] = [...RWD];
  m.invoices = [...RW];
  m.documents = [...RW];
  m.activities = [...RW];
  for (const c of ["projects", "vessels", "branches", "termins", "boq", "boqDocs"]) m[c] = [...R_ONLY];
  return m;
}

/* Pajak (#289): sama dengan Finance (penuh di Keuangan, modul bernilai uang
   lain baca saja) + boleh mengubah setting bergrup "Pajak" (dicek di CRUD). */
function makePajakMatrix(): Record<string, Action[]> {
  return { ...makeFinanceMatrix(), settings: [...RW] };
}

function makeViewerMatrix(): Record<string, Action[]> {
  const m: Record<string, Action[]> = {
    projects: [...R_ONLY],
    vessels: [...R_ONLY],
    documents: [...R_ONLY],
    drawings: [...R_ONLY],
    surveys: [...R_ONLY],
    trials: [...R_ONLY],
    warranties: [...R_ONLY],
    bast: [...R_ONLY],
    changeOrders: [...R_ONLY],
    activities: [...R_ONLY],
    branches: [...R_ONLY],
  };
  return m;
}

export const MATRIX: Record<Role, Record<string, Action[]>> = {
  developer: makeDeveloperMatrix(),
  direktur: makeDirekturMatrix(),
  manager: makeManagerMatrix(),
  finance: makeFinanceMatrix(),
  hr: makeHrMatrix(),
  procurement: makeProcurementMatrix(),
  gudang: makeGudangMatrix(),
  proyek: makeProyekMatrix(),
  mekanik: makeMekanikMatrix(),
  qc: makeQcMatrix(),
  subkon: makeSubkonMatrix(),
  equipment: makeEquipmentMatrix(),
  drydock: makeDrydockMatrix(),
  commercial: makeCommercialMatrix(),
  pajak: makePajakMatrix(),
  viewer: makeViewerMatrix(),
};

/**
 * Mengecek apakah peran memiliki izin tertentu pada koleksi.
 */
export function can(role: unknown, collection: string, action: Action, moduleAccess?: ModuleAccess): boolean {
  const r = normalizeRole(role);
  if (r === "developer") return true;
  const perms = permissionsFor(r, moduleAccess);
  const acts = perms[collection];
  if (!acts) return false;
  return acts.includes(action);
}

/**
 * Mengembalikan seluruh peta izin untuk peran yang diberikan (untuk dikirim ke /api/auth/me).
 * Bila moduleAccess diberikan, izin per koleksi disesuaikan dengan tingkat akses modul (crud/view/none).
 */
export function permissionsFor(role: unknown, moduleAccess?: ModuleAccess): Record<string, Action[]> {
  const r = normalizeRole(role);
  const base = MATRIX[r] ?? {};
  if (r === "developer") return base;

  if (!moduleAccess?.levels) {
    return base;
  }

  const effective: Record<string, Action[]> = {};
  for (const [col, acts] of Object.entries(base)) {
    effective[col] = [...acts];
  }

  for (const [col, mod] of Object.entries(COLLECTION_TO_MODULE)) {
    const level = moduleAccess.levels[mod];
    if (!level) continue;

    const SENSITIVE_SYS_COLLECTIONS = ["settings", "users", "audit", "coa"];

    // Pengecualian domain: Keuangan mengelola payroll lewat tab Payroll di modul Keuangan (#281)
    if (col === "payroll" && (r === "finance" || r === "pajak")) {
      const finLevel = moduleAccess.levels.keuangan ?? "crud";
      if (finLevel === "none") {
        effective[col] = [];
      } else if (finLevel === "view") {
        effective[col] = ["r"];
      } else {
        effective[col] = [...(base[col] ?? [])];
      }
      continue;
    }

    if (level === "none") {
      // Modul ditutup: hapus izin tulis/hapus. Bila base hanya memiliki izin baca referensi (["r"]),
      // pertahankan ["r"] untuk relasi lintas modul (mis. Procurement memilih project di PO),
      // namun bila peran memiliki "w" di base pada modul ini, cabut seluruh aksesnya.
      if (base[col] && base[col].length === 1 && base[col][0] === "r") {
        effective[col] = ["r"];
      } else {
        effective[col] = [];
      }
    } else if (level === "view") {
      // Modul hanya baca: jika peran diizinkan membaca koleksi ini di base, batasi ke ["r"]
      if (base[col] && base[col].includes("r")) {
        effective[col] = ["r"];
      } else {
        effective[col] = [];
      }
    } else if (level === "crud") {
      // CRUD: jika peran tidak memiliki akses di base, tetap kosong;
      // jika punya, izinkan RWD kecuali koleksi sensitif sistem
      if (!base[col] || base[col].length === 0) {
        effective[col] = [];
      } else if (SENSITIVE_SYS_COLLECTIONS.includes(col)) {
        effective[col] = [...base[col]];
      } else {
        effective[col] = ["r", "w", "d"];
      }
    }
  }

  return effective;
}

let _moduleAccessFor: ((role: unknown) => Promise<ModuleAccess>) | null = null;
async function resolveModuleAccess(role: unknown): Promise<ModuleAccess> {
  if (!_moduleAccessFor) {
    const mod = await import("./moduleAccess.js");
    _moduleAccessFor = mod.moduleAccessFor;
  }
  return _moduleAccessFor(role);
}

/**
 * Guard Fastify untuk memeriksa izin koleksi tertentu.
 */
export function requirePermission(collection: string, action: Action) {
  const actionLabel = action === "r" ? "membaca" : action === "w" ? "mengubah" : "menghapus";
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) {
      return reply.status(401).send({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    }
    const access = await resolveModuleAccess(req.user.role);
    if (!can(req.user.role, collection, action, access)) {
      return reply
        .status(403)
        .send(fail(`Peran ${req.user.role} tidak boleh ${actionLabel} ${collection}`, "FORBIDDEN"));
    }
  };
}

// Helper guard kompatibel untuk route yang sudah ada
export function requireCollectionWrite(collection: string) {
  return requirePermission(collection, "w");
}

export function requireCollectionRead(collection: string) {
  return requirePermission(collection, "r");
}

export function requireCollectionDelete(collection: string) {
  return requirePermission(collection, "d");
}

export function requireManageUsers() {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) {
      return reply.status(401).send({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    }
    const access = await resolveModuleAccess(req.user.role);
    if (!can(req.user.role, "users", "w", access)) {
      return reply.status(403).send(fail(`Peran ${req.user.role} tidak dapat mengelola pengguna`, "FORBIDDEN"));
    }
  };
}

export function requireSettingsWrite() {
  return requirePermission("settings", "w");
}

export function requireAuditRead() {
  return requirePermission("audit", "r");
}
