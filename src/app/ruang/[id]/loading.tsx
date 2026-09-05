/**
 * Kerangka saat halaman ini sedang disiapkan server.
 *
 * Tanpa berkas ini, menekan tautan tidak menghasilkan apa-apa di layar sampai
 * seluruh kueri servernya selesai — dan di situlah rasa "ada jeda" muncul.
 * Dengan kerangka, perpindahan halaman terasa langsung: bentuknya tampil
 * seketika, isinya menyusul.
 */

export default function Memuat() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="h-5 w-40 animate-pulse rounded bg-line" />
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-line" />
          <div className="mt-6 h-9 w-3/4 animate-pulse rounded-lg bg-line" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-line" />
          <div className="mt-8 h-64 animate-pulse rounded-2xl border border-line bg-card" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-line bg-card" />
      </div>
    </div>
  );
}
