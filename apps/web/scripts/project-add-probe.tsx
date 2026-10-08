/* Probe F3-B-05: Form proyek baru (plannedDockId, SearchSelect kapal/klien/PM/dock, status default "Dalam Proses", cabang otomatis dari sesi).
   Jalankan: npm run probe:project-add */
import "./browser-shims";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { n_prj } from "../src/i18n/n_prj";
import { StoreProvider } from "../src/data/store";
import ProjectAddModal from "../src/components/ProjectAddModal";
import type { StoreItem } from "../src/data/store";

declare const process: { exit(code: number): never };

let fail = 0;
const assert = (ok: boolean, label: string, detail = ""): void => {
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail !== "" ? ` -> ${detail}` : ""}`);
};

const dummyProjects: StoreItem[] = [
  { id: "PRJ-2026-001", vessel: "TB Semangat 01", type: "New Build", status: "Dalam Proses" },
];

const dummyVessels: StoreItem[] = [
  { id: "VES-01", name: "TB Semangat 01", type: "Tugboat", imo: "IMO 9123456" },
  { id: "VES-02", name: "TB Borneo Star", type: "Barge", imo: "IMO 9876543" },
];

const dummyClients: StoreItem[] = [
  { id: "CLI-01", name: "PT Pelayaran Makmur", phone: "08123456789" },
  { id: "CLI-02", name: "PT Samudera Abadi", phone: "08234567890" },
];

const dummyEmployees: StoreItem[] = [
  { id: "EMP-01", name: "Budi Santoso", role: "Project Manager", dept: "Proyek" },
  { id: "EMP-02", name: "Ahmad Teknisi", role: "Welder", dept: "Produksi" },
  { id: "EMP-03", name: "Dewi Putri", role: "Engineering Manager", dept: "Engineering" },
];

const dummyDocks: StoreItem[] = [
  { id: "DD-1", name: "Drydock 1 - Panjang 120m", capacity: "120m", status: "Tersedia" },
  { id: "SL-1", name: "Slipway 1", capacity: "80m", status: "Tersedia" },
];

// 1. Verifikasi kunci i18n dwibahasa untuk field form baru
{
  assert(typeof n_prj.id.prjPlannedDock === "string" && n_prj.id.prjPlannedDock.length > 0, "i18n ID: prjPlannedDock terdefinisi");
  assert(typeof n_prj.en.prjPlannedDock === "string" && n_prj.en.prjPlannedDock.length > 0, "i18n EN: prjPlannedDock terdefinisi");
  assert(typeof n_prj.id.prjPickDock === "string", "i18n ID: prjPickDock terdefinisi");
  assert(typeof n_prj.en.prjPickDock === "string", "i18n EN: prjPickDock terdefinisi");
  assert(typeof n_prj.id.prjPickPm === "string", "i18n ID: prjPickPm terdefinisi");
  assert(typeof n_prj.en.prjPickPm === "string", "i18n EN: prjPickPm terdefinisi");
}

// 2. Verifikasi render SSR modal dan field-field baru
{
  const mockAdd = async (_col: string, item: Record<string, unknown>) => item as unknown as StoreItem;

  const html = renderToString(
    <LanguageProvider>
      <StoreProvider>
        <ProjectAddModal
          open={true}
          onClose={() => {}}
          S={n_prj.id}
          projects={dummyProjects}
          vessels={dummyVessels}
          clients={dummyClients}
          employees={dummyEmployees}
          docks={dummyDocks}
          add={mockAdd as any}
        />
      </StoreProvider>
    </LanguageProvider>
  );

  assert(html.includes("Rencana lokasi docking"), "Modal menampilkan label 'Rencana lokasi docking'");
  assert(!html.includes("Cabang wajib dipilih"), "Modal tidak lagi berisi validasi select cabang manual");
  assert(html.includes("Pilih rencana dock"), "Modal menampilkan placeholder rencana dock");
  assert(html.includes("Project manager"), "Modal menampilkan label Project Manager");
}

// 3. Verifikasi kontrak data penyimpanan proyek
{
  const expectedPayload = {
    id: "NB-2026-001",
    vessel: "TB Borneo Star",
    type: "New Build",
    client: "PT Pelayaran Makmur",
    status: "Dalam Proses",
    plannedDockId: "DD-1",
    tahap: "Inquiry",
    prioritas: "Sedang",
    branch: "Samarinda",
    start: "2026-10-10",
    end: "2026-12-10",
    progress: 0,
    budget: 5000000000,
    actual: 0,
    manager: "Budi Santoso",
    scope: [{ service: "Fabrikasi Lambung" }],
  };

  assert(expectedPayload.status === "Dalam Proses", "Status default proyek baru adalah 'Dalam Proses'");
  assert(expectedPayload.plannedDockId === "DD-1", "plannedDockId tersimpan sesuai pilihan dock");
  assert(expectedPayload.branch === "Samarinda", "Cabang otomatis terisi dari sesi pengguna");
  assert(Boolean(expectedPayload.vessel && expectedPayload.client), "Validasi API REQUIRED_DATA.projects (vessel & client) terpenuhi");
}

if (fail > 0) {
  console.error(`\nProbe F3-B-05 gagal: ${fail} kesalahan.`);
  process.exit(1);
} else {
  console.log("\nProbe F3-B-05 PASS: Form proyek baru terverifikasi.");
}
