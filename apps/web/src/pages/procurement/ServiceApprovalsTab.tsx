/* Tab "Persetujuan Service" (F3-J-04, bersama F3-D-02): procurement menyetujui
 * atau menolak (dengan alasan) service proyek sebelum boleh dikerjakan.
 * Server memeriksa peran & transisi; tombol hanya tampil untuk approver. */
import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { AsyncButton, Badge, EmptyState, Field, Modal, SearchBox, rowMatches, toast } from "../../components/ui";
import { useStore, type StoreItem } from "../../data/store";
import { approvalOf, canApproveService, useServiceApproval } from "../../data/useServiceApproval";
import { useAuth } from "../../auth/auth";
import { useT } from "../../i18n/LanguageContext";
import { n_mr } from "../../i18n/n_mr";
import { fmtRupiah, fmtTanggal } from "../../utils/format";

type View = "pending" | "history";

export default function ServiceApprovalsTab() {
  const { locale } = useT();
  const T = n_mr[locale];
  const { data } = useStore();
  const { user } = useAuth();
  const setApproval = useServiceApproval();
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("pending");
  const [rejectFor, setRejectFor] = useState<StoreItem | null>(null);
  const [reason, setReason] = useState("");
  const canApprove = canApproveService(user?.role);

  // Hanya service proyek yang memakai alur persetujuan; data lama tanpa field approval = riwayat.
  const projectServices = useMemo(
    () => (data.services ?? []).filter((s) => String(s.projectId ?? "") !== "" && String(s.status ?? "") !== "Batal"),
    [data.services],
  );
  const pending = projectServices.filter((s) => approvalOf(s) === "Diajukan");
  // Riwayat termasuk service lama tanpa field approval (dianggap disetujui).
  const history = projectServices.filter((s) => approvalOf(s) !== "Diajukan");
  const list = (view === "pending" ? pending : history)
    .filter((s) => rowMatches(s, q, ["id", "projectId", "description", "technician", "wbsTask"]))
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
  const boqName = (id: unknown) => {
    const b = (data.boq ?? []).find((x) => String(x.id) === String(id));
    return b ? String(b.name ?? b.id) : "";
  };

  const approve = async (s: StoreItem) => {
    try {
      await setApproval(String(s.id), "Disetujui", "", user?.name ?? "");
      toast(T.approved.replace("{id}", String(s.id)));
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const confirmReject = async () => {
    if (!rejectFor) return;
    if (!reason.trim()) { toast(T.rejectReq, "info"); return; }
    try {
      await setApproval(String(rejectFor.id), "Ditolak", reason.trim(), user?.name ?? "");
      toast(T.rejected.replace("{id}", String(rejectFor.id)), "info");
      setRejectFor(null);
      setReason("");
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const apvTone = (a: string) => (a === "Disetujui" ? "green" : a === "Ditolak" ? "red" : "amber");
  const apvLabel: Record<string, string> = { Diajukan: T.apvPending, Disetujui: T.apvApproved, Ditolak: T.apvRejected };

  return (
    <div className="space-y-4">
      <p className="text-sm text-steel-600">{T.svcIntro}</p>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder={T.svcSearch} ariaLabel={T.svcSearch} className="min-w-52 flex-1 sm:max-w-xs" />
        <div className="inline-flex rounded-lg border border-steel-200 p-0.5">
          {(["pending", "history"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${view === v ? "bg-navy-900 text-white" : "text-steel-600 hover:text-navy-900"}`}
            >
              {v === "pending" ? `${T.svcPending} (${pending.length})` : `${T.svcHistory} (${history.length})`}
            </button>
          ))}
        </div>
        {!canApprove && <span className="text-xs text-steel-500">{T.onlyProc}</span>}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title={view === "pending" ? T.svcEmptyT : T.svcHistEmptyT} subtitle={view === "pending" ? T.svcEmptyS : T.svcHistEmptyS} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                {[T.colNo, T.colDesc, T.colProject, T.colTech, T.colCost, T.colStatus, T.colAction].map((h) => <th key={h} className="th">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {list.map((s, i) => {
                const apv = approvalOf(s);
                const boq = boqName(s.boqRef);
                return (
                  <tr key={String(s.id)}>
                    <td className="td tabular-nums text-steel-500">{i + 1}</td>
                    <td className="td">
                      <p className="text-sm font-medium text-navy-900">{String(s.description ?? "-")}</p>
                      <p className="text-[11px] text-steel-500"><span className="font-mono">{String(s.id)}</span> · {fmtTanggal(String(s.date ?? ""))} · {String(s.type ?? "")}</p>
                    </td>
                    <td className="td">
                      <p className="text-sm text-navy-900">{String(s.projectId ?? "-")}</p>
                      {s.wbsTask ? <p className="text-[11px] text-steel-500">{T.colWbs}: {String(s.wbsTask)}</p> : null}
                    </td>
                    <td className="td text-sm">{String(s.technician ?? "-")}</td>
                    <td className="td">
                      <p className="text-sm font-semibold tabular-nums text-navy-900">{fmtRupiah(Number(s.cost ?? 0))}</p>
                      {boq && <p className="text-[11px] text-steel-500">{T.boqRef.replace("{v}", boq)}</p>}
                      {s.costReason ? <p className="text-[11px] text-amber-700">{T.costReason.replace("{v}", String(s.costReason))}</p> : null}
                    </td>
                    <td className="td">
                      <Badge tone={apvTone(apv)}>{apvLabel[apv] ?? apv}</Badge>
                      {apv !== "Diajukan" && s.approvedBy ? (
                        <p className="mt-0.5 text-[11px] text-steel-500">{T.byOn.replace("{by}", String(s.approvedBy)).replace("{date}", fmtTanggal(String(s.approvedAt ?? "").slice(0, 10)))}</p>
                      ) : null}
                      {apv === "Ditolak" && s.approvalNote ? <p className="mt-0.5 text-[11px] text-ocean-700">{String(s.approvalNote)}</p> : null}
                    </td>
                    <td className="td">
                      {apv === "Diajukan" && canApprove ? (
                        <div className="flex gap-1.5">
                          <AsyncButton className="btn-primary text-xs" onAction={() => approve(s)}>{T.approve}</AsyncButton>
                          <button type="button" className="btn-secondary text-xs" onClick={() => { setRejectFor(s); setReason(""); }}>{T.reject}</button>
                        </div>
                      ) : <span className="text-xs text-steel-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={rejectFor !== null}
        onClose={() => setRejectFor(null)}
        title={T.rejectTitle.replace("{id}", String(rejectFor?.id ?? ""))}
        subtitle={String(rejectFor?.description ?? "")}
        footer={<>
          <button type="button" className="btn-secondary" onClick={() => setRejectFor(null)}>{T.cancel}</button>
          <AsyncButton className="btn-primary" onAction={confirmReject}>{T.rejectConfirm}</AsyncButton>
        </>}
      >
        <Field label={T.rejectReason}>
          <textarea className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={T.rejectPh} />
        </Field>
      </Modal>
    </div>
  );
}
