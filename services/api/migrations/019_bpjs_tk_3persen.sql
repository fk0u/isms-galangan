-- Notulen 23 Okt (#279): BPJS Ketenagakerjaan karyawan 3% (JHT 2% + JP 1%).
-- Hanya mengganti nilai bawaan lama 2, nilai lain yang sudah diatur pengguna dibiarkan.
UPDATE settings SET data = REPLACE(data, '"value":2,', '"value":3,') WHERE id = 'SET-BPJSTK';
