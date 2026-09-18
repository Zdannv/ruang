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
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 sm:px-6 lg:px-8">
      <div className="h-5 w-32 animate-pulse rounded bg-line" />
      <div className="mt-4 h-20 w-full animate-pulse rounded-2xl bg-card ring-1 ring-line" />
      <div className="mt-6 space-y-3">
        {[70, 45, 60, 38].map((lebar, i) => (
          <div
            key={i}
            className={`h-12 animate-pulse rounded-2xl bg-line ${i % 2 ? "ml-auto" : ""}`}
            style={{ width: `${lebar}%` }}
          />
        ))}
      </div>
    </div>
  );
}
