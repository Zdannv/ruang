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
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 pt-20 pb-20 text-center sm:px-6">
      <div className="h-12 w-12 animate-pulse rounded-full bg-line" />
      <div className="mt-5 h-6 w-56 animate-pulse rounded-lg bg-line" />
      <div className="mt-3 h-4 w-64 animate-pulse rounded bg-line" />
    </div>
  );
}
