import { createHash } from "node:crypto";
import { closeDb, withTx, type TxContext } from "../src/db.js";

type Data = Record<string, unknown>;
interface BoqRow { id: string; branch: string | null; data: string; updated_at: string }
interface DocRow { id: string; data: string }
interface PlannedItem { id: string; data: Data }
interface GroupPlan {
  projectId: string;
  number: string;
  docId: string;
  branch: string;
  total: number;
  issuedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rows: PlannedItem[];
  existingDoc: boolean;
}
export interface BoqMigrationSummary {
  dryRun: boolean;
  groups: Array<{ projectId: string; number: string; docId: string; branch: string; items: number; total: number; existingDoc: boolean }>;
  migratedItems: number;
  remainingOrphans: number;
}

function parseData(raw: string, id: string, table: string): Data {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("JSON bukan objek");
    }
    return value as Data;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${table} ${id} memiliki data JSON yang tidak valid: ${reason}`);
  }
}

function legacyNumber(data: Data, field: "totalPrice" | "quantity" | "unitPrice", id: string): number {
  const value = data[field];
  if ((typeof value !== "number" && typeof value !== "string")
    || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`BoQ ${id} memiliki nilai ${field} yang hilang atau bukan numerik; migrasi dihentikan.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`BoQ ${id} memiliki nilai ${field} yang hilang atau bukan numerik; migrasi dihentikan.`);
  }
  return parsed;
}

function legacyTotal(data: Data, id: string): number {
  if (data.totalPrice !== undefined && data.totalPrice !== null) {
    return legacyNumber(data, "totalPrice", id);
  }
  const total = legacyNumber(data, "quantity", id) * legacyNumber(data, "unitPrice", id);
  if (!Number.isFinite(total)) {
    throw new Error(`BoQ ${id} memiliki total hasil perhitungan yang tidak valid; migrasi dihentikan.`);
  }
  return total;
}

