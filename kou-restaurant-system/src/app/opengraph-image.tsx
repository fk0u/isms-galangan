import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG image dibuat saat build: tanpa aset gambar manual.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 80% 20%, #4a2410 0%, #0d0a08 55%)",
          color: "#f8f1e9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#ff9450",
              color: "#0d0a08",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 950 }}>
            Pesan dari meja, bayar QRIS, tanpa antre kasir.
          </div>
          <div style={{ fontSize: 30, color: "#b9a898" }}>Scan QR · Pilih meja dari denah · Bayar QRIS</div>
        </div>
      </div>
    ),
    size,
  );
}
