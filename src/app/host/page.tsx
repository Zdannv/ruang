import Link from "next/link";
import type { Metadata } from "next";
import { Eye, MessageCircle, Phone, Plus } from "lucide-react";
import GrafikHarian from "./GrafikHarian";
import { klienServer } from "@/lib/supabase/server";
import { statistikHarianSaya, statistikSaya } from "@/lib/kontak";

export const metadata: Metadata = { title: "Ringkasan · Ada Tempat" };

const HARI = 30;

/**
 * Ringkasan untuk pemilik lahan.
 *
 * Pertanyaan yang dijawab halaman ini cuma satu, dan itu pertanyaan pertama
 * setiap orang yang baru memasang listing: "ada yang lihat nggak?". Pemilik
 * yang tidak pernah dihubungi siapa pun tidak bisa membedakan "tidak ada yang
 * lihat" dari "banyak yang lihat tapi harganya kemahalan", dan dua keadaan
 * itu butuh tindakan yang berbeda.
 *
 * Ketiga angkanya peristiwa yang benar-benar terjadi — halaman dibuka, nomor
 * dilihat, chat dimulai. Tidak ada "impresi" dan tidak ada jangkauan
 * perkiraan. Angka karangan di dasbor sama saja dengan ulasan karangan,
 * hanya saja terlihat lebih teknis.
 */
export default async function RingkasanHost() {
  const db = await klienServer();
  const [per, harian] = await Promise.all([
    statistikSaya(db, HARI),
    statistikHarianSaya(db, HARI),
  ]);

  const total = per.reduce(
    (t, r) => ({
      dibuka: t.dibuka + Number(r.dibuka),
      kontak: t.kontak + Number(r.kontak),
      chat: t.chat + Number(r.chat),
    }),
    { dibuka: 0, kontak: 0, chat: 0 }
  );

  const KARTU = [
    {
      ikon: Eye,
      label: "Listing dibuka",
      nilai: total.dibuka,
      bantuan: "Berapa kali halaman lahanmu dibuka orang lain.",
    },
    {
      ikon: Phone,
      label: "Nomor dilihat",
      nilai: total.kontak,
      bantuan: "Yang sampai membuka nomormu. Ini yang paling dekat ke calon penyewa.",
    },
    {
      ikon: MessageCircle,
      label: "Chat dimulai",
      nilai: total.chat,
      bantuan: "Percakapan baru yang dibuka dari halaman lahanmu.",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Ringkasan</h1>
        <p className="text-sm text-muted">{HARI} hari terakhir</p>
      </div>

      {per.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-card p-8 text-center ring-1 ring-line">
          <p className="text-sm font-semibold">Belum ada lahan terdaftar</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
            Pasang satu dulu, angkanya menyusul. Halaman depan rumah yang cuma jadi
            tempat parkir sepeda sudah cukup.
          </p>
          <Link
            href="/host/lahan/baru"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Pasang lahan
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
            {KARTU.map((k) => (
              <div key={k.label} className="rounded-2xl bg-card p-4 ring-1 ring-line sm:p-5">
                <k.ikon className="h-4 w-4 text-brand sm:h-5 sm:w-5" />
                <p className="angka mt-2 text-2xl font-bold leading-none sm:text-3xl">
                  {k.nilai}
                </p>
                <p className="mt-1.5 text-xs font-medium sm:text-sm">{k.label}</p>
                <p className="mt-1 hidden text-xs leading-relaxed text-muted sm:block">
                  {k.bantuan}
                </p>
              </div>
            ))}
          </div>

          <GrafikHarian data={harian} hari={HARI} />

          <h2 className="mt-8 font-display text-lg font-bold tracking-tight">
            Per lahan
          </h2>
          {/* Tabelnya digulir sendiri di layar sempit, bukan membuat halamannya
              ikut bergeser mendatar. Aturan umum di CLAUDE.md: isi yang lebar
              menggulir di wadahnya sendiri. */}
          <div className="geser-x mt-3 overflow-x-auto rounded-2xl bg-card ring-1 ring-line">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Lahan</th>
                  <th className="px-3 py-3 text-right font-medium">Dibuka</th>
                  <th className="px-3 py-3 text-right font-medium">Nomor</th>
                  <th className="px-4 py-3 text-right font-medium">Chat</th>
                </tr>
              </thead>
              <tbody>
                {per.map((r) => (
                  <tr key={r.ruang_id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/host/lahan/${r.ruang_id}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {r.judul}
                      </Link>
                      {r.status !== "tayang" && (
                        <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-[11px] font-medium text-muted">
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="angka px-3 py-3 text-right font-semibold">{r.dibuka}</td>
                    <td className="angka px-3 py-3 text-right">{r.kontak}</td>
                    <td className="angka px-4 py-3 text-right">{r.chat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            Yang dihitung peristiwanya, bukan orangnya: satu orang yang membuka
            listingmu tiga kali terhitung tiga. Kunjunganmu sendiri tidak dihitung.
          </p>
        </>
      )}
    </>
  );
}
