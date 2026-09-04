import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Handshake,
  Ruler,
  Search,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import CariCepat from "@/components/CariCepat";
import { IKON_TIPE } from "@/components/IkonTipe";
import { LABEL_TIPE, rupiah } from "@/lib/label";
import { getRingkasanPasar } from "@/lib/ringkasan";
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
  const ringkas = supabaseSiap
    ? await getRingkasanPasar(await klienServer())
    : {
        jumlahRuang: 0,
        jumlahKecamatan: 0,
        hargaTermurah: null,
        jumlahPencari: 0,
        kecamatanTeratas: [],
      };

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative -mt-[68px] overflow-hidden bg-gradient-to-br from-[#0b2560] via-brand to-[#4d86ff] pb-14 pt-[112px] sm:pb-20 sm:pt-[148px]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-white/70">
            Marketplace ruang antarwarga
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Ruang kosong di dekatmu, disewakan tetangga sendiri
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
            Garasi yang mobilnya sudah dijual, kamar belakang yang tidak terpakai,
            lantai dua ruko yang kosong. Lebih dekat dan lebih murah daripada gudang
            penitipan — dan kondisinya dijelaskan apa adanya.
          </p>

          <div className="mt-8 max-w-3xl">
            <CariCepat />
          </div>

          {ringkas.jumlahRuang > 0 && (
            <dl className="angka mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <dd className="font-display text-2xl font-bold text-white">
                  {ringkas.jumlahRuang}
                </dd>
                <dt className="text-xs text-white/70">ruang tayang</dt>
              </div>
              <div>
                <dd className="font-display text-2xl font-bold text-white">
                  {ringkas.jumlahKecamatan}
                </dd>
                <dt className="text-xs text-white/70">kecamatan</dt>
              </div>
              {ringkas.hargaTermurah != null && (
                <div>
                  <dd className="font-display text-2xl font-bold text-white">
                    {rupiah(ringkas.hargaTermurah)}
                  </dd>
                  <dt className="text-xs text-white/70">termurah per bulan</dt>
                </div>
              )}
            </dl>
          )}
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
