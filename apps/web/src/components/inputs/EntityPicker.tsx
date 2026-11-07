import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { X } from "lucide-react";


/* ============ PEMILIH ENTITAS (COMBOBOX) ============ */

export interface PickerOption {
  value: string;
  label: string;
  hint?: string;
}

export function EntityPicker({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  emptyText,
  className = "",
  disabled = false,
  allowCustom = false,
  required = false,
  invalid = false,
  onOpenChange,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly PickerOption[];
  placeholder?: string;
  ariaLabel?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  required?: boolean;
  invalid?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useT();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpenState] = useState(false);
  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    setOpenState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (next !== prev) onOpenChange?.(next);
      return next;
    });
  };
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.hint ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        if (allowCustom && query.trim() !== "") {
          commit(query.trim());
        } else {
          setOpen(false);
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, allowCustom, query]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      setActive((i) => (filtered.length === 0 ? 0 : Math.min(i + 1, filtered.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      const pick = open ? filtered[active] : undefined;
      if (pick) {
        e.preventDefault();
        commit(pick.value);
        return;
      }
      if (allowCustom && query.trim() !== "") {
        e.preventDefault();
        commit(query.trim());
      }
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        e.stopPropagation();
        setOpen(false);
        setQuery("");
      }
      return;
    }
    if (open) setActive(0);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        disabled={disabled}
        className={`input w-full ${open ? "pr-8" : ""} ${invalid ? "border-rose-300" : ""}`}
        placeholder={placeholder}
        value={open ? query : selected ? selected.label : value}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          if (!open) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {value !== "" && !disabled && (
        <button
          type="button"
          aria-label={t.common.reset}
          onClick={() => {
            setQuery("");
            commit("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-steel-400 hover:bg-steel-100 hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-steel-200 bg-white py-1 shadow-lift"
        >
          {allowCustom && query.trim() !== "" && !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase() || o.value.toLowerCase() === query.trim().toLowerCase()) && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(query.trim());
              }}
              className="cursor-pointer border-b border-steel-100 bg-ocean-50/50 px-3 py-2 text-sm text-ocean-700 hover:bg-ocean-100/60"
            >
              <span className="block font-medium truncate">+ "{query.trim()}"</span>
            </li>
          )}
          {filtered.length === 0 && (!allowCustom || query.trim() === "") && (
            <li className="px-3 py-2 text-xs text-steel-400">{emptyText ?? t.common.listSearchEmpty}</li>
          )}
          {filtered.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(o.value);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === active ? "bg-ocean-50 text-navy-900" : "text-steel-700"
              }`}
            >
              <span className="block truncate">{o.label}</span>
              {o.hint !== undefined && o.hint !== "" && (
                <span className="block truncate text-[11px] text-steel-400">{o.hint}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============ SORTABLE TABLE ============ */
