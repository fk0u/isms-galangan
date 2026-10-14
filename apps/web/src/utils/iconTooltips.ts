/* Tooltip untuk tombol yang hanya berisi ikon (permintaan 14 Okt: "kasih
 * tooltip di setiap button yang cuma icon tanpa label").
 *
 * Tombol ikon di aplikasi ini sudah memberi nama aksesibel lewat aria-label
 * (dipakai pembaca layar), tetapi tidak semuanya memberi `title`, jadi
 * pengguna mouse tidak melihat penjelasan apa pun. Daripada menambal puluhan
 * tombol satu per satu (dan pasti ada yang terlewat saat tombol baru dibuat),
 * satu pengamat DOM menyalin aria-label menjadi title untuk tombol/tautan
 * yang tidak berteks dan belum punya title. Tombol berteks tidak disentuh. */
const SELECTOR = "button[aria-label]:not([title]), a[aria-label]:not([title]), [role=button][aria-label]:not([title])";

function apply(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    if ((el.textContent ?? "").trim() !== "") return;
    const label = el.getAttribute("aria-label");
    if (label) el.setAttribute("title", label);
  });
}

export function installIconTooltips(): void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  apply(document);
  // ponytail: memindai subtree yang ditambahkan saja; cukup ringan untuk ukuran DOM aplikasi ini.
  new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => { if (n instanceof HTMLElement) apply(n.parentElement ?? n); });
      if (r.type === "attributes" && r.target instanceof HTMLElement) apply(r.target.parentElement ?? r.target);
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label"] });
}
