/* service-flow-probe.ts — service proyek (F3-D-02, F3-J-04): wajib WBS, mulai
 * Diajukan, tidak bisa dikerjakan sebelum disetujui procurement, persetujuan
 * hanya lewat endpoint & hanya oleh procurement, biaya beda dari BoQ wajib alasan. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Service Flow Probe (F3-D-02) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenOf = (u: { id: string; username: string; role: string; token_version?: number }): string =>
    signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  const userOf = async (role: string) => (await q<{ id: string; username: string; role: string; token_version: number }>(
    "SELECT id, username, role, token_version FROM users WHERE role = ? LIMIT 1", [role],
  ))[0];

  const proyekUser = await userOf("proyek");
  if (!proyekUser) throw new Error("Butuh akun proyek hasil seed (npm run seed)");
  const project = (await q<{ id: string }>("SELECT id FROM projects LIMIT 1"))[0];
  if (!project) throw new Error("Butuh minimal satu proyek hasil seed");

  // Seed tidak punya akun procurement: buat sementara (hash palsu, tidak bisa login).
  const tag = Date.now().toString(36).toUpperCase();
  const procId = `USR-PROBE-${tag}`;
  await exec("INSERT INTO users (id, username, pass_hash, name, role, email) VALUES (?, ?, ?, ?, ?, ?)", [
    procId, `probe.proc.${tag}`.toLowerCase(), "x", "Probe Procurement", "procurement", "probe@example.invalid",
  ]);
  const boqId = `BOQ-PROBE${tag}`;
  await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
    boqId, "Samarinda", JSON.stringify({ projectId: project.id, item: "Probe overhaul", totalPrice: 5_000_000 }), new Date().toISOString(),
  ]);
  const created: string[] = [];

  try {
    const proyek = tokenOf(proyekUser);
    const proc = tokenOf({ id: procId, username: "probe", role: "procurement" });
    const auth = (t: string) => ({ authorization: `Bearer ${t}` });
    const create = (data: Record<string, unknown>) => app.inject({ method: "POST", url: "/api/services", headers: auth(proyek), payload: { data } });
    const patch = (id: string, data: Record<string, unknown>) => app.inject({ method: "PATCH", url: `/api/services/${id}`, headers: auth(proyek), payload: { data } });
    const approve = (t: string, id: string, approval: string, note?: string) => app.inject({
      method: "POST", url: `/api/services/${id}/approval`, headers: auth(t), payload: { approval, ...(note ? { note } : {}) },
    });
    const base = { projectId: project.id, date: "2026-10-10", type: "Repair", description: "Probe service", technician: "Probe", cost: 1_000_000 };

    const noWbs = await create(base);
    assert("service proyek tanpa WBS → 422", noWbs.statusCode === 422, noWbs.body);

    const ok1 = await create({ ...base, wbsTask: "Probe WBS", status: "In Progress", approval: "Disetujui" });
    const s1 = ok1.json().data as { id: string; data?: Record<string, unknown> } & Record<string, unknown>;
    const s1Data = (s1.data ?? s1) as Record<string, unknown>;
    if (s1?.id) created.push(s1.id);
    assert("service baru dipaksa Scheduled + Diajukan", ok1.statusCode === 201 && s1Data.status === "Scheduled" && s1Data.approval === "Diajukan", ok1.body);

    const early = await patch(s1.id, { status: "In Progress" });
    assert("dikerjakan sebelum disetujui → 422", early.statusCode === 422, early.body);
    const sneak = await patch(s1.id, { approval: "Disetujui" });
    assert("approval lewat CRUD → 422", sneak.statusCode === 422, sneak.body);

    const byProyek = await approve(proyek, s1.id, "Disetujui");
    assert("peran proyek menyetujui → 403", byProyek.statusCode === 403, byProyek.body);
    const byProc = await approve(proc, s1.id, "Disetujui");
    assert("procurement menyetujui → 200", byProc.statusCode === 200, byProc.body);
    const start = await patch(s1.id, { status: "In Progress" });
    assert("setelah disetujui boleh dikerjakan", start.statusCode === 200, start.body);
    const twice = await approve(proc, s1.id, "Ditolak", "x");
    assert("menolak yang sudah disetujui → 409", twice.statusCode === 409, twice.body);

    const ok2 = await create({ ...base, wbsTask: "Probe WBS" });
    const s2 = ok2.json().data as { id: string };
    created.push(s2.id);
    const rejNoNote = await approve(proc, s2.id, "Ditolak");
    assert("tolak tanpa alasan → 422", rejNoNote.statusCode === 422, rejNoNote.body);
    const rej = await approve(proc, s2.id, "Ditolak", "Biaya terlalu tinggi");
    assert("tolak dengan alasan → 200", rej.statusCode === 200, rej.body);
    const resubmit = await approve(proyek, s2.id, "Diajukan");
    assert("pengaju mengajukan ulang setelah ditolak → 200", resubmit.statusCode === 200, resubmit.body);

    const boqMismatch = await create({ ...base, wbsTask: "Probe WBS", boqRef: boqId, cost: 7_000_000 });
    assert("biaya beda dari BoQ tanpa alasan → 422", boqMismatch.statusCode === 422, boqMismatch.body);
    const boqReason = await create({ ...base, wbsTask: "Probe WBS", boqRef: boqId, cost: 7_000_000, costReason: "Tambahan suku cadang" });
    if (boqReason.statusCode === 201) created.push((boqReason.json().data as { id: string }).id);
    assert("biaya beda dari BoQ dengan alasan → 201", boqReason.statusCode === 201, boqReason.body);
    const boqSame = await create({ ...base, wbsTask: "Probe WBS", boqRef: boqId, cost: 5_000_000 });
    if (boqSame.statusCode === 201) created.push((boqSame.json().data as { id: string }).id);
    assert("biaya sama dengan BoQ → 201", boqSame.statusCode === 201, boqSame.body);
  } finally {
    for (const id of created) await exec("DELETE FROM services WHERE id = ?", [id]);
    await exec("DELETE FROM boq WHERE id = ?", [boqId]);
    await exec("DELETE FROM users WHERE id = ?", [procId]);
    for (const id of created) await exec("DELETE FROM audit_log WHERE row_id = ?", [id]);
  }

  console.log(`\n${passed}/${total} pemeriksaan alur service lolos.`);
  await app.close();
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  await closeDb();
});
