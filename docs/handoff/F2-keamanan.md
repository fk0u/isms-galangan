# F2 — Gerbang Keamanan

Tujuan: menutup semua temuan **Kritis & Tinggi** dari audit (`docs/audit/`, lokal) dan menjadikan security probe sebagai gate CI.
Estimasi fase: 15–20 HK. Dikerjakan berurutan sesuai nomor (task berikutnya membangun di atas yang sebelumnya).

Prinsip:
- Semua keputusan otorisasi di **server**. UI hanya menyembunyikan tombol.
- Default **fail-closed**: bila ragu (data cabang kosong, query gagal, peran tidak dikenal) → tolak.
- Setiap task menambah kasus di `security-probe.ts` yang sebelumnya VULN dan sekarang OK.

---

### F2-01 — Akun seed & demo login
P0 · 1 HK · Audit: K-05

**Konteks.** `services/api/src/auth.ts:115-120` mendefinisikan 4 akun dengan password tetap. Login akun seed hanya diblokir bila `NODE_ENV=production`, padahal default `development` (`env.ts:92`, `app.ts:54-58`). Frontend `apps/web/src/auth/auth.tsx:15-20` menyimpan password yang sama dan memakainya sebagai fallback login saat backend tak terjangkau (`auth.tsx:116-141`). Password ikut ke bundle produksi.
**File.** `auth.ts`, `app.ts`, `env.ts`, `seed.ts`, `apps/web/src/auth/auth.tsx`, `apps/web/src/pages/Login.tsx`.
**Langkah.**
1. `seedUsers()`: password tiap akun seed diambil dari env `SEED_PASSWORD_<ROLE>`; bila kosong, buat acak 16 karakter dan **cetak sekali** ke terminal saat seed.
2. Blokir login akun seed kecuali `ALLOW_SEED_LOGIN=true` (balik logika `isSeedLoginDisabled`).
3. Frontend: `demoUsers` hanya ada bila `import.meta.env.VITE_DEMO_MODE === "true"`; fallback demo **tidak pernah** dipakai bila `VITE_API_URL` terisi.
4. Hapus petunjuk password di halaman Login bila ada.
**Kriteria terima.**
- [ ] `grep -r "direktur123\|KucingTerbang" apps/web/dist` kosong setelah build tanpa `VITE_DEMO_MODE`.
- [ ] Login `direktur@galangan.com/direktur123` → 401/403 dengan konfigurasi default.
- [ ] Probe T00 OK.

---

### F2-02 — Konfigurasi default aman
P0 · 4 j · Audit: T-06

**File.** `services/api/src/env.ts`, `app.ts:142-176`, `.env.example`.
**Langkah.** `JWT_SECRET` wajib ≥ 32 karakter dan ≠ nilai contoh; `SETUP_TOKEN` bila diisi ≥ 32; `WEB_ORIGINS` wajib kecuali `NODE_ENV=development` **dan** host `localhost`; hapus fallback `*`. Pindahkan `Access-Control-Expose-Headers` ke hook `onSend` (S-05).
**Kriteria terima.** Probe T24, T25 OK; boot gagal dengan pesan jelas untuk secret lemah.

---

### F2-03 — Hierarki peran di manajemen user
P0 · 1,5 HK · Audit: K-04

**Konteks.** `routes/users.ts`: peran teks bebas (`:58-67`); manager (punya `manageUsers`, `rbac.ts:37`) bisa mengubah peran sendiri jadi direktur, membuat akun developer, dan mereset password direktur tanpa password lama (`:199-236`). Terbukti di probe T12–T15.
**Langkah.**
1. Definisikan `ROLE_RANK` (sementara di `rbac.ts`; dipindah ke `policy.ts` di F2-05): developer 100, direktur 90, manager 70, peran operasional 50, viewer 10.
2. POST/PATCH user: tolak bila `rank(target role) >= rank(actor)` kecuali actor developer/direktur; tolak ubah peran diri sendiri.
3. Reset password user lain: hanya bila `rank(actor) > rank(target)`; selalu catat audit; panggil `bumpTokenVersion(target)` (tersedia setelah F2-04 — sementara TODO dengan ID task).
**Kriteria terima.** Probe T12–T15 OK; direktur masih bisa mengelola manager.

