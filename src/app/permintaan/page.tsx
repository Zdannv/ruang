import Link from "next/link";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import FormPermintaan from "./FormPermintaan";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { daftarPermintaanSaya, getPermintaanKecamatan } from "@/lib/permintaan";
import { rupiah, volume } from "@/lib/label";

export const metadata: Metadata = {
  title: "Titipkan permintaan ruang — Ruang",
  description:
    "Belum ada ruang yang cocok? Titipkan kriterianya, dan host di kecamatanmu akan melihat ada permintaan.",
};

/**
 * Waitlist dua arah.
 *
 * Halamannya bisa dibuka tanpa masuk — hitungan permintaan per kecamatan itu
 * publik dan berguna bagi calon host yang belum punya akun. Yang butuh masuk
 * cuma menitipkan permintaan sendiri, karena barisnya harus punya pemilik.
 */
export default async function HalamanPermintaan() {
  const sesi = await sesiSaya();
  const db = await klienServer();

  const [wilayah, milikSaya] = await Promise.all([
    getPermintaanKecamatan(db),
    sesi?.profil ? daftarPermintaanSaya(db) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Belum ada yang cocok?
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Titipkan kriterianya. Permintaan yang menumpuk di satu kecamatan itulah yang
        meyakinkan orang di sana untuk menyewakan ruang kosongnya.
      </p>

      {wilayah.length > 0 && (
        <section className="mt-7 rounded-2xl bg-card p-5 ring-1 ring-line">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <Users className="h-5 w-5 text-brand" />
            Yang sedang dicari orang
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {wilayah.map((w) => (
              <li
                key={`${w.kota}-${w.kecamatan}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
              >
                <p className="text-sm font-medium">
                  {w.kecamatan}, {w.kota}
                </p>
                <p className="angka text-sm text-muted">
                  <span className="font-semibold text-ink">{w.jumlah} orang</span>
                  {w.volume_rata != null && ` · rata-rata ${volume(w.volume_rata)}`}
                  {w.harga_maks_rata != null && ` · anggaran ${rupiah(w.harga_maks_rata)}`}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Rata-rata sengaja disembunyikan di kecamatan yang permintaannya kurang dari
            tiga — di sana &ldquo;rata-rata&rdquo; berarti anggaran satu orang tertentu.
          </p>
        </section>
      )}

      <div className="mt-7">
        {sesi?.profil ? (
          <FormPermintaan penyewaId={sesi.profil.id} milikSaya={milikSaya} />
        ) : (
          <div className="rounded-2xl bg-card p-6 ring-1 ring-line">
            <p className="text-sm font-semibold">Masuk dulu untuk menitipkan permintaan</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Permintaan disimpan di akunmu supaya bisa kamu ubah atau hapus nanti.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/masuk?lanjut=/permintaan"
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
              >
                Daftar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
