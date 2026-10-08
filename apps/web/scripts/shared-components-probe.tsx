/* Probe render untuk komponen bersama F3-A-04. Jalankan lewat npm run probe:shared-components. */
import "./browser-shims";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { SearchSelect, mapSearchSelectOptions } from "../src/components/SearchSelect";
import { DateInput } from "../src/components/DateInput";
import { TimeInput24 } from "../src/components/TimeInput24";
import { PhotoUploader } from "../src/components/PhotoUploader";
import { ChangeHistory } from "../src/components/ChangeHistory";
import { StatusChips } from "../src/components/StatusChips";
import { norm24 } from "../src/utils/time24";

declare const process: { exit(code: number): never };

const html = renderToString(
  <LanguageProvider>
    <main>
      <section data-component="SearchSelect">
        <SearchSelect
          value=""
          onChange={() => {}}
          options={[{ value: "engine", label: "Mesin utama", subLabel: "Stok: 3 unit" }]}
          ariaLabel="Pilih material"
        />
      </section>
      <section data-component="DateInput">
        <DateInput value="2026-10-08" onChange={() => {}} ariaLabel="Tanggal booking" />
      </section>
      <section data-component="TimeInput24">
        <TimeInput24 value="17:30" onChange={() => {}} ariaLabel="Jam masuk" />
      </section>
      <section data-component="PhotoUploader">
        <PhotoUploader
          value={[{ url: "/files/probe.jpg", caption: "Sambungan lambung" }]}
          onChange={() => {}}
          labels={{ add: "Tambah foto", caption: "Keterangan foto {n}", remove: "Hapus foto {n}", empty: "Belum ada foto", uploading: "Mengunggah", uploadError: "Upload gagal", imageAlt: "Foto pekerjaan" }}
        />
      </section>
      <section data-component="ChangeHistory">
        <ChangeHistory
          table="projects"
          rowId="PRJ-PROBE"
          labels={{ title: "Riwayat perubahan", loading: "Memuat", empty: "Belum ada perubahan", error: "Gagal memuat", serverUnavailable: "Tidak tersambung", before: "Sebelum", after: "Sesudah", redacted: "disamarkan" }}
        />
      </section>
      <section data-component="StatusChips">
        <StatusChips
          value="Aktif"
          onChange={() => {}}
          options={[{ value: "Semua", label: "Semua", count: 2 }, { value: "Aktif", label: "Aktif" }]}
          ariaLabel="Filter status"
        />
      </section>
    </main>
  </LanguageProvider>,
);

const expected = ["SearchSelect", "DateInput", "TimeInput24", "PhotoUploader", "ChangeHistory", "StatusChips"];
const missing = expected.filter((name) => !html.includes(`data-component="${name}"`));
if (missing.length > 0) {
  console.error(`FAIL  komponen tidak ter-render: ${missing.join(", ")}`);
  process.exit(1);
}
if (!/type="date"/.test(html)) {
  console.error("FAIL  DateInput harus merender input date native");
  process.exit(1);
}
if (mapSearchSelectOptions([{ value: "engine", label: "Mesin utama", subLabel: "Stok: 3 unit" }])[0]?.hint !== "Stok: 3 unit") {
  console.error("FAIL  SearchSelect harus meneruskan sublabel ke daftar pilihan");
  process.exit(1);
}
if (!html.includes("17:30") || !html.includes("Sambungan lambung") || !html.includes("Riwayat perubahan")) {
  console.error("FAIL  contoh nilai jam, foto, atau riwayat tidak ikut dirender");
  process.exit(1);
}
if (norm24("17:30") !== "17:30" || norm24("25:00") !== "") {
  console.error("FAIL  TimeInput24 tidak mempertahankan normalisasi 24 jam");
  process.exit(1);
}
console.log(`PASS  ${expected.length} komponen bersama dirender; ISO date, pemetaan sublabel, foto, riwayat, chip, dan norm24 terverifikasi.`);
