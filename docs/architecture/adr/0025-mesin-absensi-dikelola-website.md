# ADR-0025: Mesin absensi dikelola dari website (Fingerspot FK realtime)

- **Status:** Accepted
- **Tanggal:** 2026-11-16
- **Pemutus:** CTO / pemilik produk (permintaan integrasi Fingerspot Revo WFV-208BNC tanpa cloud berbayar)

## Konteks
Mesin Fingerspot Revo terhubung langsung ke VPS (nginx port 8013 → `/fkweb`).
Protokolnya ditangkap dari mesin asli: mesin selalu `POST /` dengan header
`request_code`, `trans_id`, `dev_id`, lalu menanyakan perintah (`receive_cmd`)
kira-kira setiap 20 detik.

Ada dua kebutuhan dari lapangan:
1. ID user di mesin (1, 2, 3, ...) **tidak bisa diubah**, jadi tidak bisa
   disamakan dengan NIK karyawan.
2. Mesin harus bisa dikelola dari website: user, jam, restart, dan
   perekaman biometrik.

## Opsi
1. Mencocokkan scan ke karyawan otomatis lewat nama. Ditolak: nama di mesin
   disingkat atau kembar, sehingga absen bisa salah orang tanpa ada yang sadar
   (dan absensi dipakai untuk payroll).
2. Mengganti ID di mesin agar sama dengan NIK. Ditolak: tidak bisa dari mesin,
   dan semua biometrik harus didaftarkan ulang.
3. Menyimpan "ID mesin" di data karyawan, dihubungkan manual oleh HR dengan
   saran dari kemiripan nama, ditambah antrean perintah server → mesin.

## Keputusan
Opsi 3.
- `employees.data.devicePin` = ID user di mesin. `applyPunches` mencocokkan
  `devicePin` dulu, lalu NIK sebagai cadangan.
- Scan dari ID yang belum terhubung tetap diakui ke mesin dan dicatat di
  `audit_log`. Saat HR menghubungkan ID itu, scan tersebut diproses ulang
  (idempoten, karena tap "auto" yang sama tidak mengubah jam).
- Tabel sampingan (migrasi 022, bukan koleksi CRUD):
  - `attendance_device_status`: kapan terakhir online dan info firmware.
  - `attendance_device_users`: ID dan nama saja, **tanpa biometrik**.
  - `attendance_device_commands`: antrean perintah.
- Perintah dikirim sebagai jawaban `receive_cmd` (`trans_id` = id perintah,
  `cmd_code`, body uint32 LE + JSON). Hasil dari mesin dicocokkan lewat
  `trans_id`. Data biometrik disensor sebelum disimpan.
- Konsol perintah mentah hanya untuk developer/direktur selama kode perintah
  firmware masih diuji. Aksi HR yang bertipe (restart, sinkron jam, kirim
  user, rekam biometrik) ditambahkan setelah kodenya terbukti di mesin asli.

## Konsekuensi
- HR menghubungkan ID mesin sekali per karyawan. Karyawan baru yang dibuat
  dari website nantinya terhubung otomatis.
- Perintah hanya sampai ketika mesin online. Perintah terkirim yang tidak
  dijawab dalam 5 menit ditandai `timeout`.
- Cara membalik: hapus rute `/api/attendance/devices/*/commands` dan
  pemanggilan `takeNextCommand` di `fkweb.ts`. `devicePin` boleh tetap ada
  (field JSON opsional).
