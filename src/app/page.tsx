import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import PencarianRuang from "@/components/PencarianRuang";
import SorotanPromo from "@/components/SorotanPromo";
import SuaraPenyewa from "@/components/SuaraPenyewa";
import { getRingkasanPasar, ulasanSorotan } from "@/lib/ringkasan";
import { klienServer } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Ada Tempat · sewa tempat usaha jadi gampang",
  description:
    "Sewa tempat usaha di pinggir jalan: halaman depan rumah, teras, lahan kosong, dan kios. Bulanan, langsung dari pemiliknya. Punya lahan nganggur? Sewakan.",
};

/**
 * Siapa yang menyewa, bukan ruang seperti apa yang disewakan.
 *
 * Bedanya dengan barisan kategori di dalam `PencarianRuang` bukan pengulangan:
 * barisan itu menyaring per TIPE LAHAN ("kios", "teras"), yang cuma berarti
 * kalau orangnya sudah tahu ia butuh bentuk yang mana. Yang di sini menyaring
 * per PEKERJAAN, dan itu yang dibawa orang sejak sebelum halaman ini terbuka.
 */
const SEGMEN = [
  {
    gambar: "makanan",
    judul: "Makanan & minuman",
    isi: "Gerobak, tenda, angkringan, es kopi. Yang penting ramai dan kelihatan dari jalan.",
    tautan: "/?tipe=halaman_depan&radius=5",
    ajakan: "Cari halaman depan",
  },
  {
    gambar: "online",
    judul: "Jualan online",
    isi: "Stok numpuk di ruang tamu? Titipkan di dekat rumah, ambil kapan pun butuh.",
    tautan: "/?kategori=stok_dagangan&radius=10",
    ajakan: "Cari ruang stok",
  },
  {
    gambar: "jasa",
    judul: "Jasa harian",
    isi: "Cuci motor, tambal ban, tukang kunci. Lahan kecil di pinggir jalan, pelanggan tetap.",
    tautan: "/?tipe=lahan_kosong&radius=10",
    ajakan: "Cari lahan kosong",
  },
  {
    gambar: "pindahan",
    judul: "Pindahan & renovasi",
    isi: "Perabot butuh tempat 1-3 bulan. Lebar pintu dan muat truk apa, ada di tiap listing.",
    tautan: "/?kategori=perabot&radius=10",
    ajakan: "Cari ruang perabot",
  },
];

/*
  Manfaat, bukan pembelaan.

  Dibatasi hal yang datanya benar-benar ada, dan sejak migrasi 19 rubrik yang
  paling dibutuhkan pedagang MEMANG sudah ada kolomnya: lebar muka jalan,
  kelas jalan, listrik, air, atap, dan jenis usaha yang diizinkan.

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
  Empat langkah, bukan lima. Sewanya disepakati langsung antara pedagang dan
  pemiliknya, jadi tidak ada "ajukan sewa" dan tidak ada "bayar lewat
  aplikasi". Lihat nomor 43 di CLAUDE.md.
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
    isi: "Chat, telepon, atau WhatsApp. “Boleh gorengan nggak?” Tanya dulu, gratis.",
  },
  {
    gambar: "5-bayar",
    judul: "Sepakat langsung",
    isi: "Harga dan cara bayarnya kalian atur berdua. Aplikasi tidak ikut pegang uang.",
  },
];

/**
 * Halaman utama, dan sejak 18 September 2026 ia SEKALIGUS halaman pencarian.
 *
 * **`/cari` dan `/` digabung**, diminta pemiliknya dengan OLX sebagai rujukan.
 * Keduanya memang sudah saling menempel: halaman depan menampilkan kartu
 * listing sungguhan, barisan tipe lahan, dan tombol yang semuanya bermuara ke
 * `/cari`, sementara `/cari` punya kendali dan hasilnya sendiri. Jadi yang ada
 * bukan dua halaman melainkan satu halaman yang dipotong dua, dan potongan
 * pertamanya meminta orang menekan sesuatu hanya untuk melihat isinya.
 *
 * Urutannya mengikuti OLX, dan tiap bagian punya alasannya:
 *
 * 1. **Banner** (`SorotanPromo`). Ia sudah memuat slogan utamanya, jadi ia
 *    yang menggantikan hero besar yang dulu di sini. Hero DAN banner bersama
 *    berarti judul yang sama dua kali di satu layar, cacat yang sudah pernah
 *    diperbaiki sekali (lihat CLAUDE.md, halaman depan 18 September).
 * 2. **Pencarian**, lengkap dengan barisan kategori dan hasilnya.
 * 3. **Penjelasan**, di BAWAH hasil.
 *
 * Nomor 3 itu bedanya dari OLX, dan sengaja. OLX tidak perlu menjelaskan
 * dirinya karena semua orang sudah tahu apa itu OLX; aplikasi ini belum punya
 * satu pun pengunjung yang tahu. Yang dipindahkan bukan isinya melainkan
 * urutannya: yang sudah tahu langsung melihat lahan, yang belum tahu tinggal
 * menggulir.
 */
