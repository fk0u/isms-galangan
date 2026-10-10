import { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "../../data/store";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import { Card, StatusBadge, Modal, Field, FormGrid, toast, EmptyState, Badge, ConfirmModal,
  MoneyInput, AsyncButton, SearchBox, rowMatches,
} from "../../components/ui";
import { Plus, Wrench, Package, Box, RotateCcw, FileDown } from "lucide-react";
import { exportExcel, fmtRupiah } from "../../utils/export";
import { parseRupiah } from "../../utils/format";
import type { ServiceRecord, Sparepart } from "../../data";
import { SearchSelect } from "../../components/SearchSelect";
import { useMaterialRequest } from "../../data/useMaterialRequest";
import { useAuth } from "../../auth/auth";
import { approvalOf, useServiceApproval } from "../../data/useServiceApproval";

export type SparepartServiceView = "3d" | "service" | "sparepart" | "all";

type SvcExt = Omit<ServiceRecord, "status"> & { status: ServiceRecord["status"] | "Batal"; cancelReason?: string };
type SpExt = Sparepart & { usedDate?: string; warrantyUntil?: string; poRef?: string };

const SVC_FILTER = ["Semua", "Scheduled", "In Progress", "Done", "Batal"] as const;
const SVC_LABEL: Record<string, string> = {
  Semua: "Semua",
  Scheduled: "Dijadwalkan",
  "In Progress": "Sedang",
  Done: "Selesai",
  Batal: "Batal",
};

const STS = ["Semua", "Akan", "Sedang", "Selesai"];

interface Props {
  projectId?: string;
  vesselId?: string;
  view?: SparepartServiceView;
}

export default function SparepartServiceSection({ projectId, vesselId, view = "all" }: Props) {
  const { locale } = useT();
  const S = n_prj[locale];
  const { data, add, update, remove, log, wbsFor } = useStore();
  const setServiceApproval = useServiceApproval();
  const requestMaterial = useMaterialRequest();
  const { user } = useAuth();
  const [spTab, setSpTab] = useState("Semua");
  const [showAdd, setShowAdd] = useState(false);
  const [editSp, setEditSp] = useState<SpExt | null>(null);
  const [delSp, setDelSp] = useState<SpExt | null>(null);
  const [form, setForm] = useState({ name: "", partNumber: "", category: "Mechanical", status: "Akan" as "Akan" | "Sedang" | "Selesai", cost: "", notes: "", technician: "", usedDate: "", warrantyUntil: "", poRef: "", invItemId: "", qty: "1" });

  const [showAddSvc, setShowAddSvc] = useState(false);
  const [editSvc, setEditSvc] = useState<SvcExt | null>(null);
  const [delSvc, setDelSvc] = useState<SvcExt | null>(null);
  const [svcForm, setSvcForm] = useState({ type: "Repair" as ServiceRecord["type"], description: "", date: new Date().toISOString().slice(0, 10), technician: "", cost: "", status: "Scheduled" as ServiceRecord["status"], boqRef: "", wbsTask: "", costReason: "" });
  const [svcStatus, setSvcStatus] = useState<string>("Semua");
  const [svcQ, setSvcQ] = useState("");
  const [cancelFor, setCancelFor] = useState<SvcExt | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [modelPick, setModelPick] = useState("Tugboat");

  const SP_CATS_ID: Record<string, string> = {
    Mechanical: "Mekanis",
    Electrical: "Listrik",
    Hydraulic: "Hidrolik",
    Safety: "Keselamatan",
    Consumable: "Habis Pakai",
    Other: "Lainnya",
  };
  const SVC_TYPE_ID: Record<string, string> = {
    Overhaul: "Overhaul",
    Inspection: "Inspeksi",
    Repair: "Perbaikan",
    Drydock: "Drydock",
    Survey: "Survei",
  };
  const spCatLabel = (c: string): string => (locale === "en" ? c : SP_CATS_ID[c] ?? c);
  const svcTypeLabel = (t: string): string => (locale === "en" ? t : SVC_TYPE_ID[t] ?? t);

  const openEditSp = (sp: SpExt) => {
    setEditSp(sp);
    setForm({
      name: String(sp.name ?? ""),
      partNumber: String(sp.partNumber ?? ""),
      category: String(sp.category ?? "Mechanical"),
      status: (sp.status === "Sedang" || sp.status === "Selesai" ? sp.status : "Akan") as "Akan" | "Sedang" | "Selesai",
      cost: String(sp.cost ?? ""),
      notes: String(sp.notes ?? ""),
      technician: String(sp.technician ?? ""),
      usedDate: String(sp.usedDate ?? ""),
      warrantyUntil: String(sp.warrantyUntil ?? ""),
      poRef: String(sp.poRef ?? ""),
      invItemId: String((sp as { inventoryItemId?: unknown }).inventoryItemId ?? ""),
      qty: String((sp as { qty?: unknown }).qty ?? "1"),
    });
  };

  /* Edit service BATAL: JANGAN dipaksa jadi "Scheduled".
     Versi lama memaksa status saat membuka form, lalu saveService menulis ulang
     payload itu - sehingga menyimpan service yang dibatalkan diam-diam
     mengembalikannya ke "Dijadwalkan" dan membukanya lagi di timeline. */
  const openEditSvc = (s: SvcExt) => {
    setEditSvc(s);
    setSvcForm({
      type: s.type,
      description: String(s.description ?? ""),
      date: String(s.date ?? new Date().toISOString().slice(0, 10)),
      technician: String(s.technician ?? ""),
      cost: String(s.cost ?? ""),
      status: (s.status === "Batal" ? "Scheduled" : s.status) as ServiceRecord["status"],
      boqRef: String(s.boqRef ?? ""),
      wbsTask: String(s.wbsTask ?? ""),
      costReason: String(s.costReason ?? ""),
    });
  };

  const EMPTY_SP = { name: "", partNumber: "", category: "Mechanical", status: "Akan" as "Akan" | "Sedang" | "Selesai", cost: "", notes: "", technician: "", usedDate: "", warrantyUntil: "", poRef: "", invItemId: "", qty: "1" };
  const EMPTY_SVC = { type: "Repair" as ServiceRecord["type"], description: "", date: new Date().toISOString().slice(0, 10), technician: "", cost: "", status: "Scheduled" as ServiceRecord["status"], boqRef: "", wbsTask: "", costReason: "" };

  /* Tombol "Tambah" harus membuka form KOSONG. Versi lama memakai state form
     yang sama dengan form edit, jadi data item terakhir ikut terbawa. */
  const openAddSp = () => {
    setForm(EMPTY_SP);
    setEditSp(null);
    setShowAdd(true);
  };
  const openAddSvc = () => {
    setSvcForm(EMPTY_SVC);
    setEditSvc(null);
    setShowAddSvc(true);
  };

  const confirmDelSp = async () => {
    if (!delSp) return;
    const id = delSp.id;
    setDelSp(null);
    await remove("spareparts", id);
    log("menghapus sparepart", `${id} · ${delSp.name}`, "Sparepart");
    toast(locale === "en" ? "Sparepart deleted" : "Sparepart dihapus");
  };

  const confirmDelSvc = async () => {
    if (!delSvc) return;
    const id = delSvc.id;
    const desc = delSvc.description;
    setDelSvc(null);
    await remove("services", id);
    log("menghapus service", `${id} · ${desc}`, "Service");
    toast(locale === "en" ? "Service deleted" : "Service dihapus");
  };

  const show3d = view === "3d" || view === "all";
  const showSparepart = view === "sparepart" || view === "all";
  const showService = view === "service" || view === "all";

  const allSpareparts = useMemo(() => {
    let list = ((data.spareparts ?? []) as SpExt[]);
    if (projectId) list = list.filter((s) => s.projectId === projectId);
    if (vesselId) list = list.filter((s) => s.vesselId === vesselId);
    return list;
  }, [data.spareparts, projectId, vesselId]);

  const items = useMemo(() => {
    if (spTab === "Semua") return allSpareparts;
    return allSpareparts.filter((s) => s.status === spTab);
  }, [allSpareparts, spTab]);

  const svcItems = useMemo(() => {
    let list = ((data.services ?? []) as SvcExt[]);
    if (projectId) list = list.filter((s) => s.projectId === projectId);
    if (vesselId) list = list.filter((s) => s.vesselId === vesselId);
    return list;
  }, [data.services, projectId, vesselId]);

  const svcFiltered = useMemo(() => {
    return svcItems.filter((s) => {
      const matchSt = svcStatus === "Semua" || s.status === svcStatus;
      const matchQ = rowMatches(s as unknown as Record<string, unknown>, svcQ, ["id", "type", "description", "technician", "status", "date"]);
      return matchSt && matchQ;
    });
  }, [svcItems, svcStatus, svcQ]);

  const counts = useMemo(() => {
    return {
      Semua: allSpareparts.length,
      Akan: allSpareparts.filter((s) => s.status === "Akan").length,
      Sedang: allSpareparts.filter((s) => s.status === "Sedang").length,
      Selesai: allSpareparts.filter((s) => s.status === "Selesai").length,
    };
  }, [allSpareparts]);

  const svcLbl: Record<string, string> = { Semua: S.filterAll, Scheduled: S.svcScheduled, "In Progress": S.svcInProgress, Done: S.svcDoneLbl, Batal: S.svcCancelled };
  const spLbl: Record<string, string> = { Semua: S.filterAll, Akan: S.spAkan, Sedang: S.spSedang, Selesai: S.spSelesai };

  const advanceService = async (s: SvcExt, next: SvcExt["status"]) => {
    if (approvalOf(s as unknown as Record<string, unknown>) !== "Disetujui") { toast(S.spsNeedApproval, "info"); return; }
    try {
      await update("services", s.id, { status: next });
    } catch (e) { toast(e instanceof Error ? e.message : S.saveFail, "info"); return; }
    log("mengubah status service", `${s.id} → ${next}`, "Service");
    toast(next === "Done" ? S.spsToastSvcDone : S.spsToastSvcStart);
  };

  const confirmCancel = async () => {
    if (!cancelFor) return;
    if (!cancelReason.trim()) { toast(S.spsToastCancelReq, "info"); return; }
    await update("services", cancelFor.id, { status: "Batal", cancelReason: cancelReason.trim() });
    log("membatalkan service", `${cancelFor.id} (alasan: ${cancelReason.trim()})`, "Service");
    toast(S.spsToastCancelled, "info");
    setCancelFor(null);
    setCancelReason("");
  };

  const exportSvc = () => {
    const rows: unknown[][] = [
      ["ID", "Tanggal", "Tipe", "Deskripsi", "Status", "Teknisi", "Biaya (Rp)"],
      ...svcFiltered.map((s) => [s.id, s.date, s.type, s.description, SVC_LABEL[s.status] ?? s.status, s.technician, s.cost]),
    ];
    void exportExcel(rows, `service-${projectId ?? vesselId ?? "riwayat"}`, "Service").then(() => toast(S.spsToastSvcExport));
  };

  const modelSrc = "/models/tug_boat.glb";
  const wmRef = useRef<HTMLDivElement>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelKey, setModelKey] = useState(0);

  useEffect(() => {
    if (!show3d) return;
    const el = wmRef.current;
    if (!el) return;
    el.innerHTML = "";
    setModelError(null);
    setModelLoading(true);
    let cancelled = false;
    /* Muat @google/model-viewer on-demand agar bundle awal tetap ringan saat tab 3D disembunyikan. */
    void import("@google/model-viewer").then(() => {
      if (cancelled) return;
      if (typeof customElements !== "undefined" && !customElements.get("model-viewer")) {
        setModelLoading(false);
        setModelError(S.spsModelErrViewer);
        return;
      }
      const mv = document.createElement("model-viewer") as any;
      mv.src = modelSrc;
      mv.alt = "Tug Boat Model";
      mv.setAttribute("camera-controls", "");
      mv.setAttribute("auto-rotate", "");
      mv.setAttribute("auto-rotate-delay", "2000");
      mv.setAttribute("ar", "");
      mv.setAttribute("ar-modes", "webxr quick-look");
      mv.setAttribute("camera-orbit", "45deg 55deg 22m");
      mv.setAttribute("camera-target", "0 1 0");
      mv.setAttribute("min-camera-orbit", "auto auto 8m");
      mv.setAttribute("max-camera-orbit", "auto auto 60m");
      mv.setAttribute("shadow-intensity", "1");
      mv.style.width = "100%";
      mv.style.height = "340px";
      mv.style.display = "block";
      mv.style.background = "#FFFFFF";
      const onLoad = () => setModelLoading(false);
      const onError = () => {
        setModelLoading(false);
        setModelError(S.spsModelErrFile);
      };
      mv.addEventListener("load", onLoad);
      mv.addEventListener("error", onError);
      el.appendChild(mv);
      const timer = window.setTimeout(() => setModelLoading((v) => (el.children.length > 0 ? false : v)), 8000);
      (el as unknown as { __t?: number }).__t = timer;
    }).catch(() => {
      if (!cancelled) {
        setModelLoading(false);
        setModelError(S.spsModelErrLib);
      }
    });
    return () => {
      cancelled = true;
      const t = (el as unknown as { __t?: number }).__t;
      if (t) window.clearTimeout(t);
      el.innerHTML = "";
    };
  }, [modelSrc, show3d, modelKey, vesselId]);

  /* PRJ-27/PRJ-30: sparepart BARU untuk proyek wajib diambil dari inventori.
     Server memutuskan barang keluar vs Purchase Request (alur material). */
  const fromInventory = !editSp && !!projectId;
  const invOptions = useMemo(
    () => (data.inventory ?? []).map((i) => ({
      value: String(i.id),
      label: String(i.name ?? i.id),
      subLabel: S.spsStockLabel.replace("{stock}", String(Number(i.stock ?? 0))).replace("{unit}", String(i.unit ?? "pcs")),
    })),
    [data.inventory, S.spsStockLabel],
  );
  const pickedInv = (data.inventory ?? []).find((i) => String(i.id) === form.invItemId);
  const pickedStock = Math.max(0, Number(pickedInv?.stock ?? 0) || 0);
  const pickedUnit = String(pickedInv?.unit ?? "pcs");
  const wantQty = Number(form.qty);
  const stockHint = !pickedInv || !(wantQty > 0)
    ? null
    : pickedStock >= wantQty
      ? { tone: "ok" as const, text: S.spsStockOk.replace("{stock}", String(pickedStock)).replace("{unit}", pickedUnit) }
      : pickedStock > 0
        ? { tone: "warn" as const, text: S.spsStockShort.replace("{stock}", String(pickedStock)).replace(/\{unit\}/g, pickedUnit).replace("{short}", String(wantQty - pickedStock)) }
        : { tone: "warn" as const, text: S.spsStockNone.replace("{qty}", String(wantQty)).replace("{unit}", pickedUnit) };

  const saveFromInventory = async () => {
    if (!projectId) return;
    if (!form.invItemId) { toast(S.spsPickInv, "info"); return; }
    if (!(wantQty > 0)) { toast(S.spsQtyInvalid, "info"); return; }
    try {
      const res = await requestMaterial({
        projectId, itemId: form.invItemId, qty: wantQty, purpose: "sparepart", actor: user?.name ?? "Pengguna",
        sparepart: {
          category: form.category,
          technician: form.technician.trim() || "-",
          notes: form.notes.trim(),
          warrantyUntil: form.warrantyUntil || "-",
        },
      });
      toast(
        res.status === "Dari stok"
          ? S.spsReqDone.replace("{item}", res.itemName).replace("{n}", String(res.issued))
          : res.status === "Sebagian"
            ? S.spsReqPartial.replace("{issued}", String(res.issued)).replace("{short}", String(res.shortage)).replace("{pr}", res.requisitionId ?? "-")
            : S.spsReqPo.replace("{pr}", res.requisitionId ?? "-"),
        res.status === "Dari stok" ? "success" : "info",
      );
      setShowAdd(false);
      setForm(EMPTY_SP);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.saveFail, "info");
    }
  };

  const saveSparepart = async () => {
    if (fromInventory) { await saveFromInventory(); return; }
    if (!form.name.trim()) { toast(S.spsToastSpName, "info"); return; }
    /* Halaman Kapal mengirim vesselId tanpa projectId. Versi lama menolak, jadi
       tombol "Tambah" di tab Service/Sparepart kapal SELALU gagal. Cukup salah
       satu konteks (proyek ATAU kapal) untuk menyimpan. */
    if (!projectId && !vesselId) { toast(S.spsToastSpCtx, "info"); return; }
    const payload = {
      name: form.name.trim(),
      partNumber: form.partNumber.trim() || "-",
      category: form.category,
      status: form.status,
      cost: parseRupiah(form.cost),
      notes: form.notes.trim(),
      technician: form.technician.trim() || "-",
      usedDate: form.usedDate || "-",
      warrantyUntil: form.warrantyUntil || "-",
      ...(form.poRef ? { poRef: form.poRef } : {}),
    };
    if (editSp) {
      await update("spareparts", editSp.id, payload);
      log("mengubah sparepart", `${editSp.id} · ${payload.name}`, "Sparepart");
      toast(locale === "en" ? "Sparepart updated" : "Sparepart diperbarui");
      setEditSp(null);
      return;
    }
    await add("spareparts", {
      ...payload,
      /* Kosongkan konteks yang tidak dipakai, bukan undefined: filter membandingkan
         dengan === sehingga undefined tidak pernah sama dengan id kapal. */
      projectId: projectId ?? "",
      vesselId: vesselId ?? "",
      requestDate: new Date().toISOString().slice(0, 10),
    }, { action: "menambahkan sparepart", module: "Sparepart" });
    toast(S.spsToastSpAdd);
    setShowAdd(false);
    setForm(EMPTY_SP);
  };

  // Proyek service yang sedang diubah (tab kapal hanya mengirim vesselId).
  const svcProjectId = projectId || String(editSvc?.projectId ?? "");
  const svcWbsOptions = useMemo(
    () => (svcProjectId ? wbsFor(svcProjectId).map((w) => String(w.task)) : []),
    [svcProjectId, wbsFor],
  );
  /* Item dari surat BoQ yang sudah Digantikan/Ditolak tidak relevan lagi
     (revisi menyalin item → nama ganda di dropdown). */
  const svcBoqItems = useMemo(() => {
    if (!projectId) return [];
    const deadDocs = new Set((data.boqDocs ?? [])
      .filter((d) => ["Digantikan", "Ditolak"].includes(String(d.status ?? "")))
      .map((d) => String(d.id)));
    return (data.boq ?? []).filter((b) => String(b.projectId ?? "") === projectId && !deadDocs.has(String(b.boqDocId ?? "")));
  }, [data.boq, data.boqDocs, projectId]);
  const svcBoqItem = svcBoqItems.find((b) => String(b.id) === svcForm.boqRef);
  const svcBoqPrice = svcBoqItem ? Number(svcBoqItem.totalPrice ?? 0) || 0 : null;
  /* Teknisi dari data karyawan bila peran ini boleh membacanya; selain itu input bebas. */
  const techOptions = useMemo(
    () => (data.employees ?? []).filter((e) => String(e.status ?? "Aktif") === "Aktif").map((e) => ({
      value: String(e.name ?? e.id), label: String(e.name ?? e.id), subLabel: String(e.role ?? e.dept ?? ""),
    })),
    [data.employees],
  );

  const resubmitService = async (s: SvcExt) => {
    try {
      await setServiceApproval(s.id, "Diajukan", "", user?.name ?? "");
      toast(S.spsSvcSubmitted);
    } catch (e) { toast(e instanceof Error ? e.message : S.saveFail, "info"); }
  };

  const saveService = async () => {
    if (!svcForm.description.trim()) { toast(S.spsToastSvcDesc, "info"); return; }
    if (!projectId && !vesselId && !editSvc) { toast(S.spsToastSvcCtx, "info"); return; }
    // F3-D-02: service proyek berasal dari pekerjaan WBS.
    const svcProject = editSvc ? String(editSvc.projectId ?? "") : (projectId ?? "");
    if (svcProject && !svcForm.wbsTask) { toast(S.spsSvcWbsReq, "info"); return; }
    const cost = parseRupiah(svcForm.cost);
    if (svcBoqPrice !== null && cost !== svcBoqPrice && !svcForm.costReason.trim()) { toast(S.spsSvcCostReasonReq, "info"); return; }
    /* Status kerja TIDAK diubah dari form: berpindah lewat tombol Mulai/Selesai
       yang dijaga persetujuan procurement. */
    const payload = {
        date: svcForm.date,
        type: svcForm.type,
        description: svcForm.description.trim(),
        technician: svcForm.technician.trim() || "Belum ditentukan",
        cost,
        wbsTask: svcForm.wbsTask,
        costReason: svcBoqPrice !== null && cost !== svcBoqPrice ? svcForm.costReason.trim() : "",
        ...(svcForm.boqRef ? { boqRef: svcForm.boqRef } : {}),
      };
    if (editSvc) {
      await update("services", editSvc.id, payload);
      log("mengubah service", `${editSvc.id} · ${payload.description}`, "Service");
      toast(locale === "en" ? "Service updated" : "Service diperbarui");
      setEditSvc(null);
      return;
    }
    // Hanya service proyek yang perlu persetujuan procurement; service kapal langsung terjadwal.
    await add("services", {
      projectId: projectId ?? "", vesselId: vesselId ?? "", ...payload, status: "Scheduled",
      ...(projectId ? { approval: "Diajukan" } : {}),
    }, { action: projectId ? "mengajukan service" : "menambahkan service", module: "Service" });
    toast(projectId ? S.spsSvcSubmitted : S.spsToastSvcAdd);
    setShowAddSvc(false);
    setSvcForm(EMPTY_SVC);
  };

  const modelCard = show3d ? (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2"><Box className="h-4 w-4" /> {S.spsModelTitle}</h3>
        <div className="flex items-center gap-2">
          <select className="input w-auto py-1.5 text-xs" aria-label={S.spsModelAria} value={modelPick} onChange={(e) => setModelPick(e.target.value)}>
            <option value="Tugboat">Tugboat</option>
            <option value="Kapal Kecil">Kapal Kecil</option>
          </select>
          {modelError && (
            <button className="btn-secondary text-xs" onClick={() => setModelKey((k) => k + 1)}><RotateCcw className="h-3.5 w-3.5" /> {S.spsReload}</button>
          )}
        </div>
      </div>
      {modelPick !== "Tugboat" && (
        <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
          {S.spsGenericNote}
        </p>
      )}
      <div className="relative overflow-hidden rounded-xl border border-steel-100 bg-surface" style={{ minHeight: 340 }}>
        <div ref={wmRef} style={{ minHeight: 340 }} />
        {modelLoading && !modelError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-steel-500">{S.spsLoading}</p>
          </div>
        )}
        {modelError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface p-6 text-center">
            <p className="text-sm font-semibold text-navy-900">{S.spsModelFail}</p>
            <p className="max-w-sm text-xs text-steel-500">{modelError}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-steel-500">{S.spsModelHint}</p>
    </Card>
  ) : null;

  const sparepartCard = showSparepart ? (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2"><Package className="h-4 w-4" /> {S.spsSpTitle.replace("{a}", String(items.length)).replace("{b}", spTab !== "Semua" ? S.spsSpSuffix.replace("{n}", String(allSpareparts.length)) : "")}</h3>
        <button className="btn-secondary text-xs" onClick={openAddSp}><Plus className="h-3.5 w-3.5" /> {S.addBtn}</button>
      </div>
      <div className="flex gap-1 flex-wrap mb-3">
        {STS.map((s) => (
          <button key={s} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${spTab === s ? "bg-navy-800 text-white" : "bg-steel-100 text-steel-600 hover:bg-steel-200"}`} onClick={() => setSpTab(s)}>
            {spLbl[s]} ({(counts[s as keyof typeof counts] ?? 0)})
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Package className="h-6 w-6" />} title={S.spsSpEmpty} subtitle={allSpareparts.length === 0 ? S.spsSpEmptyNew : S.spsSpEmptyFilter.replace("{a}", spLbl[spTab] ?? spTab).replace("{b}", S.filterAll)} />
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((sp) => (
            <div key={sp.id} className="flex items-center justify-between gap-3 rounded-lg border border-steel-100 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-navy-900">{sp.name}</p>
                <p className="text-xs text-steel-500">{S.spsSpMeta.replace("{a}", sp.partNumber).replace("{b}", spCatLabel(String(sp.category))).replace("{c}", sp.requestDate)}</p>
                <p className="text-xs text-steel-500">
                  {S.spsUsedLbl}{sp.usedDate && sp.usedDate !== "-" ? sp.usedDate : "-"}{S.spsTechLbl}{sp.technician || "-"}{S.spsWarrantyLbl}{sp.warrantyUntil && sp.warrantyUntil !== "-" ? sp.warrantyUntil : "-"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <StatusBadge status={sp.status === "Akan" ? "Tertunda" : sp.status === "Sedang" ? "Dalam Proses" : "Selesai"} />
                  <p className="text-xs text-steel-500 mt-1">{fmtRupiah(sp.cost)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button className="btn-secondary px-2 py-1 text-xs" onClick={() => openEditSp(sp)}>{locale === "en" ? "Edit" : "Ubah"}</button>
                  <button className="btn-secondary px-2 py-1 text-xs text-rose-600" onClick={() => setDelSp(sp)}>{locale === "en" ? "Delete" : "Hapus"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  ) : null;

  const serviceCard = showService ? (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2"><Wrench className="h-4 w-4" /> {S.spsSvcTitle.replace("{a}", String(svcFiltered.length)).replace("{b}", svcFiltered.length !== svcItems.length ? S.spsSpSuffix.replace("{n}", String(svcItems.length)) : "")}</h3>
        <div className="flex gap-2">
          <AsyncButton className="btn-secondary text-xs" onAction={exportSvc}><FileDown className="h-3.5 w-3.5" /> {S.exportExcelBtn}</AsyncButton>
          <button className="btn-secondary text-xs" onClick={openAddSvc}><Plus className="h-3.5 w-3.5" /> {S.spsSvcAdd}</button>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox
          value={svcQ}
          onChange={setSvcQ}
          placeholder={S.spsSvcSearchPh}
          ariaLabel={S.spsSvcSearchAria}
          className="w-full sm:w-52"
        />
        <div className="flex flex-wrap gap-1">
          {SVC_FILTER.map((s) => (
            <button key={s} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${svcStatus === s ? "bg-navy-800 text-white" : "bg-steel-100 text-steel-600 hover:bg-steel-200"}`} onClick={() => setSvcStatus(s)}>
              {svcLbl[s]}
            </button>
          ))}
        </div>
      </div>
      {svcFiltered.length === 0 ? (
        <EmptyState icon={<Wrench className="h-6 w-6" />} title={S.spsSvcEmpty} subtitle={svcItems.length === 0 ? S.spsSvcEmptyNew : S.spsSvcEmptyFilter.replace("{a}", S.filterAll)} />
      ) : (
        <div className="relative space-y-0">
          {svcFiltered.map((s, i, arr) => (
            <div key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <span className={`h-3 w-3 rounded-full ${s.status === "Done" ? "bg-teal-500" : s.status === "In Progress" ? "bg-ocean-500" : s.status === "Batal" ? "bg-rose-500" : "bg-steel-300"}`} />
                {i < arr.length - 1 && <span className="w-px flex-1 bg-steel-200" />}
              </div>
              <div className="pb-1 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-900">{svcTypeLabel(s.type)}: {s.description}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge tone={s.status === "Done" ? "green" : s.status === "In Progress" ? "blue" : s.status === "Batal" ? "red" : "gray"}>{svcLbl[s.status] ?? s.status}</Badge>
                    <button className="btn-secondary px-2 py-1 text-xs" onClick={() => openEditSvc(s)}>{locale === "en" ? "Edit" : "Ubah"}</button>
                    <button className="btn-secondary px-2 py-1 text-xs text-rose-600" onClick={() => setDelSvc(s)}>{locale === "en" ? "Delete" : "Hapus"}</button>
                  </div>
                </div>
                <p className="text-xs text-steel-500">{s.date} · {s.technician} · {fmtRupiah(s.cost)}{s.wbsTask ? ` · WBS: ${s.wbsTask}` : ""}</p>
                {s.status !== "Batal" && s.status !== "Done" && (() => {
                  const apv = approvalOf(s as unknown as Record<string, unknown>);
                  if (apv === "Diajukan") return <p className="mt-1"><Badge tone="amber">{S.spsApvPending}</Badge></p>;
                  if (apv === "Ditolak") return (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone="red">{S.spsApvRejected}</Badge>
                      {s.approvalNote ? <span className="text-xs text-rose-600">{s.approvalNote}</span> : null}
                      <button className="btn-secondary px-2 py-0.5 text-xs" onClick={() => resubmitService(s)}>{S.spsResubmit}</button>
                    </div>
                  );
                  return s.approvedBy ? <p className="mt-1 text-xs text-steel-500">{S.spsApvApprovedBy.replace("{by}", String(s.approvedBy))}</p> : null;
                })()}
                {s.status === "Batal" && s.cancelReason && (
                  <p className="mt-1 text-xs text-rose-600">{S.spsCancelReasonLbl.replace("{a}", s.cancelReason)}</p>
                )}
                {s.status !== "Done" && s.status !== "Batal" && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.status === "Scheduled" && approvalOf(s as unknown as Record<string, unknown>) === "Disetujui" && (
                      <button className="rounded bg-ocean-100 px-2 py-0.5 text-xs font-semibold text-ocean-700 hover:bg-ocean-200" onClick={() => advanceService(s, "In Progress")}>{S.spsStartBtn}</button>
                    )}
                    {s.status === "In Progress" && (
                      <button className="rounded bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 hover:bg-teal-200" onClick={() => advanceService(s, "Done")}>{S.boqComplete}</button>
                    )}
                    <button className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 hover:bg-rose-200" onClick={() => { setCancelFor(s); setCancelReason(""); }}>{S.spsCancelBtn}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  ) : null;

  return (
    <div className="space-y-5">
      {view === "all" ? (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {modelCard}
            {sparepartCard}
          </div>
          {serviceCard}
        </>
      ) : (
        <>
          {modelCard}
          {sparepartCard}
          {serviceCard}
        </>
      )}

      <Modal open={showAdd || editSp !== null} onClose={() => { setShowAdd(false); setEditSp(null); }}
        title={editSp ? (locale === "en" ? `Edit sparepart ${editSp.id}` : `Ubah sparepart ${editSp.id}`) : S.spsSpModal}
        footer={<><button className="btn-secondary" onClick={() => { setShowAdd(false); setEditSp(null); }}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={saveSparepart}>{S.saveBtn}</AsyncButton></>}>
        <div className="space-y-3">
          {fromInventory ? (
            <>
              <p className="rounded-lg bg-surface px-3 py-2 text-[13px] text-steel-600">{S.spsFlowHint}</p>
              <FormGrid>
                <Field label={S.spsFromInv}>
                  <SearchSelect
                    value={form.invItemId}
                    onChange={(v) => setForm({ ...form, invItemId: v })}
                    options={invOptions}
                    placeholder={S.spsFromInvPh}
                    ariaLabel={S.spsFromInv}
                  />
                </Field>
                <Field label={S.spsQty}>
                  <input type="number" min={1} className="input" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
                </Field>
              </FormGrid>
              {stockHint && (
                <p className={`rounded-lg px-3 py-2 text-[13px] ring-1 ring-inset ${stockHint.tone === "ok" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-amber-50 text-amber-700 ring-amber-600/20"}`}>
                  {stockHint.text}
                </p>
              )}
            </>
          ) : (
            <>
          <Field label={S.spsSpName}><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={S.spsSpNamePh} /></Field>
          <Field label={S.spsPartNo}><input className="input" value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} /></Field>
            </>
          )}
          <FormGrid>
            <Field label={S.boqCategory}>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["Mechanical", "Hydraulic", "Electrical", "Insulation", "Paint", "Rigging", "Piping"].map((c) => <option key={c} value={c}>{spCatLabel(c)}</option>)}
              </select>
            </Field>
            {/* Mode inventori: status, biaya, dan tanggal pakai dihitung dari
                hasil pemenuhan stok, jadi tidak ditawarkan sebagai input. */}
            {!fromInventory && (
              <Field label={S.statusLabel}>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Akan" | "Sedang" | "Selesai" })}>
                  {["Akan", "Sedang", "Selesai"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            )}
          </FormGrid>
          <FormGrid>
            {!fromInventory && <Field label={S.spsCost}><MoneyInput className="input" value={form.cost} onChange={(v) => setForm({ ...form, cost: v })} /></Field>}
            <Field label={S.spsNotes}><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={S.spsNotesPh} /></Field>
          </FormGrid>
          <FormGrid>
            <Field label={S.spsTech}><input className="input" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} placeholder={S.spsTechPh} /></Field>
            {!fromInventory && <Field label={S.spsUsedDate}><input type="date" className="input" value={form.usedDate} onChange={(e) => setForm({ ...form, usedDate: e.target.value })} /></Field>}
          </FormGrid>
          <Field label={S.spsWarranty}><input type="date" className="input" value={form.warrantyUntil} onChange={(e) => setForm({ ...form, warrantyUntil: e.target.value })} /></Field>
          {/* D13: referensi opsional ke PO yang sudah Disetujui. */}
          {projectId && !fromInventory && (() => {
            const pos = (data.purchaseOrders ?? []).filter((po) => String(po.project ?? "") === projectId && String(po.status ?? "") === "Disetujui");
            if (pos.length === 0) return null;
            return (
              <Field label={S.spsPoRef}>
                <select className="input" value={form.poRef} onChange={(e) => setForm({ ...form, poRef: e.target.value })}>
                  <option value="">{locale === "en" ? "-- none --" : "-- tidak ada --"}</option>
                  {pos.map((po) => <option key={po.id} value={po.id}>{String(po.id)} - {String(po.item ?? "")}</option>)}
                </select>
              </Field>
            );
          })()}
        </div>
      </Modal>

      <Modal open={showAddSvc || editSvc !== null} onClose={() => { setShowAddSvc(false); setEditSvc(null); }}
        title={editSvc ? (locale === "en" ? `Edit service ${editSvc.id}` : `Ubah service ${editSvc.id}`) : S.spsSvcAdd}
        footer={<><button className="btn-secondary" onClick={() => { setShowAddSvc(false); setEditSvc(null); }}>{S.cancelBtn}</button><AsyncButton className="btn-primary" onAction={saveService}>{S.saveBtn}</AsyncButton></>}>
        <div className="space-y-3">
          <FormGrid>
            <Field label={S.detDocType}>
              <select className="input" value={svcForm.type} onChange={(e) => setSvcForm({ ...svcForm, type: e.target.value as ServiceRecord["type"] })}>
                {["Overhaul", "Inspection", "Repair", "Drydock", "Survey"].map((t) => <option key={t} value={t}>{svcTypeLabel(t)}</option>)}
              </select>
            </Field>
            {svcProjectId && (
              <Field label={S.spsSvcWbs}>
                <select className="input" value={svcForm.wbsTask} onChange={(e) => setSvcForm({ ...svcForm, wbsTask: e.target.value })}>
                  <option value="">{S.spsSvcWbsPh}</option>
                  {svcWbsOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            )}
          </FormGrid>
          <Field label={S.prjScopeDesc}><input className="input" value={svcForm.description} onChange={(e) => setSvcForm({ ...svcForm, description: e.target.value })} placeholder={S.spsSvcDescPh} /></Field>
          <FormGrid>
            <Field label={S.dateField}><input type="date" className="input" value={svcForm.date} onChange={(e) => setSvcForm({ ...svcForm, date: e.target.value })} /></Field>
            <Field label={S.spsSvcTech}>
              {techOptions.length > 0 ? (
                <SearchSelect
                  value={svcForm.technician}
                  onChange={(v) => setSvcForm({ ...svcForm, technician: v })}
                  options={techOptions}
                  placeholder={S.spsSvcTechPick}
                  ariaLabel={S.spsSvcTech}
                />
              ) : (
                <input className="input" value={svcForm.technician} onChange={(e) => setSvcForm({ ...svcForm, technician: e.target.value })} placeholder={S.spsTechPh} />
              )}
            </Field>
          </FormGrid>
          {/* Biaya mengikuti item BoQ terkait; berbeda harga wajib alasan (F3-D-02). */}
          {svcBoqItems.length > 0 && (
            <Field label={S.spsSvcBoqRef}>
              <select
                className="input"
                value={svcForm.boqRef}
                onChange={(e) => {
                  const b = svcBoqItems.find((x) => String(x.id) === e.target.value);
                  setSvcForm({ ...svcForm, boqRef: e.target.value, ...(b ? { cost: String(Number(b.totalPrice ?? 0) || 0), costReason: "" } : {}) });
                }}
              >
                <option value="">{locale === "en" ? "-- none --" : "-- tidak ada --"}</option>
                {svcBoqItems.map((b) => <option key={b.id} value={b.id}>{String(b.name ?? b.id)} · {fmtRupiah(Number(b.totalPrice ?? 0))}</option>)}
              </select>
            </Field>
          )}
          <Field label={S.spsSvcCost} hint={svcBoqPrice !== null ? S.spsSvcBoqPrice.replace("{v}", fmtRupiah(svcBoqPrice)) : undefined}>
            <MoneyInput className="input" value={svcForm.cost} onChange={(v) => setSvcForm({ ...svcForm, cost: v })} />
          </Field>
          {svcBoqPrice !== null && parseRupiah(svcForm.cost) !== svcBoqPrice && (
            <Field label={S.spsSvcCostReason}>
              <input className="input" value={svcForm.costReason} onChange={(e) => setSvcForm({ ...svcForm, costReason: e.target.value })} placeholder={S.spsSvcCostReasonPh} />
            </Field>
          )}
          {!editSvc && projectId && <p className="text-xs text-steel-500">{S.spsSvcApprovalHint}</p>}
        </div>
      </Modal>

      <Modal open={cancelFor !== null} onClose={() => setCancelFor(null)} title={S.spsCancelTitle.replace("{a}", cancelFor?.description ?? "")} subtitle={cancelFor?.id}
        footer={<><button className="btn-secondary" onClick={() => setCancelFor(null)}>{S.spsBackBtn}</button><AsyncButton className="btn-primary" onAction={confirmCancel}>{S.spsConfirmCancel}</AsyncButton></>}>
        <Field label={S.spsCancelField} hint={S.spsCancelHint}>
          <textarea className="input" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={S.spsCancelPh} />
        </Field>
      </Modal>

      <ConfirmModal
        open={delSp !== null}
        title={locale === "en" ? "Delete sparepart?" : "Hapus sparepart?"}
        desc={delSp ? `${delSp.name} · ${delSp.partNumber}` : ""}
        confirmLabel={locale === "en" ? "Delete" : "Hapus"}
        danger
        onCancel={() => setDelSp(null)}
        onConfirm={confirmDelSp}
      />

      <ConfirmModal
        open={delSvc !== null}
        title={locale === "en" ? "Delete service?" : "Hapus service?"}
        desc={delSvc ? `${svcTypeLabel(delSvc.type)}: ${delSvc.description}` : ""}
        confirmLabel={locale === "en" ? "Delete" : "Hapus"}
        danger
        onCancel={() => setDelSvc(null)}
        onConfirm={confirmDelSvc}
      />
    </div>
  );
}
