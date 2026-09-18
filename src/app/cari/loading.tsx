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
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-20 sm:px-6 lg:px-8">
      {/* Bilah kendali dulu, baru kisinya: itu urutan yang sama dengan halaman
          jadinya, jadi tidak ada yang bergeser saat isinya datang. */}
      <div className="flex flex-wrap gap-2">
        <div className="h-10 w-full animate-pulse rounded-full bg-line sm:w-56" />
        <div className="h-10 w-28 animate-pulse rounded-full bg-line" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-line" />
      </div>
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 w-[4.6rem] shrink-0 animate-pulse rounded-2xl bg-line sm:w-20" />
        ))}
      </div>
      <div className="mt-8 h-7 w-56 animate-pulse rounded-lg bg-line" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
        ))}
      </div>
    </div>
  );
}
