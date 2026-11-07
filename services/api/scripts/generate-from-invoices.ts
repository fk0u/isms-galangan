/* generate-from-invoices.ts — isi data master dari invoice yang sudah ada
 * (lanjutan #334: invoice diimpor dari Excel, tetapi klien/kapal/proyek kosong).
 *
 *   npm run generate:from-invoices              (dry-run)
 *   npm run generate:from-invoices -- --apply   (tulis, satu transaksi + audit_log)
 *
 * - clients : nama klien invoice yang belum terdaftar.
 * - vessels : satu kapal per nama kapal unik; owner = klien invoice pertama.
 * - projects: satu proyek per invoice (id PRJ-<id invoice>), nilai = jasa+material,
 *             biaya aktual = total "modal", pimpinan = pimpro, status Selesai
 *             (invoice terbit = pekerjaan sudah ditagih).
 * - subcontractors: label `modal[]` yang berupa nama orang (bukan pos biaya umum
 *             seperti Material/Karyawan); nilai kontrak = total modal ke orang itu.
 * - invoices: field `project` diisi id proyek bila masih kosong.
 * Idempoten: baris yang sudah ada (nama sama / id sama) dilewati. */
import { randomUUID } from "node:crypto";
import { closeDb, exec, q, withTx } from "../src/db.js";

type Data = Record<string, unknown>;
const APPLY = process.argv.includes("--apply");
const key = (v: unknown): string => String(v ?? "").trim().replace(/\s+/g, " ").toUpperCase();

/** Jenis kapal dari awalan nama (TB → Tugboat, BG → Barge, dst.). */
export function vesselType(name: string): string {
  const p = key(name).split(" ")[0];
  return ({ TB: "Tugboat", BG: "Barge", SPOB: "SPOB", LCT: "LCT", KM: "Kapal Motor", MT: "Tanker", AWB: "Accommodation Work Barge" } as Record<string, string>)[p] ?? "";
}

/** Label modal yang merupakan pos biaya, bukan subkon. */
const BUKAN_SUBKON = new Set(["MATERIAL", "KARYAWAN & LISTRIK", "KARYAWAN", "LISTRIK", "VENDOR LUAR", "FEE", ""]);

/** Subkon dari label modal[]: satu baris per nama, kontrak = total, active = jumlah invoice. */
export function planSubkon(invoices: Array<{ data: Data }>, existing: Set<string>): Data[] {
  const agg = new Map<string, Data & { contract: number; active: number }>();
  for (const { data: d } of invoices) {
    for (const m of Array.isArray(d.modal) ? (d.modal as Data[]) : []) {
      const name = String(m.label ?? "").trim().replace(/\s+/g, " ");
      if (BUKAN_SUBKON.has(key(name)) || existing.has(key(name))) continue;
      const row = agg.get(key(name)) ?? { name, services: "Borongan (dari modal invoice)", rating: 0, active: 0, contract: 0, status: "Aktif", k3: "" };
      row.contract += Math.round(Number(m.amount) || 0);
      row.active += 1;
      agg.set(key(name), row);
    }
  }
  return [...agg.values()];
}

export interface Plan { clients: Data[]; vessels: Data[]; projects: Array<{ id: string; data: Data }>; links: Array<{ id: string; project: string }> }

