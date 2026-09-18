/** Kerangka; setiap rute punya satu, lihat aturan region di CLAUDE.md. */
export default function Memuat() {
  return (
    <>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-line" />
      <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
        ))}
      </div>
      <div className="mt-4 h-40 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
      <div className="mt-8 h-48 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
    </>
  );
}