---

### F2-04 — Token bisa dicabut
P0 · 2–3 HK · Audit: T-01

**Konteks.** `requireAuth` (`auth.ts:71-82`) hanya memverifikasi tanda tangan JWT 8 jam; peran & cabang dibaca dari token. Logout, nonaktif, dan turun peran tidak berpengaruh (probe T16–T18).
**Langkah.**
1. Migrasi `008_token_version.sql`: `ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0`.
2. `signToken` memasukkan `v`. `requireAuth` memuat user (id, role, is_active, token_version, employee_id) dari DB dengan cache in-memory 30 detik per user id; tolak bila `is_active=0` atau `v` berbeda. **Peran dan cabang diambil dari DB, bukan token.**
3. `bumpTokenVersion(userId)` dipanggil di: logout, PATCH user (peran/aktif/employee berubah), DELETE user, ganti/reset password. Invalidasi cache saat bump.
4. Frontend: 401 → logout bersih (sudah ada event `isms:auth-expired`).
**Kriteria terima.** Probe T16–T18 OK; perubahan berlaku ≤ 30 detik (≈ langsung untuk instans yang sama).

---

### F2-05 — `policy.ts`: enum peran + izin baca/tulis
P0 · 4–5 HK · Audit: K-03, T-04 · Bergantung: F2-03, F2-04 · Keputusan: ADR-0004

**Konteks.** `rbac.ts` mencocokkan peran dengan regex substring berurutan dan hanya mengatur tulis. GET semua koleksi cukup `requireAuth`, sehingga viewer/klien membaca payroll, employees, journals, audit (T08–T09). Ada 3 mekanisme peran yang tidak konsisten: `rbac.ts`, `users.ts:14-19`, `auth.tsx:23-32`.
**File.** `services/api/src/rbac.ts` → `policy.ts`, `routes/crud.ts`, `routes/audit.ts`, `routes/users.ts`, `routes/wbs.ts`, `routes/files.ts`, `app.ts` (`/api/auth/me`), `apps/web/src/auth/auth.tsx`, `apps/web/src/pages/pengaturan/Peran.tsx`, `AppShell.tsx` (menu).
**Langkah.**
1. `policy.ts`: `type Role = "developer"|"direktur"|"manager"|"finance"|"hr"|"procurement"|"gudang"|"proyek"|"mekanik"|"qc"|"subkon"|"equipment"|"drydock"|"viewer"` (final, ADR-0004) dan `MATRIX: Record<Role, Record<Collection, ("r"|"w"|"d")[]>>`. Koleksi sensitif (`payroll`, `employees`, `journals`, `coa`, `settings`, `audit`, `users`) tertutup kecuali disebut.
2. Migrasi data: skrip `scripts/migrate-roles.ts` memetakan peran teks lama → enum (pakai regex lama sebagai pemetaan satu kali, hasil dicetak untuk ditinjau manusia).
3. `crud.ts`: GET list/id butuh `r`; POST/PATCH `w`; DELETE `d`. `/api/audit` hanya direktur/developer. Zod `role: z.enum(ROLES)` di users.
4. `/api/auth/me` mengembalikan `{user, permissions}`; frontend memakai `permissions` untuk menyembunyikan menu/tombol; hapus `canSetTarget`/`canWriteSettings` berbasis string.
5. `activities`: hanya POST (append); actor diisi dari token; PATCH/DELETE ditolak (T-05 sebagian).
**Kriteria terima.** Probe T08a–d, T09–T11 OK; tiap peran di Q2 punya test kecil di probe (minimal: viewer tidak bisa baca payroll, finance bisa).
**Jangan.** Mengubah bentuk respons CRUD (FE bergantung pada `{rows,total,limit,offset,nextCursor}`).

---

