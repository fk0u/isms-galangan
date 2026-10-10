/* Tab QC "Inspeksi Proyek" (F3-K-02 mesin kuesioner, F3-K-03 inspeksi per
 * proyek): proyek → pekerjaan WBS → isi kuesioner berbobot → skor (dihitung
 * server) + riwayat; skor di bawah ambang menawarkan NCR terisi otomatis.
 * Editor template sederhana untuk QC/direktur (ADR-0009). */
import { useMemo, useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { AsyncButton, Badge, EmptyState, Field, FormGrid, Modal, NumInput, ProgressBar, toast } from "../../components/ui";
import { useStore, type StoreItem } from "../../data/store";
import { useAuth, hasPermission } from "../../auth/auth";
import { useT } from "../../i18n/LanguageContext";
import { n_clq } from "../../i18n/n_clq";
import { scoreChecklist, type ScItem, type ScTemplate } from "../../utils/scoring";
import { getSetting } from "../../utils/settings";
import { fmtTanggal, todayISO } from "../../utils/format";

type ItemType = "ya_tidak" | "skala_1_5" | "pilihan" | "teks";
interface EditItem { id: string; text: string; type: ItemType; weight: string; options: string }
interface EditSection { title: string; items: EditItem[] }
interface EditTemplate { id: string | null; name: string; scope: "QC" | "HSE"; target: "pekerjaan" | "pekerja"; sections: EditSection[] }

const uid = () => `it-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const emptyItem = (): EditItem => ({ id: uid(), text: "", type: "ya_tidak", weight: "1", options: "Baik=1, Cukup=0.5, Buruk=0" });
const scoreTone = (s: number, thr: number) => (s >= thr ? "green" : s >= thr - 15 ? "amber" : "red");
const itemsOf = (t: StoreItem): (ScItem & { text?: string })[] =>
  ((t.sections ?? []) as { items?: (ScItem & { text?: string })[] }[]).flatMap((s) => s.items ?? []);

export default function ChecklistTab() {
  const { locale } = useT();
  const T = n_clq[locale];
  const { data, add, update, remove, wbsFor, inBranch } = useStore();
  const { user } = useAuth();
  const canManage = hasPermission(user?.permissions, "checklistTemplates", "w");
  const canInspect = hasPermission(user?.permissions, "checklistResponses", "w");
  const threshold = getSetting(data, "QC_SCORE_THRESHOLD", 70);
  const [view, setView] = useState<"projects" | "workers" | "templates">("projects");
  const [pid, setPid] = useState<string | null>(null);
  const [openHist, setOpenHist] = useState<string | null>(null);
  const [inspect, setInspect] = useState<{ pid: string; task: string; empId?: string } | null>(null);
  const [tplId, setTplId] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{ score: number; id: string; task: string; tpl: string; pid: string } | null>(null);
  const [edit, setEdit] = useState<EditTemplate | null>(null);

  const templates = data.checklistTemplates ?? [];
  // Lingkup cabang sesi: proyek & hasil inspeksi cabang lain tidak ikut tampil.
  const projects = useMemo(() => inBranch(data.projects ?? []).filter((p) => !["Selesai", "Batal"].includes(String(p.status))), [data.projects, inBranch]);
  const branchPids = useMemo(() => new Set(inBranch(data.projects ?? []).map((p) => String(p.id))), [data.projects, inBranch]);
  const responses = useMemo(() => (data.checklistResponses ?? []).filter((r) => branchPids.has(String(r.projectId ?? ""))), [data.checklistResponses, branchPids]);
  const respOf = (projectId: string, task?: string) => responses
    .filter((r) => String(r.projectId ?? "") === projectId && (task === undefined || String(r.wbsTask ?? "") === task))
    .sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
  /* F3-K-04: kuesioner HSE per pekerja - respons tanpa proyek, ber-employeeId. */
  const workers = useMemo(() => inBranch(data.employees ?? []).filter((e) => String(e.status ?? "Aktif") === "Aktif"), [data.employees, inBranch]);
  const hseOf = (empId: string) => (data.checklistResponses ?? [])
    .filter((r) => String(r.employeeId ?? "") === empId)
    .sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
  const tpl = templates.find((t) => String(t.id) === tplId);
  const preview = tpl ? scoreChecklist(tpl as unknown as ScTemplate, answers) : null;

  const saveInspection = async () => {
    if (!inspect) return;
    if (!tpl) { toast(T.needTemplate, "info"); return; }
    if (!preview || preview.answered === 0) { toast(T.needAnswers, "info"); return; }
    try {
      const created = await add("checklistResponses", {
        templateId: String(tpl.id), templateName: String(tpl.name), scope: String(tpl.scope ?? "QC"),
        projectId: inspect.pid, wbsTask: inspect.empId ? "" : inspect.task, answers, score: preview.score,
        ...(inspect.empId ? { employeeId: inspect.empId, employeeName: inspect.task } : {}),
        inspector: user?.name ?? "-", at: new Date().toISOString(),
      }, { action: "inspeksi kuesioner", target: `${inspect.pid} · ${inspect.task}`, module: "QC" });
      const score = Number(created.score ?? preview.score);
      toast(T.saved.replace("{s}", String(score)));
      // Tawaran NCR hanya untuk inspeksi pekerjaan; skor pekerja bukan ketidaksesuaian produk.
      if (!inspect.empId) setResult({ score, id: String(created.id), task: inspect.task, tpl: String(tpl.name), pid: inspect.pid });
      setInspect(null); setAnswers({}); setTplId("");
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };

  const makeNcr = async () => {
    if (!result) return;
    const proj = (data.projects ?? []).find((p) => String(p.id) === result.pid);
    try {
      const ncr = await add("ncr", {
        project: result.pid, vessel: String(proj?.vessel ?? ""), type: "Inspeksi", status: "Terbuka", severity: "Major", raised: todayISO(),
        issue: T.ncrIssue.replace("{s}", String(result.score)).replace("{t}", String(threshold)).replace("{task}", result.task).replace("{tpl}", result.tpl),
        sourceResponseId: result.id,
      }, { action: "membuat NCR dari inspeksi", target: result.pid, module: "QC" });
      toast(T.ncrMade.replace("{n}", String(ncr.id)));
      setResult(null);
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };

  const openEdit = (t?: StoreItem) => setEdit(t ? {
    id: String(t.id), name: String(t.name ?? ""), scope: (t.scope === "HSE" ? "HSE" : "QC"), target: (t.target === "pekerja" ? "pekerja" : "pekerjaan"),
    sections: ((t.sections ?? []) as { title?: string; items?: (ScItem & { text?: string })[] }[]).map((s) => ({
      title: String(s.title ?? ""),
      items: (s.items ?? []).map((i) => ({ id: i.id, text: String(i.text ?? ""), type: i.type as ItemType, weight: String(i.weight ?? 1), options: (i.options ?? []).map((o) => `${o.label}=${o.score}`).join(", ") })),
    })),
  } : { id: null, name: "", scope: "QC", target: "pekerjaan", sections: [{ title: "", items: [emptyItem()] }] });

  const saveTemplate = async () => {
    if (!edit) return;
    const sections = edit.sections.map((s) => ({
      title: s.title.trim(),
      items: s.items.filter((i) => i.text.trim() !== "").map((i) => ({
        id: i.id, text: i.text.trim(), type: i.type, weight: i.type === "teks" ? 0 : Math.max(0, Number(i.weight) || 0),
        ...(i.type === "pilihan" ? { options: i.options.split(",").map((o) => o.split("=")).filter((o) => o[0]?.trim()).map((o) => ({ label: o[0].trim(), score: Math.max(0, Math.min(1, Number(o[1]) || 0)) })) } : {}),
      })),
    })).filter((s) => s.items.length > 0);
    // Minimal satu butir bernilai (bukan teks) berbobot > 0, supaya skor tidak selalu 0.
    const scored = sections.flatMap((x) => x.items).filter((i) => i.type !== "teks" && i.weight > 0 && (i.type !== "pilihan" || (i.options ?? []).length > 0));
    if (!edit.name.trim() || sections.length === 0 || scored.length === 0) { toast(T.tplInvalid, "info"); return; }
    const payload = { name: edit.name.trim(), scope: edit.scope, target: edit.target, sections };
    try {
      if (edit.id) await update("checklistTemplates", edit.id, payload);
      else await add("checklistTemplates", payload, { action: "membuat template kuesioner", module: "QC" });
      toast(T.tplSaved);
      setEdit(null);
    } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); }
  };
  const patchItem = (si: number, ii: number, patch: Partial<EditItem>) => setEdit((e) => e && ({
    ...e, sections: e.sections.map((s, a) => (a !== si ? s : { ...s, items: s.items.map((it, b) => (b !== ii ? it : { ...it, ...patch })) })),
  }));

  const seg = (v: typeof view, label: string) => (
    <button type="button" aria-pressed={view === v} onClick={() => setView(v)}
      className={`rounded-md px-3 py-1 text-xs font-medium ${view === v ? "bg-navy-900 text-white" : "text-steel-600 hover:text-navy-900"}`}>{label}</button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-steel-600">{T.intro}</p>
        <div className="inline-flex rounded-lg border border-steel-200 p-0.5">{seg("projects", T.viewProjects)}{seg("workers", T.viewWorkers)}{seg("templates", `${T.viewTemplates} (${templates.length})`)}</div>
      </div>

      {result && result.score < threshold && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mr-auto">{T.below.replace("{s}", String(result.score)).replace("{t}", String(threshold))} {result.task}</span>
          <AsyncButton className="btn-primary text-xs" onAction={makeNcr}>{T.makeNcr}</AsyncButton>
          <button type="button" className="text-xs underline" onClick={() => setResult(null)}>×</button>
        </div>
      )}

      {view === "projects" && !pid && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{[T.colProject, T.colInspections, T.colLast, T.colAvg, ""].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-steel-100">
              {projects.map((p) => {
                const rs = respOf(String(p.id));
                const avg = rs.length ? Math.round(rs.reduce((s, r) => s + Number(r.score ?? 0), 0) / rs.length) : null;
                return (
                  <tr key={String(p.id)}>
                    <td className="td"><p className="text-sm font-semibold text-navy-900">{String(p.vessel ?? "")}</p><p className="font-mono text-xs text-steel-500">{String(p.id)}</p></td>
                    <td className="td tabular-nums">{rs.length}</td>
                    <td className="td">{rs[0] ? <Badge tone={scoreTone(Number(rs[0].score), threshold)}>{String(rs[0].score)}</Badge> : <span className="text-steel-400">-</span>}</td>
                    <td className="td tabular-nums">{avg ?? "-"}</td>
                    <td className="td"><button type="button" className="btn-secondary text-xs" onClick={() => setPid(String(p.id))}>{T.open}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === "projects" && pid && (
        <div>
          <button type="button" className="mb-2 text-sm text-ocean-600 hover:underline" onClick={() => setPid(null)}>← {T.back}</button>
          <p className="mb-2 text-sm font-semibold text-navy-900">{pid} · {String((data.projects ?? []).find((p) => String(p.id) === pid)?.vessel ?? "")}</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>{[T.colTask, T.colAssignee, T.colProgress, T.colLast, ""].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-steel-100">
                {wbsFor(pid).map((w) => {
                  const rs = respOf(pid, String(w.task));
                  const key = String(w.task);
                  return [
                    <tr key={key}>
                      <td className="td text-sm text-navy-900">{key}</td>
                      <td className="td text-sm text-steel-600">{w.assignee?.name ?? "-"}{w.assignee?.woId ? <span className="ml-1 font-mono text-[11px] text-steel-400">{w.assignee.woId}</span> : null}</td>
                      <td className="td"><div className="flex items-center gap-2"><ProgressBar value={Number(w.progress ?? 0)} className="w-20" /><span className="text-xs">{Number(w.progress ?? 0)}%</span></div></td>
                      <td className="td">
                        {rs[0] ? <Badge tone={scoreTone(Number(rs[0].score), threshold)}>{String(rs[0].score)}</Badge> : <span className="text-xs text-steel-400">{T.noHistory}</span>}
                        {rs.length > 0 && <button type="button" className="ml-2 text-xs text-ocean-600 hover:underline" onClick={() => setOpenHist(openHist === key ? null : key)}>{T.history.replace("{n}", String(rs.length))}</button>}
                      </td>
                      <td className="td">{canInspect && <button type="button" className="btn-primary text-xs" onClick={() => { setInspect({ pid, task: key }); setAnswers({}); setTplId(""); }}>{T.start}</button>}</td>
                    </tr>,
                    openHist === key ? (
                      <tr key={`${key}-h`}>
                        <td colSpan={5} className="bg-steel-50 px-4 py-2">
                          <ul className="space-y-1 text-xs">
                            {rs.map((r) => (
                              <li key={String(r.id)} className="flex flex-wrap items-center gap-2">
                                <Badge tone={scoreTone(Number(r.score), threshold)}>{String(r.score)}</Badge>
                                <span className="text-navy-900">{String(r.templateName ?? r.templateId)}</span>
                                <span className="text-steel-500">{T.by.replace("{by}", String(r.inspector ?? "-")).replace("{date}", fmtTanggal(String(r.at ?? "").slice(0, 10)))}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "workers" && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{[T.colWorker, T.colInspections, T.colLast, T.colAvg, ""].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-steel-100">
              {workers.map((e) => {
                const rs = hseOf(String(e.id));
                const avg = rs.length ? Math.round(rs.reduce((s, r) => s + Number(r.score ?? 0), 0) / rs.length) : null;
                return (
                  <tr key={String(e.id)}>
                    <td className="td"><p className="text-sm font-semibold text-navy-900">{String(e.name ?? "")}</p><p className="text-xs text-steel-500">{String(e.role ?? "")} · {String(e.dept ?? "")}</p></td>
                    <td className="td tabular-nums">{rs.length}</td>
                    <td className="td">{rs[0] ? <><Badge tone={scoreTone(Number(rs[0].score), threshold)}>{String(rs[0].score)}</Badge><span className="ml-2 text-xs text-steel-500">{fmtTanggal(String(rs[0].at ?? "").slice(0, 10))}</span></> : <span className="text-steel-400">-</span>}</td>
                    <td className="td tabular-nums">{avg ?? "-"}</td>
                    <td className="td">{canInspect && <button type="button" className="btn-primary text-xs" onClick={() => { setInspect({ pid: "", task: String(e.name ?? e.id), empId: String(e.id) }); setAnswers({}); setTplId(""); }}>{T.fill}</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === "templates" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-steel-500">{canManage ? "" : T.onlyQc}</span>
            {canManage && <button type="button" className="btn-secondary text-xs" onClick={() => openEdit()}><Plus className="h-3.5 w-3.5" /> {T.tplNew}</button>}
          </div>
          {templates.length === 0 ? <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title={T.viewTemplates} /> : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {templates.map((t) => {
                const items = itemsOf(t);
                return (
                  <li key={String(t.id)} className="rounded-xl border border-steel-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{String(t.name)}</p>
                        <p className="mt-0.5 text-xs text-steel-500">{T.items.replace("{n}", String(items.length)).replace("{w}", String(items.reduce((s, i) => s + Number(i.weight ?? 0), 0)))}</p>
                      </div>
                      <div className="flex gap-1.5"><Badge tone={t.scope === "HSE" ? "amber" : "navy"}>{String(t.scope ?? "QC")}</Badge><Badge tone="gray">{t.target === "pekerja" ? T.tgtWorker : T.tgtWork}</Badge></div>
                    </div>
                    {canManage && (
                      <div className="mt-3 flex gap-1.5">
                        <button type="button" className="btn-secondary text-xs" onClick={() => openEdit(t)}>{T.tplEdit}</button>
                        <AsyncButton className="btn-secondary text-xs text-rose-600" onAction={async () => { try { await remove("checklistTemplates", String(t.id)); } catch (e) { toast(e instanceof Error ? e.message : String(e), "info"); } }}>{T.tplDelete}</AsyncButton>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Isi kuesioner */}
      <Modal open={inspect !== null} onClose={() => setInspect(null)} wide title={T.modalTitle.replace("{n}", inspect?.task ?? "")} subtitle={inspect?.pid}
        footer={<><span className="mr-auto text-xs text-steel-600">{preview ? T.preview.replace("{s}", String(preview.score)).replace("{a}", String(preview.answered)).replace("{t}", String(preview.total)) : ""}</span><button type="button" className="btn-secondary" onClick={() => setInspect(null)}>×</button><AsyncButton className="btn-primary" onAction={saveInspection}>{T.save}</AsyncButton></>}>
        <div className="space-y-4">
          <Field label={T.template}>
            <select className="input" value={tplId} onChange={(e) => { setTplId(e.target.value); setAnswers({}); }}>
              <option value="">{T.pickTemplate}</option>
              {templates.filter((t) => (inspect?.empId ? t.scope === "HSE" && t.target === "pekerja" : String(t.scope ?? "QC") === "QC")).map((t) => <option key={String(t.id)} value={String(t.id)}>{String(t.name)}</option>)}
            </select>
          </Field>
          {tpl && ((tpl.sections ?? []) as { title?: string; items?: (ScItem & { text?: string })[] }[]).map((s, si) => (
            <fieldset key={si} className="rounded-xl border border-steel-200 p-3">
              <legend className="px-1 text-xs font-semibold text-navy-900">{String(s.title || `${T.section} ${si + 1}`)}</legend>
              <div className="space-y-3">
                {(s.items ?? []).map((it) => (
                  <div key={it.id}>
                    <p className="text-sm text-navy-900">{it.text} {it.type !== "teks" && <span className="text-[11px] text-steel-400">· {T.itemWeight} {Number(it.weight ?? 1)}</span>}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {it.type === "ya_tidak" && ([["ya", T.yes], ["tidak", T.no], ["na", T.na]] as const).map(([v, l]) => (
                        <button key={v} type="button" aria-pressed={answers[it.id] === v} onClick={() => setAnswers({ ...answers, [it.id]: v })}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium ${answers[it.id] === v ? "border-navy-900 bg-navy-900 text-white" : "border-steel-200 text-steel-600 hover:border-steel-400"}`}>{l}</button>
                      ))}
                      {it.type === "skala_1_5" && [1, 2, 3, 4, 5].map((v) => (
                        <button key={v} type="button" aria-pressed={answers[it.id] === v} onClick={() => setAnswers({ ...answers, [it.id]: v })}
                          className={`h-8 w-8 rounded-lg border text-xs font-semibold ${answers[it.id] === v ? "border-navy-900 bg-navy-900 text-white" : "border-steel-200 text-steel-600 hover:border-steel-400"}`}>{v}</button>
                      ))}
                      {it.type === "pilihan" && (it.options ?? []).map((o) => (
                        <button key={o.label} type="button" aria-pressed={answers[it.id] === o.label} onClick={() => setAnswers({ ...answers, [it.id]: o.label })}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium ${answers[it.id] === o.label ? "border-navy-900 bg-navy-900 text-white" : "border-steel-200 text-steel-600 hover:border-steel-400"}`}>{o.label}</button>
                      ))}
                      {it.type === "teks" && <input className="input" value={String(answers[it.id] ?? "")} onChange={(e) => setAnswers({ ...answers, [it.id]: e.target.value })} />}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Modal>

      {/* Editor template */}
      <Modal open={edit !== null} onClose={() => setEdit(null)} wide title={edit?.id ? T.tplEdit : T.tplNew}
        footer={<><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>×</button><AsyncButton className="btn-primary" onAction={saveTemplate}>{T.tplSave}</AsyncButton></>}>
        {edit && (
          <div className="space-y-3">
            <Field label={T.tplName}><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <FormGrid>
              <Field label={T.tplScope}><select className="input" value={edit.scope} onChange={(e) => setEdit({ ...edit, scope: e.target.value as "QC" | "HSE" })}><option>QC</option><option>HSE</option></select></Field>
              <Field label={T.tplTarget}><select className="input" value={edit.target} onChange={(e) => setEdit({ ...edit, target: e.target.value as "pekerjaan" | "pekerja" })}><option value="pekerjaan">{T.tgtWork}</option><option value="pekerja">{T.tgtWorker}</option></select></Field>
            </FormGrid>
            {edit.sections.map((s, si) => (
              <fieldset key={si} className="rounded-xl border border-steel-200 p-3">
                <legend className="px-1 text-xs font-semibold text-navy-900">{T.section} {si + 1}</legend>
                <Field label={T.sectionTitle}><input className="input" value={s.title} onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x, a) => (a === si ? { ...x, title: e.target.value } : x)) })} /></Field>
                <div className="mt-2 space-y-2">
                  {s.items.map((it, ii) => (
                    <div key={it.id} className="grid grid-cols-12 items-end gap-2">
                      <div className="col-span-12 sm:col-span-6"><Field label={T.itemText}><input className="input" value={it.text} onChange={(e) => patchItem(si, ii, { text: e.target.value })} /></Field></div>
                      <div className="col-span-6 sm:col-span-3"><Field label={T.itemType}>
                        <select className="input" value={it.type} onChange={(e) => patchItem(si, ii, { type: e.target.value as ItemType })}>
                          <option value="ya_tidak">{T.tYesNo}</option><option value="skala_1_5">{T.tScale}</option><option value="pilihan">{T.tChoice}</option><option value="teks">{T.tText}</option>
                        </select></Field></div>
                      <div className="col-span-3 sm:col-span-2"><Field label={T.itemWeight}><NumInput min={0} className="input" value={it.weight} onChange={(e) => patchItem(si, ii, { weight: e.target.value })} /></Field></div>
                      <button type="button" className="btn-secondary col-span-3 mb-0.5 h-9 px-2 text-xs sm:col-span-1" aria-label={T.remove} onClick={() => setEdit({ ...edit, sections: edit.sections.map((x, a) => (a === si ? { ...x, items: x.items.filter((_, b) => b !== ii) } : x)) })}>×</button>
                      {it.type === "pilihan" && <div className="col-span-12"><Field label={T.itemOptions}><input className="input" value={it.options} onChange={(e) => patchItem(si, ii, { options: e.target.value })} /></Field></div>}
                    </div>
                  ))}
                  <button type="button" className="btn-secondary text-xs" onClick={() => setEdit({ ...edit, sections: edit.sections.map((x, a) => (a === si ? { ...x, items: [...x.items, emptyItem()] } : x)) })}><Plus className="h-3.5 w-3.5" /> {T.addItem}</button>
                </div>
              </fieldset>
            ))}
            <button type="button" className="btn-secondary text-xs" onClick={() => setEdit({ ...edit, sections: [...edit.sections, { title: "", items: [emptyItem()] }] })}><Plus className="h-3.5 w-3.5" /> {T.addSection}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
