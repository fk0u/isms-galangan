/* Select aplikasi - pengganti <select> bawaan browser (catatan klien 18 Nov:
 * "jangan pakai bawaan browser, pakai komponen aplikasi").
 *
 * API sengaja SAMA dengan <select>: anak <option value>, `value`, dan
 * `onChange(e)` dengan `e.target.value` - jadi pemakaian lama cukup diganti
 * nama tag. Popup digambar sendiri (bukan daftar OS yang tampil gelap) lewat
 * portal + posisi fixed, supaya tidak terpotong tabel ber-overflow.
 *
 * Aksesibilitas: tombol role="combobox" + listbox; Panah atas/bawah, Home/End,
 * Enter/Spasi memilih, Escape menutup, ketik huruf melompat ke opsi.
 * <select> tersembunyi tetap ada agar validasi Field (wajib isi) & form tetap jalan. */
import { Children, Fragment, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, KeyboardEvent, ReactNode, SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

interface Opt { value: string; label: string; disabled: boolean }

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** Kumpulkan <option> dari anak (termasuk array hasil .map dan Fragment). */
function collect(children: ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: unknown; children?: ReactNode; disabled?: boolean };
    if (child.type === Fragment) { collect(props.children, out); return; }
    if (child.type === "option") {
      const label = textOf(props.children);
      out.push({ value: props.value === undefined ? label : String(props.value), label, disabled: Boolean(props.disabled) });
    }
  });
  return out;
}

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple">;

export function Select({ children, value, onChange, className = "", disabled, id, title, required, name, style, ...rest }: Props) {
  const options = useMemo(() => collect(children), [children]);
  const current = String(value ?? "");
  const selected = options.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;
  const ariaLabel = (rest as Record<string, unknown>)["aria-label"] as string | undefined;
  const ariaInvalid = (rest as Record<string, unknown>)["aria-invalid"] as boolean | undefined;

  const emit = (v: string): void => {
    if (v === current) return;
    const target = { value: v, name: name ?? "" };
    onChange?.({ target, currentTarget: target } as unknown as ChangeEvent<HTMLSelectElement>);
  };
  const place = (): void => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 240 && r.top > below;
    setPos({ position: "fixed", left: r.left, width: Math.max(r.width, 160), zIndex: 1000, ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }), maxHeight: Math.min(288, (up ? r.top : below) - 12) });
  };
  const openList = (): void => {
    if (disabled) return;
    place();
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };
  const choose = (i: number): void => {
    const o = options[i];
    if (!o || o.disabled) return;
    emit(o.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  useLayoutEffect(() => { if (open) place(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    const onMove = (): void => place();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("resize", onMove); window.removeEventListener("scroll", onMove, true); };
  }, [open]);
  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const step = (from: number, dir: 1 | -1): number => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (!options[i]?.disabled) return i;
    return from;
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { openList(); return; }
      setActive((a) => step(a, e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Home" || e.key === "End") {
      if (!open) return;
      e.preventDefault();
      setActive(e.key === "Home" ? step(-1, 1) : step(options.length, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active); else openList();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab" && open) {
      setOpen(false);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Ketik huruf: lompat ke opsi yang labelnya diawali teks yang diketik.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) { if (open) setActive(i); else emit(options[i]!.value); }
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        aria-invalid={ariaInvalid}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        title={title}
        disabled={disabled}
        style={style}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${className} inline-flex items-center justify-between gap-2 text-left ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span className={`min-w-0 truncate ${selected ? "" : "text-steel-400"}`}>{selected?.label ?? (current || " ")}</span>
        <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 text-steel-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {/* Untuk validasi Field (wajib isi) & form: nilai tetap terbaca sebagai <select>. */}
      <select aria-hidden tabIndex={-1} className="sr-only" name={name} required={required} disabled={disabled} value={current} onChange={() => undefined}>
        <option value={current}>{selected?.label ?? current}</option>
      </select>
      {open && createPortal(
        <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} style={pos}
          className="overflow-auto rounded-xl border border-steel-200 bg-white py-1 text-sm shadow-lift">
          {options.map((o, i) => (
            <li
              key={`${o.value}-${i}`}
              id={`${listId}-${i}`}
              data-i={i}
              role="option"
              aria-selected={o.value === current}
              aria-disabled={o.disabled || undefined}
              onMouseDown={(e) => { e.preventDefault(); choose(i); }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center justify-between gap-2 px-3 py-2 ${o.disabled ? "cursor-not-allowed text-steel-300" : "cursor-pointer"} ${i === active && !o.disabled ? "bg-ocean-50 text-navy-900" : "text-steel-700"}`}
            >
              <span className="min-w-0 truncate">{o.label}</span>
              {o.value === current && <Check aria-hidden className="h-4 w-4 shrink-0 text-ocean-600" />}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  );
}
