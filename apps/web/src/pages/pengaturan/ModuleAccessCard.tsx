/* Pengaturan akses modul per peran oleh akun developer (#287 & #306).
 * Pilihan granular per modul:
 * - CRUD (penuh): bisa melihat dan menambah/mengubah/menghapus data.
 * - Lihat (view only): hanya bisa melihat modul dan data (baca saja).
 * - Tutup (no access): modul dan data tertutup sama sekali.
 * Tab Keuangan juga dapat dibatasi per peran. */
import { useEffect, useState } from "react";
import { Check, Eye, Ban } from "lucide-react";
import { AsyncButton, Card, toast } from "../../components/ui";
import { apiFetch } from "../../services/http";
import { useT } from "../../i18n/LanguageContext";
import { n_roles } from "../../i18n/n_roles";

type AccessLevel = "crud" | "view" | "none";

interface Access {
  levels?: Record<string, AccessLevel>;
  deny: string[];
  finTabs: string[] | null;
}

interface RbacInfo {
  roles: string[];
  modules: string[];
  finTabs: string[];
  defaults: Record<string, Access>;
  effective: Record<string, Access>;
}

export default function ModuleAccessCard() {
  const { locale } = useT();
  const S = n_roles[locale];
  const [info, setInfo] = useState<RbacInfo | null>(null);
  const [draft, setDraft] = useState<Record<string, Access>>({});

  const load = () =>
    apiFetch<RbacInfo>("/api/rbac")
      .then((r) => {
        setInfo(r);
        setDraft(structuredClone(r.effective));
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : S.rbacLoadFail, "info"));

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!info) return null;
  const roles = info.roles.filter((r) => r !== "developer");

  const getLevel = (role: string, mod: string): AccessLevel => {
    const cur = draft[role];
    if (cur?.levels?.[mod]) return cur.levels[mod];
    if (cur?.deny?.includes(mod)) return "none";
    if (role === "viewer") return "view";
    return "crud";
  };

  const setLevel = (role: string, mod: string, level: AccessLevel) => {
    setDraft((d) => {
      const cur = d[role] ?? { levels: {}, deny: [], finTabs: null };
      const baseLevels = cur.levels ? { ...cur.levels } : {};
      // Isi default level untuk modul yang belum terdata
      for (const m of info.modules) {
        if (!baseLevels[m]) {
          baseLevels[m] = cur.deny?.includes(m) ? "none" : (role === "viewer" ? "view" : "crud");
        }
      }
      baseLevels[mod] = level;
      const deny = info.modules.filter((m) => baseLevels[m] === "none");
      return { ...d, [role]: { ...cur, levels: baseLevels, deny } };
    });
  };

  const toggleTab = (role: string, tab: string) =>
    setDraft((d) => {
      const cur = d[role] ?? { levels: {}, deny: [], finTabs: null };
      const all = info.finTabs;
      const now = cur.finTabs ?? all;
      const next = now.includes(tab) ? now.filter((t) => t !== tab) : [...now, tab];
      return {
        ...d,
        [role]: { ...cur, finTabs: next.length === all.length ? null : all.filter((t) => next.includes(t)) },
      };
    });

  const save = async () => {
    await apiFetch("/api/rbac", { method: "PUT", body: JSON.stringify({ override: draft }) });
    toast(S.rbacSaved);
    await load();
  };

  return (
    <Card className="mb-4 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-navy-900">{S.rbacTitle}</h3>
          <p className="text-xs text-steel-500">{S.rbacSub}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 border border-emerald-200" title={S.rbacLevelCrudTip}>
              <Check className="h-3.5 w-3.5 text-emerald-700" /> {S.rbacLevelCrud}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded bg-sky-50 px-2 py-0.5 font-medium text-sky-800 border border-sky-200" title={S.rbacLevelViewTip}>
              <Eye className="h-3.5 w-3.5 text-sky-700" /> {S.rbacLevelView}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded bg-steel-100 px-2 py-0.5 font-medium text-steel-600 border border-steel-200" title={S.rbacLevelNoneTip}>
              <Ban className="h-3.5 w-3.5 text-steel-500" /> {S.rbacLevelNone}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => setDraft(structuredClone(info.defaults))}
          >
            {S.rbacReset}
          </button>
          <AsyncButton className="btn-primary text-xs" onAction={save}>
            {S.rbacSave}
          </AsyncButton>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-steel-100">
        <table className="min-w-[1300px] text-xs">
          <thead>
            <tr className="border-b border-steel-100 bg-steel-50/70 text-left text-steel-600">
              <th className="sticky left-0 bg-steel-50 px-2.5 py-2 font-semibold shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                {S.rbacRole}
              </th>
              {info.modules.map((m) => (
                <th key={m} className="px-1.5 py-2 text-center font-semibold capitalize">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r} className="border-b border-steel-50 hover:bg-steel-50/30">
                <td className="sticky left-0 bg-white px-2.5 py-1.5 font-medium capitalize text-navy-900 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                  {r}
                </td>
                {info.modules.map((m) => {
                  const level = getLevel(r, m);
                  return (
                    <td key={m} className="px-1 py-1 text-center">
                      <select
                        aria-label={`${r} ${m}`}
                        value={level}
                        onChange={(e) => setLevel(r, m, e.target.value as AccessLevel)}
                        className={`w-full min-w-[72px] cursor-pointer rounded border px-1 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 ${
                          level === "crud"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-500"
                            : level === "view"
                            ? "border-sky-300 bg-sky-50 text-sky-800 focus:ring-sky-500"
                            : "border-steel-200 bg-steel-100 text-steel-500 focus:ring-steel-400"
                        }`}
                        title={
                          level === "crud"
                            ? S.rbacLevelCrudTip
                            : level === "view"
                            ? S.rbacLevelViewTip
                            : S.rbacLevelNoneTip
                        }
                      >
                        <option value="crud" className="bg-white text-emerald-800 font-medium">
                          {S.rbacLevelCrud}
                        </option>
                        <option value="view" className="bg-white text-sky-800 font-medium">
                          {S.rbacLevelView}
                        </option>
                        <option value="none" className="bg-white text-steel-500 font-medium">
                          {S.rbacLevelNone}
                        </option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mb-1 mt-4 text-sm font-semibold text-navy-900">{S.rbacFinTabs}</h4>
      <div className="overflow-x-auto rounded border border-steel-100">
        <table className="min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-steel-100 bg-steel-50/70 text-left text-steel-600">
              <th className="px-2.5 py-2 font-semibold">{S.rbacRole}</th>
              {info.finTabs.map((t) => (
                <th key={t} className="px-1.5 py-2 text-center font-semibold">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles
              .filter((r) => getLevel(r, "keuangan") !== "none")
              .map((r) => (
                <tr key={r} className="border-b border-steel-50 hover:bg-steel-50/30">
                  <td className="px-2.5 py-1.5 font-medium capitalize text-navy-900">{r}</td>
                  {info.finTabs.map((t) => (
                    <td key={t} className="px-1.5 py-1 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${r} ${t}`}
                        checked={(draft[r]?.finTabs ?? info.finTabs).includes(t)}
                        onChange={() => toggleTab(r, t)}
                        className="rounded border-steel-300 text-navy-700 focus:ring-navy-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