### F2-06 — Scope cabang di server
P0/P1 · 3–7 HK · Audit: K-02 · Bergantung: F2-05 · Keputusan: ADR-0003 → **Jalur A**

**Konteks.** Claim cabang ada tapi hanya dipakai route PDF. User cabang A membaca/mengubah/memindahkan data cabang B (T02–T07). 72% baris data seed punya `branch` kosong. Revisi klien ETC-01 menghapus filter cabang di top bar dan EQP-01 men-default "Samarinda" → indikasi klien saat ini **satu cabang**.
**Dua jalur — pilih sesuai jawaban Q1:**
- **Jalur A (satu cabang aktif, default usulan):** 1–2 HK. Semua data diisi `branch = "Samarinda"` lewat migrasi; server memaksa `branch` = cabang default pada create; PATCH tidak boleh mengubah `branch` kecuali direktur/developer; route PDF tetap memakai `branchAllowed`. Struktur siap multi-cabang, tapi tanpa filter UI.
- **Jalur B (multi-cabang wajib):** 5–7 HK. `req.scope.branches` dari F2-04; helper `scopedWhere(table, scope)` dipakai di list/get/patch/delete `crud.ts`, `wbs.ts` (via proyek induk), `files.ts`, `pdf.ts`; daftar `GLOBAL_COLLECTIONS` (coa, settings, branches, vendors?, clients?) tanpa scope; skrip backfill `scripts/backfill-branch.ts` (ikut proyek/karyawan induk, sisanya karantina + laporan); `entityBranch` fail-closed.
**Kriteria terima.** Jalur A: tidak ada baris dengan `branch` kosong; PATCH branch oleh peran operasional → 403. Jalur B: probe T02–T07 OK.

---

### F2-07 — Login mengirim cabang & cache offline aman
P0 · 1,5 HK · Audit: T-02, T-03 · Bergantung: F2-01

**Konteks.** Respons login tidak memuat `branch` (`app.ts:307`) sehingga FE selalu "SEMUA". Saat logout, IndexedDB `isms-offline` dan localStorage `isms.*` tidak dihapus; siapa pun yang login berikutnya di perangkat yang sama (tablet bengkel) melihat data user sebelumnya (`store.tsx:678-691,1617`).
**Langkah.** Kirim `branch` + `permissions` di respons login. Di `logout()` dan pada event `isms:auth-expired`: hapus database IndexedDB, kunci `localStorage` berawalan `isms.` (kecuali preferensi UI `isms.locale`, `isms.minSide`), dan antrean dirty **setelah** konfirmasi bila ada perubahan belum tersinkron. Simpan `ownerUserId` di cache; bila user berbeda saat boot, buang cache.
**Kriteria terima.** Login user A → logout → login user B: B tidak melihat data A sebelum sync; dialog peringatan muncul bila ada antrean belum terkirim.

---

### F2-08 — Audit trail wajib & terbatas
P1 · 2 HK · Audit: T-05

**Konteks.** `writeAudit` (`audit.ts:25-39`) menelan error; WBS/team (`wbs.ts`) dan upload (`files.ts`) tidak diaudit.
**Langkah.** Untuk koleksi sensitif (invoices, payables, journals, payroll, users, settings, coa, purchaseOrders) jalankan tulis data + audit dalam satu transaksi (helper `withTx` di `db.ts` untuk sqlite & mysql); gagal audit ⇒ rollback 500. Tambah audit di PUT wbs/team, upload file, render PDF (sudah ada).
**Kriteria terima.** Mematikan tabel audit membuat PATCH invoice gagal; PUT WBS muncul di halaman Audit.

---

### F2-09 — Security probe jadi gate CI
P0 · 3 j · Bergantung: F2-01…F2-08

**Langkah.** `security-probe.ts` tanpa `--report` → exit 1 bila ada kasus K/T yang VULN. Tambah ke `npm run check` API. Kasus S/R boleh tetap laporan.
**Kriteria terima.** CI hijau; mengembalikan salah satu perbaikan (mis. hapus cek rank) membuat CI merah.
