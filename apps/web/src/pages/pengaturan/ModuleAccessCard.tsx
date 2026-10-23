/* Pengaturan akses modul per peran oleh akun developer (#287). Default
 * mengikuti notulen 23 Okt (server: moduleAccess.ts); centang = boleh membuka
 * modul. Tab Keuangan bisa dibatasi per peran. Izin data (tambah/ubah/hapus)
 * tetap dijaga server per koleksi. */
import { useEffect, useState } from "react";
import { AsyncButton, Card, toast } from "../../components/ui";
import { apiFetch } from "../../services/http";
import { useT } from "../../i18n/LanguageContext";
import { n_roles } from "../../i18n/n_roles";

interface Access { deny: string[]; finTabs: string[] | null }
interface RbacInfo { roles: string[]; modules: string[]; finTabs: string[]; defaults: Record<string, Access>; effective: Record<string, Access> }

export default function ModuleAccessCard() {
  const { locale } = useT();
  const S = n_roles[locale];
  const [info, setInfo] = useState<RbacInfo | null>(null);
  const [draft, setDraft] = useState<Record<string, Access>>({});

  const load = () => apiFetch<RbacInfo>("/api/rbac")
    .then((r) => { setInfo(r); setDraft(structuredClone(r.effective)); })
    .catch((e: unknown) => toast(e instanceof Error ? e.message : S.rbacLoadFail, "info"));
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!info) return null;
  const roles = info.roles.filter((r) => r !== "developer");
  const toggle = (role: string, mod: string) => setDraft((d) => {
    const cur = d[role] ?? { deny: [], finTabs: null };
    const deny = cur.deny.includes(mod) ? cur.deny.filter((m) => m !== mod) : [...cur.deny, mod];
    return { ...d, [role]: { ...cur, deny } };
  });
  const toggleTab = (role: string, tab: string) => setDraft((d) => {
    const cur = d[role] ?? { deny: [], finTabs: null };
    const all = info.finTabs;
    const now = cur.finTabs ?? all;
    const next = now.includes(tab) ? now.filter((t) => t !== tab) : [...now, tab];
    return { ...d, [role]: { ...cur, finTabs: next.length === all.length ? null : all.filter((t) => next.includes(t)) } };
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
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => setDraft(structuredClone(info.defaults))}>{S.rbacReset}</button>
          <AsyncButton className="btn-primary text-xs" onAction={save}>{S.rbacSave}</AsyncButton>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] text-xs">
          <thead>
            <tr className="border-b border-steel-100 text-left text-steel-500">
              <th className="sticky left-0 bg-white px-2 py-1.5">{S.rbacRole}</th>
              {info.modules.map((m) => <th key={m} className="px-1.5 py-1.5 text-center capitalize">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r} className="border-b border-steel-50">
                <td className="sticky left-0 bg-white px-2 py-1.5 font-medium capitalize text-navy-900">{r}</td>
                {info.modules.map((m) => (
                  <td key={m} className="px-1.5 py-1 text-center">
                    <input type="checkbox" aria-label={`${r} ${m}`} checked={!(draft[r]?.deny ?? []).includes(m)} onChange={() => toggle(r, m)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4 className="mb-1 mt-4 text-sm font-semibold text-navy-900">{S.rbacFinTabs}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-steel-100 text-left text-steel-500">
              <th className="px-2 py-1.5">{S.rbacRole}</th>
              {info.finTabs.map((t) => <th key={t} className="px-1.5 py-1.5 text-center">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {roles.filter((r) => !(draft[r]?.deny ?? []).includes("keuangan")).map((r) => (
              <tr key={r} className="border-b border-steel-50">
                <td className="px-2 py-1.5 font-medium capitalize text-navy-900">{r}</td>
                {info.finTabs.map((t) => (
                  <td key={t} className="px-1.5 py-1 text-center">
                    <input type="checkbox" aria-label={`${r} ${t}`} checked={(draft[r]?.finTabs ?? info.finTabs).includes(t)} onChange={() => toggleTab(r, t)} />
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
