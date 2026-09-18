/**
 * Kerangka halaman utama.
 *
 * Bentuknya: banner, barisan kategori, lalu kisi kartu. Urutannya harus sama
 * dengan halaman jadinya, kalau tidak isinya tampak melompat saat datang.
 */

export default function Memuat() {
  return (
    <>
      <div className="border-b border-line bg-card py-5 sm:py-7">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="aspect-[1.53/1] w-full animate-pulse rounded-2xl bg-line sm:aspect-[2.6/1]" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-full animate-pulse rounded-full bg-line sm:w-56" />
          <div className="h-10 w-28 animate-pulse rounded-full bg-line" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-line" />
        </div>
        <div className="mt-5 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-[4.6rem] shrink-0 animate-pulse rounded-2xl bg-line sm:w-20"
            />
          ))}
        </div>
        <div className="mt-8 h-7 w-56 max-w-full animate-pulse rounded-lg bg-line" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
          ))}
        </div>
      </div>
    </>
  );
}
