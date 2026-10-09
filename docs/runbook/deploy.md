# Runbook — Deploy Pilot (F5-01, ADR-0010)

Target: satu VPS Linux (Ubuntu 22.04/24.04, ≥ 2 vCPU, 4 GB RAM, 20 GB disk) dengan Docker. Waktu: ±30 menit.

## Arsitektur
```
Internet ──443──▶ caddy (TLS Let's Encrypt, HSTS) ──▶ web (nginx: SPA + header keamanan)
                                                         └─ /api, /files, /health ──▶ api (Fastify, SQLite di volume isms-data)
```
Database pilot: **SQLite di volume Docker `isms-data`** (jalur yang diuji CI). MySQL 8 tetap opsi (ADR-0010) setelah ada uji otomatis MySQL; ganti lewat `DB_DIALECT=mysql` + `MYSQL_URL`.

## 1. Prasyarat server
- DNS: A record `ISMS_DOMAIN` → IP server (cek `dig +short <domain>`).
- Port 80 & 443 terbuka; port lain ditutup (`ufw allow 22,80,443/tcp && ufw enable`).
- Docker Engine + compose plugin: `curl -fsSL https://get.docker.com | sh`.

## 2. Pasang
```bash
git clone https://github.com/fk0u/isms-galangan.git /opt/isms && cd /opt/isms
cp deploy/.env.example deploy/.env && chmod 600 deploy/.env
```
Isi `deploy/.env`: `ISMS_DOMAIN`, `ACME_EMAIL`, `WEB_ORIGINS=https://<domain>`, `JWT_SECRET` (`openssl rand -hex 32`), dan `SEED_PASSWORD_*` (`openssl rand -base64 18`).
```bash
docker compose --env-file deploy/.env up -d --build
docker compose --env-file deploy/.env ps
```
API menjalankan migrasi otomatis saat start.

## 3. Isi data demo (sekali)
```bash
docker compose --env-file deploy/.env exec api npm run seed
docker compose --env-file deploy/.env exec api npm run seed:bulk
```
Password akun demo = nilai `SEED_PASSWORD_<PERAN>` di `deploy/.env` (bila kosong, dicetak sekali di output seed — simpan).

## 4. Verifikasi
- `curl -fsS https://<domain>/health` → `"status":"ok"`.
- Buka `https://<domain>`, login `direktur@galangan.com`, buka Dashboard, Proyek, Drydock, Inventori.
- `curl -sI https://<domain> | grep -i strict-transport` → ada header HSTS.

## 5. Update versi
```bash
cd /opt/isms && git pull && docker compose --env-file deploy/.env up -d --build
```
Rollback: `git checkout <commit-sebelumnya> && docker compose --env-file deploy/.env up -d --build`. Data aman di volume.

## 6. Backup (F5-02 — minimal sampai runbook backup lengkap)
```bash
docker compose --env-file deploy/.env exec api npm run backup -- --out /data/backups/$(date +%F)
docker cp $(docker compose --env-file deploy/.env ps -q api):/data/backups ./backups-$(date +%F)
```
Simpan salinan di luar server.

## 7. Setelah demo / sebelum data riil
- `ALLOW_SEED_LOGIN=false`, buat akun riil per peran, restart `api`.
- Jangan masukkan data riil sebelum audit ulang F5-05 lulus.
