/* Tab BoQ per nomor surat (F3-C-03, ADR-0006, revisi klien PRJ-19).
 *
 * Daftar menampilkan SURAT (bukan item): nomor, revisi, jumlah item, total,
 * status, aksi. Klik surat → detail: header + aksi alur + riwayat revisi +
 * tabel item (BoQSection difilter ke surat ini; terkunci bila Disetujui).
 *
 * Alur: Draft → Diajukan → Disetujui / Ditolak; Ditolak → Draft;
 * Disetujui → "Buat revisi" (surat baru Rev+1, item disalin); revisi yang
 * disetujui menjadikan surat lama "Digantikan". Tersambung server → endpoint
 * /api/boqDocs/:id/status & /revise (transaksional); mode lokal → logika setara. */
import { useMemo, useState } from "react";
import { ArrowLeft, FileText, GitBranch, Plus, Send, Check, X, RotateCcw, Lock } from "lucide-react";
import { useStore } from "../../data/store";
import type { BoQItem } from "../../data";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import { useAuth, hasPermission } from "../../auth/auth";
import { apiFetch, getJwt, isBackendConfigured } from "../../services/http";
import { Badge, Card, ConfirmModal, EmptyState, toast, AsyncButton } from "../../components/ui";
import { fmtRupiah } from "../../utils/export";
import { fmtTanggal, todayISO } from "../../utils/format";
import BoQSection from "./BoQSection";
import { usePdfDoc } from "../../components/usePdfDoc";

type DocStatus = "Draft" | "Diajukan" | "Disetujui" | "Ditolak" | "Digantikan";

interface DocRow {
  id: string;
  projectId: string;
  number: string;
  revision: number;
  status: DocStatus;
  supersedes?: string;
  supersededBy?: string;
  issuedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  note?: string;
}

const STATUS_TONE: Record<DocStatus, "gray" | "amber" | "green" | "red" | "navy"> = {
  Draft: "gray",
  Diajukan: "amber",
  Disetujui: "green",
  Ditolak: "red",
  Digantikan: "navy",
};

const LOCKED: DocStatus[] = ["Disetujui", "Digantikan"];

function remote(): boolean {
  return isBackendConfigured() && getJwt() !== null;
}

