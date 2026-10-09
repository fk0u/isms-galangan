# ADR-0014: Design system "Minimal Modern" (menggantikan ADR-0013)

- **Status:** Accepted
- **Tanggal:** 2026-10-09
- **Pemutus:** Kou (owner)
- **Menggantikan:** [ADR-0013](0013-design-system-swiss-industrial.md)

## Konteks
Setelah redesain Swiss Industrial (ADR-0013) live, owner meminta UI "lebih minimalis dan lebih modern" dan siap dipresentasikan ke klien, dengan prinsip design engineering Emil Kowalski. Palet putih netral + aksen merah tetap diminta. Klien akan membaca status sekilas di dashboard dan tabel, dan pengguna lapangan memakai tablet.

## Opsi
1. Pertahankan Swiss Industrial.
2. **Minimal modern lewat token & komponen inti** (mekanisme sama dengan ADR-0013): radius halus, bayangan tipis berlapis, sentence case, status fungsional lembut, gerak halus.
3. Adopsi pustaka UI baru (shadcn/Radix) — terlalu besar untuk jendela demo.

## Keputusan
Opsi 2. Ringkas:
- Netral zinc (`#09090B`…`#FAFAFA`), kanvas `#FAFAFA`, kartu putih.
- Merah `#E61919` tetap satu-satunya warna merek; hijau & kuning hanya untuk status (lembut, selalu dengan titik + teks); biru/ungu tetap dipetakan ke abu.
- Radius 6–14px, bayangan `soft`/`lift`, Inter sentence case, mono hanya untuk ID.
- Gerak: press `scale(0.97)`, modal dari `scale(0.96)` dengan `cubic-bezier(0.23,1,0.32,1)` (keluar lebih cepat), garis tab `layoutId`, hover hanya untuk pointer halus, `prefers-reduced-motion` dihormati.
Detail lengkap di `DESIGN.md`.

## Konsekuensi
- Seluruh 28 halaman ikut berubah tanpa disentuh satu per satu (alias token).
- Status hijau kembali (berbeda dari ADR-0013) karena membantu klien membaca dashboard.
- Primitif industrial (`.hazard-stripe`, `.grid-ruled` bersudut, mono huruf kapital) dinonaktifkan/dilunakkan; nama kelas dipertahankan agar kode lama tidak rusak — dibersihkan di F6.
- PDF server belum mengikuti sistem ini.
- Membalik: kembalikan blok `@theme`/`colors` dan kelas komponen (satu commit).
