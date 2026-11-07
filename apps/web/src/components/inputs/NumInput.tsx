import type { InputHTMLAttributes, KeyboardEvent as ReactKeyboardEvent } from "react";


function stripLeadingZero(v: string): string {
  if (!v) return v;
  // "0" sendiri adalah nilai sah (retensi/denda/diskon 0%) - hanya nol di depan angka lain yang dibuang.
  if (v.includes(".")) return v;
  return v.replace(/^0+(?=\d)/, "");
}

/** Input angka terkunci: blokir e/E/+/- di keyboard (+ titik/koma bila integer).
 * Nol di depan dibersihkan otomatis. Validasi Number() di handler tetap jaring kedua. */
export function NumInput({ integer = false, allowNegative = false, onKeyDown, onChange, inputMode, ...rest }: InputHTMLAttributes<HTMLInputElement> & { integer?: boolean; allowNegative?: boolean }) {
  const block = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key) && !(e.key === "-" && allowNegative)) {
      e.preventDefault();
      return;
    }
    if (integer && (e.key === "." || e.key === ",")) {
      e.preventDefault();
      return;
    }
    onKeyDown?.(e);
  };
  const clean = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const next = stripLeadingZero(el.value);
    if (next !== el.value) el.value = next;
    onChange?.(e);
  };
  return (
    <input
      type="number"
      inputMode={inputMode ?? (integer ? "numeric" : "decimal")}
      onKeyDown={block}
      onChange={clean}
      {...rest}
    />
  );
}

/* ============ T O M B O L   A K S I   B A R I S ============ */