export default async function Beranda() {
  if (!supabaseSiap) return <PetunjukPemasangan />;

  const db = await klienServer();
  const [ringkas, ulasan] = await Promise.all([
    getRingkasanPasar(db),
    ulasanSorotan(db, 6),
  ]);

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────────────────────
          Tipis, dan itu yang menentukan. Hero setinggi setengah layar akan
          mendorong hasil pencarian ke bawah lipatan di halaman yang sekarang
          justru dibuka untuk melihat hasilnya. Aturan yang sama sudah berlaku
          di `/cari` sejak 8 September 2026, dan sekarang berlaku di sini
          karena ini halaman yang sama. */}
      <section className="border-b border-line bg-card py-5 sm:py-7">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="sr-only">
            Ada Tempat: sewa tempat usaha di pinggir jalan
          </h1>
          <SorotanPromo />
        </div>
      </section>

      {/* ── Pencarian ──────────────────────────────────────────────────────
          `PencarianRuang` memakai `useSearchParams()`, jadi di server ia
          selalu tertahan Suspense. Kerangkanya harus menyerupai halaman
          jadinya, kalau tidak ada yang berkelip lalu bergeser. */}
      <Suspense fallback={<KerangkaPencarian />}>
        <PencarianRuang />
      </Suspense>

      {/* ── Mau jualan apa ─────────────────────────────────────────────── */}
      <section className="border-t border-line bg-card py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Mau jualan apa?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Tiap usaha butuh lahan yang beda. Pilih yang paling dekat sama
            rencanamu, penyaringnya sudah kami siapkan.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {SEGMEN.map((s) => (
              <Link
                key={s.judul}
                href={s.tautan}
                className="naik naik-hover group flex flex-col rounded-2xl bg-paper p-4 ring-1 ring-line sm:p-5"
              >
                {/* Petak bujur sangkar dan sederhana: ia tampil 80px di
                    telepon dan 96px di laptop, jadi yang muat cuma satu benda
                    utama plus satu aksen. */}
                <Image
                  src={`/segmen/${s.gambar}.svg`}
                  alt=""
                  width={200}
                  height={200}
                  unoptimized
                  className="h-20 w-20 rounded-xl sm:h-24 sm:w-24"
                />
                <h3 className="mt-3 font-display text-base font-bold leading-snug tracking-tight sm:text-lg">
                  {s.judul}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">
                  {s.isi}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand sm:text-sm">
                  {s.ajakan}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Yang kamu dapat ────────────────────────────────────────────────
          Dua kolom dari `sm`. Empat baris berilustrasi satu kolom membuat
          bagian ini lebih tinggi daripada hasil pencarian di atasnya, dan
          bagian penjelasan tidak boleh lebih panjang daripada barangnya. */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Yang kamu dapat
        </h2>
        <ul className="mt-7 grid gap-5 sm:grid-cols-2 sm:gap-x-10">
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
      </section>

      {/* ── Cara kerja ─────────────────────────────────────────────────────
          Bidang GELAP, dan itu satu-satunya di halaman ini. Ia memecah irama
          bagian terang berkisi yang berturut-turut, tanpa menambah warna baru
          ke palet. Ilustrasi langkahnya berlatar krem, jadi di atas tinta ia
          justru lebih menonjol. */}
      <section className="bg-ink py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
            Cara pakainya
          </h2>
          <ol className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {LANGKAH.map((l, i) => (
              <li key={l.judul} className="rounded-2xl bg-white/5 p-3 sm:p-5">
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
                  <h3 className="text-sm font-bold leading-snug text-paper">
                    {l.judul}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-paper/70">{l.isi}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Sisi pemilik lahan ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
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

/**
 * Kerangka pencarian, bentuknya mengikuti `PencarianRuang`: bilah kendali,
 * barisan kategori, lalu kisi kartu.
 */
function KerangkaPencarian() {
  return (
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
  );
}

/**
 * Tanpa kredensial Supabase, layar ini yang muncul, bukan layar putih atau
 * galat jaringan.
 */
function PetunjukPemasangan() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-xl font-bold">Ada Tempat belum tersambung ke Supabase</h1>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
        <li>
          Salin <code className="font-mono text-ink">.env.example</code> menjadi{" "}
          <code className="font-mono text-ink">.env.local</code>.
        </li>
        <li>
          Isi <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dari
          Project Settings di Supabase. Wajib anon key, bukan service role.
        </li>
        <li>
          Pastikan seluruh migrasi di{" "}
          <code className="font-mono text-ink">supabase/migrations/</code> sudah
          dijalankan berurutan. Lihat SETUP.md.
        </li>
        <li>Jalankan ulang server pengembangan.</li>
      </ol>
    </div>
  );
}
