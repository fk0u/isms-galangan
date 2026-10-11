import { isPlaceholder, siteConfig } from "@/config/site";

/**
 * Bangun link wa.me dengan pesan terisi otomatis.
 * Nomor lokal "08xx" dinormalisasi ke "628xx" karena wa.me butuh kode negara.
 */
export function buildWhatsAppUrl(
  number: string = siteConfig.whatsapp.number,
  message: string = siteConfig.whatsapp.message,
): string {
  const text = encodeURIComponent(message);
  if (isPlaceholder(number)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Kou] NEXT_PUBLIC_WA_NUMBER belum diisi — tombol WhatsApp memakai link tanpa nomor.");
    }
    // Tanpa nomor, WhatsApp tetap terbuka dengan pesan siap kirim (pemilih kontak).
    return `https://wa.me/?text=${text}`;
  }
  const digits = number.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}?text=${text}`;
}
