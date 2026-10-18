/* Sinkron ulang register Dokumen dari seluruh surat BoQ (idempoten).
 * Dipakai setelah `migrate:boq-docs --apply` atau impor data lama, karena
 * migrasi itu membuat surat BoQ tanpa memperbarui tabel documents.
 * Jalankan: npm run sync:boq-documents */
import { closeDb, q } from "../src/db.js";
import { resyncBoqDocument } from "../src/boqDocs.js";

const ids = (await q<{ id: string }>("SELECT id FROM boqDocs", [])).map((r) => String(r.id));
for (const id of ids) await resyncBoqDocument(id, "system");
console.log(`Register Dokumen disinkronkan untuk ${ids.length} surat BoQ.`);
await closeDb();
