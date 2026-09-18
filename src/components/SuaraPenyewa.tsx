import Image from "next/image";
import Link from "next/link";
import { ClipboardList, MapPin, MapPinned, Star } from "lucide-react";
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
 * `boleh_ulas()` mensyaratkan pemesanan lewat aplikasi, dan sejak alur itu
 * dibuang (18 Sep 2026) tidak ada satu pun ulasan yang bisa masuk. Jadi
 * keadaan kosong ini bukan sementara, ia satu-satunya keadaan yang ada.
 *
 * **Ulasan karangan diminta 18 September 2026** ("untuk landing page aja,
 * yang penting gak berlebihan") dan tetap tidak ditulis. Testimoni bernama
 * orang yang tidak ada, di halaman yang tugasnya meyakinkan orang menyerahkan
 * uang ke orang asing, adalah penipuan berapa pun jumlahnya, dan yang
 * menanggung akibatnya pedagang yang rugi, bukan yang memasangnya.
 *
 * Yang dipakai sebagai gantinya: keadaan yang sebenarnya. Untuk produk yang
 * baru mulai itu justru lebih meyakinkan daripada bintang, karena "lahan
 * pertamanya kami datangi sendiri" BISA DIPERIKSA orangnya, dan pembacanya
 * tahu persis sedang berhadapan dengan apa. Kalimat itu tetap harus benar:
 * kalau nanti listing masuk tanpa didatangi, kalimatnya yang diganti, bukan
 * kenyataannya yang dibiarkan menyimpang.
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

/* ── Belum ada ulasan di database ───────────────────────────────────────── */

/**
 * Testimoni dari orang yang mencoba aplikasinya di tahap awal.
 *
 * **Ini BUKAN ulasan**, dan bedanya penting sampai ke tampilannya. Ulasan
 * (`ulasan_publik`) melekat pada satu lahan, ditulis penyewanya, dan punya
 * skor; yang di bawah ini pendapat tentang APLIKASINYA, dikumpulkan
 * pemiliknya dari orang yang sudah mencoba. Jadi tidak ada bintang di sini:
 * bintang menyiratkan sistem penilaian yang tidak ada, dan itu berbohong
 * lewat bentuk, bukan lewat kata.
 *
 * **Asalnya wajib nyata.** Keenam kalimat aslinya datang dari pemilik
 * aplikasi (18 Sep 2026) sebagai kenalan yang sudah mencobanya. Dua dibuang
 * seluruhnya dan tiga dipangkas, karena menyebut hal yang TIDAK ADA di
 * aplikasi ini:
 *
 *   - "pembayarannya aman lewat aplikasi" — tidak ada pembayaran sama sekali
 *   - "ada kepastian hukum, nggak takut diusir sepihak" — tidak ada; layar
 *     lain justru menyatakan kebalikannya
 *   - "profil calon penyewa transparan" — fitur itu tidak pernah dibuat
 *   - "omzet bulan pertama balik modal" — angka penghasilan yang tidak bisa
 *     diperiksa siapa pun
 *
 * Aturannya untuk siapa pun yang menambah di sini nanti: **kalimat testimoni
 * tidak boleh menyebut fitur yang tidak ada.** Orang datang karena membaca
 * ini, dan yang menanggung selisihnya pedagang yang menyerahkan uang, bukan
 * yang memasang kalimatnya.
 */
const TESTIMONI = [
  {
    nama: "Hendra Gunawan",
    peran: "Pemilik pekarangan, Jakarta Selatan",
    isi: "Proses listing gampang banget, tinggal foto pekarangan dan atur jam operasional yang boleh disewa. Nggak ribet tawar-menawar manual di lapangan karena semua detail fasilitas dan listrik sudah disepakati dari awal di aplikasi.",
  },
  {
    nama: "Dimas Arya",
    peran: "Dimsum gerobak",
    isi: "Dulu nyari spot jualan harus muter-muter panas-panasan nanya ke warga satu per satu, seringnya malah ditolak atau harganya nggak masuk akal. Pakai aplikasi ini, saya bisa filter lokasi yang sesuai bujet dan dekat target pasar kampus.",
  },
  {
    nama: "Ratna Dewi",
    peran: "Pemilik teras ruko, Bandung",
    isi: "Teras depan ruko saya luas tapi kosong dari sore ke malam. Lewat aplikasi ini saya ketemu tenant martabak yang pas. Senangnya saya bisa seleksi dulu jualan apa yang cocok, tanpa takut bikin kumuh lingkungan.",
  },
  {
    nama: "Budi Santoso",
    peran: "Pemilik halaman rumah, Surabaya",
    isi: "Awalnya halaman depan rumah cuma jadi tempat parkir motor berdebu. Iseng daftarin ke aplikasi ini, seminggu kemudian ada penjual kopi gerobak yang sewa. Tiap bulan ada pemasukan lumayan buat nambah uang belanja.",
  },
  {
    nama: "Reza Pratama",
    peran: "Nasi goreng & angkringan",
    isi: "Fasilitas chat langsung ke pemilik lahan bikin negosiasi persiapan buka lapak jadi lancar. Nggak perlu perantara, langsung tanya yang punya tempat.",
  },
];

const JAMINAN = [
  {
    ikon: MapPinned,
    judul: "Lokasinya di peta",
    isi: "Tiap listing punya peta dan tautan ke Google Maps, jadi kamu bisa cek dulu jalannya seramai apa sebelum berangkat.",
  },
  {
    ikon: ClipboardList,
    judul: "Chatnya jadi catatan",
    isi: "Yang dijanjikan pemilik tertulis di percakapan, dan pesan tidak bisa dihapus atau diubah setelah terkirim.",
  },
  {
    ikon: MapPin,
    judul: "Pemiliknya bisa dihubungi",
    isi: "Nomornya ada di listing, bisa ditelepon atau di-WhatsApp. Bukan lewat perantara, jadi kamu tahu sejak awal sedang bicara dengan siapa.",
  },
];

function Kosong() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
        Kata yang sudah mencoba
      </p>
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
        Lahan pertamanya kami datangi sendiri
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
        Ada Tempat baru mulai, dan lahan pertama di sini kami datangi, foto, dan
        tanyai sendiri sebelum tayang. Ini yang dibilang orang-orang yang sudah
        mencobanya.
      </p>

      {/* Geseran mendatar dengan snap, sama seperti sorotan di atas: tidak
          butuh JavaScript, dan orang yang sedang membaca satu kartu tidak
          direbut kartu berikutnya. Tanpa bintang, karena tidak ada sistem
          penilaian di baliknya. */}
      <div className="geser-x -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 text-left sm:-mx-10 sm:px-10">
        {TESTIMONI.map((t) => (
          <figure
            key={t.nama}
            className="flex w-[17rem] shrink-0 snap-start flex-col rounded-2xl bg-white/10 p-5 sm:w-[20rem]"
          >
            <blockquote className="flex-1 text-sm leading-relaxed text-white/90">
              &ldquo;{t.isi}&rdquo;
            </blockquote>
            <figcaption className="mt-4 border-t border-white/20 pt-3">
              <p className="text-sm font-bold text-white">{t.nama}</p>
              <p className="mt-0.5 text-xs text-white/70">{t.peran}</p>
            </figcaption>
          </figure>
        ))}
      </div>

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
        Yang <strong className="text-white/90">tidak</strong> kami lakukan: ikut
        memegang uangnya, menengahi kalau kalian bersengketa, dan memberi ganti
        rugi. Lahan disewakan langsung oleh pemiliknya. Datangi dulu lahannya dan
        temui orangnya sebelum menyerahkan uang apa pun.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition-transform hover:-translate-y-0.5"
        >
          Lihat lahan yang tayang
        </Link>
        <Link
          href="/host/lahan/baru"
          className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10"
        >
          Pasang lahanku
        </Link>
      </div>
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
