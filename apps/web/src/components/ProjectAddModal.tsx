// Modal tambah proyek bersama — dipakai halaman Proyek DAN Dashboard
// ("Proyek Baru" langsung buka form, tanpa pindah halaman).
// Logika + validasi pindahan utuh dari Projects.tsx (satu sumber).
import { useState, useMemo } from "react";
import { Field, FormGrid, Modal, toast,
  NumInput, MoneyInput, AsyncButton,
} from "./ui";
import { SearchSelect } from "./SearchSelect";
import type { StoreItem } from "../data/store";
import { useStore } from "../data/store";
import { useAuth } from "../auth/auth";
import { fmtRupiah, parseRupiah, todayISO } from "../utils/format";
import { isProjectManager } from "../utils/employeeOptions";
import ClientModal from "./ClientModal";
import { TAHAP_V2, tahapLabel } from "../utils/projectStages";
import { useT } from "../i18n/LanguageContext";

const PREFIX_TIPE: Record<string, string> = { "New Build": "NB", Repair: "RP", Retrofit: "RF" };

const emptyForm = {
  vessel: "",
  type: "New Build",
  client: "",
  plannedDockId: "",
  start: "",
  end: "",
  budget: "",
  manager: "",
  status: "Dalam Proses",
  tahap: TAHAP_V2[0] as string,
  /* Field Prioritas dihapus dari form (catatan klien 17 Okt, K17-PM-11), tetapi
     daftar proyek, Monitoring, dan detail masih memakai prioritas - proyek baru
     tetap disimpan "Sedang" dan bisa diubah di detail proyek. */
  prioritas: "Sedang",
  vesselLoa: "",
  vesselType: "",
};

type Dict = Record<string, string>;

