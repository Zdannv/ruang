import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Handshake,
  MessageCircle,
  Ruler,
  Search,
  ShieldAlert,
  Store,
  Truck,
  Wallet,
  Wrench,
} from "lucide-react";
import CariCepat from "@/components/CariCepat";
import KolaseSorotan from "@/components/KolaseSorotan";
import { IKON_TIPE } from "@/components/IkonTipe";
import { LABEL_TIPE, rupiah } from "@/lib/label";
import { getRingkasanPasar, ruangSorotan } from "@/lib/ringkasan";
import { klienServer } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/supabase/env";
import type { TipeRuang } from "@/lib/ruang";

export const metadata: Metadata = {
  title: "Ruang — sewa ruang kosong di dekatmu",
  description:
    "Marketplace ruang antarwarga. Sewa garasi, kamar, atau lantai ruko kosong di sekitarmu — untuk barang kosan, stok jualan, atau pindahan. Kondisi ruangnya dijelaskan apa adanya.",
};

const TIPE_UNGGULAN: TipeRuang[] = [
  "garasi",
  "kamar",
  "gudang",
  "lantai_ruko",
  "kontainer",
  "loteng",
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
    ikon: GraduationCap,
    judul: "Kos kesempitan",
    isi: "Pulang kampung sebulan, atau kamar tidak cukup untuk kardus dan sepeda. Sewa per bulan, ambil kapan pun dalam jendela akses.",
    tautan: "/cari?kategori=kardus&radius=5",
    ajakan: "Ruang untuk kardus",
  },
  {
    ikon: Store,
    judul: "Jualan online",
    isi: "Stok menumpuk di ruang tamu dan perlu diambil beberapa kali seminggu. Cari yang memang menerima stok dagangan, bukan yang akan menolaknya.",
    tautan: "/cari?kategori=stok_dagangan&radius=15",
    ajakan: "Ruang untuk stok",
  },
  {
    ikon: Truck,
    judul: "Pindahan & renovasi",
    isi: "Perabot butuh tempat satu sampai tiga bulan. Lebar pintu dan kendaraan terbesar yang bisa masuk tertulis di tiap ruang, jadi tidak ada kejutan saat truknya datang.",
    tautan: "/cari?kategori=perabot&radius=10",
    ajakan: "Ruang untuk perabot",
  },
  {
    ikon: Wrench,
    judul: "Usaha kecil",
    isi: "Ban, perkakas, alat pameran, arsip yang tidak boleh lembap. Kelembapan dan riwayat banjir tiap ruang ikut tertulis.",
    tautan: "/cari?kategori=ban_perkakas&radius=15",
    ajakan: "Ruang untuk alat",
  },
];

const ALASAN = [
  {
    ikon: Ruler,
    judul: "Kondisi ruang, bukan cuma foto",
    isi: "Enam belas hal diisi host sebelum ruangnya tayang: kendaraan terbesar yang bisa masuk, lebar pintu, tinggi lantai dari tanah, kelembapan, riwayat banjir, siapa yang memegang kunci. Penyewa menilai ketepatannya setelah sewa berakhir.",
  },
  {
    ikon: CalendarClock,
    judul: "Datang berkali-kali, bukan sekali titip",
    isi: "Host menetapkan jendela akses dan kuota kunjungan per bulan. Kunjungan dijanjikan lewat aplikasi dan tercatat di log akses — itu yang menggantikan segel pada penitipan biasa.",
  },
  {
    ikon: ShieldAlert,
    judul: "Alamat dibuka bertahap",
    isi: "Yang terlihat semua orang cuma kelurahan, kecamatan, dan jarak persis; titik di peta digeser sekitar 200 meter. Alamat lengkap terbuka setelah pembayaran, nomor kontak setelah itu.",
  },
];

