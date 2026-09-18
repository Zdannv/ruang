/**
 * Kerangka saat halaman ini sedang disiapkan server.
 *
 * Tanpa berkas ini, menekan tautan tidak menghasilkan apa-apa di layar sampai
 * seluruh kueri servernya selesai. Databasenya di Singapura dan tiap
 * perpindahan halaman memanggilnya beberapa kali berurutan, jadi jeda itu
 * benar-benar terasa. Lihat CLAUDE.md, bagian Stack.
 */

export default function Memuat() {
  return (
    <>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-line" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <div className="h-4 w-40 animate-pulse rounded bg-line" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="h-11 animate-pulse rounded-xl bg-line" />
              <div className="h-11 animate-pulse rounded-xl bg-line" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
