import type { InputHTMLAttributes } from "react";


/** B2: input uang berformat titik pemisah ribuan.
 *
 * `type="text"` supaya browser tidak membuang titik pemisah ribuan.
 * Tampilan: "1.000.000". Parser di commit memakai parseRupiah
 * (hanya mengambil digit). Caller yang butuh angka memanggil
 * parseRupiah(value) saat menyimpan. */
export function MoneyInput({ value, onChange, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (v: string) => void;
}) {
  const format = (raw: string): string => {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits === "") return "";
    return Number(digits).toLocaleString("id-ID");
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={format(value)}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
      {...rest}
    />
  );
}
