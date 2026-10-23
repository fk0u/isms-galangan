/* Akses modul per role (notulen 23 Okt, #289 & #287).
 *
 * Izin koleksi (policy.ts) menjaga DATA; lapisan ini menjaga MODUL/menu yang
 * boleh dibuka - mis. Purchasing tetap membaca data proyek untuk memilih
 * proyek di PO, tetapi tidak boleh membuka Manajemen/Monitoring Proyek.
 * Kunci modul = segmen path menu web. Default di bawah mengikuti notulen;
 * akun developer bisa menimpanya per role lewat setting SET-RBAC (PUT /api/rbac). */
import { q } from "./db.js";
import { normalizeRole, ROLES, type Role } from "./policy.js";

export const MODULE_KEYS = [
  "dashboard", "crm", "procurement", "keuangan", "proyek", "monitoring", "drydock", "inventori",
  "equipment", "subkontraktor", "qc", "sdm", "absensi", "payroll", "kapal", "dokumen",
  "analytics", "laporan", "notifikasi", "pengaturan", "audit",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const FIN_TABS = ["Akun", "Aset", "Invoice", "Piutang (AR)", "Hutang (AP)", "Jadwal Bayar", "Kas & Bank", "Jurnal", "Buku Besar", "Laba Rugi", "Neraca", "Project P&L", "Pajak", "Payroll"] as const;

export interface ModuleAccess {
  /** Modul yang TIDAK boleh dibuka role ini. */
  deny: ModuleKey[];
  /** Tab Keuangan yang boleh dibuka; null = semua. */
  finTabs: string[] | null;
}

const EXEC_ONLY: ModuleKey[] = ["analytics", "laporan"];

export const DEFAULT_ACCESS: Record<Role, ModuleAccess> = Object.fromEntries(ROLES.map((r) => {
  // Analisis & Laporan hanya Direktur (dan developer pengelola sistem).
  const deny: ModuleKey[] = r === "direktur" || r === "developer" ? [] : [...EXEC_ONLY];
  let finTabs: string[] | null = null;
  if (r === "procurement" || r === "gudang") deny.push("proyek", "monitoring");
  if (r === "finance" || r === "pajak") deny.push("monitoring", "payroll"); // #281: Keuangan membayar lewat tab Payroll di Keuangan, bukan modul HR.
  if (r === "commercial") {
    deny.push("sdm", "absensi", "payroll", "qc", "procurement", "inventori", "equipment");
    finTabs = ["Invoice"];
  }
  return [r, { deny, finTabs }];
})) as Record<Role, ModuleAccess>;

type Override = Partial<Record<Role, Partial<ModuleAccess>>>;

function clean(raw: unknown): Override {
  const out: Override = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [role, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!(ROLES as readonly string[]).includes(role) || !v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    const entry: Partial<ModuleAccess> = {};
    if (Array.isArray(o.deny)) entry.deny = o.deny.filter((k): k is ModuleKey => (MODULE_KEYS as readonly string[]).includes(String(k)));
    if (o.finTabs === null) entry.finTabs = null;
    else if (Array.isArray(o.finTabs)) entry.finTabs = o.finTabs.map(String).filter((t) => (FIN_TABS as readonly string[]).includes(t));
    out[role as Role] = entry;
  }
  return out;
}

export async function loadOverride(): Promise<Override> {
  try {
    const rows = await q<{ data: string }>("SELECT data FROM settings WHERE id = ?", ["SET-RBAC"]);
    if (!rows[0]) return {};
    let v: unknown = (JSON.parse(rows[0].data) as { value?: unknown }).value;
    if (typeof v === "string") v = JSON.parse(v);
    return clean(v);
  } catch {
    return {};
  }
}

/** Akses efektif: default notulen ditimpa isian developer (per role, per kunci). */
export async function moduleAccessFor(role: unknown): Promise<ModuleAccess> {
  const r = normalizeRole(role);
  const base = DEFAULT_ACCESS[r];
  // Developer selalu bisa membuka semua modul agar tidak mengunci dirinya sendiri.
  if (r === "developer") return { deny: [], finTabs: null };
  const o = (await loadOverride())[r] ?? {};
  return { deny: o.deny ?? base.deny, finTabs: o.finTabs !== undefined ? o.finTabs : base.finTabs };
}

export async function canOpenModule(role: unknown, key: ModuleKey): Promise<boolean> {
  return !(await moduleAccessFor(role)).deny.includes(key);
}

export { clean as cleanOverride };

/* #288: dokumen hanya untuk role yang terkait. Jenis dokumen → modul pemiliknya;
   role melihat dokumen bila boleh membuka SALAH SATU modul itu. Prosedur (SOP)
   dan jenis lain/tak dikenal tetap untuk semua. */
export const DOC_TYPE_MODULES: Record<string, ModuleKey[]> = {
  Kontrak: ["crm", "proyek", "keuangan"],
  Penawaran: ["crm"],
  Invoice: ["keuangan", "crm"],
  NCR: ["qc", "proyek"],
  Sertifikat: ["kapal", "qc", "equipment"],
  Drawing: ["proyek", "drydock", "qc"],
  Laporan: ["laporan", "proyek"],
  "Dock Space": ["drydock", "proyek"],
  "Surat Jalan": ["inventori", "procurement"],
  "Tanda Terima": ["inventori", "procurement"],
  BoQ: ["proyek", "crm"],
};

/** Jenis dokumen yang TIDAK boleh dilihat role ini (kosong = semua boleh). */
export async function hiddenDocTypes(role: unknown): Promise<string[]> {
  const { deny } = await moduleAccessFor(role);
  return Object.entries(DOC_TYPE_MODULES).filter(([, mods]) => mods.every((m) => deny.includes(m))).map(([t]) => t);
}
