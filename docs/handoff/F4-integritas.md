# F4 — Integritas Data, Realtime, Kinerja

Estimasi: 6–10 HK. Sebagian besar backend; boleh dimulai setelah F2.

---

### F4-01 — Concurrency atomik
P0 · 1 HK · Audit S-01 · Lama: C1
**Konteks.** `crud.ts` PATCH: SELECT → cek `baseUpdatedAt` (opsional) → UPDATE terpisah. Dua device bisa saling menimpa (keluhan klien C1).
**Langkah.** `UPDATE … WHERE id=? AND updated_at=?` lalu cek affected rows (sqlite `changes`, mysql `affectedRows` — perlu `exec` mengembalikan hasil); 0 baris ⇒ 409 STALE dengan data terbaru. `baseUpdatedAt` wajib untuk koleksi keuangan/payroll/boq. Frontend sudah punya jalur 409; tambahkan dialog "Data diubah orang lain — muat ulang / timpa".
**Kriteria.** Probe paralel 2 PATCH: tepat satu 200, satu 409.

### F4-02 — Transaksi untuk operasi multi-langkah
P0 · 1 HK · Audit S-06
Helper `withTx(fn)` di `db.ts` (sqlite: `db.transaction`; mysql: koneksi pool + BEGIN/COMMIT). Dipakai: material request (F3-D), revise BoQ (F3-C), terima PO (F3-G), terapkan CO, audit wajib (F2-08).

### F4-03 — Realtime perubahan data
P1 · 1,5 HK · Revisi INV-01 · Lama: C1/C2
**Langkah.** Endpoint SSE `GET /api/events` (auth lewat query token sekali pakai atau cookie): server memancarkan `{table, id, op, updated_at}` setiap tulis sukses di `crud.ts` dan route khusus (EventEmitter in-process; catat ceiling: 1 instans — Redis pub/sub bila diskalakan). Frontend: satu koneksi di store; event → tarik ulang baris/koleksi terkait (pakai cursor `after`). Reconnect dengan backoff.
**Kriteria.** Ubah stok di tab A ⇒ tab B ter-update ≤ 2 detik tanpa klik.

### F4-04 — Relasi baru di `refs.ts`
P0 · 4 j
Daftarkan semua relasi yang ditambahkan upstream & F3: material WBS → inventory, sparepart → purchaseOrders/inventory, service → boq/employees, garansi → wbs/projects, boqDocs, changeOrders.boqDocId, checklistResponses → templates/projects, delegasi equipment. Delete-guard otomatis ikut.

### F4-05 — File upload terkontrol
P1 · 1 HK · Audit S-03
Metadata upload di koleksi `files` (pemilik, entitas, `sensitivity: "normal"|"pribadi"`); `/files/*` memeriksa izin baca sesuai entitas (KTP/ijazah hanya HR). Upload hanya untuk peran dengan izin tulis entitas terkait. Audit upload.

### F4-06 — Kinerja frontend
P1 · 1 HK · Audit R-01
`React.lazy` per route di `App.tsx`; model-viewer + `tug_boat.glb` dimuat on-demand (kompres Draco atau sediakan versi < 2 MB). Target: chunk awal < 1 MB gzip.

### F4-07 — Lain-lain audit
P1 · 1 HK
S-02 bcrypt dummy saat user tidak ada; S-04 hapus ipapi.co (IP dari backend); S-05 header keamanan (`@fastify/helmet` atau manual); S-07 migrasi gagal keras bila checksum berubah; S-08 `/api/admin/seed` mati di production; S-09 404/422 vs 500; R-02 font PDF Noto Sans di `assets/fonts` (lisensi OFL, boleh di-commit — ubah `.gitignore`); R-06 `npm audit fix`.
