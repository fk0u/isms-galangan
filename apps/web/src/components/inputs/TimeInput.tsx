import { useEffect, useState } from "react";
import { norm24 } from "../../utils/time24";
import { maskTimeDigits, shouldEmitTime } from "../../utils/timeMask";


/* ============ I N P U T   J A M   2 4   J A M ============ */

/**
 * Input jam 24 jam - satu-satunya cara mengetik jam di aplikasi ini.
 *
 * Kenapa komponen, dan kenapa BUKAN `input[type=time]`:
 *
 * 1. `lang="id-ID"` TIDAK memaksa format 24 jam. Chrome dan Firefox merender
 *    `input[type=time]` mengikuti locale BROWSER, bukan atribut `lang`, jadi di
 *    tablet ber-locale Inggris jam 5 sore tampil sebagai "5:00 PM". Enam input
 *    seperti itu pernah tersebar di tiga halaman (Absensi, Equipment,
 *    KaryawanDetail) dan semuanya gagal dengan cara yang sama.
 * 2. `type=text` + masking memberi jaminan yang diminta: yang tampil selalu
 *    "HH:MM", apa pun locale perangkatnya. Ini yang client minta - "strict".
 *
 * Masking bukan hiasan: pengguna ketik "1730" lalu hasilnya "17:30" di field
 * yang sama. Nilai yang tidak bisa jadi jam ditolak saat blur, bukan disimpan
 * setengah jadi - `norm24` sudah menolak (bukan menjepit) nilai di luar rentang.
 */
export function TimeInput({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "HH:MM",
  ariaLabel,
}: {
  /** Selalu "HH:MM" atau string kosong. */
  value: string;
  /** Menerima hasil masking; string kosong berarti pengguna mengosongkan. */
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(value);
  /* Nilai dari luar (tarik ulang, undo) harus mengalahkan draf lokal, tapi
     hanya kalau keduanya memang berbeda - kalau tidak, ketik pengguna akan
     dihapus setiap render. */
  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      placeholder={placeholder}
      className={`input font-mono tabular-nums ${className}`}
      value={draft}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => {
        const masked = maskTimeDigits(e.target.value);
        setDraft(masked);
        const emitted = shouldEmitTime(masked);
        /* `null` berarti belum boleh naik ke atas - draf lokal tetap berubah
           supaya angka yang diketik tidak hilang sebelum sempat diketik sisanya. */
        if (emitted !== null) onChange(emitted);
      }}
      onBlur={() => {
        const norm = norm24(draft);
        if (norm === "") setDraft("");
        else {
          setDraft(norm);
          onChange(norm);
        }
      }}
    />
  );
}

/* ============ F I L E U P L O A D   B U T T O N ============ */
