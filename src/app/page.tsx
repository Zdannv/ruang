import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Handshake,
  MessageCircle,
  Ruler,
  Search,
  ShieldAlert,
  Store,
  Truck,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react";
import CariCepat from "@/components/CariCepat";
import SorotanPromo from "@/components/SorotanPromo";
import { IKON_TIPE } from "@/components/IkonTipe";
import { LABEL_TIPE, rupiah } from "@/lib/label";
import { getRingkasanPasar } from "@/lib/ringkasan";
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
    ikon: UtensilsCrossed,
    judul: "Makanan & minuman",
    isi: "Gerobak, tenda, angkringan, es kopi. Yang penting ramai dan kelihatan dari jalan.",
    tautan: "/cari?tipe=halaman_depan&radius=5",
    ajakan: "Cari halaman depan",
  },
  {
    ikon: Store,
    judul: "Jualan online",
    isi: "Stok numpuk di ruang tamu? Titipkan di dekat rumah, ambil kapan pun butuh.",
    tautan: "/cari?kategori=stok_dagangan&radius=10",
    ajakan: "Cari ruang stok",
  },
  {
    ikon: Wrench,
    judul: "Jasa harian",
    isi: "Cuci motor, tambal ban, laundry kiloan, potong rambut. Lahan kecil, pelanggan tetap.",
    tautan: "/cari?tipe=lahan_kosong&radius=10",
    ajakan: "Cari lahan kosong",
  },
  {
    ikon: Truck,
    judul: "Pindahan & renovasi",
    isi: "Perabot butuh tempat 1-3 bulan. Lebar pintu dan muat truk apa, ada di tiap listing.",
    tautan: "/cari?kategori=perabot&radius=10",
    ajakan: "Cari ruang perabot",
  },
];

/*
  Ketiganya sengaja cuma menyebut hal yang datanya BENAR-BENAR ada di
  database. Rubrik yang paling dibutuhkan pedagang — lebar muka jalan,
  listrik, air, atap, jam boleh jualan — belum ada kolomnya, jadi tidak
  disebut di sini. Menjanjikannya sekarang berarti pengunjung pertama
  membuka listing dan tidak menemukannya.
*/
/*
  Manfaat, bukan pembelaan.

  Versi sebelumnya berjudul "Kenapa nggak cari di grup jual-beli aja?" dan
  isinya membandingkan diri dengan alternatif. Itu salah dua kali: ia
  memancing orang memikirkan alternatifnya, dan nada "kami lebih baik" bikin
  pembacanya bertahan, bukan tertarik. Marketplace besar tidak pernah
  menjelaskan kenapa bukan pesaingnya — mereka cuma menyebut apa yang didapat.

  Tetap dibatasi hal yang datanya benar-benar ada: rubrik yang paling
  dibutuhkan pedagang (lebar muka jalan, listrik, air, atap) belum ada
  kolomnya, jadi tidak disebut.
*/
const ALASAN = [
  {
    ikon: Ruler,
    judul: "Kondisinya jelas",
    isi: "Muat gerobak atau nggak, pernah banjir atau nggak, siapa yang pegang kunci. Semua tertulis sebelum kamu berangkat.",
  },
  {
    ikon: CalendarClock,
    judul: "Jam bukanya disepakati",
    isi: "Pemilik menentukan hari dan jamnya. Janjian lewat aplikasi, tercatat, jadi nggak ada versi cerita yang beda.",
  },
  {
    ikon: ShieldAlert,
    judul: "Alamat aman",
    isi: "Yang umum lihat cuma kelurahan dan jarak. Alamat lengkap kebuka setelah deal.",
  },
];

