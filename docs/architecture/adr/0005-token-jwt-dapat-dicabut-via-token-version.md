# ADR-0005: Token JWT dapat dicabut via `token_version`

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
T-01: logout/nonaktif/turun peran tidak berlaku selama 8 jam.

## Opsi
1. Access 15 menit + refresh token.
2. **`token_version` di users, dicek per request (cache 30 dtk).**
3. Session table penuh.

## Keputusan
Opsi 2; refresh token dipertimbangkan setelah pilot.

## Konsekuensi
Satu query per user per 30 dtk; peran & cabang dibaca dari DB, bukan token.
