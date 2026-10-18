/* Surat BoQ per nomor surat dengan revisi bertingkat (ADR-0006, F3-C-01).
 *
 * Surat (`boqDocs`) membungkus banyak baris pekerjaan (`boq.boqDocId`).
 * Surat berstatus Disetujui/Digantikan TERKUNCI: isi maupun barisnya tidak
 * boleh diubah lewat CRUD generik. Mengubah surat yang sudah disetujui
 * berarti membuat REVISI (surat baru, revision+1, supersedes = id lama);
 * surat lama baru menjadi "Digantikan" saat revisinya disetujui, supaya
 * selalu ada tepat satu revisi aktif per nomor surat.
 *
 * Aturan ditegakkan di server karena frontend bisa dilewati lewat API. */
import { randomUUID } from "node:crypto";
import { exec, q, withTx } from "./db.js";

export type BoqDocStatus = "Draft" | "Diajukan" | "Disetujui" | "Ditolak" | "Digantikan";

export const BOQ_DOC_STATUSES: BoqDocStatus[] = ["Draft", "Diajukan", "Disetujui", "Ditolak", "Digantikan"];
const LOCKED: BoqDocStatus[] = ["Disetujui", "Digantikan"];

/* "Digantikan" sengaja tidak ada sebagai tujuan: hanya disetel otomatis
   ketika revisi penggantinya disetujui. */
const TRANSITIONS: Record<BoqDocStatus, BoqDocStatus[]> = {
  Draft: ["Diajukan"],
  Diajukan: ["Disetujui", "Ditolak", "Draft"],
  Ditolak: ["Draft"],
  Disetujui: [],
  Digantikan: [],
};

interface Row { id: string; branch: string; data: string; updated_at: string }
type Data = Record<string, unknown>;

export class BoqError extends Error {
  constructor(public status: 404 | 409 | 422, message: string, public code: string) {
    super(message);
  }
}

function parse(row: Row | undefined): Data | null {
  if (!row) return null;
  try { return JSON.parse(row.data) as Data; } catch { return {}; }
}

function statusOf(d: Data | null): BoqDocStatus {
  const s = String(d?.status ?? "Draft");
  return (BOQ_DOC_STATUSES as string[]).includes(s) ? (s as BoqDocStatus) : "Draft";
}

async function loadDoc(id: string): Promise<{ row: Row; data: Data } | null> {
  const rows = await q<Row>("SELECT id, branch, data, updated_at FROM boqDocs WHERE id = ?", [id]);
  const row = rows[0];
  return row ? { row, data: parse(row) ?? {} } : null;
}

export function isLocked(status: unknown): boolean {
  return (LOCKED as string[]).includes(String(status ?? ""));
}

/** Total surat dihitung server dari baris BoQ-nya, bukan dari klien. */
export async function docTotal(docId: string): Promise<number> {
  const rows = await q<Row>("SELECT id, branch, data, updated_at FROM boq");
  let total = 0;
  for (const r of rows) {
    const d = parse(r) ?? {};
    if (String(d.boqDocId ?? "") !== docId) continue;
    const explicit = Number(d.totalPrice);
    total += Number.isFinite(explicit) && d.totalPrice !== undefined && d.totalPrice !== null
      ? explicit
      : (Number(d.quantity) || 0) * (Number(d.unitPrice) || 0);
  }
  return Math.round(total);
}

/** Unik (projectId, number, revision). */
export async function checkDocUnique(data: Data, selfId: string | null): Promise<string | null> {
  const projectId = String(data.projectId ?? "");
  const number = String(data.number ?? "").trim().toLowerCase();
  const revision = Number(data.revision ?? 0);
  const rows = await q<Row>("SELECT id, branch, data, updated_at FROM boqDocs");
  for (const r of rows) {
    if (r.id === selfId) continue;
    const d = parse(r) ?? {};
    if (String(d.projectId ?? "") === projectId
      && String(d.number ?? "").trim().toLowerCase() === number
      && Number(d.revision ?? 0) === revision) {
      return `Surat BoQ ${String(data.number)} Rev ${revision} sudah ada pada proyek ini`;
    }
  }
  return null;
}

/**
 * Dipanggil CRUD generik sebelum menulis/menghapus `boqDocs` atau `boq`.
 * `before` = data lama (null saat create), `after` = data baru (null saat delete).
 * Mengembalikan pesan 409 bila penulisan melanggar kunci surat.
 */
