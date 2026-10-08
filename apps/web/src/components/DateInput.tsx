export function DateInput({
  value,
  onChange,
  ariaLabel,
  locale = "id",
  disabled = false,
  required = false,
  min,
  max,
  className = "",
}: {
  /** Nilai tanggal selalu YYYY-MM-DD (ISO), atau string kosong. */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  locale?: "id" | "en";
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
}) {
  return (
    <input
      type="date"
      lang={locale === "en" ? "en-GB" : "id-ID"}
      className={`input ${className}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
      required={required}
      min={min}
      max={max}
    />
  );
}