const LANGKAH = [
  {
    ikon: Search,
    judul: "Cari dari titikmu",
    isi: "Atur radius, ukuran, anggaran, dan barang yang mau disimpan. Jaraknya dihitung dari lokasi asli ruangnya, jadi angkanya persis.",
  },
  {
    ikon: MessageCircle,
    judul: "Tanya hostnya dulu",
    isi: "\u201CMuat motor saya nggak?\u201D, \u201Cboleh lihat dulu?\u201D — percakapan bisa dibuka sebelum memesan, jadi kamu tidak perlu mengisi tanggal dan manifes hanya untuk bertanya.",
  },
  {
    ikon: ClipboardList,
    judul: "Ajukan sewa dengan manifes",
    isi: "Daftarkan barang yang akan disimpan. Kategorinya dicocokkan dengan kebijakan host sebelum permintaanmu diteruskan.",
  },
  {
    ikon: Handshake,
    judul: "Host menerima atau menolak",
    isi: "Host berhak melihat dan menolak barang. Kalau diterima, alamat lengkapnya terbuka setelah pembayaran.",
  },
  {
    ikon: Wallet,
    judul: "Pembayaran — belum aktif",
    isi: "Jalur pembayaran menunggu payment gateway berlisensi. Sampai itu ada, pemesanan berhenti tepat sebelum tahap ini.",
  },
];

export default async function Beranda() {
  const db = supabaseSiap ? await klienServer() : null;
  const [ringkas, sorotan] = db
    ? await Promise.all([getRingkasanPasar(db), ruangSorotan(db, 3)])
    : [
        {
          jumlahRuang: 0,
          jumlahKecamatan: 0,
          hargaTermurah: null,
          jumlahPencari: 0,
          kecamatanTeratas: [],
        },
        [],
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_75%_at_88%_-10%,#e6eeff_0%,transparent_58%)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex items-center rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-muted">
              Marketplace ruang antarwarga
            </span>

            <h1 className="mt-5 font-display text-[2.1rem] font-bold leading-[1.08] text-ink sm:text-5xl">
              Ruang kosong di dekatmu, disewakan tetangga sendiri
            </h1>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Buat yang kosannya kesempitan, yang stok jualannya menumpuk di ruang
              tamu, atau yang perabotnya perlu tempat selama pindahan. Lebih dekat dan
              lebih murah daripada gudang penitipan — dan kondisi ruangnya dijelaskan
              apa adanya, bukan cuma difoto.
            </p>

            <div className="mt-7">
              <CariCepat />
            </div>

            {ringkas.jumlahRuang > 0 && (
              <dl className="angka mt-7 flex flex-wrap items-end gap-x-8 gap-y-4">
                <div>
                  <dd className="font-display text-2xl font-bold">{ringkas.jumlahRuang}</dd>
                  <dt className="text-xs text-muted">ruang tayang</dt>
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
            <KolaseSorotan ruang={sorotan} />
          </div>
        </div>
      </section>

      {/* ── Buat siapa ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Kamu yang mana?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Tiap tautan langsung menyaring ruang yang memang menerima barangmu — host
          berhak menolak kategori yang tidak ia terima, dan lebih baik itu terpisah
          sebelum kamu mengajukan, bukan sesudah.
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
          Ruang seperti apa yang kamu butuh?
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
            Yang membedakannya dari iklan biasa
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
          Cara kerjanya
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
              Punya ruang yang cuma jadi gudang barang lama?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Kamu yang menentukan harganya, jendela aksesnya, dan barang apa yang
              boleh masuk. Manifes penyewa dicocokkan dengan kebijakanmu sebelum
              permintaannya sampai ke kamu — dan kamu tetap berhak menolak.
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-white/80">
              Yang mencari sebagian besar tetangga sekecamatan: mahasiswa yang kosannya
              kesempitan, penjual online yang stoknya menumpuk, keluarga yang sedang
              pindahan.
            </p>

            {ringkas.jumlahPencari > 0 && (
              <p className="angka mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                {ringkas.jumlahPencari} orang sedang mencari ruang
                {ringkas.kecamatanTeratas[0] &&
                  ` — terbanyak di ${ringkas.kecamatanTeratas[0].kecamatan}`}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/host/ruang/baru"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Daftarkan ruang
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
