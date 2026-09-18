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
    <div className="mx-auto w-full max-w-md px-4 pt-10 pb-20 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-line" />
      <div className="mt-3 h-4 w-64 animate-pulse rounded bg-line" />
      <div className="mt-8 space-y-4 rounded-2xl bg-card p-6 ring-1 ring-line">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 animate-pulse rounded bg-line" />
            <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-line" />
          </div>
        ))}
        <div className="h-11 w-full animate-pulse rounded-full bg-line" />
      </div>
    </div>
  );
}
