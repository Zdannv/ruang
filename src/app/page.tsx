import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Search } from "lucide-react";
import KartuRuang from "@/components/KartuRuang";
import SorotanPromo from "@/components/SorotanPromo";
import SuaraPenyewa from "@/components/SuaraPenyewa";
import { IKON_TIPE } from "@/components/IkonTipe";
import { LABEL_TIPE } from "@/lib/label";
import { getRingkasanPasar, ruangContoh, ulasanSorotan } from "@/lib/ringkasan";
import { klienServer } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/supabase/env";
import type { TipeRuang } from "@/lib/ruang";

export const metadata: Metadata = {
  title: "Cari Ruang — lahan nganggur jadi cuan",
  description:
    "Halaman depan nganggur? Sewakan bulanan ke pedagang di sekitarmu. Mau jualan di pinggir jalan? Sewa lahannya, tanpa beli tanah. Sidoarjo dan Surabaya.",
};

/*
  Urutannya mengikuti wilayah peluncuran, bukan selera. Di Sidoarjo dan
  Surabaya Selatan, lantai ruko yang kosong dan gudang kecil jauh lebih banyak
  daripada kamar kos yang disewakan sebagian — kebalikan dari Malang, tempat
  daftar ini pertama disusun.
*/
const TIPE_UNGGULAN: TipeRuang[] = [
  "halaman_depan",
  "lahan_kosong",
  "teras",
  "kios",
  "garasi",
  "gudang",
];

/**
 * Siapa yang menyewa, bukan ruang seperti apa yang disewakan.
 *
 * Sebelum ini halaman depan cuma bercerita tentang ruangnya — garasi, kamar,
 * loteng — dan tidak sekali pun menyebut orangnya. Akibatnya pengunjung harus
 * menerjemahkan sendiri "gudang 6 m³" menjadi "oh, barang kosan saya muat".
 * Sebagian besar orang tidak melakukan itu; mereka menutup halamannya.
 *
 * Tautannya membawa penyaring kategori, jadi hasil pertama yang dilihat orang
 * sudah ruang yang memang menerima barangnya. Kategori itu datang dari
 * `13_umkm.sql` — tanpa migrasi itu penyaringnya tidak ada isinya.
 */
const SEGMEN = [
  {
    gambar: "makanan",
    judul: "Makanan & minuman",
    isi: "Gerobak, tenda, angkringan, es kopi. Yang penting ramai dan kelihatan dari jalan.",
    tautan: "/cari?tipe=halaman_depan&radius=5",
    ajakan: "Cari halaman depan",
  },
  {
    gambar: "online",
    judul: "Jualan online",
    isi: "Stok numpuk di ruang tamu? Titipkan di dekat rumah, ambil kapan pun butuh.",
    tautan: "/cari?kategori=stok_dagangan&radius=10",
    ajakan: "Cari ruang stok",
  },
  {
    gambar: "jasa",
    judul: "Jasa harian",
    isi: "Cuci motor, tambal ban, tukang kunci. Lahan kecil di pinggir jalan, pelanggan tetap.",
    tautan: "/cari?tipe=lahan_kosong&radius=10",
    ajakan: "Cari lahan kosong",
  },
  {
    gambar: "pindahan",
    judul: "Pindahan & renovasi",
    isi: "Perabot butuh tempat 1-3 bulan. Lebar pintu dan muat truk apa, ada di tiap listing.",
    tautan: "/cari?kategori=perabot&radius=10",
    ajakan: "Cari ruang perabot",
  },
];

