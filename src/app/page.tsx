import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Handshake,
  Ruler,
  Search,
  ShieldAlert,
  Store,
  Wallet,
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
    "Marketplace ruang antarwarga. Sewa garasi, kamar, atau gudang kosong di sekitarmu — dengan kondisi ruang yang dijelaskan apa adanya.",
};

const TIPE_UNGGULAN: TipeRuang[] = [
  "garasi",
  "kamar",
  "gudang",
  "lantai_ruko",
  "kontainer",
  "loteng",
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
    isi: "Atur radius, ukuran, dan anggaran. Jaraknya dihitung dari lokasi asli ruangnya, jadi angkanya persis.",
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
              Garasi yang mobilnya sudah dijual, kamar belakang yang tidak terpakai,
              lantai dua ruko yang kosong. Lebih dekat dan lebih murah daripada gudang
              penitipan — dan kondisinya dijelaskan apa adanya.
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

        {/* Pintu masuk terpisah untuk penjual online: mereka tidak mencari
            "gudang", mereka mencari tempat menaruh stok yang bisa diambil
            berkali-kali — dan itu justru alur yang paling matang di sini. */}
        <Link
          href="/cari?kategori=stok_dagangan&radius=15"
          className="naik naik-hover mt-6 flex items-center gap-4 rounded-2xl border border-line bg-card p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
            <Store className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold tracking-tight">
              Jualan online dan stoknya menumpuk di rumah?
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted">
              Cari ruang yang memang menerima stok dagangan, dekat rumah, dengan
              jadwal ambil-barang yang disepakati lewat aplikasi.
            </span>
          </span>
          <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted sm:block" />
        </Link>
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
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
