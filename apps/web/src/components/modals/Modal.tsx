import { AsyncButton } from "../ui";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { n_misc } from "../../i18n/n_misc";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { toast } from "../Toast";


/* ============ M O D A L / P O P U P ============ */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
  extraWide = false,
  fullWidth = false,
  fullScreen = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  extraWide?: boolean;
  /** Tabel lebar (checklist BOM): hampir selebar layar. */
  fullWidth?: boolean;
  /** Modal layar penuh (RAB, editor kompleks). */
  fullScreen?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { locale } = useT();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const root = dialogRef.current;
      if (!root) return;
      if (root.contains(document.activeElement) && document.activeElement !== root) return;
      const target =
        root.querySelector<HTMLElement>("input, select, textarea") ??
        root.querySelector<HTMLElement>("button");
      (target ?? root)?.focus();
    }, 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      document.body.style.overflow = "";
      prevActive?.focus?.();
    };
  }, [open]);

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            className="fixed inset-0 bg-navy-900/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`relative flex max-h-[86vh] w-full flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-2xl ${
              fullScreen ? "sm:max-w-6xl" : fullWidth ? "sm:max-w-[min(96vw,90rem)]" : extraWide ? "sm:max-w-5xl" : wide ? "sm:max-w-3xl" : "sm:max-w-lg"
            }`}
            /* Masuk dari scale 0.96 (tidak pernah dari 0), ease-out kuat;
               keluar lebih cepat dari masuk. Modal tetap berpusat. */
            initial={{ opacity: 0, transform: "translateY(8px) scale(0.96)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)", transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transform: "translateY(4px) scale(0.98)", transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] } }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-steel-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-[-0.01em] text-navy-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-[13px] text-steel-500">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-steel-400 transition-colors hover:bg-steel-100 hover:text-navy-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div
                className="flex items-center justify-end gap-2 border-t border-steel-100 bg-steel-50/70 px-5 py-3"
                onClickCapture={(e) => {
                  /* Tombol utama (simpan) memeriksa semua Field `required` dulu.
                     Ada yang kosong: klik dibatalkan, fokus ke isian pertama. */
                  const btn = (e.target as HTMLElement).closest("button");
                  const root = dialogRef.current;
                  if (!btn || !root || btn.disabled || !btn.matches(".btn-primary, .btn-primary-gradient, [data-submit]") || btn.matches("[data-novalidate]")) return;
                  const ev = new CustomEvent(VALIDATE_EVENT, { detail: { invalid: 0 } });
                  root.dispatchEvent(ev);
                  if (ev.detail.invalid === 0) return;
                  e.stopPropagation();
                  e.preventDefault();
                  toast(n_misc[locale === "en" ? "en" : "id"].formInvalid, "info");
                  requestAnimationFrame(() => root.querySelector<HTMLElement>('label[aria-invalid="true"] input, label[aria-invalid="true"] select, label[aria-invalid="true"] textarea')?.focus());
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof document === "undefined" || !document?.body) return content;
  return createPortal(content, document.body);
}

export function ConfirmModal({
  open,
  title,
  desc,
  confirmLabel = "Ya, lanjutkan",
  danger = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  desc: string;
  confirmLabel?: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<unknown> | unknown;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>
            Batal
          </button>
          <AsyncButton
            className={danger ? "btn-danger" : "btn-primary"}
            disabled={confirmDisabled}
            title={confirmDisabled ? "Diblokir - masih dipakai" : undefined}
            onAction={onConfirm}
          >
            {confirmLabel}
          </AsyncButton>
        </>
      }
    >
      <p className="text-sm text-steel-600">{desc}</p>
    </Modal>
  );
}

/** Event yang dikirim Modal ke isinya saat tombol simpan ditekan. */
export const VALIDATE_EVENT = "isms:validate";
