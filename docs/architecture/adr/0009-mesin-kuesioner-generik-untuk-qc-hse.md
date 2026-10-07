# ADR-0009: Mesin kuesioner generik untuk QC & HSE

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
QC-02/03; isi K3 menunggu diskusi dengan K3 kapal (Q13).

## Opsi
1. Form hardcode per inspeksi.
2. **Template kuesioner berbobot + respons + skor dihitung server.**

## Keputusan
Opsi 2 (`checklistTemplates`, `checklistResponses`). Isi K3 menyusul tanpa coding.

## Konsekuensi
Butuh editor template sederhana.
