"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { TABLE_BY_ID } from "@/data/tables";
import { getCartTotals } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { useDemoStore } from "@/store/demo-store";
import { MockQr } from "./MockQr";
import { ScreenShell } from "./ScreenShell";
import type { ScreenProps } from "./types";

const QR_TTL_SECONDS = 5 * 60;
const PROCESSING_MS = 1300;

function formatCountdown(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function PaymentScreen({ focusOnMount }: ScreenProps) {
  const cart = useDemoStore((s) => s.cart);
  const tableId = useDemoStore((s) => s.tableId);
  const status = useDemoStore((s) => s.paymentStatus);
  const setStatus = useDemoStore((s) => s.setPaymentStatus);
  const completeOrder = useDemoStore((s) => s.completeOrder);
  const back = useDemoStore((s) => s.back);

  const { total } = useMemo(() => getCartTotals(cart), [cart]);
  const table = tableId ? TABLE_BY_ID.get(tableId) : undefined;

  // qrVersion ikut seed supaya "Buat QR baru" benar-benar menghasilkan pola berbeda.
  const [qrVersion, setQrVersion] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(QR_TTL_SECONDS);
  const expired = secondsLeft <= 0;
  const processTimer = useRef<number | null>(null);

  useEffect(() => {
    if (status === "processing" || expired) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [status, expired, qrVersion]);

  // Bersihkan timer simulasi bila layar ditinggal (mis. demo di-reset) saat masih memproses.
  useEffect(
    () => () => {
      if (processTimer.current !== null) window.clearTimeout(processTimer.current);
    },
    [],
  );

  const simulate = (outcome: "success" | "failed") => {
    if (status === "processing" || expired) return;
    setStatus("processing");
    processTimer.current = window.setTimeout(() => {
      processTimer.current = null;
      if (outcome === "success") completeOrder();
      else setStatus("failed");
    }, PROCESSING_MS);
  };

  const regenerate = () => {
    setQrVersion((v) => v + 1);
    setSecondsLeft(QR_TTL_SECONDS);
    setStatus("pending");
  };

  const processing = status === "processing";

  return (
    <ScreenShell
      title="Bayar dengan QRIS"
      subtitle={table ? `Meja ${table.label}` : undefined}
      focusOnMount={focusOnMount}
      onBack={back}
      backDisabled={processing}
      footer={
        expired ? (
          <button
            type="button"
            onClick={regenerate}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ember-400 px-4 text-sm font-bold text-ink-950 hover:bg-ember-300"
          >
            <Icon name="rotate" className="size-4" /> Buat QR baru
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => simulate("success")}
              disabled={processing}
              aria-busy={processing}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ember-400 px-4 text-sm font-bold text-ink-950 transition-[background-color,transform] duration-200 hover:bg-ember-300 motion-safe:active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              {processing ? (
                <>
                  <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                  Memproses pembayaran…
                </>
              ) : (
                "Simulasikan bayar berhasil"
              )}
            </button>
            <button
              type="button"
              onClick={() => simulate("failed")}
              disabled={processing}
              className="min-h-11 w-full rounded-2xl text-sm font-semibold text-sand-400 hover:bg-white/5 hover:text-sand-50 disabled:opacity-50"
            >
              Simulasikan pembayaran gagal
            </button>
          </div>
        )
      }
    >
      <p className="mb-3 flex items-center justify-center gap-1.5 rounded-full border border-ember-400/40 bg-ember-400/10 px-3 py-1.5 text-center text-xs font-semibold text-ember-200">
        <Icon name="alert" className="size-3.5" />
        Mode simulasi — tidak ada transaksi sungguhan
      </p>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-400">QRIS · Kafe Contoh</p>
        <p className="mt-1 font-display text-2xl font-bold text-sand-50">{formatRupiah(total)}</p>

        <div className="relative mx-auto mt-3 size-48">
          <MockQr seed={total * 31 + qrVersion} className={`size-48 transition-opacity duration-300 ${expired ? "opacity-20" : ""}`} />
          {expired && (
            <p className="absolute inset-0 grid place-items-center text-sm font-semibold text-sand-50">QR kedaluwarsa</p>
          )}
        </div>

        <p className="mt-3 text-xs text-sand-400" aria-live="off">
          {expired ? "Buat QR baru untuk melanjutkan." : <>Berlaku <span className="font-semibold tabular-nums text-sand-200">{formatCountdown(secondsLeft)}</span></>}
        </p>
        <p className="mt-1 text-xs text-sand-400">Scan pakai e-wallet atau m-banking yang mendukung QRIS.</p>
      </div>

      <AnimatePresence>
        {status === "failed" && (
          <m.div
            role="alert"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-start gap-2 rounded-2xl border border-danger-400/40 bg-danger-400/10 p-3 text-sm"
          >
            <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-danger-400" />
            <div>
              <p className="font-semibold text-sand-50">Pembayaran gagal (simulasi)</p>
              <p className="text-sand-200">Pelanggan cukup coba bayar lagi dengan QR yang sama.</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </ScreenShell>
  );
}
