import type { ReactNode } from "react";
import { useState } from "react";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  Bell,
  X,
} from "lucide-react";
import { Modal, AsyncButton } from "./ui";

export type AlertVariant = "info" | "success" | "warning" | "error" | "neutral";

export interface AlertProps {
  /** Gaya visual dan tingkat urgensi alert (default: "info"). */
  variant?: AlertVariant;
  /** Judul tebal di baris atas alert. */
  title?: ReactNode;
  /** Deskripsi teks penjelasan. Bisa juga ditaruh di children. */
  description?: ReactNode;
  /** Konten bebas di dalam tubuh alert. */
  children?: ReactNode;
  /** Icon di sebelah kiri. True = otomatis sesuai variant, false = tanpa icon, atau custom ReactNode. */
  icon?: ReactNode | boolean;
  /** Apakah dapat ditutup dengan tombol silang (X). */
  dismissible?: boolean;
  /** Callback saat alert ditutup. */
  onDismiss?: () => void;
  /** Komponen aksi di sudut kanan atau bawah (misalnya tombol navigasi atau aksi cepat). */
  action?: ReactNode;
  /** Kelas CSS tambahan. */
  className?: string;
}

const VARIANT_CONFIG: Record<
  AlertVariant,
  {
    icon: typeof Info;
    container: string;
    iconClass: string;
    titleClass: string;
    descClass: string;
    closeClass: string;
  }
> = {
  info: {
    icon: Info,
    container: "bg-ocean-50/80 border-ocean-200 text-ocean-950",
    iconClass: "text-ocean-600",
    titleClass: "text-ocean-950",
    descClass: "text-ocean-800",
    closeClass: "text-ocean-500 hover:text-ocean-800 hover:bg-ocean-100/60",
  },
  success: {
    icon: CheckCircle2,
    container: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
    iconClass: "text-emerald-600",
    titleClass: "text-emerald-950",
    descClass: "text-emerald-800",
    closeClass: "text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100/60",
  },
  warning: {
    icon: AlertTriangle,
    container: "bg-amber-50/80 border-amber-200 text-amber-950",
    iconClass: "text-amber-600",
    titleClass: "text-amber-950",
    descClass: "text-amber-800",
    closeClass: "text-amber-500 hover:text-amber-800 hover:bg-amber-100/60",
  },
  error: {
    icon: AlertCircle,
    container: "bg-rose-50/80 border-rose-200 text-rose-950",
    iconClass: "text-rose-600",
    titleClass: "text-rose-950",
    descClass: "text-rose-800",
    closeClass: "text-rose-500 hover:text-rose-800 hover:bg-rose-100/60",
  },
  neutral: {
    icon: Bell,
    container: "bg-steel-50/80 border-steel-200 text-steel-900",
    iconClass: "text-steel-500",
    titleClass: "text-steel-900",
    descClass: "text-steel-700",
    closeClass: "text-steel-400 hover:text-steel-700 hover:bg-steel-100",
  },
};

/**
 * Komponen banner / callout inline untuk menampilkan pesan penting,
 * peringatan risiko, atau status di dalam halaman/formulir.
 */
export function Alert({
  variant = "info",
  title,
  description,
  children,
  icon = true,
  dismissible = false,
  onDismiss,
  action,
  className = "",
}: AlertProps) {
  const [closed, setClosed] = useState(false);
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info;
  const DefaultIcon = cfg.icon;

  if (closed) return null;

  const handleClose = () => {
    setClosed(true);
    onDismiss?.();
  };

  const renderIcon = () => {
    if (icon === false) return null;
    if (icon === true) {
      return <DefaultIcon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconClass}`} />;
    }
    return <div className="mt-0.5 shrink-0">{icon}</div>;
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all ${cfg.container} ${className}`}
    >
      {renderIcon()}

      <div className="min-w-0 flex-1 space-y-1">
        {title && (
          <p className={`font-semibold leading-tight ${cfg.titleClass}`}>
            {title}
          </p>
        )}
        {description && (
          <div className={`text-xs leading-relaxed ${cfg.descClass}`}>
            {description}
          </div>
        )}
        {children && (
          <div className={`text-xs leading-relaxed ${cfg.descClass}`}>
            {children}
          </div>
        )}
        {action && (
          <div className="pt-1.5 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {(dismissible || onDismiss) && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup pesan peringatan"
          className={`-mr-1 -mt-1 rounded-lg p-1 transition-colors ${cfg.closeClass}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | ReactNode;
  children?: ReactNode;
  variant?: AlertVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm?: () => Promise<unknown> | unknown;
  onCancel?: () => void;
}

const MODAL_VARIANT_STYLE: Record<
  AlertVariant,
  {
    badgeBg: string;
    icon: typeof Info;
    iconColor: string;
    confirmBtnClass: string;
  }
> = {
  info: {
    badgeBg: "bg-ocean-100 text-ocean-700",
    icon: Info,
    iconColor: "text-ocean-600",
    confirmBtnClass: "btn-primary",
  },
  success: {
    badgeBg: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    confirmBtnClass: "btn-primary bg-emerald-600 hover:bg-emerald-700",
  },
  warning: {
    badgeBg: "bg-amber-100 text-amber-700",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    confirmBtnClass: "btn-primary bg-amber-600 hover:bg-amber-700 text-white",
  },
  error: {
    badgeBg: "bg-rose-100 text-rose-700",
    icon: AlertCircle,
    iconColor: "text-rose-600",
    confirmBtnClass: "btn-danger",
  },
  neutral: {
    badgeBg: "bg-steel-100 text-steel-700",
    icon: Bell,
    iconColor: "text-steel-600",
    confirmBtnClass: "btn-primary",
  },
};

/**
 * Modal dialog peringatan interaktif untuk mengonfirmasi tindakan penting
 * dengan indikator visual tingkat keparahan yang jelas.
 */
export function AlertModal({
  open,
  onClose,
  title,
  description,
  children,
  variant = "warning",
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: AlertModalProps) {
  const cfg = MODAL_VARIANT_STYLE[variant] || MODAL_VARIANT_STYLE.warning;
  const Icon = cfg.icon;

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
          >
            {cancelLabel}
          </button>
          {onConfirm && (
            <AsyncButton
              className={cfg.confirmBtnClass}
              disabled={confirmDisabled}
              onAction={handleConfirm}
            >
              {confirmLabel}
            </AsyncButton>
          )}
        </>
      }
    >
      <div className="flex items-start gap-4 py-1">
        <div className={`rounded-xl p-3 shrink-0 ${cfg.badgeBg}`}>
          <Icon className={`h-6 w-6 ${cfg.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {description && (
            <p className="text-sm text-steel-600 leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </Modal>
  );
}
