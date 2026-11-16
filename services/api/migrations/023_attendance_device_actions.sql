-- ADR-0025 lanjutan: aksi HR ke mesin absensi.
-- meta = konteks perintah di sisi server (mis. karyawan yang akan dihubungkan), tidak dikirim ke mesin.
ALTER TABLE attendance_device_commands ADD COLUMN meta TEXT;
-- stats = hasil GET_DEVICE_STATUS terakhir (jumlah user, sidik jari, wajah, log).
ALTER TABLE attendance_device_status ADD COLUMN stats TEXT;