function stableDocId(projectId: string): string {
  const digest = createHash("sha256").update(projectId, "utf8").digest("hex").slice(0, 20).toUpperCase();
  return `BQD-MIG-${digest}`;
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

async function buildPlan(tx: TxContext, now: string): Promise<GroupPlan[]> {
  const boqRows = await tx.q<BoqRow>("SELECT id, branch, data, updated_at FROM boq ORDER BY id");
  const docRows = await tx.q<DocRow>("SELECT id, data FROM boqDocs");
  const projectRows = await tx.q<{ id: string }>("SELECT id FROM projects");
  const parsedDocs = docRows.map((row) => ({ row, data: parseData(row.data, row.id, "boqDocs") }));
  const projectIds = new Set(projectRows.map((row) => String(row.id)));
  const groups = new Map<string, { branch: string; rows: Array<{ id: string; data: Data; updatedAt: string }> }>();

  for (const row of boqRows) {
    const data = parseData(row.data, row.id, "boq");
    const linkedId = data.boqDocId;
    if (linkedId !== undefined && linkedId !== null && String(linkedId).trim() !== "") {
      const linkedDoc = parsedDocs.find(({ row: doc }) => doc.id === String(linkedId));
      const linkedProjectId = stringField(data.projectId);
      if (!linkedDoc) throw new Error(`BoQ ${row.id} menunjuk boqDocId ${String(linkedId)} yang tidak ada.`);
      if (!linkedProjectId || !projectIds.has(linkedProjectId) || String(linkedDoc.data.projectId ?? "") !== linkedProjectId) {
        throw new Error(`BoQ ${row.id} dan surat ${String(linkedId)} tidak cocok dengan proyek yang tersedia.`);
      }
      continue;
    }

    const projectId = stringField(data.projectId);
    if (!projectId) throw new Error(`BoQ ${row.id} tidak memiliki projectId; migrasi dihentikan tanpa perubahan.`);
    if (!projectIds.has(projectId)) throw new Error(`Proyek ${projectId} pada BoQ ${row.id} tidak ada; migrasi dihentikan tanpa perubahan.`);
    const branch = stringField(row.branch) ?? "";
    const group = groups.get(projectId) ?? { branch, rows: [] };
    if (group.branch && branch && group.branch !== branch) {
      throw new Error(`BoQ proyek ${projectId} memiliki lebih dari satu cabang (${group.branch}, ${branch}); periksa data sebelum migrasi.`);
    }
    if (!group.branch && branch) group.branch = branch;
    group.rows.push({ id: row.id, data, updatedAt: row.updated_at });
    groups.set(projectId, group);
  }

  const plan: GroupPlan[] = [];
  for (const [projectId, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const number = `BQ/${projectId}/001`;
    const docId = stableDocId(projectId);
    const naturalMatches = parsedDocs.filter(({ data }) =>
      String(data.projectId ?? "") === projectId
      && String(data.number ?? "").trim().toLowerCase() === number.toLowerCase()
      && Number(data.revision ?? 0) === 0,
    );
    if (naturalMatches.some(({ row }) => row.id !== docId)) {
      throw new Error(`Surat ${number} Rev 0 sudah ada dengan ID berbeda; migrasi dihentikan agar tidak menautkan baris ke dokumen yang salah.`);
    }
    const idCollision = parsedDocs.find(({ row }) => row.id === docId);
    if (idCollision && (String(idCollision.data.projectId ?? "") !== projectId
      || String(idCollision.data.number ?? "") !== number
      || Number(idCollision.data.revision ?? 0) !== 0)) {
      throw new Error(`ID dokumen migrasi ${docId} sudah dipakai oleh data lain.`);
    }

    const rows = group.rows.sort((a, b) => a.id.localeCompare(b.id));
    const total = Math.round(rows.reduce((sum, row) => {
      const next = sum + legacyTotal(row.data, row.id);
      if (!Number.isFinite(next)) {
        throw new Error(`BoQ ${row.id} menghasilkan total gabungan yang tidak valid; migrasi dihentikan.`);
      }
      return next;
    }, 0));
    const itemApprovalDates = rows.map((row) => stringField(row.data.approvedAt)).filter((value): value is string => value !== undefined);
    const issuedAt = rows.map((row) => row.updatedAt).filter(Boolean).sort()[0] ?? now;
    const approvedAt = itemApprovalDates.sort().at(-1);
    const approvers = [...new Set(rows.map((row) => stringField(row.data.approvedBy)).filter((value): value is string => value !== undefined))];
    plan.push({
      projectId,
      number,
      docId,
      branch: group.branch,
      total,
      issuedAt,
      ...(approvedAt ? { approvedAt } : {}),
      ...(approvers.length === 1 ? { approvedBy: approvers[0] } : {}),
      rows: rows.map(({ id, data }) => ({ id, data })),
      existingDoc: idCollision !== undefined,
    });
  }
  return plan;
}

/**
 * Tautkan semua BoQ lama yang belum memiliki surat ke satu dokumen Rev 0 per proyek.
 * Default dry-run melindungi database; gunakan --apply setelah memeriksa ringkasan.
 */
export async function migrateBoqDocs(apply = false): Promise<BoqMigrationSummary> {
  const now = new Date().toISOString();
  return withTx(async (tx) => {
    const plan = await buildPlan(tx, now);
    let migratedItems = 0;
    if (apply) {
      for (const group of plan) {
        if (!group.existingDoc) {
          const data: Data = {
            projectId: group.projectId,
            number: group.number,
            revision: 0,
            status: "Disetujui",
            issuedAt: group.issuedAt,
            ...(group.approvedAt ? { approvedAt: group.approvedAt } : {}),
            ...(group.approvedBy ? { approvedBy: group.approvedBy } : {}),
            note: "Migrasi otomatis dari BoQ lama (F3-C-02).",
            total: group.total,
          };
          await tx.exec("INSERT INTO boqDocs (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
            group.docId, group.branch, JSON.stringify(data), now,
          ]);
        }
        for (const item of group.rows) {
          const updated = await tx.exec("UPDATE boq SET data = ?, updated_at = ? WHERE id = ?", [
            JSON.stringify({ ...item.data, boqDocId: group.docId }), now, item.id,
          ]);
          if (updated.changes !== 1) throw new Error(`BoQ ${item.id} berubah saat migrasi; transaksi dibatalkan.`);
          migratedItems += 1;
        }
      }
      const afterRows = await tx.q<{ id: string; data: string }>("SELECT id, data FROM boq");
      const orphans = afterRows.filter((row) => {
        const data = parseData(row.data, row.id, "boq");
        return data.boqDocId === undefined || data.boqDocId === null || String(data.boqDocId).trim() === "";
      });
      if (orphans.length > 0) {
        throw new Error(`Masih ada ${orphans.length} BoQ tanpa boqDocId setelah migrasi (${orphans.slice(0, 10).map((row) => row.id).join(", ")}).`);
      }
    }
    return {
      dryRun: !apply,
      groups: plan.map(({ projectId, number, docId, branch, total, rows, existingDoc }) => ({
        projectId, number, docId, branch, items: rows.length, total, existingDoc,
      })),
      migratedItems,
      remainingOrphans: apply ? 0 : plan.reduce((sum, group) => sum + group.rows.length, 0),
    };
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--apply" && arg !== "--dry-run");
  if (unknown.length > 0 || (args.includes("--apply") && args.includes("--dry-run"))) {
    throw new Error("Argumen valid: --dry-run (default) atau --apply.");
  }
  const apply = args.includes("--apply");
  const result = await migrateBoqDocs(apply);
  console.log(`=== MIGRASI BOQ DOCS ${apply ? "APPLY" : "DRY-RUN"} ===`);
  if (result.groups.length === 0) console.log("Tidak ada BoQ lama yang perlu ditautkan.");
  for (const group of result.groups) {
    console.log(`[${apply ? "MIGRASI" : "RENCANA"}] ${group.projectId} → ${group.number} Rev 0 (${group.items} item, total ${group.total}, ${group.existingDoc ? "dokumen sudah ada" : "dokumen baru"})`);
  }
  console.log(`Grup: ${result.groups.length}; item ${apply ? "ditautkan" : "akan ditautkan"}: ${apply ? result.migratedItems : result.groups.reduce((sum, group) => sum + group.items, 0)}; yatim tersisa: ${result.remainingOrphans}`);
  if (!apply) console.log("Tidak ada data yang diubah. Jalankan ulang dengan --apply setelah meninjau hasil.");
}

const entry = process.argv[1] ?? "";
if (entry.endsWith("migrate-boq-docs.ts") || entry.endsWith("migrate-boq-docs.js")) {
  main()
    .then(() => closeDb().then(() => process.exit(0)))
    .catch(async (error) => {
      console.error("[migrate-boq-docs] gagal:", error);
      await closeDb();
      process.exit(1);
    });
}
