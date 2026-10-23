import { useEffect, useState } from "react";
import { AsyncButton, Field, FormGrid, Modal, toast } from "./ui";
import { useStore } from "../data/store";
import type { StoreItem } from "../data/store";
import { fmtRupiah, todayISO } from "../utils/format";
import { kasKodeOf, postCashJournal } from "../services/autoJournal";
import { applyKasbonPotongan, normKasbonList } from "../utils/kasbon";
import { n_dry } from "../i18n/n_dry";
import { useT } from "../i18n/LanguageContext";

/* #281: pembayaran gaji hanya oleh Keuangan. Peran yang boleh membayar
   harus sama dengan guard server (crud.ts, PATCH payroll status Dibayar). */
export const PAYROLL_PAYER_ROLES = ["finance", "pajak", "direktur", "developer"];
export const canPayPayroll = (role: string | undefined): boolean => PAYROLL_PAYER_ROLES.includes(String(role ?? "").toLowerCase());

/* Modal bukti bayar + kasbon + jurnal kas. Dipindah dari Payroll agar tab
   Payroll di Keuangan memakai alur yang persis sama. */
export function PayrollPayModal({ target, onClose }: { target: StoreItem | null; onClose: () => void }) {
  const { data, add, update, log } = useStore();
  const { locale } = useT();
  const S = n_dry[locale];
  const [proof, setProof] = useState({ date: todayISO(), method: "Transfer", ref: "" });
  useEffect(() => { if (target) setProof({ date: todayISO(), method: "Transfer", ref: "" }); }, [target]);

  const confirmPay = async () => {
    if (!target) return;
    if (!proof.date) { toast(S.tDateReq, "info"); return; }
    if (!proof.ref.trim()) { toast(S.tRefReq, "info"); return; }
    const type = String(target.type ?? "Gaji");
    const period = String(target.period ?? "");
    try {
      /* Kasbon dipotong saat Bayar: min(cicilan, sisa) per entri, kurangi sisa
         karyawan, lalu sesuaikan potongan + net slip ini. */
      let kasbonPot = Number(target.kasbonPot || 0);
      let deductions = Number(target.deductions || 0);
      let net = Number(target.net || 0);
      const emp = data.employees.find((e) => e.id === String(target.employeeId));
      const kasbon = emp ? normKasbonList(emp.kasbon) : [];
      if (kasbon.length > 0 && String(target.status ?? "") !== "Dibayar") {
        // K17-HR-03: potongan per kasbon tercatat di riwayatnya (slip + periode).
        const { next, pot } = applyKasbonPotongan(kasbon, { id: String(target.id), period, tanggal: proof.date });
        if (pot > 0) {
          await update("employees", String(target.employeeId), { kasbon: next });
          kasbonPot += pot;
          deductions += pot;
          net -= pot;
        }
      }
      await update("payroll", target.id, {
        status: "Dibayar",
        paidAt: proof.date,
        paidMethod: proof.method,
        paidRef: proof.ref.trim(),
        kasbonPot,
        deductions,
        net,
      });
      log("membayar payroll", `${target.id} via ${proof.method} ${proof.ref.trim()}${kasbonPot > 0 ? ` · kasbon ${fmtRupiah(kasbonPot)}` : ""}`, "Payroll");
      await postCashJournal({
        add,
        journals: data.journals ?? [],
        branch: String(target.branch ?? ""),
        dokumen: `PAYROLL-${type}-${period}-${String(target.employeeId ?? "")}`,
        date: proof.date,
        uraian: `Bayar ${type} ${target.id} via ${proof.ref.trim()}`,
        db: "6-002",
        kr: kasKodeOf(proof.method),
        amount: Math.max(0, net),
      });
      toast(S.tPaid.replace("{a}", String(target.id)));
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : S.tPayFail.replace("{a}", String(target.id)), "info");
    }
  };

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={S.payProofTitle}
      subtitle={target ? S.payProofSub.replace("{a}", String(target.id)).replace("{b}", fmtRupiah(Number(target.net || 0))) : ""}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>{S.cancelBtn}</button>
          <AsyncButton className="btn-primary" onAction={confirmPay}>{S.btnConfirmPay}</AsyncButton>
        </>
      }
    >
      <div className="space-y-3">
        <FormGrid>
          <Field label={S.lblPayDate} required><input type="date" className="input" value={proof.date} onChange={(e) => setProof({ ...proof, date: e.target.value })} /></Field>
          <Field label={S.lblMethod}>
            <select className="input" value={proof.method} onChange={(e) => setProof({ ...proof, method: e.target.value })}>
              <option>Transfer</option>
              <option>Tunai</option>
              <option>Giro</option>
            </select>
          </Field>
        </FormGrid>
        <Field label={S.lblRefNo} required><input className="input" value={proof.ref} onChange={(e) => setProof({ ...proof, ref: e.target.value })} placeholder={S.phRefNo} /></Field>
      </div>
    </Modal>
  );
}
