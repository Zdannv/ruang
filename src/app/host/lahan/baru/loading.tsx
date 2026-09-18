/**
 * Kerangka khusus halaman daftar ruang.
 *
 * Tanpa berkas ini yang tampil adalah kerangka `/host` — judul lalu tiga kartu
 * setinggi 24 — padahal yang menyusul sesudahnya formulir panjang. Bentuk yang
 * salah lebih mengganggu daripada tidak ada bentuk sama sekali: layarnya
 * melompat begitu isi aslinya datang.
 */
export default function Memuat() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="h-5 w-28 animate-pulse rounded bg-line" />
      <div className="mt-4 h-8 w-64 max-w-full animate-pulse rounded-lg bg-line" />
      <div className="mt-2 h-4 w-full max-w-md animate-pulse rounded bg-line" />
      <div className="mt-6 flex items-center gap-3">
        <div className="h-7 w-40 animate-pulse rounded-full bg-line" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-line" />
      </div>
      <div className="mt-6 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl border border-line bg-card"
          />
        ))}
      </div>
    </div>
  );
}