export async function boqLockError(table: string, before: Data | null, after: Data | null): Promise<string | null> {
  if (table === "boqDocs") {
    if (before && isLocked(before.status)) {
      return `Surat BoQ ${String(before.number ?? "")} sudah ${String(before.status)} dan terkunci — buat revisi`;
    }
    if (before && after && String(after.status ?? "Draft") !== String(before.status ?? "Draft")) {
      return "Status surat BoQ hanya bisa diubah lewat POST /api/boqDocs/:id/status";
    }
    if (after && !before) {
      const err = await checkDocUnique(after, null);
      if (err) return err;
    }
    return null;
  }
  if (table === "boq") {
    const docIds = new Set([before?.boqDocId, after?.boqDocId].map((v) => String(v ?? "")).filter((v) => v !== ""));
    for (const docId of docIds) {
      const doc = await loadDoc(docId);
      if (doc && isLocked(doc.data.status)) {
        return `Item BoQ milik surat ${String(doc.data.number ?? docId)} (${String(doc.data.status)}) terkunci — buat revisi`;
      }
    }
  }
  return null;
}

/** Normalisasi surat baru dari CRUD: status selalu Draft, revisi default 0. */
export function normalizeNewDoc(data: Data): Data {
  return {
    ...data,
    number: String(data.number ?? "").trim(),
    revision: Number.isInteger(Number(data.revision)) ? Number(data.revision) : 0,
    status: "Draft",
    total: 0,
    assigner: data.assigner ? String(data.assigner).trim() : (data.createdBy ? String(data.createdBy).trim() : undefined),
  };
}

/** Sinkronkan surat BoQ ke tabel documents agar selalu tampil di register Dokumen & Laporan. */
export async function syncBoqDocToDocuments(id: string, boqData: Data, branch: string, actor?: string): Promise<void> {
  const docId = `DOC-${id}`;
  const now = new Date().toISOString();
  const exists = await q<{ id: string; data: string }>("SELECT id, data FROM documents WHERE id = ?", [docId]);
  const pr = await q<{ data: string }>("SELECT data FROM projects WHERE id = ?", [String(boqData.projectId ?? "")]);
  let vessel = "";
  try {
    vessel = String((JSON.parse(pr[0]?.data ?? "{}") as Data).vessel ?? "");
  } catch {
    /* proyek tanpa data */
  }

  const assigner = String(boqData.assigner || boqData.createdBy || boqData.owner || (actor && actor !== "system" ? actor : "") || "");
  const status = String(boqData.status ?? "Draft");
  const rev = Number(boqData.revision ?? 0);
  const title = `BoQ ${String(boqData.number ?? id)} Rev ${rev}`;
  /* Ringkasan isi surat ikut disimpan di register Dokumen (revisi 18 Okt: BoQ di
     proyek tidak "nyambung" ke modul Dokumen) - dihitung dari baris boq. */
  const items = (await q<Row>("SELECT id, branch, data, updated_at FROM boq")).filter((rw) => String(parse(rw)?.boqDocId ?? "") === id);
  const total = await docTotal(id);
  const itemCount = items.length;

  if (exists.length === 0) {
    const docRecord: Data = {
      title,
      type: "BoQ",
      subType: rev > 0 ? "Revisi BoQ" : "BoQ Proyek",
      project: String(boqData.projectId ?? ""),
      vessel,
      version: `Rev ${rev}`,
      status,
      updated: now.slice(0, 10),
      owner: assigner || actor || "",
      assigner: assigner || "",
      boqDocId: id,
      total,
      itemCount,
      archived: status === "Digantikan",
      docCopy: "Terkendali",
    };
    await exec("INSERT INTO documents (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      docId, branch, JSON.stringify(docRecord), now,
    ]);
  } else {
    let prev: Data = {};
    try {
      prev = JSON.parse(exists[0].data ?? "{}") as Data;
    } catch {
      /* noop */
    }
    const updated: Data = {
      ...prev,
      title,
      type: "BoQ",
      subType: rev > 0 ? "Revisi BoQ" : "BoQ Proyek",
      project: String(boqData.projectId ?? ""),
      vessel: vessel || prev.vessel || "",
      version: `Rev ${rev}`,
      status,
      updated: now.slice(0, 10),
      owner: assigner || prev.owner || actor || "",
      assigner: assigner || prev.assigner || "",
      boqDocId: id,
      total,
      itemCount,
      archived: status === "Digantikan",
    };
    await exec("UPDATE documents SET data = ?, updated_at = ? WHERE id = ?", [
      JSON.stringify(updated), now, docId,
    ]);
  }
}

/** Sinkron ulang register Dokumen untuk satu surat: dipanggil setelah baris boq
 *  atau suratnya berubah. Surat yang sudah dihapus → baris dokumennya ikut hilang. */
