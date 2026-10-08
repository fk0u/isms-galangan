import { useMemo } from "react";
import { EntityPicker } from "./ui";
import type { PickerOption } from "./ui";

export interface SearchSelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

export function mapSearchSelectOptions(options: readonly SearchSelectOption[]): PickerOption[] {
  return options.map(({ value, label, subLabel }) => ({ value, label, hint: subLabel }));
}

/** Pilihan entitas yang dapat dicari, dinavigasi dengan keyboard, dan dibaca labelnya. */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  emptyText,
  className,
  disabled,
  allowCustom,
  required,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  required?: boolean;
  invalid?: boolean;
}) {
  const pickerOptions = useMemo(
    () => mapSearchSelectOptions(options),
    [options],
  );

  return (
    <EntityPicker
      value={value}
      onChange={onChange}
      options={pickerOptions}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      emptyText={emptyText}
      className={className}
      disabled={disabled}
      allowCustom={allowCustom}
      required={required}
      invalid={invalid}
    />
  );
}
