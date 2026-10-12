// Test unit dokumen PDF Analitik & Dashboard (#80)
import { describe, expect, it } from "vitest";
import { analyticReport, type AnalyticModel } from "../pdf/documents/laporan.js";
import { checkGeometry } from "../pdf/document.js";
import { PAGES, MARGIN_MM } from "../pdf/theme.js";

const sampleModel: AnalyticModel = {
  scope: "Dashboard",
  periodLabel: "Okt 2025 - Okt 2026",
  branch: "Samarinda",
  targets: {
    revenue: 120_000_000_000,
    projects: 8,
  },
  executiveSummary: {
    activeContractsValue: 48_000_000_000,
    activeEmployees: 128,
    stockValue: 1_250_000_000,
    lowStockCount: 2,
    seaTrialVessel: "TB. Mahakam 01",
    pipelineActiveValue: 8_500_000_000,
    openNcrCount: 11,
    criticalNcrCount: 3,
    arOutstandingValue: 4_200_000_000,
    wonContractValue: 24_000_000_000,
    wonContractCount: 6,
  },
  activeProjectsList: [
    { id: "PRJ-2026-001", vessel: "TB. Berau Coal 01", client: "PT Berau Coal", type: "Repair", budget: 6_500_000_000, progress: 85, status: "Sedang Berjalan" },
    { id: "PRJ-2026-002", vessel: "TB. Mahakam 01", client: "PT Pelayaran Mahakam", type: "New Build", budget: 14_000_000_000, progress: 92, status: "Dalam Proses" },
    { id: "PRJ-2026-003", vessel: "BG. Nusantara 300", client: "PT Nusantara Lines", type: "Retrofit", budget: 4_200_000_000, progress: 45, status: "Sedang Berjalan" },
    { id: "PRJ-2026-009", vessel: "Km. Sepinggan", client: "PT Pelni", type: "Repair", budget: 8_500_000_000, progress: 30, status: "Terlambat" },
  ],
  series: [
    { key: "2026-08", label: "Agu 2026", revenue: 900, cost: 700, margin: 22, projects: 4 },
    { key: "2026-09", label: "Sep 2026", revenue: 1100, cost: 850, margin: 23, projects: 5 },
    { key: "2026-10", label: "Okt 2026", revenue: 1250, cost: 920, margin: 26, projects: 6 },
  ],
  kpi: {
    totalProjects: 15,
    activeProjects: 4,
    lateProjects: 1,
    totalBudget: 33_200_000_000,
    totalActual: 21_000_000_000,
    avgProgress: 68,
    revenueYtd: 3_250,
    marginAvg: 23.7,
    openNcr: 11,
    criticalNcr: 3,
    activeEmployees: 128,
    equipmentBusy: 20,
    equipmentTotal: 30,
    drydockUsed: 2,
    drydockTotal: 3,
    lowStock: 2,
    unpaidInvoices: 5,
    unpaidPayables: 4,
  },
  growth: { revenue: 13.6, margin: 3.0 },
  ncrPareto: [
    { factor: "Pengelasan", count: 7, impact: 64, cumulative: 64 },
    { factor: "Material", count: 4, impact: 36, cumulative: 100 },
  ],
  profitByType: [
    { key: "New Build", budget: 14_000_000_000, actual: 9_000_000_000, profit: 5_000_000_000, count: 1 },
    { key: "Repair", budget: 15_000_000_000, actual: 10_000_000_000, profit: 5_000_000_000, count: 2 },
  ],
  profitByBranch: [
    { key: "Samarinda", budget: 33_200_000_000, actual: 21_000_000_000, profit: 12_200_000_000, count: 4 },
  ],
  rework: { negativeCo: 200_000_000, ncrEstimate: 300_000_000, total: 500_000_000 },
  risk: {
    dockConflicts: 0,
    lowStock: [{ name: "Baut M16", stock: 10, minStock: 50 }],
    atRiskProjects: [{ id: "PRJ-2026-009", vessel: "Km. Sepinggan", status: "Terlambat" }],
    openNcr: 11,
    maintenancePending: 1,
    calibrationPending: 2,
    worstVendor: { name: "PT BAJA NUSANTARA", onTime: 75 },
  },
  projectStatus: [
    { label: "Dalam Proses", value: 1 },
    { label: "Sedang Berjalan", value: 2 },
    { label: "Terlambat", value: 1 },
  ],
  locale: "id",
};

describe("analyticReport (#80)", () => {
  it("merender dokumen PDF lengkap dengan struktur landscape dan multi-halaman", () => {
    const doc = analyticReport(sampleModel);
    const res = doc.render();

    expect(res.bytes.byteLength).toBeGreaterThan(5000);
    expect(res.pages).toBeGreaterThanOrEqual(2);

    const pdfRaw = Buffer.from(res.bytes).toString("latin1");
    expect(pdfRaw.startsWith("%PDF-")).toBe(true);

    // Geometri harus bersih tanpa ada elemen yang keluar dari content box
    const spec = PAGES.a4;
    const problems = checkGeometry(res, MARGIN_MM, { width: spec.height, height: spec.width });
    expect(problems).toHaveLength(0);
  });

  it("mendukung locale bahasa Inggris (en)", () => {
    const enModel: AnalyticModel = {
      ...sampleModel,
      locale: "en",
    };
    const doc = analyticReport(enModel);
    const res = doc.render();
    expect(res.pages).toBeGreaterThanOrEqual(2);

    const spec = PAGES.a4;
    const problems = checkGeometry(res, MARGIN_MM, { width: spec.height, height: spec.width });
    expect(problems).toHaveLength(0);
  });
});
