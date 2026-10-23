/* #278 gross-up: PPh 21 ditanggung perusahaan lewat tunjangan PPh T yang
   memenuhi T = PPh(penghasilan + T). Dicari iteratif (konvergen karena tarif
   marginal < 100%); gaji bersih karyawan tidak lagi dipotong PPh. */
export function grossUp(pphOf: (tunjangan: number) => number): number {
  let t = 0;
  for (let i = 0; i < 50; i++) {
    const next = pphOf(t);
    if (Math.abs(next - t) < 1) return next;
    t = next;
  }
  return Math.round(t);
}