/*
  Manfaat, bukan pembelaan.

  Versi sebelumnya berjudul "Kenapa nggak cari di grup jual-beli aja?" dan
  isinya membandingkan diri dengan alternatif. Itu salah dua kali: ia
  memancing orang memikirkan alternatifnya, dan nada "kami lebih baik" bikin
  pembacanya bertahan, bukan tertarik. Marketplace besar tidak pernah
  menjelaskan kenapa bukan pesaingnya — mereka cuma menyebut apa yang didapat.

  Tetap dibatasi hal yang datanya benar-benar ada — dan sejak migrasi 19
  rubrik yang paling dibutuhkan pedagang MEMANG sudah ada kolomnya: lebar muka
  jalan, kelas jalan, listrik, air, atap, dan jenis usaha yang diizinkan. Itu
  sebabnya ketiganya sekarang boleh menyebutnya; sebelum migrasi itu, kalimat
  yang sama adalah janji yang tidak ada isinya di halaman listing.

  Yang tetap TIDAK boleh disebut: ganti rugi, jaminan keamanan, dan asuransi.
  Ketiganya tidak ada, dan tidak akan ada sampai ada penanggung berlisensi.
*/
const ALASAN = [
  {
    gambar: "1-ukuran",
    judul: "Ukurannya jelas dari awal",
    isi: "Berapa meter muka jalannya, jalan raya atau dalam gang, pernah banjir atau nggak. Ketahuan sebelum kamu berangkat ke sana.",
  },
  {
    gambar: "2-utilitas",
    judul: "Listrik, air, atap — ditulis",
    isi: "Ada colokan atau nggak, boleh pakai air pemilik atau nggak, ada kanopi atau kena hujan. Tiga hal yang bikin jualan bisa jalan.",
  },
  {
    gambar: "3-usaha",
    judul: "Boleh menggoreng atau nggak",
    isi: "Pemilik mencentang usaha apa saja yang boleh. Yang nggak dicentang ditolak sistem sebelum kamu nunggu jawaban.",
  },
  {
    gambar: "4-alamat",
    judul: "Alamat kebuka bertahap",
    isi: "Yang umum lihat cuma kelurahan dan jaraknya. Alamat lengkap kebuka setelah deal, nomor kontak setelah bayar.",
  },
];

const LANGKAH = [
  {
    gambar: "1-cari",
    judul: "Cari dari titikmu",
    isi: "Atur radius, ukuran, dan budget. Jaraknya dari titik asli lahannya.",
  },
  {
    gambar: "2-tanya",
    judul: "Tanya dulu, gratis",
    isi: "\u201CBoleh gorengan nggak?\u201D \u201CAda listrik?\u201D Chat dulu, gratis, tanpa isi tanggal.",
  },
  {
    gambar: "3-ajukan",
    judul: "Ajukan sewa",
    isi: "Isi tanggal dan barangnya. Dicocokkan dengan aturan pemilik dulu.",
  },
  {
    gambar: "4-jawab",
    judul: "Pemilik terima atau tolak",
    isi: "Dia berhak menolak. Kalau diterima, alamatnya kebuka.",
  },
  {
    gambar: "5-bayar",
    judul: "Bayar, terus jualan",
    isi: "Bayar sewanya lewat aplikasi. Habis itu lahannya kamu pakai sesuai tanggal dan jamnya.",
  },
];

