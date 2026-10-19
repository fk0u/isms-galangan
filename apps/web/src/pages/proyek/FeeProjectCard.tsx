/* Fee proyek untuk pihak ketiga (K17-PM-15, jawaban klien Q22): persen dari
   nilai proyek atau nominal; ditagihkan setelah proyek Selesai. Menagihkan fee
   membuat hutang di Keuangan, sehingga pembayarannya mengikuti alur hutang yang
   sudah ada (bukti bayar, jurnal). Server menolak fee tidak valid dan tagihan
   sebelum proyek Selesai. */
import { useState } from "react";
import { Receipt, Trash2 } from "lucide-react";
import { Badge, Card, Field, MoneyInput, NumInput, RowAction, toast } from "../../components/ui";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import type { StoreItem } from "../../data/store";
import { fmtRupiah, parseRupiah } from "../../utils/format";
import { feeAmount, normFees, type ProjectFee } from "../../utils/projectFee";

interface Props {
  project: StoreItem;
  canEdit: boolean;
  onSaveFees: (fees: ProjectFee[], note: string) => Promise<void>;
  /** Buat hutang untuk fee; kembalikan id hutang. */
  onTagih: (fee: ProjectFee, amount: number) => Promise<string>;
}

const emptyForm = { penerima: "", basis: "persen" as ProjectFee["basis"], nilai: "", catatan: "" };

export default function FeeProjectCard({ project, canEdit, onSaveFees, onTagih }: Props) {
  const { locale } = useT();
  const S = n_prj[locale];
  const fees = normFees(project.fees);
  const value = Number(project.budget || 0);
  const selesai = String(project.status ?? "") === "Selesai";
  const total = fees.reduce((s, f) => s + feeAmount(f, value), 0);
  const [f, setF] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try { await fn(); } catch (e) { toast(e instanceof Error ? e.message : S.saveFail, "info"); } finally { setBusy(false); }
  };
  const add = () => run(async () => {
    const nilai = f.basis === "nominal" ? parseRupiah(f.nilai) : Number(f.nilai.replace(",", "."));
    if (!f.penerima.trim() || !Number.isFinite(nilai) || nilai <= 0 || (f.basis === "persen" && nilai > 100)) { toast(S.feeInvalid, "info"); return; }
    const fee: ProjectFee = { id: `FEE-${Date.now().toString(36).toUpperCase()}`, penerima: f.penerima.trim(), basis: f.basis, nilai, status: "Belum", ...(f.catatan.trim() ? { catatan: f.catatan.trim() } : {}) };
    await onSaveFees([...fees, fee], `tambah fee ${fee.penerima}`);
    setF(emptyForm);
    toast(S.feeSaved);
  });
  const del = (id: string) => run(async () => { await onSaveFees(fees.filter((x) => x.id !== id), `hapus fee ${id}`); });
  const tagih = (fee: ProjectFee) => run(async () => {
    const amount = feeAmount(fee, value);
    const apId = await onTagih(fee, amount);
    await onSaveFees(fees.map((x) => (x.id === fee.id ? { ...x, status: "Ditagihkan", apId, tagihAt: new Date().toISOString().slice(0, 10) } : x)), `tagihkan fee ${fee.id} → ${apId}`);
    toast(S.feeTagihDone.replace("{n}", fee.penerima).replace("{a}", fmtRupiah(amount)));
  });

  return (
    <Card className="mb-4 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-navy-900">{S.feeTitle}</h4>
          <p className="text-xs text-steel-500">{S.feeHint}</p>
        </div>
        <p className="text-xs font-semibold text-navy-900">{S.feeTotal.replace("{n}", String(fees.length)).replace("{a}", fmtRupiah(total))}</p>
      </div>
      {fees.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">{S.feeColPenerima}</th><th className="th">{S.feeColBasis}</th>
                <th className="th text-right">{S.feeColJumlah}</th><th className="th">{S.feeColStatus}</th><th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {fees.map((x) => (
                <tr key={x.id}>
                  <td className="td text-sm font-medium text-navy-900">{x.penerima}{x.catatan && <span className="block text-xs font-normal text-steel-500">{x.catatan}</span>}</td>
                  <td className="td text-xs text-steel-600">{x.basis === "persen" ? `${x.nilai}% × ${fmtRupiah(value)}` : S.feeBasisNominal}</td>
                  <td className="td text-right text-sm font-semibold">{fmtRupiah(feeAmount(x, value))}</td>
                  <td className="td">{x.status === "Ditagihkan" ? <Badge tone="teal">{S.feeStDitagihkan.replace("{n}", x.apId ?? "-")}</Badge> : <Badge tone="gray">{S.feeStBelum}</Badge>}</td>
                  <td className="td whitespace-nowrap text-right">
                    {canEdit && x.status === "Belum" && (
                      <>
                        <RowAction icon={Receipt} label={selesai ? S.feeTagih : S.feeTagihHint} disabled={!selesai || busy} onClick={() => void tagih(x)} />
                        <RowAction icon={Trash2} tone="danger" label={`${S.feeDel} ${x.penerima}`} disabled={busy} onClick={() => void del(x.id)} />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canEdit && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Field label={S.feeColPenerima}><input className="input w-56" value={f.penerima} onChange={(e) => setF({ ...f, penerima: e.target.value })} placeholder={S.feePhPenerima} /></Field>
          <Field label={S.feeColBasis}>
            <select className="input w-auto" value={f.basis} onChange={(e) => setF({ ...f, basis: e.target.value === "nominal" ? "nominal" : "persen", nilai: "" })}>
              <option value="persen">{S.feeBasisPersen}</option>
              <option value="nominal">{S.feeBasisNominal}</option>
            </select>
          </Field>
          <Field label={f.basis === "persen" ? S.feeNilaiPersen : S.feeNilaiNominal}>
            {f.basis === "persen"
              ? <NumInput className="input w-28" min={0} max={100} step={0.1} value={f.nilai} onChange={(e) => setF({ ...f, nilai: e.target.value })} />
              : <MoneyInput className="input w-44" value={f.nilai} onChange={(v) => setF({ ...f, nilai: v })} />}
          </Field>
          <Field label={S.feeCatatan}><input className="input w-48" value={f.catatan} onChange={(e) => setF({ ...f, catatan: e.target.value })} /></Field>
          <button className="btn-primary" disabled={busy} onClick={() => void add()}>{S.feeAdd}</button>
        </div>
      )}
    </Card>
  );
}
