/**
 * Konten statis halaman. Hanya klaim yang sesuai fakta produk:
 * PWA mobile-first + scan QR meja, denah meja visual, pembayaran QRIS.
 */

export type IconName =
  | "chat"
  | "pencil"
  | "clock"
  | "qr"
  | "layout"
  | "wallet"
  | "phone"
  | "check";

export interface PainPoint {
  id: string;
  problem: { title: string; body: string; icon: IconName };
  solution: { title: string; body: string; icon: IconName };
}

export const PAIN_POINTS: readonly PainPoint[] = [
  {
    id: "chat",
    problem: {
      title: "Pesanan lewat chat",
      body: "Pesanan numpuk di WhatsApp, diselipin chat lain, gampang kelewat saat ramai.",
      icon: "chat",
    },
    solution: {
      title: "Pelanggan pesan sendiri",
      body: "Scan QR di meja, pilih menu dari HP sendiri. Nggak perlu bolak-balik balas chat.",
      icon: "qr",
    },
  },
  {
    id: "salah-catat",
    problem: {
      title: "Salah catat",
      body: "Pesanan diulang lisan lalu ditulis tangan — menu atau nomor meja bisa tertukar.",
      icon: "pencil",
    },
    solution: {
      title: "Pesanan sesuai pilihan pelanggan",
      body: "Menu dan jumlahnya dipilih langsung oleh pelanggan, meja dipilih dari denah visual.",
      icon: "layout",
    },
  },
  {
    id: "kasir",
    problem: {
      title: "Nunggu kasir",
      body: "Pelanggan antre di kasir cuma untuk pesan dan bayar, apalagi di jam sibuk.",
      icon: "clock",
    },
    solution: {
      title: "Bayar QRIS dari meja",
      body: "Setelah pesan, pelanggan langsung bayar pakai QRIS tanpa meninggalkan meja.",
      icon: "wallet",
    },
  },
];

export interface HowStep {
  id: string;
  title: string;
  body: string;
  icon: IconName;
}

export const HOW_STEPS: readonly HowStep[] = [
  { id: "scan", title: "Scan", body: "Pelanggan scan QR yang ada di meja pakai kamera HP.", icon: "qr" },
  { id: "pilih", title: "Pilih", body: "Pilih menu, atur jumlah, lalu tentukan meja dari denah.", icon: "layout" },
  { id: "bayar", title: "Bayar", body: "Bayar pakai QRIS dari e-wallet atau m-banking yang mendukung QRIS.", icon: "wallet" },
];

export interface Feature {
  id: string;
  title: string;
  body: string;
  icon: IconName;
}

export const FEATURES: readonly Feature[] = [
  {
    id: "pwa",
    title: "PWA mobile-first",
    body: "Dibuka langsung dari browser HP pelanggan dan dirancang untuk layar kecil lebih dulu.",
    icon: "phone",
  },
  {
    id: "qr",
    title: "Scan QR di meja",
    body: "Pelanggan mulai memesan cukup dengan scan QR — pesan sendiri tanpa menunggu pelayan.",
    icon: "qr",
  },
  {
    id: "denah",
    title: "Pilih meja dari denah",
    body: "Denah meja visual menunjukkan meja kosong dan terisi, pelanggan tinggal tap.",
    icon: "layout",
  },
  {
    id: "qris",
    title: "Pembayaran QRIS",
    body: "Satu QR untuk berbagai e-wallet dan m-banking yang mendukung QRIS.",
    icon: "wallet",
  },
];
