import type { ButtonHTMLAttributes } from "react";
import { useCallback, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useT } from "../i18n/LanguageContext";
import { toast } from "./Toast";

/** Guard satu aksi async: status pending otomatis (loading/disabled) dan
 *  spam click diabaikan. Untuk banyak aksi ber-key dalam satu halaman tetap
 *  pakai useBusy; untuk satu tombol/aksi pakai ini (atau AsyncButton). */
export function useAsyncAction(): {
  pending: boolean;
  run: <T>(fn: () => Promise<T> | T) => Promise<T | undefined>;
} {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const run = useCallback(async <T,>(fn: () => Promise<T> | T): Promise<T | undefined> => {
    if (pendingRef.current) return undefined;
    pendingRef.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, []);
  return { pending, run };
}

/** Tombol yang otomatis disabled + spinner selama aksi async berjalan.
 *  Pakai: `<AsyncButton className="btn-primary" onAction={save}>Simpan</AsyncButton>` */
export function AsyncButton({
  onAction,
  className = "btn-secondary",
  disabled = false,
  onError,
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled"> & {
  onAction: () => Promise<unknown> | unknown;
  disabled?: boolean;
  /** Handler error opsional. Tanpa ini, penolakan onAction akan muncul
   *  sebagai unhandled rejection karena pemanggil memakai `void run(...)`. */
  onError?: (err: unknown) => void;
}) {
  const { pending, run } = useAsyncAction();
  const { locale } = useT();
  return (
    <button
      type="button"
      className={className}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={() => {
        void run(onAction).catch((err: unknown) => {
          if (onError) {
            onError(err);
            return;
          }
          /* Default: laporkan ke pengguna. Menelan error di sini berarti
             tombol terlihat berhasil padahal aksinya gagal. */
          const msg =
            err instanceof Error && err.message
              ? err.message
              : locale === "en"
                ? "Action failed"
                : "Aksi gagal";
          toast(msg, "info");
          if (!(err instanceof Error)) console.error("[async-button]", err);
        });
      }}
      {...rest}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

