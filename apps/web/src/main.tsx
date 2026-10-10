import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import "./index.css";
import { AuthProvider, RequireAuth } from "./auth/auth";
import { LanguageProvider } from "./i18n/LanguageContext";
import { StoreProvider } from "./data/store";
import { SecurityGuards } from "./security/watermark";
import AppShell from "./layouts/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
const Analytics = lazyPage(() => import("./pages/Analytics"));
const Projects = lazyPage(() => import("./pages/proyek/Projects"));
const ProjectDetail = lazyPage(() => import("./pages/proyek/ProjectDetail"));
const Inventory = lazyPage(() => import("./pages/inventori/Inventory"));
const Finance = lazyPage(() => import("./pages/keuangan/Finance"));
const HR = lazyPage(() => import("./pages/sdm/HR"));
const CRM = lazyPage(() => import("./pages/crm/CRM"));
const Procurement = lazyPage(() => import("./pages/procurement/Procurement"));
const QCSafety = lazyPage(() => import("./pages/qc/QCSafety"));
const Drydock = lazyPage(() => import("./pages/drydock/Drydock"));
const Subcontractor = lazyPage(() => import("./pages/subkontraktor/Subcontractor"));
const Vessels = lazyPage(() => import("./pages/kapal/Vessels"));
const VesselDetail = lazyPage(() => import("./pages/kapal/VesselDetail"));
const EquipmentPage = lazyPage(() => import("./pages/equipment/Equipment"));
const Documents = lazyPage(() => import("./pages/dokumen/Documents"));
const Absensi = lazyPage(() => import("./pages/absensi/Absensi"));
const Payroll = lazyPage(() => import("./pages/payroll/Payroll"));
const Laporan = lazyPage(() => import("./pages/laporan/Laporan"));
const Monitoring = lazyPage(() => import("./pages/proyek/Monitoring"));
const BomDetail = lazyPage(() => import("./pages/inventori/BomDetail"));
const KaryawanDetail = lazyPage(() => import("./pages/sdm/KaryawanDetail"));
const QuotationDetail = lazyPage(() => import("./pages/crm/QuotationDetail"));
const Settings = lazyPage(() => import("./pages/pengaturan/Settings"));
const Peran = lazyPage(() => import("./pages/pengaturan/Peran"));
const Notifikasi = lazyPage(() => import("./pages/notifikasi/Notifikasi"));
const Audit = lazyPage(() => import("./pages/audit/Audit"));
import { ErrorBoundary } from "./components/ui";
import { ApiError } from "./services/http";

/* Jaring pengaman: ApiError selalu di-toast di sumbernya (notifyConflict /
   notifyForbidden / degrade) - cegah warning unhandledrejection di konsol
   untuk kegagalan yang sudah ditangani secara UX. */
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason instanceof ApiError) e.preventDefault();
});

/* PWA: aplikasi bisa dipasang di Android, iOS, Windows, macOS. Hanya di build
   produksi — di dev, service worker menahan modul lama dan membingungkan HMR. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

/**
 * Bungkus satu rute dengan ErrorBoundary yang ME-RESET setiap lokasi berubah.
 *
 * Tanpa resetKey, galat di /proyek/A mengunci /proyek/B, /kapal/X mengunci
 * /kapal/Y, dan seterusnya: React Router memakai instance React yang sama
 * untuk dua URL dalam satu pola rute, jadi boundary lama tidak pernah
 * di-unmount dan tetap menampilkan layar galat. Gejalanya persis "satu modul
 * rusak, semua modul ikut rusak" - padahal store dan modul lain baik-baik saja.
 *
 * resetKey memuat pathname DAN search. Query string ikut karena galat juga
 * bisa datang dari render yang dipicu ?tab= (mis. modul QC memindahkan tab),
 * dan tanpa itu galat di /keuangan akan tetap tampil setelah pengguna
 * pindah ke tab lain di halaman yang sama. Ini TIDAK membuang state modul pada
 * kasus normal, karena componentDidUpdate hanya bereaksi saat state.error
 * sudah terisi.
 */
/* F4-06: halaman dimuat per rute. Setelah deploy, tab lama bisa meminta
   chunk yang sudah tidak ada di server - muat ulang SEKALI agar mengambil
   index.html baru, bukan menampilkan layar galat. */