const LANGKAH = [
  {
    ikon: Search,
    judul: "Cari dari titikmu",
    isi: "Atur radius, ukuran, dan budget. Jaraknya dari titik asli lahannya.",
  },
  {
    ikon: MessageCircle,
    judul: "Tanya dulu, gratis",
    isi: "\u201CBoleh gorengan nggak?\u201D \u201CAda listrik?\u201D Chat dulu, gratis, tanpa isi tanggal.",
  },
  {
    ikon: ClipboardList,
    judul: "Ajukan sewa",
    isi: "Isi tanggal dan barangnya. Dicocokkan dengan aturan pemilik dulu.",
  },
  {
    ikon: Handshake,
    judul: "Pemilik terima atau tolak",
    isi: "Dia berhak menolak. Kalau diterima, alamatnya kebuka.",
  },
  {
    ikon: Wallet,
    judul: "Bayar — belum aktif",
    isi: "Masih nunggu payment gateway. Pemesanan berhenti tepat sebelum tahap ini.",
  },
];

export default async function Beranda() {
  const db = supabaseSiap ? await klienServer() : null;
  // Sorotan tidak lagi mengambil foto ruang dari database — lihat
  // `SorotanPromo`. Satu kueri lebih sedikit di jalur kritis halaman depan.
  const ringkas = db
    ? await getRingkasanPasar(db)
    : {
        jumlahRuang: 0,
        jumlahKecamatan: 0,
        hargaTermurah: null,
        jumlahPencari: 0,
        kecamatanTeratas: [],
      };

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────
          Latar terang, bukan bidang biru penuh seperti versi sebelumnya.
          Bidang warna sebesar itu tidak membawa informasi apa pun, dan justru
          membuat foto ruang serta harganya — hal yang benar-benar ingin dilihat
          orang — kalah menonjol. Warnanya sekarang cuma tersisa sebagai kilau
          tipis di sudut. */}
      <section className="relative -mt-[var(--tinggi-header)] overflow-hidden border-b border-line bg-card pt-[var(--tinggi-header)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_75%_at_88%_-10%,#e6eeff_0%,transparent_58%)]" />

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

            <div className="mt-7">
              <CariCepat />
            </div>

            {ringkas.jumlahRuang > 0 && (
              <dl className="angka mt-7 flex flex-wrap items-end gap-x-8 gap-y-4">
                <div>
                  <dd className="font-display text-2xl font-bold">{ringkas.jumlahRuang}</dd>
                  <dt className="text-xs text-muted">lahan tayang</dt>
                </div>
                <div>
                  <dd className="font-display text-2xl font-bold">
                    {ringkas.jumlahKecamatan}
                  </dd>
                  <dt className="text-xs text-muted">kecamatan</dt>
                </div>
                {ringkas.hargaTermurah != null && (
                  <div>
                    <dd className="font-display text-2xl font-bold">
                      {rupiah(ringkas.hargaTermurah)}
                    </dd>
                    <dt className="text-xs text-muted">termurah per bulan</dt>
                  </div>
                )}
              </dl>
            )}
          </div>

          <div className="lg:pl-2">
            <SorotanPromo />
          </div>
        </div>
      </section>

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
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                <g.ikon className="h-5 w-5" />
              </span>
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
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {ALASAN.map((a) => (
              <div key={a.judul}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                  <a.ikon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
                  {a.judul}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a.isi}</p>
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
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {LANGKAH.map((l, i) => {
            const belumAktif = i === LANGKAH.length - 1;
            return (
              <li
                key={l.judul}
                className={`rounded-2xl p-5 ring-1 ${
                  belumAktif
                    ? "bg-paper ring-line/70"
                    : "bg-card ring-line"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`angka flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      belumAktif ? "bg-line text-muted" : "bg-brand text-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <l.ikon
                    className={`h-5 w-5 ${belumAktif ? "text-muted" : "text-brand"}`}
                  />
                </div>
                <h3 className="mt-3 text-sm font-bold">{l.judul}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{l.isi}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Sisi host ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2560] via-brand to-[#4d86ff] p-8 sm:p-12">
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
    </>
  );
}
