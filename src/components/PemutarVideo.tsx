import { Play } from "lucide-react";

/**
 * Video lahan di halaman detail.
 *
 * `preload="none"` bukan pilihan gaya — itu keputusan biaya, dan yang paling
 * besar di seluruh fitur ini. Satu video 30 detik dari HP sekitar 8 MB. Kalau
 * pemutarnya memuat sendiri, setiap kunjungan halaman lahan membayar 8 MB
 * dan kuota egress 5 GB habis di sekitar 600 kunjungan. Dengan `none` plus
 * poster, biayanya berpindah dari "setiap pengunjung" ke "setiap penonton" —
 * dan sebagian besar pengunjung tidak menonton.
 *
 * Karena itu juga tidak ada `autoPlay`. Selain memboroskan kuota, video yang
 * memutar sendiri di halaman yang sedang dibaca orang adalah gangguan.
 *
 * Kalau posternya tidak ada — sebagian peramban HP menolak menggambar bingkai
 * video ke canvas saat unggah — yang tampil bidang gelap dengan tanda putar,
 * bukan kotak hitam tanpa penjelasan.
 */
export default function PemutarVideo({
  video,
}: {
  video: {
    id: string;
    url: string;
    poster_url: string | null;
    durasi_detik: number | null;
    keterangan: string | null;
  }[];
}) {
  if (video.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold tracking-tight">Video lahan</h2>
      <p className="mt-1 text-sm text-muted">
        Direkam pemiliknya. Ketuk untuk memutar — videonya baru diunduh saat itu.
      </p>

      <ul className="geser-x -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {video.map((v) => (
          <li key={v.id} className="w-[68%] shrink-0 sm:w-[46%] lg:w-[31%]">
            <div className="relative overflow-hidden rounded-2xl bg-ink">
              <video
                src={v.url}
                poster={v.poster_url ?? undefined}
                controls
                preload="none"
                playsInline
                className="aspect-[3/4] w-full object-cover"
              />
              {!v.poster_url && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <Play className="h-10 w-10 text-white/70" />
                </span>
              )}
            </div>
            <p className="angka mt-1.5 text-xs text-muted">
              {v.keterangan ?? "video"}
              {v.durasi_detik ? ` · ${v.durasi_detik} detik` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
