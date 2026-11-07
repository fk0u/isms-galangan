import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { n_misc } from "../../i18n/n_misc";

import { VALIDATE_EVENT } from "../modals/Modal";

/** Field form (catatan CTO 21 Okt: sistem validasi form).
 *  - `required`: label diberi *, dan saat tombol utama modal ditekan field ini
 *    memeriksa sendiri isiannya; kosong = garis merah + "<label> wajib diisi",
 *    penyimpanan dibatalkan (lihat Modal). Tanda hilang begitu diisi.
 *  - `error`: pesan dari validasi halaman (aturan selain wajib isi), tampil
 *    dengan gaya yang sama dan menggantikan hint. */
export function Field({
  label,
  children,
  hint,
  required,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
  error?: string | null;
}) {
  const { locale } = useT();
  const ref = useRef<HTMLLabelElement>(null);
  const [autoErr, setAutoErr] = useState("");
  useEffect(() => {
    const root = required ? ref.current?.closest('[role="dialog"]') : null;
    if (!root) return;
    const onValidate = (ev: Event) => {
      const ctl = ref.current?.querySelector<HTMLInputElement>('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea');
      if (!ctl || ctl.disabled || String(ctl.value ?? "").trim() !== "") return;
      setAutoErr(n_misc[locale === "en" ? "en" : "id"].fieldRequired.replace("{n}", label));
      (ev as CustomEvent<{ invalid: number }>).detail.invalid += 1;
    };
    root.addEventListener(VALIDATE_EVENT, onValidate);
    return () => root.removeEventListener(VALIDATE_EVENT, onValidate);
  }, [required, label, locale]);
  const shown = error || autoErr;
  return (
    <label
      ref={ref}
      className={`block ${shown ? "[&_.input]:!border-rose-500 [&_.input]:!ring-rose-200" : ""}`}
      aria-invalid={shown ? true : undefined}
      onInputCapture={() => { if (autoErr) setAutoErr(""); }}
      onChangeCapture={() => { if (autoErr) setAutoErr(""); }}
    >
      <span className="label">{label}{required && <span className="text-rose-600" aria-hidden> *</span>}</span>
      {children}
      {shown
        ? <span role="alert" className="mt-1 block text-[11px] font-medium text-rose-600">{shown}</span>
        : hint && <span className="mt-1 block text-[11px] text-steel-400">{hint}</span>}
    </label>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

/* ============ PENCARIAN DAFTAR ============ */
