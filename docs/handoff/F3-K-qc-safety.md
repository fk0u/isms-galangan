# F3-K — QC & Safety

Halaman: `/qc-safety` (`pages/qc/QCSafety.tsx`, 2.418 baris), teks `i18n/n_qc.ts`. Koleksi: `inspections`, `ncr`, `incidents`, `toolbox`, `walks`, `auditPlans`, `drawings`.
Tab saat ini: Drawing, Inspeksi (ITP), NCR, HSE Operasional, Insiden, Sertifikat.
Estimasi: 4–5 HK. **Catatan:** QC-04 — detail HSE akan dibahas dengan K3 kapal (Q13); bangun mesin kuesioner yang fleksibel agar isinya bisa diganti tanpa coding.

---

### F3-K-01 — Hapus tab Drawing
P1 · 1 j · QC-01
Sembunyikan tab (data `drawings` tetap; preview drawing di modul lain bila ada tetap jalan).

### F3-K-02 — Mesin kuesioner & skoring
P0 · 1,5 HK · QC-02, QC-03
**Model.**
```
checklistTemplates (koleksi baru, prefix "CLT")
  data: { name, scope: "QC"|"HSE", target: "pekerjaan"|"pekerja", sections: [
    { title, items: [ { id, text, type: "ya_tidak"|"skala_1_5"|"pilihan"|"teks", weight, options? } ] } ] }
checklistResponses (koleksi baru, prefix "CLR")
  data: { templateId, projectId?, wbsId?, subcontractorId?, employeeId?, answers: {itemId: value},
          score (0-100, dihitung server), inspectorId, at, photos[] }
```
Skor = Σ(nilai ternormalisasi × bobot) / Σ bobot × 100. Hitung di server (`services/api/src/scoring.ts`) + probe.
Editor template sederhana di Pengaturan (direktur/qc): tambah section/item, bobot.

### F3-K-03 — Inspeksi per proyek
P0 · 1,5 HK · QC-02
Tab Inspeksi: list proyek aktif → klik → daftar pekerjaan WBS dengan subkon & pekerja (dari assign F3-B-09) → "Mulai inspeksi" memilih template QC → isi kuesioner → skor tampil + riwayat inspeksi per pekerjaan. Skor < ambang (setting) ⇒ tawarkan buat NCR terisi otomatis.

### F3-K-04 — HSE: kuesioner pekerja
P1 · 1 HK · QC-03
Tab HSE: daftar kuesioner HSE untuk pekerja (template scope HSE, target pekerja); pengisian per pekerja (bisa via link/QR yang sama dengan mekanisme HR-06); rekap skor per pekerja & per subkon.
