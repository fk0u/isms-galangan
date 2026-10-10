/* events-probe.ts — F4-03: tulis sukses memancarkan event SSE berisi nama
 * koleksi; tanpa token ditolak; koleksi yang tak boleh dibaca peran tidak dikirim. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { q, exec, closeDb } from "../src/db.js";

async function main(): Promise<void> {
  console.log("=== ISMS Events Probe (F4-03) ===");
  const app = await buildApp();
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
  let passed = 0;
  let total = 0;
  const assert = (name: string, cond: boolean, detail = ""): void => {
    total += 1;
    if (cond) { passed += 1; console.log(`[PASS] ${name}`); } else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  const tokenFor = async (role: string): Promise<string> => {
    const u = (await q<{ id: string; username: string; role: string; token_version: number }>("SELECT id, username, role, token_version FROM users WHERE role = ? AND is_active = 1 LIMIT 1", [role]))[0];
    return signToken({ id: u.id, username: u.username, role: u.role, branch: "SEMUA", v: u.token_version ?? 0 });
  };
  /** Buka stream, jalankan aksi, kumpulkan nama tabel selama `ms`. */
  const listen = async (tok: string, act: () => Promise<void>, ms = 1200): Promise<string[]> => {
    const ctl = new AbortController();
    const res = await fetch(`${base}/api/events`, { headers: { authorization: `Bearer ${tok}` }, signal: ctl.signal });
    const reader = res.body!.getReader();
    const seen: string[] = [];
    const pump = (async () => {
      const dec = new TextDecoder();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ")) seen.push(...(JSON.parse(line.slice(6)) as { tables: string[] }).tables);
          }
        }
      } catch { /* abort */ }
    })();
    await act();
    await new Promise((r) => setTimeout(r, ms));
    ctl.abort();
    await pump;
    return seen;
  };
  const id = `VND-EVT-${Date.now().toString(36).toUpperCase()}`;
  const write = (): Promise<void> => exec("INSERT INTO vendors (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [id, "Samarinda", JSON.stringify({ name: "Probe Vendor" }), new Date().toISOString()]).then(() => undefined);
  try {
    const anon = await fetch(`${base}/api/events`);
    assert("tanpa token → 401", anon.status === 401, String(anon.status));
    const dir = await listen(await tokenFor("direktur"), write);
    assert("direktur menerima event 'vendors' setelah tulis", dir.includes("vendors"), JSON.stringify(dir));
    assert("tabel internal (audit_log) tidak pernah dikirim", !dir.includes("audit_log"), JSON.stringify(dir));
    // Peran lapangan tidak punya izin baca payroll → event payroll tidak boleh bocor.
    const payId = `PAY-EVT-${Date.now().toString(36).toUpperCase()}`;
    const mech = await listen(await tokenFor("mekanik"), async () => {
      await exec("INSERT INTO payroll (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [payId, "Samarinda", "{}", new Date().toISOString()]);
      await exec("DELETE FROM payroll WHERE id = ?", [payId]);
    });
    assert("mekanik tidak menerima event 'payroll'", !mech.includes("payroll"), JSON.stringify(mech));
  } finally {
    await exec("DELETE FROM vendors WHERE id = ?", [id]);
  }
  console.log(`\n${passed}/${total} pemeriksaan events lolos.`);
  await app.close();
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
