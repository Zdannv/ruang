import type { StatistikHari } from "@/lib/kontak";

/**
 * Deret harian "listing dibuka", digambar sebagai batang.
 *
 * **SVG yang disusun sendiri, bukan pustaka grafik.** Yang digambar satu
 * deret tanpa sumbu, tanpa tooltip, dan tanpa zoom; pustaka grafik mana pun
 * berarti puluhan kilobyte JavaScript di halaman yang isinya tiga angka.
 * Kalau nanti butuh beberapa deret sekaligus, di situlah pustakanya jadi
 * layak.
 *
 * Hari yang tidak ada barisnya diisi nol DI SINI, bukan di database: hanya
 * layar yang tahu rentang mana yang sedang digambar, dan tanpa pengisian itu
 * grafiknya memampatkan hari-hari sepi jadi tidak terlihat.
 */
export default function GrafikHarian({
  data,
  hari,
}: {
  data: StatistikHari[];
  hari: number;
}) {
  const peta = new Map(data.map((d) => [d.tanggal, Number(d.dibuka)]));
  const hariIni = new Date();
  const deret = Array.from({ length: hari }, (_, i) => {
    const t = new Date(hariIni);
    t.setDate(t.getDate() - (hari - 1 - i));
    const kunci = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(t);
    return { kunci, nilai: peta.get(kunci) ?? 0 };
  });

  const puncak = Math.max(1, ...deret.map((d) => d.nilai));
  if (deret.every((d) => d.nilai === 0)) return null;

  const lebar = 100;
  const tinggi = 28;
  const jarak = lebar / deret.length;

  return (
    <div className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-line">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-sm font-medium">Listing dibuka per hari</p>
        <p className="angka text-xs text-muted">tertinggi {puncak} sehari</p>
      </div>
      <svg
        viewBox={`0 0 ${lebar} ${tinggi}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Grafik listing dibuka ${hari} hari terakhir, tertinggi ${puncak} dalam sehari`}
        className="mt-3 h-24 w-full"
      >
        {deret.map((d, i) => {
          // Batang nol tetap digambar setinggi 0,6 supaya deretnya terbaca
          // sebagai rentang waktu, bukan sebagai lubang.
          const t = d.nilai === 0 ? 0.6 : (d.nilai / puncak) * tinggi;
          return (
            <rect
              key={d.kunci}
              x={i * jarak + jarak * 0.15}
              y={tinggi - t}
              width={jarak * 0.7}
              height={t}
              rx={jarak * 0.2}
              className={d.nilai === 0 ? "fill-line" : "fill-brand"}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{hari} hari lalu</span>
        <span>hari ini</span>
      </div>
    </div>
  );
}
