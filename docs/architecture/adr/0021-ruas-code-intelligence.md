# ADR-0021: RUAS sebagai alat bantu penelusuran kode untuk agen dan developer

- **Status:** Accepted
- **Tanggal:** 2026-10-17
- **Pemutus:** Ghani (permintaan langsung)

## Konteks
Pengembangan berjalan lewat AI agent berbasis kartu task (ADR-0012). Catatan klien 17 Okt menambah 37 issue, banyak yang lintas modul (WBS ↔ BOM ↔ subkon ↔ anggaran), sehingga agen perlu cara cepat dan murah mencari simbol terkait dan dampak perubahan sebelum mengedit. Repo memakai identifier campuran Indonesia/Inggris yang sulit dicari dengan pencarian teks biasa.

Sebelumnya `package.json` root punya skrip `ruas` yang menunjuk build lokal di laptop salah satu developer (`/Users/kou/Project/Graph_Draft/...`), sehingga tidak jalan di mesin lain atau di CI.

## Opsi
1. Tidak melakukan apa-apa (grep + membaca file manual).
2. Pasang `@fk0u/ruas` sebagai devDependency root (menambah `node_modules` + lockfile di root yang saat ini tidak punya dependensi).
3. Jalankan `@fk0u/ruas` lewat `npx` dengan versi dipin, tanpa menambah dependensi repo.

## Keputusan
Opsi 3. Skrip root `ruas`, `ruas:index`, `ruas:mcp` memanggil `npx -y @fk0u/ruas@1.4.0`; `.mcp.json` root mendaftarkan server MCP `ruas` untuk agen. Indeks disimpan di `.ruas/` dan memori agen di `RUAS_CONTEXT.md`, keduanya diabaikan git. RUAS berjalan offline (SQLite lokal, tanpa API cloud), jadi tidak ada kode atau data yang dikirim keluar.

## Konsekuensi
- Tidak mengubah `npm run setup`/`check`, dependensi `apps/web`/`services/api`, maupun build produksi; CI tidak terpengaruh.
- Pemakaian pertama mengunduh paket (butuh Node ≥ 22, sama dengan syarat repo).
- Naik versi = ganti angka versi di `package.json` dan `.mcp.json`.
- Membalik keputusan: hapus tiga skrip, `.mcp.json`, dan dua baris `.gitignore`.
