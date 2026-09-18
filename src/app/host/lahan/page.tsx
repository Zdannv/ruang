import Link from "next/link";
import type { Metadata } from "next";
import { Camera, Plus, Store, TrendingUp } from "lucide-react";
import LencanaStatus from "@/components/LencanaStatus";
import { klienServer } from "@/lib/supabase/server";
import { daftarRuangSaya } from "@/lib/host";
import { LABEL_TIPE, luas, pakaiLuas, rupiah, volume } from "@/lib/label";

export const metadata: Metadata = { title: "Lahan saya · Ada Tempat" };

/**
 * Daftar lahan milik pemanggilnya, beserta yang perlu ditindaki.
 *
 * Angka kunjungannya TIDAK diulang di sini — itu tugas `/host` (Ringkasan),
 * dan dua tempat yang menampilkan angka sama adalah dua tempat yang bisa
 * berbeda isi. Yang ada di sini keadaan listingnya: fotonya sudah ada belum,
 * jenis usahanya sudah dicentang belum.
 *
 * Sesinya sudah dijaga `app/host/layout.tsx`, jadi tidak diperiksa lagi.
 */
export default async function DaftarLahanSaya() {

  const db = await klienServer();
  const ruang = await daftarRuangSaya(db);
  const { data: permintaan } = await db.rpc("permintaan_di_wilayah_saya");
  const wilayah = (permintaan ?? []) as {
    kota: string;
    kecamatan: string;
    jumlah: number;
  }[];

  const tanpaFoto = ruang.filter((r) => r.jumlah_foto === 0);
  /*
    Lahan terbuka yang tayang tapi belum menuliskan jenis usaha yang boleh.

    Daftar kosong berarti pedagang yang membuka lahannya tidak menemukan satu
    pun keterangan tentang apa yang boleh dijual di sana, dan sebagian besar
    tidak akan repot bertanya.
  */
  const tanpaUsaha = ruang.filter(
    (r) =>
      pakaiLuas(r.tipe) &&
      r.status === "tayang" &&
      (r.usaha_diizinkan ?? []).length === 0
  );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Lahan saya
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {ruang.length === 0
              ? "Belum ada lahan terdaftar."
              : `${ruang.length} lahan terdaftar.`}
          </p>
        </div>
        <Link
          href="/host/lahan/baru"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Sewakan lahan
        </Link>
      </div>

      {(tanpaUsaha.length > 0 || tanpaFoto.length > 0 || wilayah.length > 0) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {tanpaUsaha.length > 0 && (
            <Link
              href={`/host/lahan/${tanpaUsaha[0].id}`}
              className="flex items-start gap-3 rounded-2xl bg-warn-soft p-4 transition-transform hover:-translate-y-0.5"
            >
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
              <span>
                <span className="angka block text-sm font-semibold text-warn">
                  {tanpaUsaha.length} lahan belum menyebut usaha yang boleh
                </span>
                <span className="mt-0.5 block text-xs text-warn/80">
                  Selama daftarnya kosong, tidak ada pedagang yang bisa mengirim
                  permintaan, sistem menolaknya lebih dulu. Centang minimal satu.
                </span>
              </span>
            </Link>
          )}

          {tanpaFoto.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-warn-soft p-4">
              <Camera className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
              <span>
                <span className="angka block text-sm font-semibold text-warn">
                  {tanpaFoto.length} lahan belum ada fotonya
                </span>
                <span className="mt-0.5 block text-xs text-warn/80">
                  Lahan tanpa foto hampir tidak pernah diklik, bahkan kalau harganya
                  paling murah. Pedagang mau lihat mukanya ke jalan.
                </span>
              </span>
            </div>
          )}

          {wilayah.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-line sm:col-span-2">
              <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <span>
                <span className="block text-sm font-semibold">
                  Permintaan yang belum terlayani di wilayahmu
                </span>
                <span className="angka mt-1 block text-xs leading-relaxed text-muted">
                  {wilayah
                    .map((w) => `${w.jumlah} orang di ${w.kecamatan}`)
                    .join(" · ")}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {ruang.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-card p-8 text-center ring-1 ring-line">
          <p className="text-sm font-semibold">Mulai dari satu lahan</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
            Halaman depan rumah yang cuma jadi tempat parkir sepeda, teras samping,
            pojok lahan kosong yang menghadap jalan. Kamu yang menentukan harga, jam
            boleh jualan, dan jenis usaha apa saja yang boleh, termasuk boleh
            menggoreng atau tidak, dan tetap berhak menolak permintaan.
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
            Yang menyewa biasanya pedagang makanan dan minuman, kopi keliling yang
            capek pindah-pindah, jualan buah, atau tukang tambal ban. Ruang
            tertutup, garasi, gudang, lantai ruko, juga tetap bisa didaftarkan di
            sini.
          </p>
          <Link
            href="/host/lahan/baru"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Sewakan lahan pertama
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {ruang.map((r) => (
            <li key={r.id}>
              <Link
                href={`/host/lahan/${r.id}`}
                className="block rounded-2xl bg-card p-4 ring-1 ring-line transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{r.judul}</p>
                    <p className="angka mt-1 text-xs text-muted">
                      {LABEL_TIPE[r.tipe]} · {r.kecamatan}, {r.kota} ·{" "}
                      {/* Satuan ikut tipenya: "0,60 m³" untuk halaman depan
                          3×2 m benar secara aritmatika dan tidak berarti
                          apa-apa. Lihat `pakaiLuas()`. */}
                      {pakaiLuas(r.tipe) ? luas(r.luas_m2) : volume(r.volume_m3)}
                    </p>
                  </div>
                  <LencanaStatus status={r.status} />
                </div>

                <div className="angka mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-muted">
                  <span className="font-semibold text-ink">
                    {rupiah(r.harga_bulanan)}/bulan
                  </span>
                  <span>{r.jumlah_foto} foto</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
