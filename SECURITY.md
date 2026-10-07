# Security Policy

## Status
Prototype. Audit teknis 6 Okt 2026 menemukan celah otorisasi yang **sedang diperbaiki** di Fase 2 ([rencana](docs/architecture/security-plan.md), [task](docs/handoff/F2-keamanan.md)). Jangan memakai versi ini dengan data riil sebelum Fase 2 selesai dan security probe di CI hijau.

## Melaporkan celah
Jangan membuka issue publik. Hubungi owner repo melalui GitHub (pesan privat / Security Advisory "Report a vulnerability"). Sertakan langkah reproduksi dan dampak. Kami merespons dalam 3 hari kerja.

## Aturan untuk kontributor
- Tidak ada secret, kredensial, atau data pribadi/keuangan riil di repo (repo publik).
- Otorisasi selalu di server; UI hanya menyembunyikan tombol.
- Default fail-closed: ragu → tolak.
- Setiap perbaikan keamanan disertai kasus di security probe (`services/api/scripts/security-probe.ts`, setelah F1-05).
- Data pribadi karyawan (KTP, ijazah, gaji) hanya untuk peran `hr`/`direktur`/`developer` (UU PDP).
