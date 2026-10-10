# Runbook — Backup & Restore (F5-02)

## Yang dicadangkan
`npm run backup` (services/api) menulis satu folder berisi:
- `isms.db` (SQLite, snapshot konsisten lewat `VACUUM INTO`) atau `dump.sql` (MySQL, butuh `mysqldump`),
- `uploads/` (lampiran & foto),
- `manifest.json` (waktu, dialek, daftar tabel).

## Jadwal harian + retensi 14 hari
Skrip: `deploy/backup-cron.sh` — menjalankan backup di dalam container API ke volume `/data/backups/<tanggal>` lalu menghapus folder yang lebih tua dari 14 hari.

Pasang di crontab pengguna deploy (tanpa sudo):
```bash
crontab -l 2>/dev/null | grep -v backup-cron.sh; echo "15 2 * * * $HOME/isms/deploy/backup-cron.sh >> $HOME/isms-backup.log 2>&1"
```
```bash
(crontab -l 2>/dev/null | grep -v backup-cron.sh; echo "15 2 * * * $HOME/isms/deploy/backup-cron.sh >> $HOME/isms-backup.log 2>&1") | crontab -
```
Cek hasil: `tail ~/isms-backup.log` dan `docker compose -p isms exec api ls /data/backups`.

Backup berada di volume yang sama dengan database. Salin keluar server secara berkala (mis. `docker cp isms-api-1:/data/backups/<tanggal> .` lalu `scp`) supaya kerusakan disk tidak menghilangkan keduanya.

## Restore
1. Hentikan API: `docker compose -p isms stop api`.
2. Restore: `docker compose -p isms run --rm api npx tsx src/restore.ts --from /data/backups/<tanggal> --yes`.
3. Jalankan API: `docker compose -p isms start api`, cek `/health`.

## Uji restore
`npm run probe:backup` (bagian dari `npm run check`): backup → restore ke database kosong → jumlah baris setiap tabel dibandingkan. Hasil terakhir: 68 tabel, 724 baris identik (SQLite, 2026-10-10).

Untuk MySQL (ADR-0010) jalankan langkah yang sama dengan `DB_DIALECT=mysql` dan `MYSQL_URL` di compose; bandingkan `SELECT COUNT(*)` per tabel sebelum dan sesudah restore. Uji ini belum dijalankan karena pilot memakai SQLite.
