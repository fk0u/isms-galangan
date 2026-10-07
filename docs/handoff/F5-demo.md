# F5 — Kesiapan Demo & Pilot

Estimasi: 3–5 HK. Bergantung: semua fase sebelumnya.

---

### F5-01 — Docker & deploy
P0 · 1 HK · Keputusan: ADR-0010
`docker-compose.yml`: `mysql:8` (volume), `api` (build `services/api`, migrate saat start, env dari `.env`), `web` (build `apps/web`, disajikan nginx dengan header keamanan + proxy `/api` ke api). `docs/runbook/deploy.md`: provisioning VPS, TLS (Caddy/Let's Encrypt), env wajib, update versi, rollback.
**Kriteria.** `docker compose up` di mesin bersih → aplikasi jalan di `https://<host>`.

### F5-02 — Backup & restore teruji
P0 · 4 j
Jalankan `npm run backup` / `restore` pada MySQL di compose; jadwal cron harian + retensi 14 hari; uji restore ke database kosong dan bandingkan jumlah baris. Catat di `docs/runbook/backup.md`.

### F5-03 — Data demo yang bercerita
P0 · 1 HK
Seed demo: 1 galangan (Samarinda), 3 dock, 6 kapal, 4 proyek di tahap berbeda (baru, produksi dengan BoQ Rev 1 + CO, trial, selesai dengan garansi), stok dengan item kritis, PO sebagian terpenuhi + pengalihan vendor, 2 subkon dengan termin DP bertahap, 20 karyawan lengkap PTKP, absensi 1 bulan dengan lembur, inspeksi berskor. Akun per peran Q2 dengan password dari env.

### F5-04 — Skenario demo per modul
P0 · 1 HK
`docs/demo/` — satu file per alur dari `docs/product/scope.md` (13 alur): langkah klik, data yang dipakai, hasil yang diharapkan. Uji kering 2× sebelum demo.

### F5-05 — Audit ulang
P0 · 4 j
Jalankan security probe (harus 0 VULN K/T), `npm run check` kedua paket, Lighthouse halaman utama, dan checklist Definition of Done (`docs/product/scope.md`). Hasil di `docs/log/audit-ulang.md`.