export async function resyncBoqDocument(docId: string, actor?: string): Promise<void> {
  if (!docId) return;
  const doc = await loadDoc(docId);
  if (!doc) {
    await exec("DELETE FROM documents WHERE id = ?", [`DOC-${docId}`]);
    return;
  }
  await syncBoqDocToDocuments(docId, doc.data, String(doc.row.branch ?? ""), actor);
}

export async function setDocStatus(id: string, to: string, actor: string, note = ""): Promise<Data> {
  if (!(BOQ_DOC_STATUSES as string[]).includes(to)) throw new BoqError(422, `Status tidak dikenal: ${to}`, "UNPROCESSABLE");
  return withTx(async () => {
    const doc = await loadDoc(id);
    if (!doc) throw new BoqError(404, `Surat BoQ ${id} tidak ada`, "NOT_FOUND");
    const from = statusOf(doc.data);
    const target = to as BoqDocStatus;
    if (!TRANSITIONS[from].includes(target)) {
      throw new BoqError(409, `Transisi ${from} → ${target} tidak diizinkan`, "INVALID_TRANSITION");
    }
    const now = new Date().toISOString();
    const next: Data = { ...doc.data, status: target, total: await docTotal(id) };
    if (target === "Diajukan") next.issuedAt = doc.data.issuedAt ?? now;
    if (target === "Disetujui") { next.approvedBy = actor; next.approvedAt = now; }
    if (note) next.note = note;
    await exec("UPDATE boqDocs SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(next), now, id]);
    // Revisi disetujui → revisi sebelumnya digantikan (satu revisi aktif per nomor surat).
    const prevId = String(doc.data.supersedes ?? "");
    if (target === "Disetujui" && prevId !== "") {
      const prev = await loadDoc(prevId);
      if (prev) {
        const prevNext = { ...prev.data, status: "Digantikan", supersededBy: id };
        await exec("UPDATE boqDocs SET data = ?, updated_at = ? WHERE id = ?", [
          JSON.stringify(prevNext), now, prevId,
        ]);
        await syncBoqDocToDocuments(prevId, prevNext, prev.row.branch, actor);
      }
    }
    /* Surat BoQ semua status (Draft, Diajukan, Disetujui, Digantikan) disinkronkan ke register Dokumen */
    await syncBoqDocToDocuments(id, next, doc.row.branch, actor);
    return { id, ...next };
  });
}

function newId(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Buat revisi dari surat Disetujui: surat baru Draft + salinan semua item. */
export async function reviseDoc(id: string): Promise<{ id: string; revision: number; items: number }> {
  return withTx(async () => {
    const doc = await loadDoc(id);
    if (!doc) throw new BoqError(404, `Surat BoQ ${id} tidak ada`, "NOT_FOUND");
    if (statusOf(doc.data) !== "Disetujui") {
      throw new BoqError(409, "Hanya surat berstatus Disetujui yang bisa direvisi", "INVALID_TRANSITION");
    }
    const all = await q<Row>("SELECT id, branch, data, updated_at FROM boqDocs");
    const pending = all.find((r) => String(parse(r)?.supersedes ?? "") === id && !isLocked(parse(r)?.status));
    if (pending) throw new BoqError(409, `Revisi ${pending.id} masih berjalan untuk surat ini`, "CONFLICT");

    const now = new Date().toISOString();
    const newDocId = newId("BQD");
    const revision = Number(doc.data.revision ?? 0) + 1;
    const nextDoc: Data = {
      projectId: doc.data.projectId, number: doc.data.number, revision, status: "Draft",
      supersedes: id, note: "", total: 0,
      assigner: doc.data.assigner || doc.data.createdBy || doc.data.owner || undefined,
    };
    await exec("INSERT INTO boqDocs (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      newDocId, doc.row.branch, JSON.stringify(nextDoc), now,
    ]);
    const items = await q<Row>("SELECT id, branch, data, updated_at FROM boq");
    let copied = 0;
    for (const r of items) {
      const d = parse(r) ?? {};
      if (String(d.boqDocId ?? "") !== id) continue;
      await exec("INSERT INTO boq (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
        newId("BQ"), r.branch, JSON.stringify({ ...d, boqDocId: newDocId, copiedFrom: r.id }), now,
      ]);
      copied += 1;
    }
    const finalDoc = { ...nextDoc, total: await docTotal(newDocId) };
    await exec("UPDATE boqDocs SET data = ?, updated_at = ? WHERE id = ?", [
      JSON.stringify(finalDoc), now, newDocId,
    ]);
    await syncBoqDocToDocuments(newDocId, finalDoc, doc.row.branch);
    return { id: newDocId, revision, items: copied };
  });
}
