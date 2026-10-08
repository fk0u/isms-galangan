import { TimeInput } from "./ui";
import { norm24 } from "../utils/time24";

/** Input jam yang menjaga kontrak nilai HH:MM pada komponen bersama. */
export function TimeInput24({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <TimeInput
      value={norm24(value)}
      onChange={(next) => onChange(norm24(next))}
      ariaLabel={ariaLabel}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  );
}
