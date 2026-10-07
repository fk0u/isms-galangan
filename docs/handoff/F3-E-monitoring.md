# F3-E — Monitoring Proyek (perhatian khusus klien)

Halaman: `/proyek/monitoring` (`pages/proyek/Monitoring.tsx`, 316 baris), sidebar di `layouts/AppShell.tsx`.
Estimasi: 3–4 HK. Bergantung: F3-B-06 (rumus progres), F3-B-09 (histori & foto WBS), F2-05 (izin per peran).

## Konteks
Klien ingin Monitoring berfungsi seperti **monitoring pekerjaan** harian: lihat apa yang dikerjakan, progres terbaru dengan foto, dan mana yang butuh perhatian — dengan tampilan berbeda per peran.

---

### F3-E-01 — Feed update pekerjaan dengan foto
P0 · 1,5 HK · MON-01
**Langkah.** Bagian utama: feed terbaru dari update progres WBS & WO subkon (sumber: histori F3-B-09 + SUB-04): foto, proyek, pekerjaan, progres sebelum→sesudah, oleh siapa, kapan. Filter proyek & tanggal. Tombol "Update pekerjaan" (modal yang sama dengan F3-B-09) untuk peran yang berhak.
**Kriteria.** [ ] Update dari detail proyek muncul di feed tanpa reload manual.

### F3-E-02 — Tampilan per peran
P0 · 1 HK · MON-02 · Bergantung: F2-05
**Langkah.** Direktur/manager: semua proyek + ringkasan KPI. Proyek/mekanik: hanya proyek di mana ia anggota tim/assignee, dengan tombol update. Subkon: hanya WO miliknya. Viewer klien: hanya proyek kapal miliknya, tanpa tombol aksi. Server menyaring (bukan hanya UI).

### F3-E-03 — Label "Perhatian khusus"
P1 · 1 j · MON-03
Ganti "Proyek perlu perhatian" → "Perhatian khusus", badge/kartu merah (`bg-red-50 text-red-700 border-red-200`), i18n.

### F3-E-04 — Tombol Kembali ke asal
P0 · 2 j · MON-04
**Langkah.** Saat navigasi ke `/proyek/:id`, kirim `state: { from: "/proyek/monitoring" }` atau `"/proyek"`. Tombol Kembali di `ProjectDetail` memakai `location.state.from` (fallback `/proyek`). Label ikut asal: "Kembali ke Monitoring" / "Kembali ke Manajemen Proyek".
**Kriteria.** [ ] Kedua jalur kembali ke halaman asal, termasuk setelah refresh (fallback aman).

### F3-E-05 — Highlight menu aktif di sidebar
P1 · 2 j · MON-05
Gunakan `NavLink` `isActive` (atau `matchPath`) untuk menu dan submenu; `/proyek/:id` menyorot menu asal (berdasarkan `state.from`). Berlaku untuk semua menu, bukan hanya Monitoring.
