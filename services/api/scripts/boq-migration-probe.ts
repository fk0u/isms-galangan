import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main(): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "isms-boq-migration-"));
  const originalDbPath = process.env.SQLITE_PATH;
  const originalDialect = process.env.DB_DIALECT;
  process.env.SQLITE_PATH = path.join(tempDir, "fixture.db");
  process.env.DB_DIALECT = "sqlite";

  const { closeDb, exec, q } = await import("../src/db.js");
  try {
    const { migrate } = await import("../src/migrate.js");
    const { migrateBoqDocs } = await import("./migrate-boq-docs.js");
    await migrate();

    const now = "2026-10-09T00:00:00.000Z";
    await exec("INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      "PRJ-MIG-A", "Samarinda", JSON.stringify({ name: "Proyek Uji A" }), now,
    ]);
    await exec("INSERT INTO projects (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      "PRJ-MIG-B", "Samarinda", JSON.stringify({ name: "Proyek Uji B" }), now,
    ]);
    const fixtures = [
      { id: "OLD-A-1", projectId: "PRJ-MIG-A", quantity: 2, unitPrice: 10, totalPrice: 20 },
      { id: "OLD-A-2", projectId: "PRJ-MIG-A", quantity: "3", unitPrice: "5" },
      { id: "OLD-B-1", projectId: "PRJ-MIG-B", quantity: 4, unitPrice: 7, totalPrice: 28 },
    ];
    for (const item of fixtures) {
      await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
        item.id, "Samarinda", JSON.stringify(item), now,
      ]);
    }

    const preview = await migrateBoqDocs(false);
    assert.equal(preview.dryRun, true, "default preview tidak boleh menulis");
    assert.equal(preview.groups.length, 2, "preview mengelompokkan per proyek");
    assert.equal(preview.groups.reduce((sum, group) => sum + group.items, 0), 3);
    assert.equal((await q("SELECT id FROM boqDocs")).length, 0, "preview tidak membuat dokumen");
    assert.equal((await q<{ data: string }>("SELECT data FROM boq WHERE id = ?", ["OLD-A-1"]))[0].data.includes("boqDocId"), false);

    const applied = await migrateBoqDocs(true);
    assert.equal(applied.dryRun, false);
    assert.equal(applied.groups.length, 2);
    assert.equal(applied.migratedItems, 3);
    assert.equal(applied.remainingOrphans, 0);

    const docs = await q<{ id: string; data: string }>("SELECT id, data FROM boqDocs ORDER BY id");
    assert.equal(docs.length, 2, "tepat satu Rev 0 dibuat per proyek");
    const parsedDocs = docs.map((doc) => ({ id: doc.id, data: JSON.parse(doc.data) as Record<string, unknown> }));
    for (const doc of parsedDocs) {
      assert.equal(doc.data.revision, 0);
      assert.equal(doc.data.status, "Disetujui");
      assert.match(String(doc.data.number), /^BQ\/PRJ-MIG-[AB]\/001$/);
    }
    const totalByProject = new Map(parsedDocs.map((doc) => [String(doc.data.projectId), Number(doc.data.total)]));
    assert.equal(totalByProject.get("PRJ-MIG-A"), 35, "total memakai totalPrice atau quantity × unitPrice");
    assert.equal(totalByProject.get("PRJ-MIG-B"), 28);

    const migratedItems = await q<{ id: string; data: string }>("SELECT id, data FROM boq ORDER BY id");
    assert.equal(migratedItems.length, 3);
    for (const row of migratedItems) {
      const item = JSON.parse(row.data) as Record<string, unknown>;
      assert.ok(typeof item.boqDocId === "string" && item.boqDocId.length > 0, `${row.id} tertaut ke surat`);
      assert.ok(docs.some((doc) => doc.id === item.boqDocId), `${row.id} merujuk surat yang tersedia`);
    }

    const rerun = await migrateBoqDocs(true);
    assert.equal(rerun.groups.length, 0, "migrasi ulang tidak menambah dokumen");
    assert.equal((await q("SELECT id FROM boqDocs")).length, 2, "jumlah dokumen tetap setelah rerun");

    await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      "OLD-BROKEN", "Samarinda", JSON.stringify({ quantity: 1, unitPrice: 10 }), now,
    ]);
    await assert.rejects(() => migrateBoqDocs(true), /tidak memiliki projectId/, "data cacat ditolak sebelum ditulis");
    assert.equal((await q("SELECT id FROM boqDocs")).length, 2, "transaksi gagal tidak membuat dokumen parsial");
    await exec("DELETE FROM boq WHERE id = ?", ["OLD-BROKEN"]);

    const damagedNumbers = [
      { id: "OLD-MISSING-QUANTITY", field: "quantity", data: { projectId: "PRJ-MIG-A", unitPrice: 10 } },
      { id: "OLD-MISSING-UNIT-PRICE", field: "unitPrice", data: { projectId: "PRJ-MIG-A", quantity: 2 } },
      { id: "OLD-NONNUMERIC-QUANTITY", field: "quantity", data: { projectId: "PRJ-MIG-A", quantity: "rusak", unitPrice: 10 } },
      { id: "OLD-NONNUMERIC-UNIT-PRICE", field: "unitPrice", data: { projectId: "PRJ-MIG-A", quantity: 2, unitPrice: "rusak" } },
      { id: "OLD-BLANK-UNIT-PRICE", field: "unitPrice", data: { projectId: "PRJ-MIG-A", quantity: 2, unitPrice: " " } },
      { id: "OLD-NONNUMERIC-TOTAL-PRICE", field: "totalPrice", data: { projectId: "PRJ-MIG-A", quantity: 2, unitPrice: 10, totalPrice: "rusak" } },
      { id: "OLD-OVERFLOW-TOTAL", field: "total hasil", data: { projectId: "PRJ-MIG-A", quantity: 1e308, unitPrice: 1e308 } },
    ];
    for (const damaged of damagedNumbers) {
      await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
        damaged.id, "Samarinda", JSON.stringify(damaged.data), now,
      ]);
      const numericError = new RegExp(`BoQ ${damaged.id}.*${damaged.field}`);
      await assert.rejects(() => migrateBoqDocs(false), numericError, `${damaged.id}: dry-run harus gagal tertutup`);
      await assert.rejects(() => migrateBoqDocs(true), numericError, `${damaged.id}: apply harus gagal tertutup`);
      assert.equal((await q("SELECT id FROM boqDocs")).length, 2, `${damaged.id}: tidak membuat dokumen baru`);
      const [unchanged] = await q<{ data: string }>("SELECT data FROM boq WHERE id = ?", [damaged.id]);
      assert.equal(JSON.parse(unchanged.data).boqDocId, undefined, `${damaged.id}: tidak tertaut setelah gagal`);
      await exec("DELETE FROM boq WHERE id = ?", [damaged.id]);
    }

    await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      "OLD-DANGLING", "Samarinda", JSON.stringify({ projectId: "PRJ-MIG-A", boqDocId: "MISSING-DOC" }), now,
    ]);
    await assert.rejects(() => migrateBoqDocs(true), /boqDocId MISSING-DOC yang tidak ada/, "tautan ke surat yang hilang ditolak");
    assert.equal((await q("SELECT id FROM boqDocs")).length, 2, "tautan surat hilang tidak membuat dokumen baru");
    await exec("DELETE FROM boq WHERE id = ?", ["OLD-DANGLING"]);

    await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      "OLD-UNKNOWN-PROJECT", "Samarinda", JSON.stringify({ projectId: "PRJ-UNKNOWN", quantity: 1, unitPrice: 1 }), now,
    ]);
    await assert.rejects(() => migrateBoqDocs(true), /Proyek PRJ-UNKNOWN.*tidak ada/, "referensi proyek yang hilang ditolak");
    assert.equal((await q("SELECT id FROM boqDocs")).length, 2, "proyek yang hilang tidak membuat dokumen parsial");
    await exec("DELETE FROM boq WHERE id = ?", ["OLD-UNKNOWN-PROJECT"]);

    console.log("[probe:boq-migration] PASS — preview, pengelompokan, fail-closed numerik, status, total, tautan, idempotensi, relasi, dan rollback terverifikasi.");
  } finally {
    await closeDb();
    if (originalDbPath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = originalDbPath;
    if (originalDialect === undefined) delete process.env.DB_DIALECT;
    else process.env.DB_DIALECT = originalDialect;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("[probe:boq-migration] FAIL", error);
  process.exit(1);
});
