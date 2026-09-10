/** Kerangka; setiap rute punya satu, lihat aturan region di CLAUDE.md. */
export default function Memuat() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="h-9 w-64 max-w-full animate-pulse rounded-lg bg-line" />
      <div className="mt-4 h-16 animate-pulse rounded-2xl bg-line/60" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl border border-line bg-card"
          />
        ))}
      </div>
    </div>
  );
}