/** Rencana murni dari invoice + nama klien/kapal & id proyek yang sudah ada. */
export function plan(invoices: Array<{ id: string; data: Data }>, clientNames: Set<string>, vesselNames: Set<string>, projectIds: Set<string>): Plan {
  const out: Plan = { clients: [], vessels: [], projects: [], links: [] };
  const sorted = [...invoices].sort((a, b) => String(a.data.date ?? "").localeCompare(String(b.data.date ?? "")));
  for (const { id, data: d } of sorted) {
    const client = String(d.client ?? "").trim().replace(/\s+/g, " ");
    const vessel = String(d.vessel ?? "").trim().replace(/\s+/g, " ");
    if (client && !clientNames.has(key(client))) {
      clientNames.add(key(client));
      out.clients.push({ name: client, saldoAwal: 0, saldoAkhir: 0 });
    }
    if (vessel && !vesselNames.has(key(vessel))) {
      vesselNames.add(key(vessel));
      out.vessels.push({
        name: vessel, type: vesselType(vessel), owner: client, flag: "Indonesia", status: "Dalam Operasi", certificates: [],
        history: [{ date: String(d.date ?? ""), event: `Didaftarkan dari invoice ${String(d.noInv ?? id)}`, type: "Registrasi" }],
      });
    }
    const pid = `PRJ-${id}`;
    // Invoice yang sudah punya proyek tidak dibuatkan proyek baru.
    if (!vessel || !client || (String(d.project ?? "").trim() && d.project !== "-")) continue;
    if (!projectIds.has(pid)) {
      projectIds.add(pid);
      const modal = Array.isArray(d.modal) ? (d.modal as Data[]) : [];
      out.projects.push({ id: pid, data: {
        vessel, client, type: "Repair", status: "Selesai", start: String(d.date ?? ""), end: String(d.date ?? ""), progress: 100,
        budget: Math.round(Number(d.amount) || Number(d.grandTotal) || 0),
        // Impor Excel menyimpan rincian `modal[]`; invoice dari UI memakai `modalTotal`.
        actual: Math.round(Number(d.modalTotal) || modal.reduce((s, m) => s + (Number(m.amount) || 0), 0)),
        manager: String(d.pimpro ?? ""), scope: [], source: `invoice ${String(d.noInv ?? id)}`,
      } });
    }
    out.links.push({ id, project: pid });
  }
  return out;
}

if (process.argv[1]?.endsWith("generate-from-invoices.ts")) {
  await (APPLY ? withTx(run) : run());
  await closeDb();
}

async function run(): Promise<void> {
  const P = (s: string): Data => JSON.parse(s) as Data;
  const invoices = (await q<{ id: string; data: string }>("SELECT id, data FROM invoices")).map((r) => ({ id: r.id, data: P(r.data) }));
  const clients = new Set((await q<{ data: string }>("SELECT data FROM clients")).map((r) => key(P(r.data).name)));
  const vessels = new Set((await q<{ data: string }>("SELECT data FROM vessels")).map((r) => key(P(r.data).name)));
  const projects = new Set((await q<{ id: string }>("SELECT id FROM projects")).map((r) => r.id));
  const p = plan(invoices, clients, vessels, projects);
  const subkon = planSubkon(invoices, new Set((await q<{ data: string }>("SELECT data FROM subcontractors")).map((r) => key(P(r.data).name))));
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — klien baru ${p.clients.length}, kapal baru ${p.vessels.length}, proyek baru ${p.projects.length}, subkon baru ${subkon.length}, invoice ditautkan ${p.links.length}`);
  if (!APPLY) return;
  const now = new Date().toISOString();
  const branch = "Samarinda";
  const audit = (table: string, id: string, action: string, diff: unknown) =>
    exec("INSERT INTO audit_log (id, actor, action, table_name, row_id, diff, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), "generate:from-invoices", action, table, id, JSON.stringify(diff), "-", now]);
  const insert = async (table: string, id: string, data: Data) => {
    const row = { ...data, createdAt: now, updatedAt: now };
    await exec(`INSERT INTO ${table} (id, branch, data, updated_at) VALUES (?, ?, ?, ?)`, [id, branch, JSON.stringify(row), now]);
    await audit(table, id, "create", { after: row });
  };
  const nid = (prefix: string) => `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  for (const c of p.clients) await insert("clients", nid("C"), c);
  for (const v of p.vessels) await insert("vessels", nid("V"), v);
  for (const s of subkon) await insert("subcontractors", nid("SUB"), s);
  for (const pr of p.projects) await insert("projects", pr.id, pr.data);
  for (const l of p.links) {
    const [r] = await q<{ data: string }>("SELECT data FROM invoices WHERE id = ?", [l.id]);
    const d = { ...P(r.data), project: l.project, updatedAt: now };
    await exec("UPDATE invoices SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(d), now, l.id]);
    await audit("invoices", l.id, "update", { before: { project: P(r.data).project ?? null }, after: { project: l.project } });
  }
  console.log("Selesai.");
}
