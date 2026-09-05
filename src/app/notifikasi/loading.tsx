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
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-line" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-line bg-card"
          />
        ))}
      </div>
    </div>
  );
}