export default function ProjectAddModal({
  open,
  onClose,
  S,
  projects,
  vessels,
  clients,
  employees,
  docks,
  add,
}: {
  open: boolean;
  onClose: () => void;
  S: Dict;
  projects: StoreItem[];
  vessels: StoreItem[];
  clients: StoreItem[];
  employees: StoreItem[];
  docks?: StoreItem[];
  add: (collection: any, item: any, meta?: any) => Promise<StoreItem>;
}) {
  const { user } = useAuth();
  const { locale } = useT();
  const { branch: storeBranch } = useStore();
  const activeBranch = (user?.branch && user.branch !== "SEMUA") ? user.branch : (storeBranch || "Samarinda");

  const [form, setForm] = useState(emptyForm);
  const [scopeRows, setScopeRows] = useState([{ service: "", harga: "", deskripsi: "" }]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [createdGuide, setCreatedGuide] = useState<{ id: string; vessel: string } | null>(null);

  const totalScopePrice = useMemo(
    () => scopeRows.reduce((sum, r) => sum + (parseRupiah(r.harga) || 0), 0),
    [scopeRows]
  );

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const vesselExists = vessels.some((v) => String(v.name ?? "").toLowerCase() === form.vessel.trim().toLowerCase());

  const vesselOptions = useMemo(
    () =>
      vessels.map((v) => ({
        value: String(v.name ?? ""),
        label: String(v.name ?? ""),
        subLabel: v.type ? `${v.type}${v.owner ? ` · ${v.owner}` : ""}` : undefined,
      })),
    [vessels]
  );

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: String(c.name ?? ""),
        label: String(c.name ?? ""),
        subLabel: c.type ? String(c.type) : (c.phone ? String(c.phone) : undefined),
      })),
    [clients]
  );

  const dockOptions = useMemo(
    () =>
      (docks ?? []).map((d) => ({
        value: String(d.id),
        label: String(d.name ?? d.id),
        subLabel: d.capacity ? String(d.capacity) : (d.status ? String(d.status) : undefined),
      })),
    [docks]
  );

  const pmOptions = useMemo(
    () =>
      employees
        .filter(isProjectManager)
        .map((e) => ({
          value: String(e.name ?? ""),
          label: String(e.name ?? ""),
          subLabel: `${e.role || e.dept || "Karyawan"}`,
        })),
    [employees]
  );

  const nextProjectCode = (type: string, start: string): string => {
    const prefix = PREFIX_TIPE[type] ?? "PRJ";
    const year = start.match(/^(\d{4})/)?.[1] ?? String(new Date().getFullYear());
    let max = 0;
    for (const p of projects) {
      const m = String(p.id).match(new RegExp(`^${prefix}-(\\d{4})-(\\d+)$`));
      if (m && m[1] === year) max = Math.max(max, Number(m[2]));
    }
    return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
  };

  const codePreview = nextProjectCode(form.type, form.start);

  const close = () => {
    setForm(emptyForm);
    setScopeRows([{ service: "", harga: "", deskripsi: "" }]);
    onClose();
  };

  const save = async () => {
    if (!form.vessel.trim() || !form.client.trim()) { toast(S.prjToastVesselClient, "info"); return; }
    const scopeItems = scopeRows
      .map((r) => {
        const h = parseRupiah(r.harga);
        return {
          service: r.service.trim(),
          ...(Number.isFinite(h) && h > 0 ? { harga: h } : {}),
          ...(r.deskripsi.trim() ? { deskripsi: r.deskripsi.trim() } : {}),
        };
      })
      .filter((r) => r.service);
    if (scopeItems.length === 0) { toast(S.prjToastScopeMin, "info"); return; }
    if (!form.start || !form.end) { toast(S.prjToastDatesReq, "info"); return; }
    if (form.end < form.start) { toast(S.prjToastDateOrder, "info"); return; }
    const budget = totalScopePrice;
    if (!Number.isFinite(budget) || budget <= 0) {
      toast(locale === "en" ? "Please specify prices in the scope of work to calculate the project value." : "Mohon isi harga pada ruang lingkup pekerjaan untuk menentukan nilai proyek.", "info");
      return;
    }
    if (!form.manager) { toast(S.prjToastPm, "info"); return; }
    if (form.type === "New Build" && projects.some((p) => String(p.vessel ?? "").trim().toLowerCase() === form.vessel.trim().toLowerCase() && String(p.type) === "New Build")) {
      toast(S.prjToastDup, "info");
      return;
    }
    if (!vesselExists) {
      const loa = Number(form.vesselLoa);
      if (!Number.isFinite(loa) || loa <= 0) { toast(S.prjToastLoa, "info"); return; }
      if (!form.vesselType.trim()) { toast(S.prjToastVType, "info"); return; }
    }
    const code = nextProjectCode(form.type, form.start);
    try {
      const created: StoreItem = await add(
        "projects",
        {
          id: code,
          vessel: form.vessel.trim(),
          type: form.type,
          client: form.client.trim(),
          status: "Dalam Proses",
          plannedDockId: form.plannedDockId || "",
          tahap: form.tahap,
          // Proyek baru memakai urutan tahap Progress baru (K17-PM-10, Q20).
          tahapVersi: 2,
          prioritas: form.prioritas,
          tahapLog: [{ from: "-", to: form.tahap, date: todayISO(), by: user?.name || "Anda", reason: "Proyek dibuat" }],
          branch: activeBranch,
          start: form.start,
          end: form.end,
          progress: 0,
          budget,
          actual: 0,
          manager: form.manager,
          scope: scopeItems,
        },
        { action: "membuat proyek", module: "Proyek" }
      );
      if (!vesselExists) {
        await add("vessels", {
          /* IMO, tahun bangun & bollard tidak lagi dicatat untuk kapal (K17-KPL-01). */
          name: form.vessel.trim(),
          type: form.vesselType.trim(),
          class: "BKI",
          flag: "Indonesia",
          owner: form.client.trim(),
          loa: Number(form.vesselLoa), beam: 0, draft: 0,
          status: form.type === "New Build" ? "Dalam Pembangunan" : "Dalam Docking",
          certificates: [],
          history: [{ date: form.start, event: "Proyek dibuat", type: "Kontrak" }],
        }, { action: "mendaftarkan kapal", target: form.vessel.trim(), module: "Kapal" });
        toast(S.prjToastCreatedVessel.replace("{a}", created.id).replace("{b}", form.vessel.trim()));
      } else {
        toast(S.prjToastCreated.replace("{a}", created.id));
      }
      setCreatedGuide({ id: String(created.id), vessel: form.vessel.trim() });
      setForm(emptyForm);
      setScopeRows([{ service: "", harga: "", deskripsi: "" }]);
      onClose();
    } catch {
      toast(S.prjToastSaveFail.replace("{a}", code), "info");
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={close}
        title={S.prjNew}
        subtitle={S.prjModalSub}
        wide
        footer={
          <>
            <button className="btn-secondary" onClick={close}>{S.cancelBtn}</button>
            <AsyncButton className="btn-primary" onAction={save}>{S.prjSave}</AsyncButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-steel-500">
            {S.prjCodeAuto}<span className="font-mono font-semibold text-navy-900">{codePreview}</span>
          </p>
          <FormGrid>
            <Field label={S.prjVesselName} required>
              <SearchSelect
                value={form.vessel}
                onChange={(v) => setF("vessel", v)}
                options={vesselOptions}
                placeholder={S.prjVesselPh}
                ariaLabel={S.prjVesselAria || S.prjVesselName}
                allowCustom
                emptyText={S.prjVesselEmpty}
              />
            </Field>
            <Field label={S.colClient} required>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <SearchSelect
                    value={form.client}
                    onChange={(v) => setF("client", v)}
                    options={clientOptions}
                    placeholder={S.prjPickClient}
                    ariaLabel={S.prjClientAria || S.colClient}
                    emptyText={S.prjClientEmpty}
                  />
                </div>
                <button
                  type="button"
                  className="btn-secondary whitespace-nowrap text-xs shrink-0 py-2"
                  onClick={() => setShowClientModal(true)}
                  title={S.prjAddClient}
                >
                  {S.prjAddClientBtn || "+ Klien"}
                </button>
              </div>
            </Field>
            <Field label={S.prjType}>
              <select className="input" value={form.type} onChange={(e) => setF("type", e.target.value)}>
                <option>New Build</option>
                <option>Repair</option>
                <option>Retrofit</option>
              </select>
            </Field>
            <Field label={S.prjInitStage}>
              <select className="input" value={form.tahap} onChange={(e) => setF("tahap", e.target.value)}>
                {TAHAP_V2.map((t) => <option key={t} value={t}>{tahapLabel(t, locale)}</option>)}
              </select>
            </Field>
            <Field label={S.prjPlannedDock}>
              <SearchSelect
                value={form.plannedDockId}
                onChange={(v) => setF("plannedDockId", v)}
                options={dockOptions}
                placeholder={S.prjPickDock}
                ariaLabel={S.prjDockAria || S.prjPlannedDock}
                emptyText={S.prjDockEmpty}
              />
            </Field>
            <Field label={S.prjFieldPm} required>
              <SearchSelect
                value={form.manager}
                onChange={(v) => setF("manager", v)}
                options={pmOptions}
                placeholder={S.prjPickPm}
                ariaLabel={S.prjPmAria || S.prjFieldPm}
                emptyText={S.prjPmEmpty}
              />
            </Field>
            <Field label={S.prjStart} required><input type="date" className="input" value={form.start} onChange={(e) => setF("start", e.target.value)} /></Field>
            <Field label={S.prjEnd} required><input type="date" className="input" value={form.end} onChange={(e) => setF("end", e.target.value)} /></Field>
          </FormGrid>
          {!vesselExists && form.vessel.trim() && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-xs font-semibold text-amber-800">{S.prjNewVesselNote}</p>
              <FormGrid>
                <Field label={S.prjLoa}><NumInput min={0} step={0.1} className="input" value={form.vesselLoa} onChange={(e) => setF("vesselLoa", e.target.value)} placeholder={S.prjLoaPh} /></Field>
                <Field label={S.prjVesselType} required><input className="input" value={form.vesselType} onChange={(e) => setF("vesselType", e.target.value)} placeholder={S.prjVesselTypePh} /></Field>
              </FormGrid>
            </div>
          )}
          <Field label={S.prjBudget} hint={locale === "en" ? "Project value is automatically calculated from the scope items below" : "Nilai proyek otomatis dihitung dari rincian harga ruang lingkup pekerjaan di bawah"} required>
            <MoneyInput
              className="input bg-steel-50/80 font-semibold text-navy-900 cursor-not-allowed"
              value={String(totalScopePrice)}
              onChange={() => {}}
              placeholder="Rp 0"
              disabled
            />
          </Field>
          <div className="rounded-xl border border-steel-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-navy-900">{S.prjScope}</p>
                {totalScopePrice > 0 && (
                  <p className="text-[11px] font-medium text-ocean-700">
                    {(S.prjScopeTotalCost || "Total Biaya")}: {fmtRupiah(totalScopePrice)}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn-secondary px-2 py-1 text-xs"
                onClick={() => setScopeRows((s) => [...s, { service: "", harga: "", deskripsi: "" }])}
              >
                {S.prjAddScope}
              </button>
            </div>
            <div className="space-y-2">
              {scopeRows.map((r, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg bg-surface p-2 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Field label={S.prjScopeType}>
                      <input className="input" value={r.service} onChange={(e) => setScopeRows((s) => s.map((x, i) => (i === idx ? { ...x, service: e.target.value } : x)))} placeholder={S.prjScopeTypePh} />
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label={S.prjScopePrice || "Harga"}>
                      <MoneyInput className="input" value={r.harga} onChange={(v) => setScopeRows((s) => s.map((x, i) => (i === idx ? { ...x, harga: v } : x)))} placeholder={S.prjScopePricePh || "Rp 0"} />
                    </Field>
                  </div>
                  <div className="sm:col-span-4">
                    <Field label={S.prjScopeDesc}>
                      <input className="input" value={r.deskripsi} onChange={(e) => setScopeRows((s) => s.map((x, i) => (i === idx ? { ...x, deskripsi: e.target.value } : x)))} placeholder={S.prjScopeDescPh} />
                    </Field>
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <button
                      type="button"
                      className="btn-secondary w-full px-2 py-2 text-xs text-rose-600"
                      aria-label={S.prjDelScopeAria.replace("{n}", String(idx + 1))}
                      disabled={scopeRows.length <= 1}
                      onClick={() => setScopeRows((s) => s.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ClientModal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSaved={(name) => setF("client", name)}
      />

      {/* Modal Panduan Step-by-Step Pengisian Proyek Baru */}
      <Modal
        open={createdGuide !== null}
        onClose={() => setCreatedGuide(null)}
        title={S.prjGuideTitle}
        subtitle={`${createdGuide?.id ?? ""} · ${createdGuide?.vessel ?? ""}`}
        wide
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreatedGuide(null)}>{S.cancelBtn}</button>
            <button
              className="btn-primary"
              onClick={() => {
                const targetId = createdGuide?.id;
                setCreatedGuide(null);
                if (targetId && typeof window !== "undefined") {
                  window.location.href = `/proyek/${targetId}`;
                }
              }}
            >
              {S.prjGuideOpenProject} →
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-steel-600">{S.prjGuideSub}</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-steel-200 bg-white p-3.5 shadow-2xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-xs font-bold text-navy-800">1</span>
              <div>
                <h4 className="text-sm font-semibold text-navy-900">{S.prjGuideStep1}</h4>
                <p className="mt-0.5 text-xs text-steel-600">{S.prjGuideStep1Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-steel-200 bg-white p-3.5 shadow-2xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-xs font-bold text-navy-800">2</span>
              <div>
                <h4 className="text-sm font-semibold text-navy-900">{S.prjGuideStep2}</h4>
                <p className="mt-0.5 text-xs text-steel-600">{S.prjGuideStep2Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-steel-200 bg-white p-3.5 shadow-2xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-xs font-bold text-navy-800">3</span>
              <div>
                <h4 className="text-sm font-semibold text-navy-900">{S.prjGuideStep3}</h4>
                <p className="mt-0.5 text-xs text-steel-600">{S.prjGuideStep3Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-steel-200 bg-white p-3.5 shadow-2xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-xs font-bold text-navy-800">4</span>
              <div>
                <h4 className="text-sm font-semibold text-navy-900">{S.prjGuideStep4}</h4>
                <p className="mt-0.5 text-xs text-steel-600">{S.prjGuideStep4Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-steel-200 bg-white p-3.5 shadow-2xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-xs font-bold text-navy-800">5</span>
              <div>
                <h4 className="text-sm font-semibold text-navy-900">{S.prjGuideStep5}</h4>
                <p className="mt-0.5 text-xs text-steel-600">{S.prjGuideStep5Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
