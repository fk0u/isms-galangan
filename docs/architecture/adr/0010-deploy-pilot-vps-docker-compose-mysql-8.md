# ADR-0010: Deploy pilot: VPS + Docker Compose + MySQL 8

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
Q6. Belum ada resep deploy (T-07).

## Opsi
1. On-premise di galangan.
2. PaaS.
3. **VPS + Docker Compose (api, web/nginx, mysql) + Caddy TLS.**

## Keputusan
Opsi 3. Backup harian `npm run backup`, retensi 14 hari.

## Konsekuensi
Biaya VPS bulanan kecil; bisa dipindah on-prem dengan compose yang sama.
