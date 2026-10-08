# Handoff ISMS — Setelah Penyelesaian F3-B-09 (PR #20)

**Waktu:** 2026-10-08 22:58 WITA  
**Branch Aktif:** `main` (commit `937c834`)  
**Status CI:** Hijau 100% (CI/web, CI/api, GitGuardian, cubic AI reviewer).

---

## 1. Status Terakhir
- **Task Terakhir Selesai:** `F3-B-09` — WBS: progres, material, histori, foto, assign (P0). Merged via PR #20 (`be81a30`).
- **Yang Setengah Jalan:** Tidak ada (working tree bersih, 0 PR terbuka).
- **Hasil Pekerjaan F3-B-09:**
  1. Modal update progres WBS: material memakai `SearchSelect` inventori + input jumlah `materialQty`.
  2. Alur material F3-D: bila stok cukup memotong stok dan membuat `movements` OUT; bila stok kurang mengeluarkan stok yang ada dan sisa kekurangannya otomatis membuat `requisitions` (PR) status Diajukan.
  3. Foto pekerjaan diunggah via `PhotoUploader` dan disimpan di array `photos` per WBS task.
  4. Komponen `ChangeHistory` diintegrasikan untuk menampilkan riwayat progres (before, after, actor, waktu, foto, catatan) per task WBS.
  5. Kolom Aksi WBS dilengkapi tombol **Assign** dan tabel menampilkan kolom badge **Assignee** (Internal / Subkon beserta Work Order).
  6. Penugasan Eksternal ke subkontraktor otomatis membuat atau menautkan `workOrders` (WO) proyek.
  7. Ditambahkan probe `apps/web/scripts/wbs-flow-probe.ts` (`probe:wbs` dan masuk ke `check`).

---

## 2. Lima (5) Task Berikutnya (Gelombang 4: Data Domain)
1. **`F3-C-01` — Migrasi & API boqDocs** (P0 · 1,5 HK · BOQ-01 s.d. BOQ-07)
   - Migrasi `009_boq_docs.sql`
   - Daftarkan koleksi `boqDocs` di `services/api/src/routes/crud.ts` (COLLECTIONS, PREFIX `BQD`, REQUIRED_DATA: `["projectId", "number"]`) dan `apps/web/src/data/store.tsx`
   - Relasi di `services/api/src/refs.ts`: `boqDocs.projectId → projects`, `boq.boqDocId → boqDocs`, `changeOrders.boqDocId → boqDocs`
   - Endpoint: `POST /api/boqDocs/:id/revise` (buat revisi + salin item dalam transaksi atomik) dan `POST /api/boqDocs/:id/status` (validasi status transisi)
   - Proteksi: PATCH item `boq` milik surat Disetujui ditolak 409
2. **`F3-C-02` — Migrasi data lama BoQ** (P0 · 3 j · BOQ-08, BOQ-09)
   - Skrip `scripts/migrate-boq-docs.ts`: kelompokkan `boq` lama per proyek ke 1 surat `BQ/<projectId>/001 Rev 0` status Disetujui
   - Pastikan tidak ada `boq` tanpa `boqDocId`
3. **`F3-C-03` — UI list & detail surat BoQ** (P0 · 1,5 HK · BOQ-10 s.d. BOQ-15)
   - Pindahkan `BoQSection.tsx` ke tab terisolasi
   - List surat BoQ (nomor, revisi, total, status, dokumen, aksi)
   - Detail surat (header, tabel item, riwayat revisi)
4. **`F3-C-05` — Change Order lewat owner & terhubung BoQ** (P0 · 1 HK · BOQ-22 s.d. BOQ-26)
   - Form CO pilih surat BoQ aktif + item diubah
   - Status Diajukan → Disetujui owner → Diterapkan (otomatis membuat revisi surat BoQ)
5. **`F3-D-01` — Tambah sparepart dari inventori** (P0 · 1,5 HK · PRJ-30, PRJ-27)

---

## 3. Prompt untuk Melanjutkan di Sesi Baru (Bila Diperlukan)
```markdown
Kamu melanjutkan pekerjaan tim engineering proyek ISMS dalam mode satu sesi empat topi (🧭 NAKHODA, 🛠️ EKSEKUTOR, 🔍 PENGUJI, 🧹 PEMBERSIH).
Baca: ai-prompts/00-ALL-IN-ONE.md bagian PROMPT UTAMA, .agent/rules/isms-core.md, docs/handoff/handoff-f3-b-09.md, docs/handoff/STATUS.md, dan docs/log/progress.md.
Periksa git: git status && git log -5 origin/main --oneline.
Task berikutnya yang harus dikerjakan adalah F3-C-01 (Migrasi & API boqDocs) dari docs/handoff/F3-C-boq-change-order.md.
Lakukan siklus per task: NAKHODA -> RENCANA -> BRANCH -> EKSEKUSI -> VERIFIKASI (npm run check exit 0) -> REVIEW PENGUJI -> PR & MERGE -> DOKUMENTASI.
```
