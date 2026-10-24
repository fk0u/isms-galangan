import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from "lucide-react";

export type ToastTone = "success" | "info" | "warning" | "error" | "danger";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: number | string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  tone?: ToastTone;
}

export interface ToastItem {
  id: number | string;
  message: string;
  title?: string;
  tone: ToastTone;
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
  createdAt: number;
}

let toastSeq = 0;

/**
 * Menerbitkan notifikasi toast ke seluruh aplikasi.
 * Kompatibel penuh dengan signature lama: toast(message, "success" | "info")
 * serta mendukung options tambahan dan method pembantu (toast.success, toast.error, dll).
 */
export function toast(
  message: string,
  toneOrOptions?: ToastTone | ToastOptions,
  extraOptions?: ToastOptions,
): number | string {
  let tone: ToastTone = "success";
  let opts: ToastOptions = {};

  if (typeof toneOrOptions === "string") {
    tone = toneOrOptions;
    if (extraOptions) opts = extraOptions;
  } else if (typeof toneOrOptions === "object" && toneOrOptions !== null) {
    opts = toneOrOptions;
    if (opts.tone) tone = opts.tone;
  }

  const id = opts.id ?? ++toastSeq;
  const duration = opts.duration ?? 3500;
  const dismissible = opts.dismissible ?? true;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("isms:toast", {
        detail: {
          id,
          message,
          title: opts.title,
          tone: tone === "danger" ? "error" : tone,
          duration,
          dismissible,
          action: opts.action,
        },
      }),
    );
  }

  return id;
}

toast.success = (message: string, options?: ToastOptions) =>
  toast(message, { ...options, tone: "success" });

toast.info = (message: string, options?: ToastOptions) =>
  toast(message, { ...options, tone: "info" });

toast.warning = (message: string, options?: ToastOptions) =>
  toast(message, { ...options, tone: "warning" });

toast.error = (message: string, options?: ToastOptions) =>
  toast(message, { ...options, tone: "error" });

toast.danger = (message: string, options?: ToastOptions) =>
  toast(message, { ...options, tone: "error" });

toast.dismiss = (id?: number | string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("isms:toast:dismiss", {
        detail: { id },
      }),
    );
  }
};

toast.promise = async <T,>(
  promise: Promise<T>,
  msgs: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
  options?: ToastOptions,
): Promise<T> => {
  const toastId = toast(msgs.loading, {
    ...options,
    tone: "info",
    duration: 0,
    dismissible: false,
  });

  try {
    const res = await promise;
    toast.dismiss(toastId);
    const msg = typeof msgs.success === "function" ? msgs.success(res) : msgs.success;
    toast.success(msg, options);
    return res;
  } catch (err) {
    toast.dismiss(toastId);
    const msg = typeof msgs.error === "function" ? msgs.error(err) : msgs.error;
    toast.error(msg, options);
    throw err;
  }
};

const TONE_CONFIG: Record<
  "success" | "info" | "warning" | "error",
  {
    icon: typeof CheckCircle2;
    iconColor: string;
    borderColor: string;
    badgeBg: string;
    progressBar: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-800",
    progressBar: "bg-emerald-500",
  },
  info: {
    icon: Info,
    iconColor: "text-ocean-500",
    borderColor: "border-ocean-200",
    badgeBg: "bg-ocean-50 text-ocean-800",
    progressBar: "bg-ocean-500",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    borderColor: "border-amber-200",
    badgeBg: "bg-amber-50 text-amber-800",
    progressBar: "bg-amber-500",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-rose-500",
    borderColor: "border-rose-200",
    badgeBg: "bg-rose-50 text-rose-800",
    progressBar: "bg-rose-500",
  },
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: number | string) => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const normTone = item.tone === "danger" ? "error" : item.tone;
  const cfg = TONE_CONFIG[normTone] || TONE_CONFIG.info;
  const Icon = cfg.icon;

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(item.duration);

  useEffect(() => {
    if (item.duration <= 0) return;

    if (isPaused) {
      return;
    }

    startTimeRef.current = Date.now();
    const interval = 50;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const rem = remainingRef.current - elapsed;
      if (rem <= 0) {
        clearInterval(timer);
        onDismiss(item.id);
      } else {
        setProgress(Math.max(0, (rem / item.duration) * 100));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, item.duration, item.id, onDismiss]);

  const handleMouseEnter = () => {
    if (item.duration <= 0) return;
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (item.duration <= 0) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border ${cfg.borderColor} bg-white p-3.5 shadow-lift backdrop-blur-md transition-all hover:shadow-lg`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconColor}`} />
        <div className="min-w-0 flex-1 space-y-0.5">
          {item.title && (
            <p className="text-xs font-semibold text-navy-900 leading-tight">
              {item.title}
            </p>
          )}
          <p className="text-sm font-medium text-steel-700 leading-snug break-words">
            {item.message}
          </p>
          {item.action && (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  onDismiss(item.id);
                }}
                className="rounded px-2 py-0.5 text-xs font-semibold text-ocean-600 hover:bg-ocean-50 active:bg-ocean-100 transition-colors"
              >
                {item.action.label}
              </button>
            </div>
          )}
        </div>
        {item.dismissible && (
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            aria-label="Tutup notifikasi"
            className="rounded p-1 text-steel-400 hover:bg-steel-100 hover:text-steel-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {item.duration > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-steel-100">
          <div
            className={`h-full transition-all duration-75 ease-linear ${cfg.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Wadah render Toast terpusat di sudut layar aplikasi.
 */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id?: number | string) => {
    if (id === undefined) {
      setItems([]);
    } else {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<ToastItem> & {
        message: string;
      };
      const id = detail.id ?? ++toastSeq;
      const tone = detail.tone ?? "success";
      const duration = detail.duration !== undefined ? detail.duration : 3500;
      const dismissible = detail.dismissible !== undefined ? detail.dismissible : true;

      setItems((prev) => {
        // Cegah spam pesan identik yang masih aktif tampil di layar
        if (prev.some((t) => t.message === detail.message)) {
          return prev;
        }
        const next = prev.filter((t) => t.id !== id);
        // Maksimal 5 toast aktif bersamaan
        const trimmed = next.length >= 5 ? next.slice(-4) : next;
        return [
          ...trimmed,
          {
            id,
            message: detail.message,
            title: detail.title,
            tone,
            duration,
            dismissible,
            action: detail.action,
            createdAt: Date.now(),
          },
        ];
      });
    };

    const onDismiss = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: number | string };
      dismiss(detail?.id);
    };

    window.addEventListener("isms:toast", onToast);
    window.addEventListener("isms:toast:dismiss", onDismiss);

    return () => {
      window.removeEventListener("isms:toast", onToast);
      window.removeEventListener("isms:toast:dismiss", onDismiss);
    };
  }, [dismiss]);

  return (
    <div
      aria-label="Notifikasi sistem"
      className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-full max-w-[calc(100vw-2.5rem)] sm:w-96 flex-col gap-2.5"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
