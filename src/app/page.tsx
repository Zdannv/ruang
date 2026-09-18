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
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/supabase/env";
import type { TipeRuang } from "@/lib/ruang";

export const metadata: Metadata = {
  title: "Cari Ruang · lahan nganggur jadi cuan",
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
    judul: "Listrik, air, dan atap ditulis",
    isi: "Ada colokan atau nggak, boleh pakai air pemilik atau nggak, ada kanopi atau kena hujan. Tiga hal yang bikin jualan bisa jalan.",
  },
  {
    gambar: "3-usaha",
    judul: "Boleh menggoreng atau nggak",
    isi: "Pemilik mencentang usaha apa saja yang boleh di lahannya, jadi kamu tahu sebelum bertanya.",
  },
  {
    gambar: "4-alamat",
    judul: "Alamat dan nomornya ada",
    isi: "Tiap listing punya peta yang bisa dibuka di Google Maps, dan nomor pemiliknya bisa langsung dihubungi.",
  },
];

/*
  Empat langkah, bukan lima, dan yang hilang persis yang dibuang 18 September
  2026: "ajukan sewa" dan "bayar lewat aplikasi". Sewanya disepakati langsung
  antara pedagang dan pemiliknya. Lihat nomor 43 di CLAUDE.md.

  Urutannya juga berubah setelah alamat tampil di listing (nomor 44): dulu
  "tanya dulu" mendahului "lihat lokasi", karena alamatnya memang cuma bisa
  didapat dari chat. Sekarang orang melihat lokasinya lebih dulu dan baru
  menghubungi kalau tempatnya masuk akal — itu urutan yang sebenarnya terjadi.
*/
const LANGKAH = [
  {
    gambar: "1-cari",
    judul: "Cari dari titikmu",
    isi: "Atur radius, ukuran, dan budget. Jaraknya dari titik asli lahannya.",
  },
  {
    gambar: "4-jawab",
    judul: "Lihat lokasinya",
    isi: "Alamat dan petanya ada di listing. Cek dulu jalannya seramai apa sebelum berangkat.",
  },
  {
    gambar: "2-tanya",
    judul: "Hubungi pemiliknya",
    isi: "Chat, telepon, atau WhatsApp. \u201CBoleh gorengan nggak?\u201D Tanya dulu, gratis.",
  },
  {
    gambar: "5-bayar",
    judul: "Sepakat langsung",
    isi: "Harga dan cara bayarnya kalian atur berdua. Aplikasi tidak ikut pegang uang.",
  },
];

