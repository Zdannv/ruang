import Image from "next/image";
import Link from "next/link";
import { CalendarClock, ClipboardList, MapPin, Star } from "lucide-react";
import type { UlasanSorotan } from "@/lib/ringkasan";

/**
 * Bagian kepercayaan di dasar halaman depan.
 *
 * Bentuknya mengikuti pola yang lazim di marketplace — blok berwarna penuh
 * dengan kutipan penyewa yang bisa digeser. Isinya TIDAK mengikuti pola itu
 * selama belum ada ulasannya.
 *
 * Kenapa keadaan kosongnya ditulis panjang dan bukan disembunyikan saja:
 * ini satu-satunya tempat di halaman depan yang tugasnya menjawab "kenapa
 * saya harus percaya". Menyembunyikannya berarti pertanyaan itu tidak
 * terjawab; mengisinya dengan ulasan karangan berarti menjawabnya dengan
 * bohong. Yang tersisa adalah menjawabnya dengan mekanismenya — dan
 * mekanisme itu memang sudah ada dan bisa diperiksa.
 *
 * `boleh_ulas()` mensyaratkan pemesanan yang sudah dibayar, jadi daftar ini
 * akan kosong sampai jalur pembayaran jalan. Itu bukan kegagalan yang perlu
 * ditutupi — justru itu yang membuat ulasannya berarti nanti, dan kalimat di
 * keadaan kosong menyebutkannya apa adanya.
 */
export default function SuaraPenyewa({
  ulasan,
  rata,
  jumlahTotal,
}: {
  ulasan: UlasanSorotan[];
  rata: number | null;
  jumlahTotal: number;
}) {
  const kosong = ulasan.length === 0;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-brand px-5 py-10 sm:px-10 sm:py-14">
        {kosong ? <Kosong /> : <Isi ulasan={ulasan} rata={rata} jumlahTotal={jumlahTotal} />}
      </div>
    </section>
  );
}

/* ── Belum ada ulasan ───────────────────────────────────────────────────── */

const JAMINAN = [
  {
    ikon: ClipboardList,
    judul: "Barangnya tercatat",
    isi: "Manifes berfoto: nama, jumlah, dan nilai taksiran tiap barang. Versi baru tiap kali berubah, yang lama tidak ditimpa.",
  },
  {
    ikon: CalendarClock,
    judul: "Kedatangan tercatat",
    isi: "Jam akses disepakati di aplikasi, dan setiap kedatangan masuk log. Bukan ingatan siapa-siapa.",
  },
  {
    ikon: MapPin,
    judul: "Alamat bertahap",
    isi: "Yang umum lihat cuma kelurahan dan jarak. Titik di peta digeser sekitar 200 meter, dan pergeserannya tidak bisa dimatikan pemilik.",
  },
];

function Kosong() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
        Ulasan penyewa
      </p>
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
        Belum ada ulasan — dan memang belum bisa ada
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
        Ulasan di sini cuma bisa ditulis penyewa yang sewanya sudah{" "}
        <strong className="text-white">selesai</strong>, dan yang dinilai bukan
        cuma bintang — ia menilai seberapa tepat keterangan yang ditulis pemilik
        dibanding kenyataannya. Tidak ada cara menambahnya dari luar, jadi
        jumlahnya akan bertambah lambat. Itu memang maksudnya.
      </p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
        {JAMINAN.map((j) => (
          <div key={j.judul} className="rounded-2xl bg-white/10 p-4">
            <j.ikon className="h-5 w-5 text-white" />
            <p className="mt-2.5 text-sm font-bold text-white">{j.judul}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/80">{j.isi}</p>
          </div>
        ))}
      </div>

      {/* Kalimat ini wajib ada dan tidak boleh diperhalus — lihat CLAUDE.md,
          bagian keputusan produk yang dikunci. Justru di bagian yang gunanya
          membangun kepercayaan, menyembunyikannya paling merugikan. */}
      <p className="mx-auto mt-8 max-w-2xl border-t border-white/20 pt-6 text-xs leading-relaxed text-white/70">
        Yang <strong className="text-white/90">tidak</strong> kami janjikan: ganti
        rugi. Lahan disewakan langsung oleh pemiliknya, dan tidak ada asuransi
        barang. Kalau ada sengketa, kami memutuskan siapa yang benar berdasarkan
        catatan di atas — bukan membayar kerugiannya.
      </p>

      <Link
        href="/cari"
        className="mt-7 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition-transform hover:-translate-y-0.5"
      >
        Lihat lahan yang tayang
      </Link>
    </div>
  );
}

/* ── Sudah ada ulasan ───────────────────────────────────────────────────── */

function Isi({
  ulasan,
  rata,
  jumlahTotal,
}: {
  ulasan: UlasanSorotan[];
  rata: number | null;
  jumlahTotal: number;
}) {
  return (
    <div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                rata != null && i < Math.round(rata)
                  ? "fill-white text-white"
                  : "text-white/35"
              }`}
            />
          ))}
        </div>
        <p className="angka mt-2.5 text-sm text-white/85">
          {jumlahTotal} ulasan
          {rata != null && ` · ${rata.toFixed(1).replace(".", ",")}/5`}
        </p>
      </div>

      {/* Snap mendatar, sama seperti sorotan: tanpa JavaScript, dan kutipan
          yang sedang dibaca tidak direbut kutipan berikutnya. */}
      <ul className="geser-x -mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        {ulasan.map((u) => (
          <li
            key={u.id}
            className="w-[86%] shrink-0 snap-center rounded-2xl bg-white/10 p-5 sm:w-[48%] lg:w-[32%]"
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < u.skor ? "fill-white text-white" : "text-white/30"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white">
              &ldquo;{u.komentar}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/25">
                {u.penulis_foto_url && (
                  <Image
                    src={u.penulis_foto_url}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {u.penulis_nama}
                </span>
                {u.akurasi != null && (
                  <span className="angka block text-xs text-white/70">
                    Ketepatan keterangan {u.akurasi}/5
                  </span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