export default async function Beranda() {
  const db = supabaseSiap ? await klienServer() : null;
  // Sorotan tidak lagi mengambil foto ruang dari database — lihat
  // `SorotanPromo`. Satu kueri lebih sedikit di jalur kritis halaman depan.
  const [ringkas, contoh, ulasan] = db
    ? await Promise.all([
        getRingkasanPasar(db),
        ruangContoh(db, 4),
        ulasanSorotan(db, 6),
      ])
    : [
        {
          jumlahRuang: 0,
          jumlahKecamatan: 0,
          hargaTermurah: null,
          jumlahPencari: 0,
          kecamatanTeratas: [],
        },
        [],
        { daftar: [], rata: null, jumlahTotal: 0 },
      ];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────
          Latar terang, bukan bidang biru penuh seperti versi sebelumnya.
          Bidang warna sebesar itu tidak membawa informasi apa pun, dan justru
          membuat foto ruang serta harganya — hal yang benar-benar ingin dilihat
          orang — kalah menonjol. Warnanya sekarang cuma tersisa sebagai kilau
          tipis di sudut. */}
      <section className="relative -mt-[var(--tinggi-header)] overflow-hidden border-b border-line bg-card pt-[var(--tinggi-header)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_75%_at_88%_-10%,#f7e3d9_0%,transparent_58%)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex items-center rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-muted">
              Lahan nganggur jadi cuan
            </span>

            <h1 className="mt-5 font-display text-[2.1rem] font-bold leading-[1.08] text-ink sm:text-5xl">
              Halaman depan nganggur? Jadikan cuan.
            </h1>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Sewakan bulanan ke pedagang di sekitarmu. Atau kalau kamu yang mau
              jualan — sewa lahan di pinggir jalan, tanpa beli tanah.
            </p>

            {/* Kotak pencarian dulu di sini. Dipindah ke `/cari` saja: di
                halaman depan ia meminta orang memilih titik dan radius sebelum
                mereka tahu isi aplikasinya seperti apa. Yang menggantikannya
                dua tombol, dan contoh listing di bawah. */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/cari"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                <Search className="h-4 w-4" />
                Cari lahan
              </Link>
              <Link
                href="/host/ruang/baru"
                className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
              >
                Sewakan lahanku
              </Link>
            </div>

            {/* Deret angka "N lahan tayang · N kecamatan · termurah Rp X"
                dibuang 9 September 2026. Dengan dua lahan di database ia
                membaca sebagai aplikasi yang kosong, dan bahkan dengan lima
                belas ia tidak menjawab pertanyaan yang sedang dipikirkan
                pengunjung. Yang menggantikannya contoh listing sungguhan di
                bawah — itu yang benar-benar memberi tahu isinya seperti apa. */}
          </div>

          <div className="lg:pl-2">
            <SorotanPromo />
          </div>
        </div>
      </section>

      {/* ── Contoh listing ─────────────────────────────────────────────────
          Kartu listing sungguhan dari database, bukan gambar contoh. Ini yang
          paling cepat menjawab "aplikasinya isinya apa" — jauh lebih cepat
          daripada deret angka yang dulu ada di hero.

          Disembunyikan seluruhnya kalau belum ada isinya: bagian berjudul
          "Contoh lahan yang tayang" dengan nol kartu di bawahnya lebih
          merugikan daripada tidak ada bagiannya sama sekali. */}
      {contoh.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Yang sedang tayang
            </h2>
            <Link
              href="/cari"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Lihat semua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {contoh.map((r) => (
              /* `tanpaJarak`: halaman depan tidak tahu di mana pengunjungnya,
                 dan "0 m" adalah angka yang salah, bukan yang kosong. */
              <KartuRuang key={r.id} ruang={r} tanpaJarak />
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="font-display text-lg font-bold tracking-tight">
                Mau sewa salah satunya?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Bikin akun dulu — gratis, dan sekalian dipakai buat chat pemiliknya.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Daftar
              </Link>
              <Link
                href="/masuk"
                className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-card"
              >
                Sudah punya akun
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Buat siapa ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Mau jualan apa?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Pemilik lahan berhak menolak jenis usaha yang dia nggak mau. Lebih enak
          ketahuan sekarang daripada setelah kamu bolak-balik.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {SEGMEN.map((g) => (
            <Link
              key={g.judul}
              href={g.tautan}
              className="naik naik-hover group flex gap-4 rounded-2xl border border-line bg-card p-5"
            >
              {/* Petak 80/96px, bukan ikon 44px. Di ukuran itu ilustrasi
                  masih terbaca asal isinya satu benda — lihat catatan di
                  `skrip/buat-ilustrasi.py`. */}
              <Image
                src={`/segmen/${g.gambar}.svg`}
                alt=""
                width={240}
                height={240}
                unoptimized
                className="h-20 w-20 shrink-0 rounded-2xl sm:h-24 sm:w-24"
              />
              <span className="min-w-0">
                <span className="block font-display text-lg font-bold tracking-tight">
                  {g.judul}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                  {g.isi}
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  {g.ajakan}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Tipe ruang ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Butuh lahan seperti apa?
        </h2>
        <div className="geser-x -mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-3 pb-1 sm:grid sm:w-auto sm:grid-cols-3 lg:grid-cols-6">
            {TIPE_UNGGULAN.map((t) => {
              const Ikon = IKON_TIPE[t];
              return (
                <Link
                  key={t}
                  href={`/cari?tipe=${t}&radius=15`}
                  className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-card px-3 text-center text-sm font-semibold ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5 sm:h-32 sm:w-auto"
                >
                  <Ikon className="h-7 w-7 text-brand" />
                  {LABEL_TIPE[t]}
                </Link>
              );
            })}
          </div>
        </div>

      </section>

      {/* ── Kenapa ─────────────────────────────────────────────────────────── */}
      <section className="bg-card py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-2xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Yang kamu dapat
          </h2>
          {/* Dua kolom di telepon, dengan alasan yang sama persis seperti
              kartu langkah — dan di sini ia diukur setelah salah dulu: satu
              kolom berilustrasi membuat bagian ini 1758px, dan orang berhenti
              menggulir sebelum sampai alasan keempat. Dua kolom: 908px. */}
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 lg:grid-cols-4">
            {ALASAN.map((a) => (
              <div key={a.judul}>
                {/* Ilustrasi di atas judul, bentuk yang sama dengan kartu
                    langkah — keduanya bagian penjelasan, dan dua pola berbeda
                    di satu halaman terbaca sebagai dua bagian yang tidak
                    berhubungan. Kartunya sekitar 250px di laptop. */}
                <Image
                  src={`/alasan/${a.gambar}.svg`}
                  alt=""
                  width={400}
                  height={300}
                  unoptimized
                  className="h-auto w-full rounded-2xl"
                />
                <h3 className="mt-3 font-display text-base font-bold leading-snug tracking-tight sm:mt-4 sm:text-lg">
                  {a.judul}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm">
                  {a.isi}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara kerja ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Cara pakainya
        </h2>
        {/* Dua kolom di telepon, bukan satu. Lima kartu berilustrasi satu
            kolom membuat bagian ini sekitar 1750px — orang berhenti
            menggulir sebelum sampai langkah lima. Bentuk ilustrasinya
            sengaja tegas supaya tetap terbaca di lebar 150px. */}
        <ol className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
          {LANGKAH.map((l, i) => (
            <li
              key={l.judul}
              className="rounded-2xl bg-card p-3 ring-1 ring-line sm:p-5"
            >
              {/* Ilustrasi menggantikan ikon lucide yang dulu di sini.
                  SVG, bukan raster seperti kartu sorotan, karena ukuran
                  tampilnya: kartu ini lebarnya sekitar 210px di laptop dan
                  165px di telepon — di ukuran itu ilustrasi berdetail tidak
                  terbaca, dan kelimanya muncul sekaligus di satu halaman.
                  Kelimanya 0,8-0,9 KB. */}
              <Image
                src={`/langkah/${l.gambar}.svg`}
                alt=""
                width={400}
                height={300}
                unoptimized
                className="mb-3 h-auto w-full rounded-xl"
              />
              <div className="flex items-center gap-2.5">
                <span className="angka flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="text-sm font-bold leading-snug">{l.judul}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{l.isi}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Sisi host ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-brand-dark to-brand p-8 sm:p-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Punya lahan? Pasang harganya sendiri.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Lahan 2×3 meter di depan rumah yang cuma jadi tempat parkir motor tamu
              bisa jadi penghasilan tiap bulan. Nggak perlu modal, nggak perlu
              dibangun apa-apa.
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-white/80">
              Kamu yang tentukan harganya, jam bukanya, dan jenis usaha apa yang boleh
              — mau yang nggak menggoreng saja, boleh. Setiap permintaan tetap harus
              lewat kamu dulu.
            </p>

            {ringkas.jumlahPencari > 0 && (
              <p className="angka mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                {ringkas.jumlahPencari} orang sedang mencari lahan
                {ringkas.kecamatanTeratas[0] &&
                  ` — terbanyak di ${ringkas.kecamatanTeratas[0].kecamatan}`}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/host/ruang/baru"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Sewakan lahanku
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/host"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10"
              >
                Dasbor host
              </Link>
            </div>
          </div>
        </div>
      </section>
      <SuaraPenyewa
        ulasan={ulasan.daftar}
        rata={ulasan.rata}
        jumlahTotal={ulasan.jumlahTotal}
      />
    </>
  );
}
