import type { CollectionKey } from "./store";

export const PROCUREMENT_COLLECTIONS: CollectionKey[] = [
  "activities",
  "materialRequests",
  "payables",
  "projects",
  "purchaseOrders",
  "requisitions",
  "rfqs",
  "settings",
  "services",
  "vendors",
];

const FINANCE_TAB_COLLECTIONS: Record<string, CollectionKey[]> = {
  Akun: ["coa"],
  Aset: ["assets", "equipment", "inventory", "movements", "projects"],
  Invoice: ["bast", "clientPos", "contracts", "invoices", "projects", "services", "termins", "warranties", "workOrders"],
  "Piutang (AR)": ["clientPos", "clients", "invoices", "projects"],
  "Hutang (AP)": ["payables", "payroll", "projects", "purchaseOrders"],
  "Jadwal Bayar": ["payables", "payroll", "purchaseOrders"],
  "Kas & Bank": ["coa", "invoices", "journals", "payables", "payroll"],
  Jurnal: ["coa", "invoices", "journals", "payables", "payroll"],
  "Buku Besar": ["assets", "coa", "invoices", "journals", "payables", "payroll"],
  "Laba Rugi": ["assets", "coa", "invoices", "journals", "payables", "payroll"],
  Neraca: ["assets", "coa", "invoices", "journals", "payables", "payroll"],
  "Project P&L": [
    "bast", "bookings", "equipment", "invoices", "inventory", "movements",
    "payables", "payroll", "projects", "purchaseOrders", "termins", "timesheets", "workOrders",
  ],
  Pajak: ["invoices", "payables", "payroll", "taxPeriods"],
};

/* KPI yang selalu tampil di header Finance membutuhkan sumber terkini pada
   saat halaman dibuka, tanpa menunggu pengguna pindah tab. */
const FINANCE_SUMMARY_COLLECTIONS: CollectionKey[] = ["invoices", "payables", "payroll", "projects"];

export function financeCollectionsForTab(tab: string): CollectionKey[] {
  return [...new Set([
    "settings" as CollectionKey,
    ...FINANCE_SUMMARY_COLLECTIONS,
    ...(FINANCE_TAB_COLLECTIONS[tab] ?? FINANCE_TAB_COLLECTIONS.Akun),
  ])];
}