function lazyPage<T extends { default: React.ComponentType }>(load: () => Promise<T>) {
  return lazy(() => load().then((m) => { sessionStorage.removeItem("isms.chunk.reload"); return m; }).catch((err: unknown) => {
    if (sessionStorage.getItem("isms.chunk.reload") !== "1") {
      sessionStorage.setItem("isms.chunk.reload", "1");
      window.location.reload();
      return new Promise<T>(() => {}); // menunggu reload
    }
    throw err;
  }));
}

function Guard({ title, children }: { title: string; children: ReactElement }) {
  const { pathname, search } = useLocation();
  return (
    <ErrorBoundary title={title} resetKey={`${pathname}${search}`}>
      <Suspense fallback={<div className="p-6 text-sm text-steel-400" role="status" aria-busy="true">…</div>}>{children}</Suspense>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
      <SecurityGuards />
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Guard title="Dashboard gagal dimuat"><Dashboard /></Guard>} />
              <Route path="/dashboard" element={<Guard title="Dashboard gagal dimuat"><Dashboard /></Guard>} />
              {/* Komersial: CRM -> Procurement -> Keuangan */}
              <Route path="/crm" element={<Guard title="CRM gagal dimuat"><CRM /></Guard>} />
              <Route path="/crm/quotation/:id" element={<Guard title="Penawaran gagal dimuat"><QuotationDetail /></Guard>} />
              <Route path="/procurement" element={<Guard title="Procurement gagal dimuat"><Procurement /></Guard>} />
              <Route path="/keuangan" element={<Guard title="Keuangan gagal dimuat"><Finance /></Guard>} />
              {/* Operasional: Proyek -> Drydock -> Inventori -> Equipment -> Subkontraktor -> QC */}
              <Route path="/proyek" element={<Guard title="Proyek gagal dimuat"><Projects /></Guard>} />
              <Route path="/proyek/monitoring" element={<Guard title="Monitoring gagal dimuat"><Monitoring /></Guard>} />
              <Route path="/proyek/:id" element={<Guard title="Detail proyek gagal dimuat"><ProjectDetail /></Guard>} />
              <Route path="/drydock" element={<Guard title="Drydock gagal dimuat"><Drydock /></Guard>} />
              <Route path="/inventori" element={<Guard title="Inventori gagal dimuat"><Inventory /></Guard>} />
              <Route path="/inventori/bom/:id" element={<Guard title="BOM gagal dimuat"><BomDetail /></Guard>} />
              <Route path="/equipment" element={<Guard title="Equipment gagal dimuat"><EquipmentPage /></Guard>} />
              <Route path="/subkontraktor" element={<Guard title="Subkontraktor gagal dimuat"><Subcontractor /></Guard>} />
              <Route path="/qc-safety" element={<Guard title="QC &amp; Safety gagal dimuat"><QCSafety /></Guard>} />
              {/* SDM */}
              <Route path="/sdm" element={<Guard title="SDM gagal dimuat"><HR /></Guard>} />
              <Route path="/sdm/karyawan/:id" element={<Guard title="Karyawan gagal dimuat"><KaryawanDetail /></Guard>} />
              <Route path="/absensi" element={<Guard title="Absensi gagal dimuat"><Absensi /></Guard>} />
              <Route path="/payroll" element={<Guard title="Payroll gagal dimuat"><Payroll /></Guard>} />
              {/* Aset (master) */}
              <Route path="/kapal" element={<Guard title="Kapal gagal dimuat"><Vessels /></Guard>} />
              <Route path="/kapal/:id" element={<Guard title="Detail kapal gagal dimuat"><VesselDetail /></Guard>} />
              <Route path="/dokumen" element={<Guard title="Dokumen gagal dimuat"><Documents /></Guard>} />
              {/* Analisis */}
              <Route path="/analytics" element={<Guard title="Analitik gagal dimuat"><Analytics /></Guard>} />
              <Route path="/laporan" element={<Guard title="Laporan gagal dimuat"><Laporan /></Guard>} />
              {/* Sistem */}
              <Route path="/notifikasi" element={<Guard title="Notifikasi gagal dimuat"><Notifikasi /></Guard>} />
              <Route path="/pengaturan" element={<Guard title="Pengaturan gagal dimuat"><Settings /></Guard>} />
              <Route path="/pengaturan/peran" element={<Guard title="Peran gagal dimuat"><Peran /></Guard>} />
              <Route path="/audit" element={<Guard title="Audit gagal dimuat"><Audit /></Guard>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);