export default async function Beranda() {
  const db = supabaseSiap ? await klienServer() : null;
  const sesi = supabaseSiap ? await sesiSaya() : null;
  // Sorotan tidak lagi mengambil foto ruang dari database — lihat
  // `SorotanPromo`. Satu kueri lebih sedikit di jalur kritis halaman depan.
  const [ringkas, contoh, ulasan] = db
    ? await Promise.all([
        getRingkasanPasar(db),
        /*
          Wilayah pengunjungnya dari profil, yang memang sudah ditanyakan saat
          mendaftar. Tidak ada izin lokasi yang diminta di halaman depan:
          dialog izin yang muncul tanpa interaksi diredam Chrome, dan
          penolakannya melekat (lihat nomor 24).
        */
        ruangContoh(db, 4, {
          kelurahan: sesi?.profil?.kelurahan,
          kecamatan: sesi?.profil?.kecamatan,
        }),
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
        { daftar: [], wilayah: null },
        { daftar: [], rata: null, jumlahTotal: 0 },
      ];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────
          Latar terang, bukan bidang biru penuh seperti versi sebelumnya.
          Bidang warna sebesar itu tidak membawa informasi apa pun, dan justru
          membuat foto ruang serta harganya, hal yang benar-benar ingin dilihat
          orang, kalah menonjol. Warnanya sekarang cuma tersisa sebagai kilau
          tipis di sudut. */}
      {/*
        SATU KOLOM, dan itu perbaikan 18 September 2026.

        Versi sebelumnya menaruh judul di kiri dan `SorotanPromo` di kanan —
        dan kartu sorotan PERTAMA memuat slogan yang sama persis dengan H1 di
        sebelahnya. Judul yang sama dua kali, bersebelahan, adalah hal pertama
        yang membuat halaman ini terbaca seperti disusun tanpa dilihat.
        Sorotannya turun ke tengah halaman, tempat ia menguatkan alih-alih
        mengulang.

        Yang menggantikan kolom kanan bukan gambar lain melainkan RUANG dan
        ukuran huruf. Judul 4,25rem dengan leading rapat adalah satu-satunya
        hal di layar pertama, dan itu yang membedakannya dari halaman yang
        membagi dua semuanya.
      */}
      <section className="relative -mt-[var(--tinggi-header)] overflow-hidden border-b border-line bg-card pt-[var(--tinggi-header)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_82%_-15%,#f7e3d9_0%,transparent_60%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <h1 className="max-w-4xl font-display text-[2.5rem] font-bold leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
            Halaman depan nganggur?{" "}
            <span className="text-brand">Jadikan cuan.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Sewakan bulanan ke pedagang di sekitarmu. Atau kalau kamu yang mau
            jualan, sewa lahan di pinggir jalan, tanpa beli tanah.
          </p>

          {/* Kotak pencarian dulu di sini. Dipindah ke `/cari` saja: di
              halaman depan ia meminta orang memilih titik dan radius sebelum
              mereka tahu isi aplikasinya seperti apa. */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cari"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:text-base"
            >
              <Search className="h-4 w-4" />
              Cari lahan
            </Link>
            <Link
              href="/host/lahan/baru"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-ink ring-1 ring-ink/15 transition-colors hover:bg-paper sm:text-base"
            >
              Sewakan lahanku
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contoh listing ─────────────────────────────────────────────────
          Kartu listing sungguhan dari database, bukan gambar contoh. Ini yang
          paling cepat menjawab "aplikasinya isinya apa", jauh lebih cepat
          daripada deret angka yang dulu ada di hero.

          Disembunyikan seluruhnya kalau belum ada isinya: bagian berjudul
          "Contoh lahan yang tayang" dengan nol kartu di bawahnya lebih
          merugikan daripada tidak ada bagiannya sama sekali. */}
      {contoh.daftar.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {contoh.wilayah ? `Yang tayang di ${contoh.wilayah}` : "Yang sedang tayang"}
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
            {contoh.daftar.map((r) => (
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
                Bikin akun dulu, gratis, dan sekalian dipakai buat chat pemiliknya.
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

      {/* ── Cari berdasarkan ───────────────────────────────────────────────
          Dulu DUA bagian berturut-turut yang sama-sama berjudul "mau X apa?"
          dan sama-sama berisi kisi kartu bertaut ke `/cari` dengan penyaring
          berbeda. Dua bagian untuk satu pekerjaan membuat halaman ini terasa
          diulur; digabung, tipe ruangnya jadi barisan chip di kaki bagian
          yang sama. */}
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
                  masih terbaca asal isinya satu benda, lihat catatan di
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

        <div className="geser-x -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <span className="shrink-0 self-center pr-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Atau per tipe
          </span>
          {TIPE_UNGGULAN.map((t) => {
            const Ikon = IKON_TIPE[t];
            return (
              <Link
                key={t}
                href={`/cari?tipe=${t}&radius=15`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-ink ring-1 ring-line transition-colors hover:bg-brand-soft"
              >
                <Ikon className="h-4 w-4 text-brand" />
                {LABEL_TIPE[t]}
              </Link>
            );
          })}
        </div>
      </section>


      {/* ── Kenapa ─────────────────────────────────────────────────────────
          DUA KOLOM, dan itu penggabungan dua bagian yang dulu berdiri
          sendiri-sendiri: sorotan bergambar, lalu empat alasan bergambar.
          Keduanya bergambar, keduanya berkisi, dan berurutan mereka terbaca
          sebagai satu bagian yang diulang. Digabung, gambarnya mengerjakan
          sesuatu — ia mendampingi teks yang menjelaskannya — dan halaman ini
          berkurang sekitar 500px.

          Ilustrasi alasannya turun jadi lencana 56px di kiri tiap baris.
          Di ukuran itu yang terbaca cuma satu bentuk tegas per gambar, dan
          itu memang yang digambar `skrip/buat-ilustrasi.py`. */}
      <section className="bg-card py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-8">
          <SorotanPromo />

          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Yang kamu dapat
            </h2>
            <ul className="mt-6 space-y-5">
              {ALASAN.map((a) => (
                <li key={a.judul} className="flex gap-4">
                  <Image
                    src={`/alasan/${a.gambar}.svg`}
                    alt=""
                    width={400}
                    height={300}
                    unoptimized
                    className="h-11 w-14 shrink-0 rounded-lg sm:h-14 sm:w-[4.6rem]"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold leading-snug tracking-tight sm:text-lg">
                      {a.judul}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                      {a.isi}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Cara kerja ─────────────────────────────────────────────────────
          Bidang GELAP, dan itu satu-satunya di halaman ini.

          Sebelumnya delapan bagian berturut-turut berlatar terang dengan kisi
          kartu bergaris tipis yang sama, dan akibatnya halaman ini terbaca
          seperti satu bagian yang diulang delapan kali. Satu bidang gelap di
          tengah memecah iramanya tanpa menambah warna baru ke palet, dan
          kebetulan ia mendarat di bagian yang paling ingin dibaca orang.

          Ilustrasi langkahnya tetap berlatar krem, jadi di atas tinta ia
          justru lebih menonjol daripada di atas kertas. */}
      <section className="bg-ink py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
          Cara pakainya
        </h2>
        {/* Dua kolom di telepon, bukan satu. Lima kartu berilustrasi satu
            kolom membuat bagian ini sekitar 1750px, orang berhenti
            menggulir sebelum sampai langkah lima. Bentuk ilustrasinya
            sengaja tegas supaya tetap terbaca di lebar 150px. */}
        <ol className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="rounded-2xl bg-white/5 p-3 sm:p-5">
              {/* Ilustrasi menggantikan ikon lucide yang dulu di sini.
                  SVG, bukan raster seperti kartu sorotan, karena ukuran
                  tampilnya: kartu ini lebarnya sekitar 210px di laptop dan
                  165px di telepon, di ukuran itu ilustrasi berdetail tidak
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
                <h3 className="text-sm font-bold leading-snug text-paper">{l.judul}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-paper/70">{l.isi}</p>
            </li>
          ))}
        </ol>
        </div>
      </section>

      {/* ── Sisi pemilik lahan ──────────────────────────────────────────────────────── */}
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
              Kamu yang tentukan harganya, jam bukanya, dan jenis usaha apa yang
              boleh. Mau yang nggak menggoreng saja, boleh. Setiap permintaan tetap
              harus lewat kamu dulu.
            </p>

            {ringkas.jumlahPencari > 0 && (
              <p className="angka mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                {ringkas.jumlahPencari} orang sedang mencari lahan
                {ringkas.kecamatanTeratas[0] &&
                  `, terbanyak di ${ringkas.kecamatanTeratas[0].kecamatan}`}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/host/lahan/baru"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Sewakan lahanku
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/host"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10"
              >
                Dasbor pemilik
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
