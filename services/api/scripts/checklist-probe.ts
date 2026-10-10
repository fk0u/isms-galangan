/* checklist-probe.ts — F3-K-02: skor kuesioner dihitung server
 * (Σ nilai ternormalisasi × bobot / Σ bobot × 100), skor kiriman klien diabaikan. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { scoreChecklist } from "../src/scoring.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Checklist Probe (F3-K-02) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const template = { sections: [{ title: "A", items: [
    { id: "a", type: "ya_tidak", weight: 2 }, { id: "b", type: "skala_1_5", weight: 1 },
    { id: "c", type: "pilihan", weight: 1, options: [{ label: "Baik", score: 1 }, { label: "Cukup", score: 0.5 }, { label: "Buruk", score: 0 }] },
    { id: "d", type: "teks", weight: 5 },
  ] }] };
  assert("semua sempurna = 100", scoreChecklist(template, { a: "ya", b: 5, c: "Baik" }).score === 100);
  assert("ya(2) + skala 3 (0,5×1) + Cukup (0,5×1) = 3/4 = 75", scoreChecklist(template, { a: "ya", b: 3, c: "Cukup" }).score === 75);
  assert("butir 'na' keluar dari penyebut", scoreChecklist(template, { a: "tidak", b: "na", c: "Baik" }).score === 33.3);
  assert("tanpa jawaban = 0", scoreChecklist(template, {}).score === 0);

  const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1"))[0];
  const tok = signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  const h = { authorization: `Bearer ${tok}` };
  const ids: Array<[string, string]> = [];
  try {
    const empty = await app.inject({ method: "POST", url: "/api/checklistTemplates", headers: h, payload: { data: { name: "Kosong", scope: "QC", sections: [] } } });
    assert("template tanpa butir → 422", empty.statusCode === 422, empty.body);
    const t = await app.inject({ method: "POST", url: "/api/checklistTemplates", headers: h, payload: { data: { name: "Probe QC", scope: "QC", target: "pekerjaan", ...template } } });
    const tid = (t.json().data as { id: string }).id;
    ids.push(["checklistTemplates", tid]);
    assert("template valid → 201", t.statusCode === 201, t.body);
    const r = await app.inject({ method: "POST", url: "/api/checklistResponses", headers: h, payload: { data: { templateId: tid, answers: { a: "ya", b: 3, c: "Cukup" }, score: 100 } } });
    const rd = r.json().data as { id: string; data?: { score: number }; score?: number };
    ids.push(["checklistResponses", rd.id]);
    assert("skor dihitung server (75), kiriman klien 100 diabaikan", r.statusCode === 201 && (rd.data?.score ?? rd.score) === 75, r.body);
    const bad = await app.inject({ method: "POST", url: "/api/checklistResponses", headers: h, payload: { data: { templateId: "CLT-TIDAK-ADA", answers: {} } } });
    assert("template tak dikenal → 422", bad.statusCode === 422, bad.body);
  } finally {
    for (const [table, id] of ids.reverse()) { await exec(`DELETE FROM ${table} WHERE id = ?`, [id]); await exec("DELETE FROM audit_log WHERE row_id = ?", [id]); }
  }
  console.log(`\n${passed}/${total} pemeriksaan kuesioner lolos.`);
  await app.close();
  await closeDb();
}
main().catch(async (err) => { console.error(err); process.exitCode = 1; await closeDb(); });
