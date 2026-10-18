/* Rencana docking proyek di tab WBS (catatan klien 17 Okt, K17-PM-12):
   Pimpinan Proyek melengkapi lokasi docking, rencana mulai, dan estimasi
   selesai. Sebelumnya ketiganya hanya bisa diisi saat proyek dibuat. Hak ubah
   mengikuti izin tulis `projects` (server menegakkan hal yang sama). */
import { useEffect, useState } from "react";
import { Card, Field, FormGrid, toast } from "../../components/ui";
import { useT } from "../../i18n/LanguageContext";
import { n_prj } from "../../i18n/n_prj";
import type { StoreItem } from "../../data/store";
import { fmtTanggal } from "../../utils/format";

interface Props {
  project: StoreItem;
  drydocks: StoreItem[];
  canEdit: boolean;
  onSave: (patch: { plannedDockId: string; start: string; end: string }) => Promise<void>;
}

const iso = (v: unknown): string => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? String(v) : "");

export default function DockPlanCard({ project, drydocks, canEdit, onSave }: Props) {
  const { locale } = useT();
  const S = n_prj[locale];
  const init = () => ({ plannedDockId: String(project.plannedDockId ?? ""), start: iso(project.start), end: iso(project.end) });
  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF(init()); }, [project.id, project.plannedDockId, project.start, project.end]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = f.plannedDockId !== String(project.plannedDockId ?? "") || f.start !== iso(project.start) || f.end !== iso(project.end);
  const dockName = drydocks.find((d) => String(d.id) === String(project.plannedDockId ?? ""))?.name;

  const save = async (): Promise<void> => {
    if (f.start && f.end && f.end < f.start) { toast(S.dockPlanEndBeforeStart, "info"); return; }
    setBusy(true);
    try {
      await onSave(f);
      toast(S.dockPlanSaved);
    } catch (e) {
      toast(e instanceof Error ? e.message : S.dockPlanSaveFail, "info");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-navy-900">{S.dockPlanTitle}</h3>
          <p className="text-xs text-steel-500">{canEdit ? S.dockPlanSub : S.dockPlanReadOnly}</p>
        </div>
        {canEdit && dirty && (
          <button type="button" className="btn-primary text-xs" disabled={busy} onClick={() => void save()}>{S.dockPlanSave}</button>
        )}
      </div>
      {canEdit ? (
        <FormGrid>
          <Field label={S.dockPlanDock}>
            <select className="input" value={f.plannedDockId} onChange={(e) => setF({ ...f, plannedDockId: e.target.value })}>
              <option value="">{S.dockPlanNoDock}</option>
              {drydocks.map((d) => <option key={String(d.id)} value={String(d.id)}>{String(d.name ?? d.id)}</option>)}
            </select>
          </Field>
          <Field label={S.dockPlanStart}>
            <input type="date" className="input" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
          </Field>
          <Field label={S.dockPlanEnd}>
            <input type="date" className="input" min={f.start || undefined} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
          </Field>
        </FormGrid>
      ) : (
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-steel-500">{S.dockPlanDock}</dt><dd className="font-medium text-navy-900">{dockName ? String(dockName) : "-"}</dd></div>
          <div><dt className="text-xs text-steel-500">{S.dockPlanStart}</dt><dd className="font-medium text-navy-900">{fmtTanggal(iso(project.start) || "-")}</dd></div>
          <div><dt className="text-xs text-steel-500">{S.dockPlanEnd}</dt><dd className="font-medium text-navy-900">{fmtTanggal(iso(project.end) || "-")}</dd></div>
        </dl>
      )}
    </Card>
  );
}
