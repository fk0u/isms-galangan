# ADR-0004: Enum peran + matriks izin di `policy.ts`

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
Q2, Q7. RBAC sekarang regex substring pada teks bebas, hanya untuk tulis; viewer membaca payroll (K-03, T-04).

## Opsi
1. Perbaiki regex.
2. Library RBAC eksternal (Casbin dsb).
3. **Enum tertutup + matriks peran × koleksi × {r,w,d} di satu modul.**

## Keputusan
Opsi 3. Peran: `developer, direktur, manager, finance, hr, procurement, gudang, proyek, mekanik, qc, subkon, equipment, drydock, viewer` (viewer = pemilik kapal, dibatasi ke proyek kapalnya). Owner untuk persetujuan Change Order = `direktur`. Frontend membaca izin dari `/api/auth/me`.

## Konsekuensi
Satu sumber kebenaran; peran baru butuh perubahan kode + migrasi. Skrip pemetaan peran lama wajib ditinjau manusia.