export default function BoqDocsSection({ projectId }: { projectId: string }) {
  const { locale } = useT();
  const S = n_prj[locale];
  const pdfDoc = usePdfDoc();
  const { data, add, update, resyncCollections, log } = useStore();
  const { user } = useAuth();
  const canWrite = hasPermission(user?.permissions, "boq", "w");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [confirm, setConfirm] = useState<{ doc: DocRow; to: DocStatus | "revise" } | null>(null);

  const docs = useMemo(
    () => ((data.boqDocs ?? []) as unknown as DocRow[])
      .filter((d) => d.projectId === projectId)
      .sort((a, b) => a.number.localeCompare(b.number) || b.revision - a.revision),
    [data.boqDocs, projectId],
  );
  const items = (data.boq ?? []) as BoQItem[];
  const itemsOf = (docId: string) => items.filter((b) => b.boqDocId === docId);
  const totalOf = (docId: string) => itemsOf(docId).reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
  const visible = showOld ? docs : docs.filter((d) => d.status !== "Digantikan");
  const legacyCount = items.filter((b) => b.projectId === projectId && !b.boqDocId).length;
  const statusLabel = (s: DocStatus): string => ({
    Draft: S.bqdStDraft, Diajukan: S.bqdStDiajukan, Disetujui: S.bqdStDisetujui,
    Ditolak: S.bqdStDitolak, Digantikan: S.bqdStDigantikan,
  })[s] ?? s;

  const nextNumber = (): string => {
    const nums = docs
      .map((d) => Number(d.number.split("/").pop()))
      .filter((n) => Number.isFinite(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `BQ/${projectId}/${String(next).padStart(3, "0")}`;
  };

  const createDoc = async () => {
    const number = nextNumber();
    try {
      const created = await add("boqDocs", {
        projectId, number, revision: 0, status: "Draft", issuedAt: todayISO(), note: "", total: 0,
      }, { action: "membuat surat BoQ", target: number, module: "BoQ" });
      toast(S.bqdCreated.replace("{a}", number), "success");
      setOpenId(String(created.id));
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  /* Transisi status. Server: endpoint transaksional; lokal: logika setara. */
  const transition = async (doc: DocRow, to: DocStatus) => {
    if (remote()) {
      await apiFetch(`/api/boqDocs/${encodeURIComponent(doc.id)}/status`, {
        method: "POST", body: JSON.stringify({ status: to }),
      });
      await resyncCollections(["boqDocs", "boq", "activities"]);
    } else {
      const total = totalOf(doc.id);
      const patch: Record<string, unknown> = { status: to, total };
      if (to === "Diajukan") patch.issuedAt = doc.issuedAt || todayISO();
      if (to === "Disetujui") { patch.approvedBy = user?.name ?? "-"; patch.approvedAt = todayISO(); }
      await update("boqDocs", doc.id, patch);
      if (to === "Disetujui" && doc.supersedes) {
        await update("boqDocs", doc.supersedes, { status: "Digantikan", supersededBy: doc.id });
      }
    }
    log(`mengubah status surat BoQ → ${to}`, `${doc.number} Rev ${doc.revision}`, "BoQ");
    toast(S.bqdMoved.replace("{a}", `${doc.number} Rev ${doc.revision}`).replace("{b}", statusLabel(to)), "success");
  };

  const revise = async (doc: DocRow) => {
    let newId: string;
    if (remote()) {
      const res = await apiFetch<{ id: string; revision: number }>(`/api/boqDocs/${encodeURIComponent(doc.id)}/revise`, { method: "POST" });
      await resyncCollections(["boqDocs", "boq", "activities"]);
      newId = res.id;
    } else {
      if (docs.some((d) => d.supersedes === doc.id && !LOCKED.includes(d.status))) {
        throw new Error(S.bqdRevisePending);
      }
      const created = await add("boqDocs", {
        projectId, number: doc.number, revision: doc.revision + 1, status: "Draft",
        supersedes: doc.id, issuedAt: todayISO(), note: "", total: totalOf(doc.id),
      }, { action: "membuat revisi surat BoQ", target: doc.number, module: "BoQ" });
      newId = String(created.id);
      for (const it of itemsOf(doc.id)) {
        const { id: _drop, ...rest } = it as BoQItem & { id: string };
        void _drop;
        await add("boq", { ...rest, boqDocId: newId, status: "Draft", copiedFrom: it.id });
      }
    }
    toast(S.bqdRevised.replace("{a}", `${doc.number} Rev ${doc.revision + 1}`), "success");
    setOpenId(newId);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.to === "revise") await revise(confirm.doc);
      else await transition(confirm.doc, confirm.to);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
    setConfirm(null);
  };

  const open = docs.find((d) => d.id === openId) ?? null;

  /* ---------- Detail surat ---------- */
  if (open) {
    const locked = LOCKED.includes(open.status);
    const chain = docs.filter((d) => d.number === open.number).sort((a, b) => b.revision - a.revision);
    const actions: { to: DocStatus | "revise"; label: string; icon: typeof Send; primary?: boolean; danger?: boolean; needsApprover?: boolean }[] = [];
    if (open.status === "Draft") actions.push({ to: "Diajukan", label: S.bqdSubmit, icon: Send, primary: true });
    if (open.status === "Diajukan") {
      actions.push({ to: "Disetujui", label: S.bqdApprove, icon: Check, primary: true, needsApprover: true });
      actions.push({ to: "Ditolak", label: S.bqdReject, icon: X, danger: true, needsApprover: true });
      actions.push({ to: "Draft", label: S.bqdBackToDraft, icon: RotateCcw });
    }
    if (open.status === "Ditolak") actions.push({ to: "Draft", label: S.bqdBackToDraft, icon: RotateCcw, primary: true });
    if (open.status === "Disetujui") actions.push({ to: "revise", label: S.bqdMakeRevision, icon: GitBranch, primary: true });

    return (
      <div className="space-y-4">
        <button className="btn-secondary text-xs" onClick={() => setOpenId(null)}>
          <ArrowLeft className="h-3.5 w-3.5" /> {S.bqdBack}
        </button>
        <button className="btn-secondary text-xs" onClick={() => void pdfDoc.request({ kind: "boq", id: String(openId), locale }, `BoQ-${String(openId)}`, false)}>
          <FileText className="h-3.5 w-3.5" /> {S.boqPrint}
        </button>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] text-steel-500">{S.bqdLetter}</p>
              <h3 className="mt-0.5 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-navy-900">
                <span className="font-mono">{open.number}</span>
                <span className="rounded-md bg-steel-100 px-2 py-0.5 text-sm font-medium text-navy-800">Rev {open.revision}</span>
                <Badge tone={STATUS_TONE[open.status]}>{statusLabel(open.status)}</Badge>
              </h3>
              <p className="mt-2 text-sm text-steel-500">
                {S.bqdTotal}: <span className="font-semibold text-navy-900 tabular-nums">{fmtRupiah(totalOf(open.id))}</span>
                {" · "}{S.bqdItemCount.replace("{n}", String(itemsOf(open.id).length))}
                {open.approvedAt ? <> {" · "}{S.bqdApprovedBy.replace("{a}", open.approvedBy ?? "-").replace("{b}", fmtTanggal(open.approvedAt))}</> : null}
              </p>
              {locked && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-steel-500">
                  <Lock className="h-3.5 w-3.5" /> {open.status === "Digantikan" ? S.bqdLockedSuperseded : S.bqdLockedApproved}
                </p>
              )}
            </div>
            {canWrite && actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                  <button
                    key={String(a.to)}
                    className={a.primary ? "btn-primary" : a.danger ? "btn-danger" : "btn-secondary"}
                    onClick={() => setConfirm({ doc: open, to: a.to })}
                  >
                    <a.icon className="h-4 w-4" /> {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {chain.length > 1 && (
            <div className="mt-5 border-t border-steel-100 pt-4">
              <p className="mb-2 text-[13px] font-medium text-steel-600">{S.bqdHistory}</p>
              <ol className="flex flex-wrap gap-2">
                {chain.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => setOpenId(d.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${d.id === open.id ? "border-navy-900 bg-navy-900 text-white" : "border-steel-200 bg-white text-steel-700 hover:border-steel-300"}`}
                    >
                      Rev {d.revision}
                      <span className={d.id === open.id ? "text-white/70" : "text-steel-400"}>· {statusLabel(d.status)}</span>
                      <span className="tabular-nums">{fmtRupiah(totalOf(d.id))}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>

        <BoQSection projectId={projectId} docId={open.id} locked={locked || !canWrite} />

        <ConfirmModal
          open={confirm !== null}
          title={confirm?.to === "revise" ? S.bqdMakeRevision : S.bqdConfirmTitle}
          desc={confirm
            ? confirm.to === "revise"
              ? S.bqdConfirmRevise.replace("{a}", `${confirm.doc.number} Rev ${confirm.doc.revision}`).replace("{b}", String(confirm.doc.revision + 1))
              : S.bqdConfirmMove.replace("{a}", `${confirm.doc.number} Rev ${confirm.doc.revision}`).replace("{b}", statusLabel(confirm.to))
            : ""}
          confirmLabel={S.bqdConfirmYes}
          onConfirm={runConfirm}
          danger={confirm?.to === "Ditolak"}
          onCancel={() => setConfirm(null)}
        />
      </div>
    );
  }

  /* ---------- Daftar surat ---------- */
  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-navy-900">
            <FileText className="h-4 w-4 text-steel-500" /> {S.bqdTitle}
          </h3>
          <p className="mt-0.5 text-[13px] text-steel-500">{S.bqdSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {docs.some((d) => d.status === "Digantikan") && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-steel-600">
              <input type="checkbox" className="accent-ocean-500" checked={showOld} onChange={(e) => setShowOld(e.target.checked)} />
              {S.bqdShowOld}
            </label>
          )}
          {canWrite && (
            <AsyncButton className="btn-primary" onAction={createDoc}>
              <Plus className="h-4 w-4" /> {S.bqdNew}
            </AsyncButton>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="border-t border-steel-100">
          <EmptyState icon={<FileText className="h-6 w-6" />} title={S.bqdEmptyTitle} subtitle={S.bqdEmptySub} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">{S.bqdColNumber}</th>
                <th className="th">Rev</th>
                <th className="th text-right">{S.bqdColItems}</th>
                <th className="th text-right">{S.bqdTotal}</th>
                <th className="th">{S.bqdColStatus}</th>
                <th className="th">{S.bqdColDate}</th>
                <th className="th text-right">{S.bqdColAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {visible.map((d) => (
                <tr key={d.id} className="cursor-pointer transition-colors hover:bg-steel-50" onClick={() => setOpenId(d.id)}>
                  <td className="td font-mono text-[13px] font-medium text-navy-900">{d.number}</td>
                  <td className="td"><span className="rounded-md bg-steel-100 px-1.5 py-0.5 text-xs font-medium text-navy-800">Rev {d.revision}</span></td>
                  <td className="td text-right tabular-nums">{itemsOf(d.id).length}</td>
                  <td className="td text-right font-medium tabular-nums text-navy-900">{fmtRupiah(totalOf(d.id))}</td>
                  <td className="td"><Badge tone={STATUS_TONE[d.status]}>{statusLabel(d.status)}</Badge></td>
                  <td className="td text-[13px] text-steel-500">{d.approvedAt ? fmtTanggal(d.approvedAt) : d.issuedAt ? fmtTanggal(d.issuedAt) : "-"}</td>
                  <td className="td text-right">
                    <button className="btn-secondary px-2.5 py-1 text-xs" onClick={(e) => { e.stopPropagation(); setOpenId(d.id); }}>
                      {S.bqdDetail}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {legacyCount > 0 && (
        <p className="border-t border-steel-100 px-5 py-3 text-[13px] text-amber-700">{S.bqdLegacy.replace("{n}", String(legacyCount))}</p>
      )}
    </Card>
  );
}
