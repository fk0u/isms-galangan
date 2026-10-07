/**
 * tx-probe.ts — Verifikasi atomisitas helper withTx(fn) (F4-02 / Audit S-06).
 * Menguji commit sukses, rollback saat error, nested savepoints,
 * konkurensi paralel, dan penjalaran konteks AsyncLocalStorage.
 */

import { q, exec, withTx, closeDb, getDialect } from "../src/db.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${msg}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  }
}

async function main(): Promise<void> {
  console.log(`=== ISMS Database Transaction Probe (F4-02) [Dialect: ${getDialect()}] ===\n`);

  // Buat tabel pengujian sementara
  await exec("CREATE TABLE IF NOT EXISTS _tx_probe_test (id TEXT PRIMARY KEY, val INTEGER)");
  await exec("DELETE FROM _tx_probe_test");

  // 1. Commit Sukses: Semua tulis di dalam withTx tersimpan atomik
  const commitResult = await withTx(async (tx) => {
    const res1 = await tx.exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", ["row-1", 100]);
    const res2 = await tx.exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", ["row-2", 200]);
    assert(res1.changes === 1, "exec mengembalikan changes=1 untuk baris 1");
    assert(res2.changes === 1, "exec mengembalikan changes=1 untuk baris 2");
    return "done-1";
  });
  assert(commitResult === "done-1", "withTx mengembalikan nilai dari callback");

  const rowsAfterCommit = await q<{ id: string; val: number }>("SELECT id, val FROM _tx_probe_test ORDER BY id");
  assert(rowsAfterCommit.length === 2, "2 baris tersimpan setelah commit");
  assert(rowsAfterCommit[0].id === "row-1" && rowsAfterCommit[1].id === "row-2", "data baris cocok setelah commit");

  // 2. Rollback saat Error: Operasi sebelum lemparan error wajib dibatalkan
  let caught = false;
  try {
    await withTx(async (tx) => {
      await tx.exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", ["row-3", 300]);
      await tx.exec("UPDATE _tx_probe_test SET val = ? WHERE id = ?", [999, "row-1"]);
      throw new Error("Simulated transaction failure");
    });
  } catch (err) {
    caught = true;
    assert((err as Error).message === "Simulated transaction failure", "error diteruskan ke pemanggil");
  }
  assert(caught, "withTx melempar error saat callback gagal");

  const rowsAfterRollback = await q<{ id: string; val: number }>("SELECT id, val FROM _tx_probe_test ORDER BY id");
  assert(rowsAfterRollback.length === 2, "row-3 tidak tersimpan setelah rollback");
  assert(rowsAfterRollback[0].val === 100, "perubahan row-1 dibatalkan setelah rollback (nilai tetap 100)");

  // 3. Konteks Implisit AsyncLocalStorage: global q() dan exec() otomatis masuk transaksi
  await withTx(async () => {
    // Panggil fungsi tanpa parameter tx
    await exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", ["row-implicit", 400]);
    const inside = await q<{ id: string }>("SELECT id FROM _tx_probe_test WHERE id = ?", ["row-implicit"]);
    assert(inside.length === 1, "global q() dapat membaca data uncommitted di dalam transaksi aktif");
  });
  const rowsAfterImplicit = await q<{ id: string }>("SELECT id FROM _tx_probe_test WHERE id = ?", ["row-implicit"]);
  assert(rowsAfterImplicit.length === 1, "data dari global exec() di dalam withTx berhasil dicommit");

  // 4. Nested Transactions (Savepoint):
  // Inner transaksi gagal dan di-handle, outer tetap berhasil commit
  await withTx(async (tx) => {
    await tx.exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", ["row-outer", 500]);

    // Inner transaksi yang gagal ditangkap
    try {
      await withTx(async (innerTx) => {
        await innerTx.exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", ["row-inner-fail", 600]);
        throw new Error("Inner savepoint failure");
      });
    } catch {
      // Ditangani oleh outer
    }

    // Inner transaksi kedua yang sukses
    await withTx(async (innerTx2) => {
      await innerTx2.exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", ["row-inner-ok", 700]);
    });
  });

  const checkNested = await q<{ id: string }>("SELECT id FROM _tx_probe_test WHERE id LIKE 'row-outer%' OR id LIKE 'row-inner%' ORDER BY id");
  const nestedIds = checkNested.map((r) => r.id);
  assert(nestedIds.includes("row-outer"), "outer transaction berhasil dicommit");
  assert(!nestedIds.includes("row-inner-fail"), "inner transaction yang gagal di-rollback ke savepoint");
  assert(nestedIds.includes("row-inner-ok"), "inner transaction kedua berhasil dicommit");

  // 5. Konkurensi Paralel: Beberapa withTx async berjalan bersamaan tanpa tabrakan SQLite/MySQL
  const concurrentTasks = Array.from({ length: 5 }, (_, i) =>
    withTx(async (tx) => {
      const id = `concurrent-${i}`;
      await tx.exec("INSERT INTO _tx_probe_test (id, val) VALUES (?, ?)", [id, i]);
      // Simulasi delay async event-loop
      await new Promise((resolve) => setTimeout(resolve, 10));
      await tx.exec("UPDATE _tx_probe_test SET val = val + 10 WHERE id = ?", [id]);
      return id;
    })
  );

  const results = await Promise.all(concurrentTasks);
  assert(results.length === 5, "5 transaksi paralel selesai seluruhnya");

  const concurrentRows = await q<{ id: string; val: number }>("SELECT id, val FROM _tx_probe_test WHERE id LIKE 'concurrent-%' ORDER BY id");
  assert(concurrentRows.length === 5, "kelima baris konkruen tersimpan dengan benar");
  assert(concurrentRows.every((r, idx) => r.val === idx + 10), "semua mutasi bertahap pada transaksi paralel tuntas tanpa korupsi");

  // Bersihkan tabel pengujian
  await exec("DROP TABLE IF EXISTS _tx_probe_test");
  await closeDb();

  console.log(`\nHasil: ${passed} lolos, ${failed} gagal.`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error("Unhandled error in tx-probe:", err);
  try {
    await closeDb();
  } catch {}
  process.exit(1);
});
